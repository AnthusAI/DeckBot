import os
import shutil
import time
import subprocess
import json
import base64
from io import BytesIO
from typing import Optional
import PIL.Image
from google import genai
from google.genai import types
from datetime import datetime
from rich.console import Console
from google.api_core.exceptions import ResourceExhausted

console = Console()

# ============================================================================
# PROMPT TEMPLATES - Centralized prompt text for image generation
# ============================================================================
# All prompt language is defined here for easy tweaking and iteration.
# To modify how prompts are constructed, edit the templates below.
# See AGENTS.md "Image Generation Context Engineering" section for details.
# ============================================================================

PROMPT_TEMPLATES = {
    # Aspect ratio descriptions - used in system instructions
    # Format: "Generate a {description}."
    'aspect_ratio': {
        '1:1': 'square image (1:1 aspect ratio)',
        '16:9': 'wide landscape image (16:9 aspect ratio)',
        '9:16': 'tall portrait image (9:16 aspect ratio)',
        '4:3': 'landscape image (4:3 aspect ratio)',
        '3:4': 'portrait image (3:4 aspect ratio)',
        '3:2': 'landscape image (3:2 aspect ratio)',
        '2:3': 'portrait image (2:3 aspect ratio)',
        '4:5': 'portrait image (4:5 aspect ratio)',
        '5:4': 'landscape image (5:4 aspect ratio)',
        '21:9': 'ultra-wide image (21:9 aspect ratio)'
    },
    # System instruction templates - sent as text part before user message
    # These provide context and constraints to the image model
    'system_instructions': {
        # First instruction: aspect ratio requirement
        'aspect_ratio': 'Generate a {aspect_ratio_instruction}.',
        # Style reference: when images/style.png exists, tells model to use it as style guide only
        # IMPORTANT: Must ignore content but MUST follow the visual style, colors, and aesthetic
        'style_reference': 'You MUST use the provided style reference image as a visual style guide. Ignore the specific content, subjects, or objects in the reference image. However, you MUST closely match its visual style, color palette, artistic technique, and overall aesthetic. Study the reference image carefully and apply its style characteristics to your generated image.',
        # Remix: when remixing a slide or image, tells model to transform while maintaining structure
        'remix': 'Remix the provided reference image according to the user\'s prompt. Transform the reference image while maintaining its core composition and structure.',
        # Prefixes for style and design opinions
        'style_prompt_prefix': 'Style instructions: ',
        'design_opinions_prefix': 'Design opinions: '
    },
    # User message prefixes - added to user prompt when applicable
    # These help the model understand the context of the request
    'user_message_prefixes': {
        # Style reference prefix: when images/style.png exists
        # Emphasizes that the style should be followed
        'style_reference': 'Using the provided style reference image as a visual style guide (match its style, colors, and aesthetic), generate: ',
        # Remix prefix: when remixing a slide or image
        'remix': 'Remix the provided reference image according to: '
    }
}

def generate_batch_slug(prompt, max_length=40):
    """Generate a unique slug for an image batch based on prompt and timestamp."""
    import re
    # Clean the prompt: lowercase, replace spaces/special chars with dashes
    slug = prompt.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
    # Truncate to max length
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')
    
    # Add timestamp for uniqueness
    timestamp = int(time.time() * 1000) % 100000  # Last 5 digits of ms timestamp
    slug = f"{slug}-{timestamp}"
    
    return slug

