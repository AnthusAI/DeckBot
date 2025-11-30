import os
import shutil
import time
import subprocess
import json
import PIL.Image
from google import genai
from google.genai import types
from datetime import datetime
from rich.console import Console
from google.api_core.exceptions import ResourceExhausted

console = Console()

class NanoBananaClient:
    def __init__(self, presentation_context):
        self.context = presentation_context
        
        env_root = os.environ.get('VIBE_PRESENTATION_ROOT')
        if env_root:
            root = env_root
        elif os.path.exists("presentations"):
            root = os.path.abspath("presentations")
        else:
            root = os.path.expanduser("~/.vibe_presentation")
            
        self.presentation_dir = os.path.join(root, presentation_context['name'])
        self.images_dir = os.path.join(self.presentation_dir, "images")
        # New drafts directory
        self.drafts_dir = os.path.join(self.presentation_dir, "drafts")
        
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)
        if not os.path.exists(self.drafts_dir):
            os.makedirs(self.drafts_dir)

        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        # Check for deprecated GEMINI_API_KEY
        if not self.api_key and os.getenv("GEMINI_API_KEY"):
            # Silently fall back for image generation (warning already shown by Agent)
            self.api_key = os.getenv("GEMINI_API_KEY")
        
        self.client = None
        if self.api_key:
             self.client = genai.Client(api_key=self.api_key)
             # Imagen 3 via Gemini API
             self.model_name = 'imagen-3.0-generate-001'
        
    def generate_candidates(self, prompt, status_spinner=None, progress_callback=None, aspect_ratio="1:1", resolution="2K"):
        """
        Generate 4 image candidates.
        
        Args:
            prompt: The image generation prompt
            status_spinner: Rich spinner for CLI mode
            progress_callback: Function(current, total, status) for web mode progress updates
            aspect_ratio: Aspect ratio for the image (e.g., "1:1", "16:9")
            resolution: Image resolution ("1K", "2K", "4K")
        """
        if status_spinner:
            status_spinner.stop() # Pause spinner for logs
            
        console.print(f"[yellow]Generating 4 candidates for: '{prompt}'...[/yellow]")
        
        # Load style from metadata and extract theme/CSS info from deck.marp.md
        metadata_path = os.path.join(self.presentation_dir, "metadata.json")
        deck_path = os.path.join(self.presentation_dir, "deck.marp.md")
        style_prompt = ""
        style_reference_path = None
        style_reference_image = None
        theme_info = ""
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    data = json.load(f)
                    style = data.get("image_style", {})
                    if style.get("prompt"):
                        style_prompt = style["prompt"]
                    
                    # Load style reference image if specified
                    if style.get("style_reference"):
                        style_reference_path = os.path.join(self.presentation_dir, style["style_reference"])
                        if os.path.exists(style_reference_path):
                            try:
                                style_reference_image = PIL.Image.open(style_reference_path)
                            except Exception as e:
                                console.print(f"[yellow]Warning: Could not load style reference image: {e}[/yellow]")
            except Exception:
                pass
        
        # Extract theme and styling information from deck.marp.md
        if os.path.exists(deck_path):
            try:
                with open(deck_path, "r") as f:
                    content = f.read()
                    # Extract front matter (between first two ---)
                    if content.startswith("---"):
                        parts = content.split("---", 2)
                        if len(parts) >= 2:
                            front_matter = parts[1]
                            
                            # Extract theme
                            import re
                            theme_match = re.search(r'^theme:\s*(\w+)', front_matter, re.MULTILINE)
                            if theme_match:
                                theme_name = theme_match.group(1)
                                theme_info = f"Marp theme: {theme_name}. "
                            
                            # Extract custom CSS style block
                            style_match = re.search(r'^style:\s*\|(.+?)(?=^[a-z]+:|\Z)', front_matter, re.MULTILINE | re.DOTALL)
                            if style_match:
                                css_block = style_match.group(1).strip()
                                # Extract key style info (fonts, colors)
                                font_matches = re.findall(r'font-family:\s*[\'"]?([^;\'"]+)', css_block)
                                color_matches = re.findall(r'color:\s*(#[0-9a-fA-F]{3,6})', css_block)
                                
                                if font_matches:
                                    theme_info += f"Fonts: {', '.join(font_matches)}. "
                                if color_matches:
                                    theme_info += f"Colors: {', '.join(color_matches)}. "
            except Exception:
                pass

        final_prompt = prompt
        if theme_info:
            final_prompt = f"{prompt}. {theme_info}"
        if style_prompt:
            final_prompt = f"{final_prompt} Style instructions: {style_prompt}"
        
        # Add style reference indication to prompt if we have one
        if style_reference_image:
            final_prompt = f"Using the provided style reference image as a visual style guide, generate: {final_prompt}"
        
        # Add aspect ratio instruction to prompt for Gemini native image generation
        aspect_ratio_instruction = {
            "1:1": "square image (1:1 aspect ratio)",
            "16:9": "wide landscape image (16:9 aspect ratio)",
            "9:16": "tall portrait image (9:16 aspect ratio)",
            "4:3": "landscape image (4:3 aspect ratio)",
            "3:4": "portrait image (3:4 aspect ratio)",
            "3:2": "landscape image (3:2 aspect ratio)",
            "2:3": "portrait image (2:3 aspect ratio)",
            "4:5": "portrait image (4:5 aspect ratio)",
            "5:4": "landscape image (5:4 aspect ratio)",
            "21:9": "ultra-wide image (21:9 aspect ratio)"
        }.get(aspect_ratio, f"image with {aspect_ratio} aspect ratio")
        
        final_prompt = f"Generate a {aspect_ratio_instruction}. {final_prompt}"
            
        if status_spinner:
            status_spinner.start() # Resume

        candidates = []
        
        # Create isolated folder for this request
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        safe_prompt = "".join([c if c.isalnum() else "_" for c in prompt[:30]]).strip("_")
        request_folder = os.path.join(self.drafts_dir, f"{timestamp}_{safe_prompt}")
        os.makedirs(request_folder, exist_ok=True)
        
        if not self.client:
            console.print("[red]Error: API Key not found.[/red]")
            return self._fallback_generation(request_folder, progress_callback)

        for i in range(4):
            if progress_callback:
                progress_callback(i+1, 4, f"Generating image {i+1}/4...", candidates)
            import sys
            if 'behave' not in sys.modules:
                console.print(f"  Generating candidate {i+1}/4...")
            try:
                # Build contents list - include style reference image if available
                contents = []
                if style_reference_image:
                    contents.append(style_reference_image)
                contents.append(final_prompt)
                
                # Use generate_content for Gemini native image generation
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_modalities=['IMAGE']
                    )
                )
                
                image_saved = False
                
                # Process Gemini native image generation response
                if response.parts:
                    for part in response.parts:
                        # Check for inline_data (Gemini format)
                        if hasattr(part, 'inline_data') and part.inline_data:
                            output_path = os.path.join(request_folder, f"candidate_{i+1}.png")
                            # Use as_image() method to get PIL Image
                            image = part.as_image()
                            image.save(output_path)
                            candidates.append(output_path)
                            image_saved = True
                            if progress_callback:
                                progress_callback(i+1, 4, f"Generated image {i+1}/4", candidates)
                            break

                if not image_saved:
                    import sys
                    if 'behave' not in sys.modules:
                        console.print(f"  [red]No image found in response for candidate {i+1}[/red]")
                    candidates.append(self._create_dummy(request_folder, i+1))
                    if progress_callback:
                        progress_callback(i+1, 4, f"Generated image {i+1}/4 (fallback)", candidates)

            except ResourceExhausted:
                import sys
                if 'behave' not in sys.modules:
                    console.print(f"  [red]Quota exceeded for candidate {i+1}. Please try again later.[/red]")
                candidates.append(self._create_dummy(request_folder, i+1))
                if progress_callback:
                    progress_callback(i+1, 4, f"Generated image {i+1}/4 (quota exceeded)", candidates)
            except Exception as e:
                # import sys
                # if 'behave' not in sys.modules:
                console.print(f"  [red]Error generating candidate {i+1}: {e}[/red]")
                candidates.append(self._create_dummy(request_folder, i+1))
                if progress_callback:
                    progress_callback(i+1, 4, f"Generated image {i+1}/4 (error)", candidates)
            
            time.sleep(1)

        # Only open folder in CLI mode (when no progress callback provided)
        if not progress_callback:
            self._open_folder(request_folder)
        return candidates

    def _create_dummy(self, folder, index):
        path = os.path.join(folder, f"candidate_{index}.png")
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(b"dummy_image_data_placeholder")
        return path

    def _fallback_generation(self, folder, progress_callback=None):
        console.print("[yellow]Falling back to dummy generation...[/yellow]")
        candidates = []
        for i in range(4):
            if progress_callback:
                progress_callback(i+1, 4, f"Generating image {i+1}/4...")
            candidates.append(self._create_dummy(folder, i+1))
        if not progress_callback:
            self._open_folder(folder)
        return candidates

    def _open_folder(self, path):
        # Try opening in VS Code first using direct execution to bypass shell/path issues
        try:
            console.print(f"[dim]Opening drafts in VS Code: {path}[/dim]")
            subprocess.run(["code", path], check=True)
            return
        except (FileNotFoundError, subprocess.CalledProcessError):
            # VS Code not found or failed to open
            pass

        try:
            if os.name == 'nt':
                os.startfile(path)
            elif os.name == 'posix':
                if subprocess.call(["which", "open"], stdout=subprocess.PIPE, stderr=subprocess.PIPE) == 0:
                    subprocess.run(["open", path])
                else:
                    subprocess.run(["xdg-open", path])
        except Exception as e:
            console.print(f"[dim]Could not auto-open folder: {e}[/dim]")

    def save_selection(self, candidates, index, filename):
        if index < 0 or index >= len(candidates):
            raise ValueError("Invalid selection index")
            
        selected_path = candidates[index]
        final_path = os.path.join(self.images_dir, filename)
        
        shutil.copy2(selected_path, final_path)
        return final_path
