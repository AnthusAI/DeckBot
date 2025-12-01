"""Step definitions for system images feature."""
import os
import json
import shutil
from behave import given, when, then
from PIL import Image


@given('the system images directory exists with placeholder images')
def step_impl(context):
    """Ensure system images exist in templates directory."""
    # Set up templates directory in temp_dir if not already set
    if not hasattr(context, 'templates_dir'):
        context.templates_dir = os.path.join(context.temp_dir, "templates")
        os.makedirs(context.templates_dir, exist_ok=True)
    
    system_images_dir = os.path.join(context.templates_dir, "system-images")
    os.makedirs(system_images_dir, exist_ok=True)
    
    # Create dummy placeholder images if they don't exist
    placeholders = ['placeholder-square.png', 'placeholder-landscape.png', 'placeholder-portrait.png']
    for placeholder in placeholders:
        path = os.path.join(system_images_dir, placeholder)
        if not os.path.exists(path):
            # Create a simple colored image
            if 'square' in placeholder:
                img = Image.new('RGB', (100, 100), color='blue')
            elif 'landscape' in placeholder:
                img = Image.new('RGB', (160, 90), color='green')
            else:  # portrait
                img = Image.new('RGB', (90, 160), color='red')
            img.save(path)


@given('a template "{name}" exists without an images folder')
def step_impl(context, name):
    """Create a template without an images folder."""
    template_path = os.path.join(context.templates_dir, name)
    os.makedirs(template_path, exist_ok=True)
    
    # Create minimal metadata
    with open(os.path.join(template_path, "metadata.json"), "w") as f:
        json.dump({"name": name, "description": "Minimal template"}, f)
    
    # Create minimal deck
    with open(os.path.join(template_path, "deck.marp.md"), "w") as f:
        f.write("# Template")


@given('a template "{name}" exists with custom images')
def step_impl(context, name):
    """Create a template with an images folder."""
    template_path = os.path.join(context.templates_dir, name)
    os.makedirs(template_path, exist_ok=True)
    
    # Create images directory
    images_path = os.path.join(template_path, "images")
    os.makedirs(images_path, exist_ok=True)
    
    # Create minimal metadata
    with open(os.path.join(template_path, "metadata.json"), "w") as f:
        json.dump({"name": name, "description": "Branded template"}, f)
    
    # Create minimal deck
    with open(os.path.join(template_path, "deck.marp.md"), "w") as f:
        f.write("# Template")


@given('the template has "{filename}" in its images folder')
def step_impl(context, filename):
    """Add a specific image to the most recently created template."""
    # Find the most recently mentioned template in context
    if not hasattr(context, 'last_template'):
        # Find templates dir and use the last one
        templates = [d for d in os.listdir(context.templates_dir) if os.path.isdir(os.path.join(context.templates_dir, d))]
        template_name = templates[-1] if templates else None
    else:
        template_name = context.last_template
    
    if template_name:
        images_path = os.path.join(context.templates_dir, template_name, "images")
        os.makedirs(images_path, exist_ok=True)
        
        # Create a dummy image file
        img_path = os.path.join(images_path, filename)
        img = Image.new('RGB', (100, 100), color='purple')
        img.save(img_path)


@given('the template metadata indicates "include_system_images: true"')
def step_impl(context):
    """Update template metadata to include system images flag."""
    # Find the most recently mentioned template
    templates = [d for d in os.listdir(context.templates_dir) if os.path.isdir(os.path.join(context.templates_dir, d))]
    template_name = templates[-1] if templates else None
    
    if template_name:
        metadata_path = os.path.join(context.templates_dir, template_name, "metadata.json")
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        metadata['include_system_images'] = True
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)


@then('the presentation "{name}" should have an "images" folder')
def step_impl(context, name):
    """Verify images folder exists."""
    images_path = os.path.join(context.temp_dir, name, "images")
    assert os.path.exists(images_path), f"Images folder not found at {images_path}"
    assert os.path.isdir(images_path), f"{images_path} is not a directory"


@then('the "images" folder should contain "{filename}"')
def step_impl(context, filename):
    """Verify a specific file exists in images folder."""
    # Get the most recent presentation name from context
    pres_dirs = [d for d in os.listdir(context.temp_dir) 
                 if os.path.isdir(os.path.join(context.temp_dir, d)) and d != "templates"]
    pres_name = pres_dirs[-1] if pres_dirs else None
    
    assert pres_name, "No presentation directory found"
    
    file_path = os.path.join(context.temp_dir, pres_name, "images", filename)
    assert os.path.exists(file_path), f"File {filename} not found in images folder at {file_path}"