class ImagePromptBuilder:
    """
    Builds prompts for image generation from presentation context.
    
    This class separates prompt construction logic from API calling logic,
    making it easier to understand, test, and tweak prompt language.
    
    The builder gathers context from multiple sources:
    1. User prompt (direct input)
    2. Presentation metadata (image_style, design_opinions)
    3. Deck frontmatter (theme info from CSS)
    4. Style reference image (if images/style.png exists)
    5. Remix reference image (for remix operations)
    6. Aspect ratio (from presentation settings or explicit request)
    """
    
    def __init__(self, presentation_dir, metadata=None, theme_info=""):
        """
        Initialize the prompt builder.
        
        Args:
            presentation_dir: Path to presentation directory
            metadata: Dict from metadata.json (or None)
            theme_info: Extracted theme info from deck.marp.md CSS
        """
        self.presentation_dir = presentation_dir
        self.metadata = metadata or {}
        self.theme_info = theme_info
    
    def _get_color_and_font_info(self):
        """Extract color and font information from metadata for prompt inclusion."""
        parts = []
        
        # Color information
        color_settings = self.metadata.get("color_settings", {})
        if color_settings:
            color_info = "Presentation color palette (use these as style reference colors): "
            color_parts = []
            if color_settings.get("primary"):
                color_parts.append(f"Primary: {color_settings['primary']}")
            if color_settings.get("secondary"):
                color_parts.append(f"Secondary: {color_settings['secondary']}")
            if color_settings.get("accent"):
                color_parts.append(f"Accent: {color_settings['accent']}")
            if color_settings.get("foreground"):
                color_parts.append(f"Text: {color_settings['foreground']}")
            if color_settings.get("background"):
                color_parts.append(f"Background: {color_settings['background']}")
            
            if color_parts:
                parts.append(color_info + ", ".join(color_parts))
        
        # Font information
        font_settings = self.metadata.get("font_settings", {})
        if font_settings:
            font_info = "Typography: "
            font_parts = []
            if font_settings.get("primary"):
                font_parts.append(f"Headings: {font_settings['primary']}")
            if font_settings.get("secondary"):
                font_parts.append(f"Body: {font_settings['secondary']}")
            
            if font_parts:
                parts.append(font_info + ", ".join(font_parts))
        
        return ". ".join(parts) + ". " if parts else ""
        
    def build_system_instructions(self, aspect_ratio, style_reference_image=None, remix_reference_image=None):
        """
        Constructs system instructions from all context sources.
        
        System instructions are sent to Gemini as a text part before the user message.
        They provide context, constraints, and style guidance to the image model.
        
        Construction order (this order matters for clarity):
        1. Aspect ratio requirement (always first)
        2. Style reference instructions (if style.png exists)
        3. Remix instructions (if remixing)
        4. Theme info (fonts/colors from deck.marp.md CSS)
        5. Color settings (from metadata.json → color_settings)
        6. Style prompt (from metadata.json → image_style.prompt)
        7. Design opinions (from metadata.json → design_opinions)
        
        Args:
            aspect_ratio: Aspect ratio string (e.g., "16:9", "1:1")
            style_reference_image: PIL.Image if images/style.png exists (None otherwise)
            remix_reference_image: PIL.Image if remixing a slide/image (None otherwise)
            
        Returns:
            String containing all system instructions joined with spaces
            
        Example output:
            "Generate a wide landscape image (16:9 aspect ratio). Using the provided 
            style reference image ONLY as a style reference. Ignore the content of the 
            reference image; copy only its visual style, color palette, and vibe. 
            Fonts: Inter, Source Serif Pro. Colors: #2F80ED, #EB5757. 
            Style instructions: minimalist, clean. Design opinions: icons: lucide"
        """
        instructions = []
        
        # 1. Aspect ratio instruction (always first)
        # Look up description from templates, fallback to generic if not found
        aspect_ratio_instruction = PROMPT_TEMPLATES['aspect_ratio'].get(
            aspect_ratio, 
            f"image with {aspect_ratio} aspect ratio"
        )
        instructions.append(PROMPT_TEMPLATES['system_instructions']['aspect_ratio'].format(
            aspect_ratio_instruction=aspect_ratio_instruction
        ))
        
        # 2. Style reference instructions (if style.png exists)
        # Tells model to use style.png as visual style guide only, ignore content
        if style_reference_image:
            instructions.append(PROMPT_TEMPLATES['system_instructions']['style_reference'])
        
        # 3. Remix instructions (if remixing)
        # Tells model to transform reference image while maintaining structure
        if remix_reference_image:
            instructions.append(PROMPT_TEMPLATES['system_instructions']['remix'])
        
        # 4. Theme info (from deck.marp.md CSS)
        # Extracted fonts and colors from presentation CSS (e.g., "Fonts: Inter. Colors: #2F80ED")
        if self.theme_info:
            instructions.append(self.theme_info)
        
        # 5. Color and font settings (from metadata.json → color_settings, font_settings)
        # Presentation color palette and typography - these are the official style references
        color_and_font_info = self._get_color_and_font_info()
        if color_and_font_info:
            instructions.append(color_and_font_info.strip())
        
        # 6. Style prompt (from metadata.json → image_style.prompt)
        # Presentation-wide style instructions that apply to all generated images
        style_prompt = self.metadata.get("image_style", {}).get("prompt", "")
        if style_prompt:
            instructions.append(PROMPT_TEMPLATES['system_instructions']['style_prompt_prefix'] + style_prompt)
        
        # 7. Design opinions (from metadata.json → design_opinions)
        # Design preferences like icon style, color palette, typography preferences
        # Format: "key: value" pairs joined with semicolons
        design_opinions = self.metadata.get("design_opinions", {})
        if design_opinions:
            opinions_text = []
            for key, value in design_opinions.items():
                # Handle list values (e.g., color_palette: ["#hex", "#hex"])
                val_str = ", ".join(value) if isinstance(value, list) else str(value)
                opinions_text.append(f"{key}: {val_str}")
            if opinions_text:
                instructions.append(PROMPT_TEMPLATES['system_instructions']['design_opinions_prefix'] + "; ".join(opinions_text))
        
        # Join all instructions with spaces
        return " ".join(instructions)
    
    def build_user_message(self, prompt, style_reference_image=None, remix_reference_image=None):
        """
        Constructs user message with appropriate prefixes and context.
        
        The user message is sent as the last part in the contents array to Gemini.
        It contains the actual user request with context added for clarity.
        
        Construction order (prefixes added last so they appear first in final message):
        1. Start with base user prompt
        2. Append theme info (fonts/colors from CSS)
        3. Append style prompt (from metadata.json)
        4. Prepend style reference prefix (if style.png exists)
        5. Prepend remix prefix (if remixing)
        
        Final structure:
        [style prefix] + [remix prefix] + user_prompt + theme_info + style_prompt
        
        Args:
            prompt: Base user prompt (e.g., "a blue circle")
            style_reference_image: PIL.Image if images/style.png exists (None otherwise)
            remix_reference_image: PIL.Image if remixing a slide/image (None otherwise)
            
        Returns:
            String containing the final user message with all prefixes and context
            
        Example output (with style.png):
            "Using the provided style reference image as a visual style guide, generate: 
            a blue circle. Fonts: Inter. Colors: #2F80ED. Style instructions: minimalist, clean"
            
        Example output (remixing):
            "Remix the provided reference image according to: make it look like everything 
            is on fire. Fonts: Inter. Style instructions: minimalist, clean"
        """
        final_prompt = prompt
        
        # Add theme info to user message (fonts and colors from deck.marp.md CSS)
        # This helps the model understand the presentation's visual style
        if self.theme_info:
            final_prompt = f"{prompt}. {self.theme_info}"
        
        # Add color and font settings to user message (from metadata.json → color_settings, font_settings)
        # These are the official style reference colors and fonts for the presentation
        color_and_font_info = self._get_color_and_font_info()
        if color_and_font_info:
            final_prompt = f"{final_prompt}. {color_and_font_info.strip()}"
        
        # Add style prompt to user message (from metadata.json → image_style.prompt)
        # This is added to both system instructions AND user message for emphasis
        style_prompt = self.metadata.get("image_style", {}).get("prompt", "")
        if style_prompt:
            final_prompt = f"{final_prompt} Style instructions: {style_prompt}"
        
        # Add style reference prefix (if style.png exists)
        # This tells the model to use the style reference image as a visual guide
        # Note: Prefixes are added last so they appear first in the final message
        if style_reference_image:
            final_prompt = PROMPT_TEMPLATES['user_message_prefixes']['style_reference'] + final_prompt
        
        # Add remix prefix (if remixing)
        # This tells the model this is a remix operation, not a fresh generation
        if remix_reference_image:
            final_prompt = PROMPT_TEMPLATES['user_message_prefixes']['remix'] + final_prompt
        
        return final_prompt
    
    def get_prompt_details(self, prompt, aspect_ratio, resolution, style_reference_image=None, remix_reference_image=None):
        """
        Returns structured prompt details for logging/UI.
        
        Args:
            prompt: Base user prompt
            aspect_ratio: Aspect ratio string
            resolution: Resolution string
            style_reference_image: PIL.Image if style.png exists
            remix_reference_image: PIL.Image if remixing
            
        Returns:
            Dict with user_message, system_message, aspect_ratio, resolution
        """
        user_message = self.build_user_message(prompt, style_reference_image, remix_reference_image)
        system_message = self.build_system_instructions(aspect_ratio, style_reference_image, remix_reference_image)
        
        return {
            "user_message": user_message,
            "system_message": system_message,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution
        }

