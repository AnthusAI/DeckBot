import os
import json
import threading
from typing import Optional, List, Dict, Callable, Any
from deckbot.agent import Agent
from deckbot.nano_banana import NanoBananaClient

class SessionService:
    def __init__(self, presentation_context: Dict[str, Any]):
        self.context = presentation_context
        self.agent = Agent(presentation_context)
        # NanoClient is also initialized inside Agent, but we might want direct access or share the instance.
        # Agent creates its own NanoBananaClient. We should probably use the one from the agent 
        # or modify Agent to accept one. For now, we'll access it via agent.nano_client
        self.nano_client = self.agent.nano_client
        
        self.listeners: List[Callable[[str, Any], None]] = []
        self._lock = threading.Lock()
        
        # Web-specific state
        self.pending_candidates: List[str] = []
        self.last_image_prompt: str = ""

        # Hook presentation updates
        if hasattr(self.agent, 'tools_handler'):
            # Accept slide_number (or any data) and forward it
            self.agent.tools_handler.on_presentation_updated = lambda data=None: self._notify("presentation_updated", data)
            # Hook image generation requests from the agent
            self.agent.tools_handler.on_image_generation = self._handle_agent_image_request
            # Hook tool events
            self.agent.tools_handler.on_tool_call = self._handle_tool_event
            # Hook agent request details
            self.agent.tools_handler.on_agent_request = lambda details: self._notify("agent_request_details", details)

    def subscribe(self, callback: Callable[[str, Any], None]):
        """Subscribe to events. Callback receives (event_type, data)."""
        with self._lock:
            self.listeners.append(callback)

    def _handle_tool_event(self, event_type: str, data: Any):
        """Forward tool events to listeners."""
        self._notify(event_type, data)

    def _notify(self, event_type: str, data: Any = None):
        with self._lock:
            for listener in self.listeners:
                try:
                    listener(event_type, data)
                except Exception as e:
                    print(f"Error in listener: {e}")

    def send_message(self, user_input: str, status_spinner=None) -> str:
        """Send a message to the agent and get the response."""
        # Emit user message so it appears in chat
        self._notify("message", {"role": "user", "content": user_input})
        self._notify("thinking_start")
        try:
            response = self.agent.chat(user_input, status_spinner=status_spinner)
            self._notify("message", {"role": "model", "content": response})
            return response
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"Agent error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            self._notify("message", {"role": "model", "content": error_msg})
            return error_msg
        finally:
            self._notify("thinking_end")

    def _handle_agent_image_request(self, prompt: str, aspect_ratio: str = "1:1", resolution: str = "2K"):
        """
        Called when agent's generate_image tool is invoked (web mode).
        
        This is the deterministic system workflow:
        1. Generate 4 candidates (with progress updates)
        2. Display each image in chat as individual messages
        3. Wait for user selection (handled by select_image method)
        4. Save selected image (handled by select_image method)
        5. Notify agent with filename (handled by select_image method)
        """
        # Generate images in the background and notify via SSE
        import threading
        import traceback
        def _generate():
            self.last_image_prompt = prompt
            batch_slug_sent = False
            sent_candidate_count = 0  # Track how many candidates we've already sent
            
            def progress(current, total, status, current_candidates, prompt_details=None):
                nonlocal batch_slug_sent, sent_candidate_count
                
                # Send request details on first progress update
                if prompt_details and not batch_slug_sent:
                    # Generate batch slug for this request
                    from deckbot.nano_banana import generate_batch_slug
                    batch_slug = generate_batch_slug(prompt)
                    prompt_details['batch_slug'] = batch_slug
                    self._notify("image_request_details", prompt_details)
                    batch_slug_sent = True
                
                # Send progress update
                self._notify("image_progress", {
                    "current": current, 
                    "total": total, 
                    "status": status
                })
                
                # Send only NEW candidates (ones we haven't sent yet)
                if current_candidates:
                    candidates_to_send = current_candidates[sent_candidate_count:]
                    for idx, candidate_path in enumerate(candidates_to_send):
                        actual_index = sent_candidate_count + idx
                        self._notify("image_candidate", {
                            "image_path": candidate_path,
                            "index": actual_index,
                            "batch_slug": getattr(self, 'current_batch_slug', '')
                        })
                    sent_candidate_count = len(current_candidates)
            
            try:
                print(f"[IMAGE GEN] Starting generation for prompt: {prompt[:50]}... (aspect_ratio={aspect_ratio}, resolution={resolution})")
                # Deterministic: Always generate 4 candidates
                result = self.nano_client.generate_candidates(
                    prompt, 
                    status_spinner=None, 
                    progress_callback=progress,
                    aspect_ratio=aspect_ratio,
                    resolution=resolution
                )
                candidates = result['candidates']
                batch_slug = result['batch_slug']
                print(f"[IMAGE GEN] Generated {len(candidates)} candidates in batch: {batch_slug}")
                
                # Store candidates with batch info
                self.pending_candidates = candidates
                self.current_batch_slug = batch_slug
                
                # Final notification
                self._notify("images_ready", {"batch_slug": batch_slug})
                print(f"[IMAGE GEN] Notified images_ready")
            except Exception as e:
                print(f"[IMAGE GEN ERROR] {type(e).__name__}: {e}")
                traceback.print_exc()
                self._notify("message", {"role": "system", "content": f"Error generating images: {str(e)}"})
        
        # Run in thread to avoid blocking the agent response
        print(f"[IMAGE GEN] Starting thread for image generation")
        threading.Thread(target=_generate, daemon=True).start()

    def generate_images(self, prompt: str, status_spinner=None) -> List[str]:
        """Generate image candidates (direct call, typically from CLI)."""
        self._notify("generating_images_start", {"prompt": prompt})
        self.last_image_prompt = prompt
        
        def progress(current, total, status, current_candidates, prompt_details=None):
            payload = {
                "current": current, 
                "total": total, 
                "status": status,
                "candidates": current_candidates
            }
            if prompt_details:
                payload["prompt_details"] = prompt_details
            self._notify("image_progress", payload)
        
        try:
            # agent.nano_client.generate_candidates expects a rich spinner potentially.
            # We pass it through if provided (CLI mode).
            result = self.nano_client.generate_candidates(prompt, status_spinner=status_spinner, progress_callback=progress)
            candidates = result['candidates']
            batch_slug = result['batch_slug']
            
            self.pending_candidates = candidates
            self.current_batch_slug = batch_slug
            self._notify("images_ready", {"candidates": candidates, "prompt": prompt, "batch_slug": batch_slug})
            return candidates
        except Exception as e:
            self._notify("error", {"message": str(e)})
            return []

    def select_image(self, index: int, filename: Optional[str] = None) -> Optional[str]:
        """
        Deterministic image selection workflow (step 3-5 of image generation).
        
        When user clicks an image in the UI:
        1. Validate selection
        2. Auto-generate filename if needed
        3. DETERMINISTIC: Save file to images/ folder
        4. DETERMINISTIC: Notify UI of selection
        5. DETERMINISTIC: Tell agent about the selection so it can incorporate the image
        """
        print(f"[SELECT_IMAGE] Called with index={index}, filename={filename}")
        print(f"[SELECT_IMAGE] pending_candidates={self.pending_candidates}")
        
        if not self.pending_candidates or index < 0 or index >= len(self.pending_candidates):
            print(f"[SELECT_IMAGE] Invalid selection - returning None")
            return None
        
        # Step 2: Auto-generate filename if not provided (deterministic naming)
        if not filename:
            # Extract a base name from the last prompt
            base = "".join([c if c.isalnum() else "_" for c in self.last_image_prompt[:20]]).strip("_")
            if not base:
                base = "image"
            # Find next available number
            i = 1
            while True:
                filename = f"{base}_{i}.png"
                test_path = os.path.join(self.nano_client.images_dir, filename)
                if not os.path.exists(test_path):
                    break
                i += 1
            
        try:
            # Step 3: DETERMINISTIC - Always save to images/ folder
            saved_path = self.nano_client.save_selection(self.pending_candidates, index, filename)
            rel_path = f"images/{filename}"
            
            # Step 4: DETERMINISTIC - Always notify UI
            self._notify("image_selected", {"path": saved_path, "filename": filename})
            
            # Step 5: DETERMINISTIC - Always notify agent with the filename
            # This is a system message, not a user message, telling agent what happened
            import threading
            def _notify_agent():
                try:
                    # This is the key: we're telling the agent what the system did
                    # Include batch_slug to provide context about which generation batch this selection is from
                    batch_info = f" (batch: {self.current_batch_slug})" if hasattr(self, 'current_batch_slug') else ""
                    system_notification = f"[SYSTEM] User selected an image from{batch_info}. It has been saved to `{rel_path}`. Please incorporate this image into the presentation."
                    
                    self._notify("message", {"role": "system", "content": system_notification})
                    self._notify("thinking_start")
                    
                    try:
                        response = self.agent.chat(system_notification, status_spinner=None)
                        self._notify("message", {"role": "model", "content": response})
                    finally:
                        self._notify("thinking_end")
                except Exception as e:
                    print(f"Error notifying agent: {e}")
                    self._notify("error", {"message": f"Error incorporating image: {e}"})
            
            # Run in background so API call returns immediately
            threading.Thread(target=_notify_agent, daemon=True).start()
            
            # Also trigger a preview refresh after a short delay to ensure compilation happens
            def _delayed_refresh():
                import time
                time.sleep(2)  # Give agent time to process and compile
                self._notify("presentation_updated")
            
            threading.Thread(target=_delayed_refresh, daemon=True).start()
            
            self.pending_candidates = [] # Clear candidates after selection
            return saved_path
        except Exception as e:
            self._notify("error", {"message": str(e)})
            raise e

    def get_tools(self) -> List[Dict[str, str]]:
        """Get list of available tools."""
        tools = []
        for tool in self.agent.tools_list:
            name = getattr(tool, '__name__', str(tool))
            doc = getattr(tool, '__doc__', "No description available.")
            if doc:
                doc = doc.strip().split('\n')[0] # Use first line of docstring
            tools.append({"name": name, "description": doc})
        return tools

    def get_history(self):
        """Get chat history."""
        # Agent.load_history returns list of {role, parts=[Part objects]}
        # Convert to JSON-serializable format
        history = self.agent.load_history()
        serializable_history = []
        
        for entry in history:
            serializable_entry = {"role": entry.get("role", "user")}
            
            # Convert parts to serializable format
            parts = entry.get("parts", [])
            serializable_parts = []
            
            for part in parts:
                part_dict = {}
                
                # Check all possible part types (a part can have multiple fields)
                if hasattr(part, 'text') and part.text:
                    part_dict["text"] = part.text
                if hasattr(part, 'function_call') and part.function_call:
                    part_dict["function_call"] = {
                        "name": part.function_call.name,
                        "args": dict(part.function_call.args)
                    }
                if hasattr(part, 'function_response') and part.function_response:
                    part_dict["function_response"] = {
                        "name": part.function_response.name,
                        "response": dict(part.function_response.response)
                    }
                
                # If we extracted any fields, add the part
                if part_dict:
                    serializable_parts.append(part_dict)
                elif isinstance(part, dict):
                    # Already serializable
                    serializable_parts.append(part)
                elif isinstance(part, str):
                    # Plain string
                    serializable_parts.append({"text": part})
            
            serializable_entry["parts"] = serializable_parts
            serializable_history.append(serializable_entry)
        
        return serializable_history

    def get_state(self):
        """Get current session state."""
        return {
            "presentation": self.context,
            "pending_candidates": self.pending_candidates,
            "last_prompt": self.last_image_prompt
        }

