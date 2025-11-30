import os
import json
import time
import re
from datetime import datetime

class PresentationManager:
    def __init__(self, root_dir=None):
        if root_dir:
            self.root_dir = root_dir
        else:
            # Priority order: VIBE_PRESENTATION_ROOT env var, local presentations/ folder, ~/.vibe_presentation
            env_root = os.environ.get('VIBE_PRESENTATION_ROOT')
            if env_root:
                self.root_dir = env_root
            else:
                local_presentations = os.path.abspath("presentations")
                if os.path.exists(local_presentations):
                    self.root_dir = local_presentations
                else:
                    self.root_dir = os.path.expanduser("~/.vibe_presentation")
        
        if not os.path.exists(self.root_dir):
            os.makedirs(self.root_dir)
        
        # Templates directory
        # 1. Check inside root_dir (useful for tests or self-contained storage)
        internal_templates = os.path.join(self.root_dir, "templates")
        if os.path.exists(internal_templates):
             self.templates_dir = internal_templates
        else:
             # 2. Check local templates folder (useful for repo usage)
             local_templates = os.path.abspath("templates")
             if os.path.exists(local_templates):
                 self.templates_dir = local_templates
             else:
                 # Default back to internal
                 self.templates_dir = internal_templates

    def create_presentation(self, name, description="", template=None):
        presentation_dir = os.path.join(self.root_dir, name)
        if os.path.exists(presentation_dir):
            raise ValueError(f"Presentation '{name}' already exists.")
        
        # Default aspect ratio
        aspect_ratio = "4:3"
        
        if template:
            # Create from template
            template_path = os.path.join(self.templates_dir, template)
            if not os.path.exists(template_path):
                raise ValueError(f"Template '{template}' not found.")
            
            import shutil
            shutil.copytree(template_path, presentation_dir)
            
            # Update metadata
            metadata_path = os.path.join(presentation_dir, "metadata.json")
            metadata = {}
            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            
            # Preserve existing aspect ratio if present in template metadata
            if "aspect_ratio" in metadata:
                aspect_ratio = metadata["aspect_ratio"]
            
            metadata.update({
                "name": name,
                "description": description,
                "aspect_ratio": aspect_ratio,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            })
            
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
                
            return metadata
        else:
            # Create default
            os.makedirs(presentation_dir)
            
            metadata = {
                "name": name,
                "description": description,
                "aspect_ratio": aspect_ratio,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            with open(os.path.join(presentation_dir, "metadata.json"), "w") as f:
                json.dump(metadata, f, indent=2)
                
            # Create a default Marp deck
            with open(os.path.join(presentation_dir, "deck.marp.md"), "w") as f:
                f.write(f"""---
marp: true
theme: default
size: {aspect_ratio}
paginate: true
---

# {name}

{description}

---

# Slide 1

- Bullet 1
- Bullet 2
""")
            
            return metadata

    def list_templates(self):
        templates = []
        if not os.path.exists(self.templates_dir):
            return []
            
        for name in os.listdir(self.templates_dir):
            path = os.path.join(self.templates_dir, name)
            if os.path.isdir(path):
                metadata_path = os.path.join(path, "metadata.json")
                desc = ""
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, "r") as f:
                            data = json.load(f)
                            desc = data.get('description', '')
                    except: pass
                templates.append({"name": name, "description": desc})
        return templates

    def list_presentations(self):
        presentations = []
        if not os.path.exists(self.root_dir):
            return []
            
        for name in os.listdir(self.root_dir):
            path = os.path.join(self.root_dir, name)
            if os.path.isdir(path):
                metadata_path = os.path.join(path, "metadata.json")
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, "r") as f:
                            metadata = json.load(f)
                            presentations.append(metadata)
                    except json.JSONDecodeError:
                        continue
        
        # Sort by created_at desc
        presentations.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return presentations

    def get_presentation(self, name):
        path = os.path.join(self.root_dir, name)
        if not os.path.exists(path):
            return None
        
        metadata_path = os.path.join(path, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                return json.load(f)
        return None

    def delete_presentation(self, name):
        path = os.path.join(self.root_dir, name)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Presentation '{name}' not found.")
        
        import shutil
        shutil.rmtree(path)
        return True

    def get_presentation_aspect_ratio(self, name):
        pres = self.get_presentation(name)
        if pres:
            return pres.get('aspect_ratio', '4:3')
        return '4:3'

    def set_presentation_aspect_ratio(self, name, aspect_ratio):
        path = os.path.join(self.root_dir, name)
        if not os.path.exists(path):
            raise ValueError(f"Presentation '{name}' not found.")
            
        # Update metadata
        metadata_path = os.path.join(path, "metadata.json")
        metadata = {}
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
        
        metadata['aspect_ratio'] = aspect_ratio
        metadata['updated_at'] = datetime.now().isoformat()
        
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
            
        # Update Marp file
        marp_path = os.path.join(path, "deck.marp.md")
        if os.path.exists(marp_path):
            with open(marp_path, "r") as f:
                content = f.read()
            
            # Regex to replace size: ... in front matter
            # Front matter is between first two ---
            
            # Check if size exists
            if re.search(r'^size:\s*.*$', content, re.MULTILINE):
                new_content = re.sub(r'^size:\s*.*$', f'size: {aspect_ratio}', content, flags=re.MULTILINE)
            else:
                # Insert size after theme or marp: true
                if 'theme:' in content:
                    new_content = re.sub(r'(^theme:\s*.*$)', f'\\1\nsize: {aspect_ratio}', content, flags=re.MULTILINE, count=1)
                elif 'marp: true' in content:
                    new_content = re.sub(r'(^marp: true)', f'\\1\nsize: {aspect_ratio}', content, flags=re.MULTILINE, count=1)
                else:
                    # Just add it at start of front matter?
                    new_content = content.replace('---\n', f'---\nsize: {aspect_ratio}\n', 1)
            
            with open(marp_path, "w") as f:
                f.write(new_content)
                
        return metadata

    def duplicate_presentation(self, source_name, new_name, copy_images=True):
        source_path = os.path.join(self.root_dir, source_name)
        new_path = os.path.join(self.root_dir, new_name)
        
        if not os.path.exists(source_path):
            raise ValueError(f"Source presentation '{source_name}' not found.")
        if os.path.exists(new_path):
            raise ValueError(f"Destination '{new_name}' already exists.")
            
        import shutil
        
        # Copy directory
        # shutil.copytree requires destination to NOT exist
        # We might want to exclude images if copy_images is False
        
        def ignore_patterns(path, names):
            if not copy_images and path == source_path and "images" in names:
                return ["images"]
            return []
            
        shutil.copytree(source_path, new_path, ignore=ignore_patterns)
        
        # Update metadata
        metadata_path = os.path.join(new_path, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
                
            metadata.update({
                "name": new_name,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            })
            # Keep description, aspect_ratio, style, etc.
            
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
        
        # Update title in Marp file?
        marp_path = os.path.join(new_path, "deck.marp.md")
        if os.path.exists(marp_path):
            with open(marp_path, "r") as f:
                content = f.read()
            
            # Simple replace of title if it matches source name exactly in # Title
            # This is a bit risky, maybe just leave it?
            # Let's try to replace the first # Title if it matches
            
            # Construct regex for title
            # # Source Name
            pattern = re.compile(f"^# {re.escape(source_name)}$", re.MULTILINE)
            if pattern.search(content):
                content = pattern.sub(f"# {new_name}", content, count=1)
                with open(marp_path, "w") as f:
                    f.write(content)
                    
        return self.get_presentation(new_name)