class NanoBananaClient:
    def __init__(self, presentation_context, root_dir=None, image_model: Optional[str] = None):
        self.context = presentation_context

        if root_dir:
            root = root_dir
        else:
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
             # Use provided image model or default
             self.model_name = image_model or 'gemini-3-pro-image-preview'
        
    def generate_candidates(self, prompt, status_spinner=None, progress_callback=None, aspect_ratio="1:1", resolution="2K", remix_reference_image=None, batch_metadata=None):
        """
        Generate 4 image candidates.
        
        This method orchestrates the image generation workflow:
        1. Gathers context from presentation (metadata, theme, style reference)
        2. Builds prompts using ImagePromptBuilder
        3. Calls Gemini API to generate images
        4. Saves candidates to drafts folder
        
        Args:
            prompt: The image generation prompt
            status_spinner: Rich spinner for CLI mode
            progress_callback: Function(current, total, status) for web mode progress updates
            aspect_ratio: Aspect ratio for the image (e.g., "1:1", "16:9")
            resolution: Image resolution ("1K", "2K", "4K")
            remix_reference_image: Optional PIL.Image to use as remix reference (for remixing slides/images)
            batch_metadata: Optional dict with additional metadata (e.g., remix_slide_number)
        """
        if status_spinner:
            status_spinner.stop() # Pause spinner for logs
            
        console.print(f"[yellow]Generating 4 candidates for: '{prompt}'...[/yellow]")
        
        # ========================================================================
        # IMAGE GENERATION WORKFLOW
        # ========================================================================
        # This method orchestrates the complete image generation process:
        #
        # 1. CONTEXT GATHERING: Load metadata, style reference, theme info
        # 2. PROMPT BUILDING: Use ImagePromptBuilder to construct prompts
        # 3. API CALLS: Generate 4 candidates via Gemini API
        # 4. SAVING: Store candidates in drafts/{batch-slug}/ folder
        #
        # The prompts sent to Gemini include:
        # - System instructions: aspect ratio, style guidance, design opinions
        # - User message: user prompt with context prefixes
        # - Reference images: style.png and/or remix reference (if applicable)
        #
        # See AGENTS.md "Image Generation Context Engineering" for full details.
        # ========================================================================
        
        # Step 1: Gather context from presentation files
        metadata_path = os.path.join(self.presentation_dir, "metadata.json")
        deck_path = os.path.join(self.presentation_dir, "deck.marp.md")
        metadata = {}
        theme_info = ""
        
        # Load metadata.json (image_style, design_opinions)
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            except Exception:
                pass
        
        # Load style reference image
        # First check metadata.json for custom path, then fall back to convention-based style.png
        style_reference_image = None
        style_reference_path = None
        
        # Check metadata.json for custom style reference path
        style_ref_path_from_metadata = None
        if metadata.get("image_style", {}).get("style_reference"):
            style_ref_path_from_metadata = os.path.join(self.presentation_dir, metadata["image_style"]["style_reference"])
        
        # Try metadata path first, then fall back to style.png convention
        style_png_path = style_ref_path_from_metadata or os.path.join(self.presentation_dir, "images", "style.png")
        
        if os.path.exists(style_png_path):
            try:
                style_reference_image = PIL.Image.open(style_png_path)
                style_reference_path = style_png_path
            except Exception as e:
                console.print(f"[yellow]Warning: Could not load style reference image: {e}[/yellow]")
        
        # Extract theme and styling information from deck.marp.md CSS
        if os.path.exists(deck_path):
            try:
                with open(deck_path, "r") as f:
                    content = f.read()
                    # Extract front matter (between first two ---)
                    if content.startswith("---"):
                        parts = content.split("---", 2)
                        if len(parts) >= 2:
                            front_matter = parts[1]
                            
                            # Extract custom CSS style block
                            import re
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

        # Step 2: Build prompts using ImagePromptBuilder
        prompt_builder = ImagePromptBuilder(
            presentation_dir=self.presentation_dir,
            metadata=metadata,
            theme_info=theme_info
        )
        
        # Build system instructions and user message
        system_message = prompt_builder.build_system_instructions(
            aspect_ratio=aspect_ratio,
            style_reference_image=style_reference_image,
            remix_reference_image=remix_reference_image
        )
        
        user_message = prompt_builder.build_user_message(
            prompt=prompt,
            style_reference_image=style_reference_image,
            remix_reference_image=remix_reference_image
        )
        
        # Log the separated prompts nicely
        from rich.rule import Rule
        console.print(Rule(title="IMAGE GENERATION REQUEST", style="bold cyan"))
        console.print(f"[bold yellow]User Message:[/bold yellow] {user_message}")
        console.print(f"[bold blue]System Instructions:[/bold blue] {system_message}")
        console.print(Rule(style="bold cyan"))
        
        # Prepare Prompt Details for UI
        prompt_details = {
            "user_message": user_message,
            "system_message": system_message,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution
        }
            
        if status_spinner:
            status_spinner.start() # Resume
            
        if progress_callback:
            # Send initial update with prompt details
            progress_callback(0, 4, "Initializing generation...", [], prompt_details=prompt_details)

        candidates = []
        
        # Create isolated folder for this request
        # Generate unique batch slug for this image generation request
        batch_slug = generate_batch_slug(prompt)
        request_folder = os.path.join(self.drafts_dir, batch_slug)
        os.makedirs(request_folder, exist_ok=True)
        
        # Store batch_slug for later reference
        self.last_batch_slug = batch_slug
        
        # Save batch metadata to JSON file
        batch_metadata_dict = {
            "batch_slug": batch_slug,
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "created_at": datetime.now().isoformat(),
            "is_remix": remix_reference_image is not None
        }
        # Merge in any additional batch metadata (e.g., remix_slide_number, remix_image_path)
        if batch_metadata:
            batch_metadata_dict.update(batch_metadata)
        metadata_path = os.path.join(request_folder, "metadata.json")
        with open(metadata_path, "w") as f:
            json.dump(batch_metadata_dict, f, indent=2)
        
        if not self.client:
            console.print("[red]Error: API Key not found.[/red]")
            return self._fallback_generation(request_folder, progress_callback)

        for i in range(4):
            if progress_callback:
                progress_callback(i+1, 4, f"Generating image {i+1}/4...", candidates)
            console.print(f"  Generating candidate {i+1}/4...")
            try:
                # Build contents list - include style reference image and remix reference image if available
                contents = []
                if style_reference_image:
                    contents.append(style_reference_image)
                    import sys
                    if 'behave' not in sys.modules:
                        console.print(f"  [dim]Including style reference image (size: {style_reference_image.size})[/dim]")
                
                if remix_reference_image:
                    contents.append(remix_reference_image)
                    import sys
                    if 'behave' not in sys.modules:
                        console.print(f"  [dim]Including remix reference image (size: {remix_reference_image.size})[/dim]")
                
                if system_message:
                    contents.append(system_message)
                contents.append(user_message)
                
                import sys
                if 'behave' not in sys.modules:
                    console.print(f"  [dim]API Call - Model: {self.model_name}, Response Modality: IMAGE[/dim]")
                
                # Use generate_content for Gemini native image generation
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_modalities=['IMAGE']
                    )
                )
                
                image_saved = False
                
                # The v1beta SDK returns data in candidates -> content -> parts
                candidate_parts = []
                if hasattr(response, 'candidates') and response.candidates:
                    console.print(f"  [dim]Response has {len(response.candidates)} candidate(s)[/dim]")
                    for c_idx, candidate in enumerate(response.candidates):
                        parts = []
                        content = getattr(candidate, 'content', None)
                        if content is not None:
                            parts = getattr(content, 'parts', []) or []
                        console.print(f"    Candidate {c_idx}: parts={len(parts)}")
                        candidate_parts.extend(parts)
                elif hasattr(response, 'parts') and response.parts:
                    console.print(f"  [dim]Response has {len(response.parts)} part(s)[/dim]")
                    candidate_parts = response.parts
                else:
                    console.print(f"  [red]Response has neither parts nor candidates[/red]")
                
                if not candidate_parts:
                    console.print("  [red]No inline parts returned in response[/red]")
                
                # Process Gemini native image generation response
                for part in candidate_parts:
                    # Check for inline_data (Gemini format)
                    if hasattr(part, 'inline_data') and part.inline_data:
                        output_path = os.path.join(request_folder, f"candidate_{i+1}.png")
                        image_bytes = getattr(part.inline_data, 'data', None)
                        if isinstance(image_bytes, str):
                            image_bytes = base64.b64decode(image_bytes)
                        if not image_bytes:
                            continue
                        image = PIL.Image.open(BytesIO(image_bytes))
                        image.save(output_path, format="PNG")
                        candidates.append(output_path)
                        image_saved = True
                        console.print(f"  [green]✓ Saved image to candidate_{i+1}.png (size: {image.size})[/green]")
                        if progress_callback:
                            progress_callback(i+1, 4, f"Generated image {i+1}/4", candidates)
                        break

                if not image_saved:
                    console.print(f"  [red]✗ No image found in response for candidate {i+1}[/red]")
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
                # Always show errors, even in tests
                console.print(f"  [red]Error generating candidate {i+1}: {type(e).__name__}: {e}[/red]")
                candidates.append(self._create_dummy(request_folder, i+1))
                if progress_callback:
                    progress_callback(i+1, 4, f"Generated image {i+1}/4 (error)", candidates)
            
            time.sleep(1)

        # Count actual vs fallback images
        actual_images = sum(1 for c in candidates if os.path.exists(c) and os.path.getsize(c) > 100)
        import sys
        if 'behave' not in sys.modules:
            if actual_images < 4:
                console.print(f"\n[yellow]Warning: Only {actual_images}/4 images generated successfully. {4-actual_images} fallback(s) created.[/yellow]")
            else:
                console.print(f"\n[green]Successfully generated all 4 images![/green]")
        
        # Only open folder in CLI mode (when no progress callback provided and not in tests)
        import sys
        if not progress_callback and 'behave' not in sys.modules:
            self._open_folder(request_folder)
        
        # Return both candidates and batch_slug
        return {
            'candidates': candidates,
            'batch_slug': batch_slug,
            'batch_folder': request_folder
        }

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
        import sys
        if not progress_callback and 'behave' not in sys.modules:
            self._open_folder(folder)
        
        # Extract batch_slug from folder path
        batch_slug = os.path.basename(folder)
        return {
            'candidates': candidates,
            'batch_slug': batch_slug,
            'batch_folder': folder
        }

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
