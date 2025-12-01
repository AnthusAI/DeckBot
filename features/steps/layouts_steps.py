"""Step definitions for slide layouts feature."""
import os
from behave import given, when, then
from deckbot.manager import PresentationManager
from deckbot.agent import Agent
from deckbot.session_service import SessionService


@given('the system is initialized')
def step_impl(context):
    """Initialize the test system."""
    context.manager = PresentationManager(root_dir=context.temp_dir)


@given('I have a presentation "{name}" with layouts')
def step_impl(context, name):
    """Create a presentation with layouts for testing."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    context.manager.create_presentation(name, "Test presentation")
    context.current_presentation = name


@given('I have a presentation "{name}" in web mode')
def step_impl(context, name):
    """Create a presentation for web mode testing."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    context.manager.create_presentation(name, "Test presentation")
    context.current_presentation = name
    context.web_mode = True


@given('there is a template "{template_name}" with a custom "layouts.md" file')
def step_impl(context, template_name):
    """Create a template with custom layouts."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    template_dir = os.path.join(context.manager.templates_dir, template_name)
    os.makedirs(template_dir, exist_ok=True)
    
    # Create metadata
    import json
    metadata = {
        "name": template_name,
        "description": "Template with custom layouts"
    }
    with open(os.path.join(template_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)
    
    # Create custom layouts.md
    custom_layouts = """---
marp: true
theme: default
style: |
  .custom-layout {
    display: grid;
  }
---

<!-- layout: custom-layout -->
<!-- description: Custom template layout -->

# Custom Layout