@then('the "images" folder should NOT contain "{filename}"')
def step_impl(context, filename):
    """Verify a specific file does NOT exist in images folder."""
    # Get the most recent presentation name from context
    pres_dirs = [d for d in os.listdir(context.temp_dir) 
                 if os.path.isdir(os.path.join(context.temp_dir, d)) and d != "templates"]
    pres_name = pres_dirs[-1] if pres_dirs else None
    
    assert pres_name, "No presentation directory found"
    
    file_path = os.path.join(context.temp_dir, pres_name, "images", filename)
    assert not os.path.exists(file_path), f"File {filename} should not exist but was found at {file_path}"


@when('I read the "layouts.md" file')
def step_impl(context):
    """Read the layouts.md file from the most recent presentation."""
    pres_dirs = [d for d in os.listdir(context.temp_dir) 
                 if os.path.isdir(os.path.join(context.temp_dir, d)) and d != "templates"]
    pres_name = pres_dirs[-1] if pres_dirs else None
    
    assert pres_name, "No presentation directory found"
    
    layouts_path = os.path.join(context.temp_dir, pres_name, "layouts.md")
    with open(layouts_path, 'r') as f:
        context.layouts_content = f.read()


@then('the "{layout_name}" layout should reference "{image_path}"')
def step_impl(context, layout_name, image_path):
    """Verify a layout references a specific image path."""
    assert hasattr(context, 'layouts_content'), "layouts.md has not been read"
    
    # Find the layout section
    lines = context.layouts_content.split('\n')
    in_layout = False
    found_image = False
    
    for line in lines:
        if f'<!-- layout: {layout_name} -->' in line:
            in_layout = True
        elif in_layout and '<!-- layout:' in line:
            # Moved to next layout
            break
        elif in_layout and image_path in line:
            found_image = True
            break
    
    assert found_image, f"Layout '{layout_name}' does not reference '{image_path}'"


@given('the system images exist')
def step_impl(context):
    """Verify system images directory exists with images."""
    system_images_dir = os.path.join(context.templates_dir, "system-images")
    assert os.path.exists(system_images_dir), f"System images directory not found at {system_images_dir}"
    
    required = ['placeholder-square.png', 'placeholder-landscape.png', 'placeholder-portrait.png']
    for filename in required:
        path = os.path.join(system_images_dir, filename)
        assert os.path.exists(path), f"Required system image {filename} not found"
    
    context.system_images_dir = system_images_dir


@then('"{filename}" should have aspect ratio close to {ratio}')
def step_impl(context, filename, ratio):
    """Verify an image has the correct aspect ratio."""
    image_path = os.path.join(context.system_images_dir, filename)
    
    img = Image.open(image_path)
    width, height = img.size
    actual_ratio = width / height
    
    # Parse expected ratio
    if ':' in ratio:
        w, h = map(int, ratio.split(':'))
        expected_ratio = w / h
    else:
        expected_ratio = float(ratio)
    
    # Allow 5% tolerance
    tolerance = 0.05
    assert abs(actual_ratio - expected_ratio) / expected_ratio < tolerance, \
        f"{filename} has aspect ratio {actual_ratio:.2f}, expected {expected_ratio:.2f}"


@when('the agent is queried about available images')
def step_impl(context):
    """Query the agent about available images."""
    # The agent would list files in the images directory
    pres_dirs = [d for d in os.listdir(context.temp_dir) 
                 if os.path.isdir(os.path.join(context.temp_dir, d)) and d != "templates"]
    pres_name = pres_dirs[-1] if pres_dirs else None
    
    if pres_name:
        images_dir = os.path.join(context.temp_dir, pres_name, "images")
        if os.path.exists(images_dir):
            context.available_images = os.listdir(images_dir)
        else:
            context.available_images = []


@then('the agent should mention "{filename}"')
def step_impl(context, filename):
    """Verify the agent would mention a specific image."""
    assert hasattr(context, 'available_images'), "No available images in context"
    assert filename in context.available_images, \
        f"Image {filename} not in available images: {context.available_images}"

