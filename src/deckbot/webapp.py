import os
import json
import time
import threading
from flask import Flask, render_template, request, jsonify, Response, stream_with_context, send_file, send_from_directory
from deckbot.manager import PresentationManager
from deckbot.session_service import SessionService
from deckbot.preferences import PreferencesManager
from deckbot.state import StateManager

app = Flask(__name__)

# Global service instance (single user for now)
current_service = None

@app.route('/')
def index():
    return render_template('chat.html')

@app.route('/api/serve-image')
def serve_image():
    path = request.args.get('path')
    if not path or not os.path.exists(path):
        return "Image not found", 404
    return send_file(path)

@app.route('/api/presentation/preview')
def preview_presentation():
    global current_service
    if not current_service:
        return "No presentation loaded", 400
        
    pres_dir = current_service.agent.presentation_dir
    html_path = os.path.join(pres_dir, "deck.marp.html")
    
    if not os.path.exists(html_path):
        return "<h1>Presentation not compiled yet.</h1><p>Ask the agent to 'Show the deck' or 'Compile'.</p>"
    
    # Modify HTML to fix image paths before serving
    with open(html_path, 'r') as f:
        html_content = f.read()
    
    # Replace relative image paths with API endpoint
    # images/file.png -> /api/presentation/images/file.png
    import re
    html_content = re.sub(
        r'(src|href)="images/([^"]+)"',
        r'\1="/api/presentation/images/\2"',
        html_content
    )
    html_content = re.sub(
        r'url\(&quot;images/([^&]+)&quot;\)',
        r'url(&quot;/api/presentation/images/\1&quot;)',
        html_content
    )
    
    return html_content

@app.route('/api/presentation/images/<path:filename>')
def serve_presentation_image(filename):
    global current_service
    if not current_service:
        return "No presentation loaded", 404
        
    pres_dir = current_service.agent.presentation_dir
    images_dir = os.path.join(pres_dir, "images")
    
    return send_from_directory(images_dir, filename)

@app.route('/api/presentations', methods=['GET'])
def list_presentations():
    manager = PresentationManager()
    presentations = manager.list_presentations()
    return jsonify(presentations)

@app.route('/api/presentations/create', methods=['POST'])
def create_presentation():
    import subprocess
    
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    template = data.get('template')
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    manager = PresentationManager()
    try:
        manager.create_presentation(name, description, template=template)
        
        # Compile the presentation immediately so preview works
        presentation_dir = os.path.join(manager.root_dir, name)
        try:
            subprocess.run(
                ["npx", "@marp-team/marp-cli", "deck.marp.md", "--allow-local-files"],
                cwd=presentation_dir,
                check=True,
                capture_output=True
            )
        except Exception as e:
            # Don't fail creation if compilation fails, just log it
            print(f"Warning: Failed to compile presentation on creation: {e}")
        
        return jsonify({"message": "Created", "name": name})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/presentations/delete', methods=['POST'])