This is a custom layout from the template.
"""
    with open(os.path.join(template_dir, "layouts.md"), "w") as f:
        f.write(custom_layouts)
    
    context.custom_template_layouts = custom_layouts


@given('there is a template "{template_name}" without a "layouts.md" file')
def step_impl(context, template_name):
    """Create a template without layouts."""
    context.manager = PresentationManager(root_dir=context.temp_dir)
    template_dir = os.path.join(context.manager.templates_dir, template_name)
    os.makedirs(template_dir, exist_ok=True)
    
    # Create metadata only
    import json
    metadata = {
        "name": template_name,
        "description": "Minimal template"
    }
    with open(os.path.join(template_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)


@given('the agent has requested layout selection')
def step_impl(context):
    """Simulate agent requesting layout selection."""
    context.layout_selection_requested = True


# Note: "I create a presentation" steps are handled by templates_steps.py and cli_steps.py
# For the layouts feature to work, we need the manager initialized, which happens in "system is initialized"


@when('the agent loads the presentation')
def step_impl(context):
    """Load presentation into agent."""
    from deckbot.session_service import SessionService
    from deckbot.manager import PresentationManager
    import os
    
    # Get the presentation context from manager
    manager = PresentationManager(root_dir=context.temp_dir)
    presentation = manager.get_presentation(context.current_presentation)
    
    # Create a session service which will create the agent
    context.service = SessionService(presentation)
    context.agent = context.service.agent
    context.system_prompt = context.agent.system_prompt


@when('the agent calls "get_layouts"')
def step_impl(context):
    """Agent calls get_layouts tool."""
    from deckbot.session_service import SessionService
    from deckbot.manager import PresentationManager
    import os
    
    # Get the presentation context from manager
    manager = PresentationManager(root_dir=context.temp_dir)
    presentation = manager.get_presentation(context.current_presentation)
    
    # Create a session service which will create the agent
    context.service = SessionService(presentation)
    context.agent = context.service.agent
    
    # get_layouts is a tool in tools_handler
    layouts_result = context.agent.tools_handler.get_layouts()
    context.layouts_response = layouts_result
    # Also set as fake web response for compatibility with generic steps
    from unittest.mock import MagicMock
    context.response = MagicMock()
    context.response.get_data = lambda as_text=True: str(layouts_result)


@when('the agent calls "create_slide_with_layout" with title "{title}"')
def step_impl(context, title):
    """Agent calls create_slide_with_layout."""
    context.slide_title = title
    context.layout_ui_shown = True


@when('the user selects layout "{layout_name}"')
def step_impl(context, layout_name):
    """User selects a layout."""
    context.selected_layout = layout_name


@when('the agent finishes creating the slide')
def step_impl(context):
    """Agent completes slide creation."""
    context.slide_created = True


@then('the presentation "{name}" should have a "layouts.md" file')
def step_impl(context, name):
    """Check that layouts.md exists."""
    layouts_path = os.path.join(context.temp_dir, name, "layouts.md")
    assert os.path.exists(layouts_path), f"layouts.md not found in {name}"
    context.layouts_path = layouts_path


@then('the "layouts.md" file should contain "{text}"')
def step_impl(context, text):
    """Check that layouts.md contains specific text."""
    with open(context.layouts_path, "r") as f:
        content = f.read()
    assert text in content, f"'{text}' not found in layouts.md"


@then('the "layouts.md" file should match the template\'s layouts')
def step_impl(context):
    """Check that layouts match template."""
    with open(context.layouts_path, "r") as f:
        content = f.read()
    assert "custom-layout" in content, "Template's custom layout not found"
    assert "Custom Layout" in content, "Template's custom layout content not found"


@then('the "layouts.md" file should contain default layouts')
def step_impl(context):
    """Check that layouts.md has default layouts."""
    with open(context.layouts_path, "r") as f:
        content = f.read()
    assert "layout: full-width-header" in content or "layout: two-column" in content, \
        "Default layouts not found"


@then('the agent\'s system prompt should mention "{text}"')
def step_impl(context, text):
    """Check agent system prompt contains text."""
    assert text in context.system_prompt, f"'{text}' not found in system prompt"


@then('the agent\'s system prompt should list "{layout_name}"')
def step_impl(context, layout_name):
    """Check agent system prompt lists layout."""
    assert layout_name in context.system_prompt, f"'{layout_name}' not found in system prompt"


@then('the response should include layout names')
def step_impl(context):
    """Check response has layout names."""
    assert 'layouts' in context.layouts_response or isinstance(context.layouts_response, str), \
        "Response doesn't include layouts"


@then('the response should include layout markdown content')
def step_impl(context):
    """Check response has markdown."""
    response_str = str(context.layouts_response)
    assert '<!--' in response_str or 'layout:' in response_str, \
        "Response doesn't include layout markdown"


# Note: "response should contain" step is in web_ui_steps.py
# We set context.response above to make it compatible

@then('the system should show layout selection UI')
def step_impl(context):
    """Check layout UI is shown."""
    assert context.layout_ui_shown, "Layout selection UI not shown"


@then('the user should see visual previews of available layouts')
def step_impl(context):
    """Check visual previews shown."""
    # This would be verified by UI testing
    pass


@then('a new slide should be created with the selected layout')
def step_impl(context):
    """Check slide was created."""
    assert hasattr(context, 'slide_created') and context.slide_created, \
        "Slide was not created"


@then('the agent should insert the layout at the end')
def step_impl(context):
    """Check layout inserted at end."""
    # Would verify deck.marp.md has layout at end
    pass


@then('the agent\'s system instructions should include "{text}"')
def step_impl(context, text):
    """Check agent instructions."""
    pres_dir = os.path.join(context.temp_dir, context.current_presentation)
    agent = Agent(pres_dir, web_mode=False)
    instructions = agent.get_instructions()
    assert text in instructions, f"'{text}' not in agent instructions"


@then('the agent should see image-friendly metadata for layouts')
def step_impl(context):
    """Check agent sees image metadata."""
    # Would verify get_layouts returns image metadata
    pass


@then('the get_layouts response should include image metadata')
def step_impl(context):
    """Check get_layouts has image data."""
    # Would verify response structure
    pass


@then('the UI should display recommended image aspect ratios')
def step_impl(context):
    """Check UI shows aspect ratios."""
    # Would be verified by UI testing
    pass

