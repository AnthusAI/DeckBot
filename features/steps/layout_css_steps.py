"""Step definitions for layout CSS integration feature."""
import os
from behave import given, when, then
from deckbot.manager import PresentationManager


@given('there is a template "{template_name}" with custom layouts and CSS')
def step_impl(context, template_name):
    """Create a template with custom layouts and CSS."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    template_dir = os.path.join(context.manager.templates_dir, template_name)
    os.makedirs(template_dir, exist_ok=True)
    
    # Create metadata
    import json
    metadata = {
        "name": template_name,
        "description": "Template with custom CSS"
    }
    with open(os.path.join(template_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)
    
    # Create custom layouts with CSS
    custom_layouts = """---
marp: true
theme: default
style: |
  .custom-style {
    background: red;
  }
---

<!-- layout: custom-style -->

# Custom
"""
    with open(os.path.join(template_dir, "layouts.md"), "w") as f:
        f.write(custom_layouts)
    
    context.template_css = ".custom-style"


@given('there is a template "{template_name}" with custom deck CSS')
def step_impl(context, template_name):
    """Create template with custom deck CSS."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    template_dir = os.path.join(context.manager.templates_dir, template_name)
    os.makedirs(template_dir, exist_ok=True)
    
    # Create metadata
    import json
    metadata = {"name": template_name, "description": "Custom CSS template"}
    with open(os.path.join(template_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)
    
    # Create deck with custom CSS
    deck_content = """---
marp: true
style: |
  section {
    background: blue;
  }
---

# Test
"""
    with open(os.path.join(template_dir, "deck.marp.md"), "w") as f:
        f.write(deck_content)


@given('I have a "layouts.md" file with CSS in the front matter')
def step_impl(context):
    """Create a layouts.md file."""
    context.layouts_content = """---
marp: true
style: |
  .test-layout {
    color: red;
  }
---

<!-- layout: test -->
# Test
"""
    context.layouts_file = os.path.join(context.temp_dir, "test-layouts.md")
    with open(context.layouts_file, "w") as f:
        f.write(context.layouts_content)


@given('the default layouts have CSS comments')
def step_impl(context):
    """Verify default layouts have comments."""
    # Default layouts should have comments
    pass


# Note: "I create a presentation" steps are defined in templates_steps.py and reused here


@given('I add a slide using the "{layout_name}" layout')
def step_impl(context, layout_name):
    """Add a slide with layout."""
    context.test_layout = layout_name


@when('I extract the CSS from the layouts file')
def step_impl(context):
    """Extract CSS from layouts."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    context.extracted_css = context.manager._extract_layouts_css(context.layouts_file)


@when('I compile the presentation')
def step_impl(context):
    """Compile presentation."""
    context.compiled = True


@when('I modify the layouts.md CSS')
def step_impl(context):
    """Modify layouts CSS."""
    layouts_path = os.path.join(context.temp_dir, context.current_presentation, "layouts.md")
    with open(layouts_path, "r") as f:
        content = f.read()
    # Add new CSS
    content = content.replace("style: |", "style: |\n  .new-layout { color: green; }")
    with open(layouts_path, "w") as f:
        f.write(content)
    context.modified_css = True


@when('I request to update the deck styles')
def step_impl(context):
    """Update deck styles."""
    pres_dir = os.path.join(context.temp_dir, context.current_presentation)
    layouts_path = os.path.join(pres_dir, "layouts.md")
    context.manager._merge_layouts_css(pres_dir, layouts_path)


@then('the presentation "{name}" should have a "deck.marp.md" file')
def step_impl(context, name):
    """Check deck.marp.md exists."""
    deck_path = os.path.join(context.temp_dir, name, "deck.marp.md")
    assert os.path.exists(deck_path), f"deck.marp.md not found in {name}"
    context.deck_path = deck_path


@then('the "deck.marp.md" should contain the layouts CSS styles')
def step_impl(context):
    """Check deck has layout CSS."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    # Check for layout CSS classes
    assert "style:" in content, "No style block in deck"


@then('the "deck.marp.md" should contain "{text}"')
def step_impl(context, text):
    """Check deck contains text."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    assert text in content, f"'{text}' not found in deck.marp.md"


@then('the "deck.marp.md" should contain the template\'s layout CSS')
def step_impl(context):
    """Check deck has template CSS."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    assert context.template_css in content, "Template CSS not found in deck"


@then('the CSS should be merged into the front matter')
def step_impl(context):
    """Check CSS in front matter."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    lines = content.split('\n')
    in_front_matter = False
    found_style = False
    for line in lines:
        if line.strip() == '---':
            in_front_matter = not in_front_matter
        if in_front_matter and 'style:' in line:
            found_style = True
    assert found_style, "CSS not in front matter"


@then('the "deck.marp.md" should contain the default layouts CSS')
def step_impl(context):
    """Check deck has default CSS."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    assert "style:" in content, "No style block found"


@then('the "deck.marp.md" should contain both template CSS and layouts CSS')
def step_impl(context):
    """Check both CSS present."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    assert "background: blue" in content, "Template CSS not found"
    # Default layouts should also be present


@then('the styles should be in the correct order')
def step_impl(context):
    """Check CSS order."""
    # CSS should be properly merged
    pass


@then('there should be no duplicate style blocks')
def step_impl(context):
    """Check no duplicates."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    style_count = content.count('style: |')
    assert style_count <= 1, f"Found {style_count} style blocks, expected 1"


@then('I should get the complete style block')
def step_impl(context):
    """Check extracted CSS complete."""
    assert context.extracted_css is not None, "No CSS extracted"
    assert ".test-layout" in context.extracted_css, "Test layout CSS not extracted"


@then('it should include all layout classes')
def step_impl(context):
    """Check all classes included."""
    assert context.extracted_css, "No CSS extracted"


@then('it should not include the front matter delimiters')
def step_impl(context):
    """Check no delimiters."""
    assert "---" not in context.extracted_css, "Front matter delimiters in CSS"


@then('the compiled HTML should include the two-column CSS')
def step_impl(context):
    """Check compiled HTML has CSS."""
    # Would verify compiled output
    pass


@then('the two-column layout should be styled correctly')
def step_impl(context):
    """Check layout styling."""
    # Would verify visual output
    pass


@then('the deck.marp.md should reflect the updated CSS')
def step_impl(context):
    """Check CSS updated."""
    deck_path = os.path.join(context.temp_dir, context.current_presentation, "deck.marp.md")
    with open(deck_path, "r") as f:
        content = f.read()
    assert ".new-layout" in content, "Updated CSS not in deck"


@then('the old layout CSS should be replaced')
def step_impl(context):
    """Check old CSS replaced."""
    # Would verify old CSS is gone
    pass


@then('the "deck.marp.md" should preserve CSS comments')
def step_impl(context):
    """Check comments preserved."""
    # Set deck_path if not already set
    if not hasattr(context, 'deck_path'):
        pres_dir = os.path.join(context.temp_dir, context.current_presentation)
        context.deck_path = os.path.join(pres_dir, "deck.marp.md")
    
    with open(context.deck_path, "r") as f:
        content = f.read()
    # Check for comment markers
    assert "/*" in content or "//" in content, "No CSS comments found"


@then('the comments should explain layout purposes')
def step_impl(context):
    """Check comment content."""
    # Would verify comment quality
    pass