def delete_presentation():
    data = request.json
    name = data.get('name')
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    manager = PresentationManager()
    try:
        manager.delete_presentation(name)
        
        # Clear state if we deleted the current presentation
        state_manager = StateManager()
        current = state_manager.get_current_presentation()
        if current == name:
            state_manager.clear_current_presentation()
            
        return jsonify({"message": "Deleted", "name": name})
    except FileNotFoundError:
        return jsonify({"error": "Presentation not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def list_templates():
    manager = PresentationManager()
    templates = manager.list_templates()
    return jsonify(templates)

@app.route('/api/preferences', methods=['GET'])
def get_preferences():
    """Get all preferences."""
    prefs = PreferencesManager()
    return jsonify(prefs.get_all())

@app.route('/api/preferences/<key>', methods=['GET'])
def get_preference(key):
    """Get a specific preference."""
    prefs = PreferencesManager()
    value = prefs.get(key)
    if value is None:
        return jsonify({"error": "Preference not found"}), 404
    return jsonify({"key": key, "value": value})

@app.route('/api/preferences', methods=['POST'])
def set_preferences():
    """Set one or more preferences."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    prefs = PreferencesManager()
    prefs.update(data)
    return jsonify({"message": "Preferences updated", "preferences": prefs.get_all()})

@app.route('/api/preferences/<key>', methods=['POST'])
def set_preference(key):
    """Set a specific preference."""
    data = request.json
    if 'value' not in data:
        return jsonify({"error": "No value provided"}), 400
    
    prefs = PreferencesManager()
    prefs.set(key, data['value'])
    return jsonify({"message": "Preference updated", "key": key, "value": data['value']})

@app.route('/api/state/current-presentation', methods=['GET'])
def get_current_presentation_state():
    """Get the persisted current presentation name."""
    state_manager = StateManager()
    current_pres = state_manager.get_current_presentation()
    if not current_pres:
        return jsonify({"name": None})
        
    # Verify it still exists
    manager = PresentationManager()
    if not manager.get_presentation(current_pres):
        # Clean up if it was deleted outside of this session
        state_manager.clear_current_presentation()
        return jsonify({"name": None})
        
    return jsonify({"name": current_pres})

@app.route('/api/state/current-presentation', methods=['DELETE'])
def clear_current_presentation_state():
    """Clear the persisted current presentation state and unload service."""
    global current_service
    state_manager = StateManager()
    state_manager.clear_current_presentation()
    current_service = None
    return jsonify({"message": "State cleared"})

@app.route('/api/load', methods=['POST'])
def load_presentation():
    global current_service
    data = request.json
    name = data.get('name')
    manager = PresentationManager()
    presentation = manager.get_presentation(name)
    
    if not presentation:
        return jsonify({"error": "Presentation not found"}), 404
        
    current_service = SessionService(presentation)
    
    # Persist state
    state_manager = StateManager()
    state_manager.set_current_presentation(name)
    
    # Return history
    history = current_service.get_history()
    return jsonify({"message": "Loaded", "history": history, "presentation": presentation})

@app.route('/api/chat', methods=['POST'])
def chat():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    data = request.json
    user_input = data.get('message')
    
    if not user_input:
        return jsonify({"error": "Empty message"}), 400

    # Use thread to not block
    def run_chat():
        current_service.send_message(user_input)
        
    threading.Thread(target=run_chat).start()
    
    return jsonify({"status": "processing"})

@app.route('/api/images/generate', methods=['POST'])
def generate_images():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    data = request.json
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({"error": "Empty prompt"}), 400
        
    def run_gen():
        current_service.generate_images(prompt)
        
    threading.Thread(target=run_gen).start()
    
    return jsonify({"message": "Image generation started"})

@app.route('/api/images/select', methods=['POST'])
def select_image():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    data = request.json
    index = data.get('index')
    filename = data.get('filename')  # Optional now
    
    if index is None:
        return jsonify({"error": "Index required"}), 400
    
    try:
        saved_path = current_service.select_image(index, filename)
        
        if not saved_path:
            return jsonify({"error": "Invalid selection"}), 400
        
        return jsonify({"path": saved_path, "filename": os.path.basename(saved_path)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/events')
def events():
    def stream():
        events_queue = []
        
        def listener(event_type, data):
            events_queue.append((event_type, data))
            
        # Track the service we are subscribed to
        last_service = None
            
        # Keep connection open and yield events
        # We check queue every 0.1s
        while True:
            # Check if service changed (dynamic subscription)
            global current_service
            if current_service != last_service:
                if current_service:
                    current_service.subscribe(listener)
                last_service = current_service

            while events_queue:
                event_type, data = events_queue.pop(0)
                yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
            time.sleep(0.1)
            
    return Response(stream_with_context(stream()), mimetype='text/event-stream')

@app.route('/api/presentation/settings', methods=['GET'])
def get_presentation_settings():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
    
    # Refresh metadata from file
    manager = PresentationManager()
    if not current_service.agent.context:
         return jsonify({"error": "Context not available"}), 500
         
    pres_name = current_service.agent.context['name']
    pres = manager.get_presentation(pres_name)
    
    if not pres:
        return jsonify({"error": "Presentation not found"}), 404
        
    return jsonify({
        "aspect_ratio": pres.get("aspect_ratio", "4:3"),
        "description": pres.get("description", ""),
    })

@app.route('/api/presentation/settings', methods=['POST'])
def set_presentation_settings():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    data = request.json
    aspect_ratio = data.get("aspect_ratio")
    
    if aspect_ratio:
        manager = PresentationManager()
        name = current_service.agent.context['name']
        try:
            manager.set_presentation_aspect_ratio(name, aspect_ratio)
            
            # Recompile
            import subprocess
            presentation_dir = current_service.agent.presentation_dir
            subprocess.run(["npx", "@marp-team/marp-cli", "deck.marp.md", "--allow-local-files"], cwd=presentation_dir, check=True)
            
        except Exception as e:
             return jsonify({"error": f"Settings saved but compile failed: {e}"}), 500
             
    return jsonify({"message": "Settings updated"})

@app.route('/api/presentation/save-as', methods=['POST'])
def save_presentation_as():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    data = request.json
    new_name = data.get("name")
    copy_images = data.get("copy_images", True)
    
    if not new_name:
        return jsonify({"error": "Name is required"}), 400
        
    manager = PresentationManager()
    source_name = current_service.agent.context['name']
    
    try:
        manager.duplicate_presentation(source_name, new_name, copy_images=copy_images)
        return jsonify({"message": "Presentation duplicated", "name": new_name})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/presentation/export-pdf', methods=['POST'])
def export_pdf():
    global current_service
    if not current_service:
        return jsonify({"error": "No presentation loaded"}), 400
        
    try:
        result = current_service.agent.tools.export_pdf()
        return jsonify({"message": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
