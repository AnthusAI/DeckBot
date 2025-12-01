"""Step definitions for template overhaul feature."""
import os
import json
import shutil
from behave import given, when, then


@given('the template "{template_name}" exists')
def step_impl(context, template_name):
    """Copy a template from the real templates directory to the test directory."""
    # Get the real templates directory
    real_templates_dir = os.path.abspath("templates")
    real_template_path = os.path.join(real_templates_dir, template_name)
    
    # Copy to test templates directory
    test_template_path = os.path.join(context.templates_dir, template_name)
    
    if os.path.exists(real_template_path):
        shutil.copytree(real_template_path, test_template_path)
    else:
        raise AssertionError(f"Template '{template_name}' does not exist at {real_template_path}")


@when('I read the template metadata for "{template_name}"')
def step_impl(context, template_name):
    """Read the metadata.json file for a template."""
    template_path = os.path.join(context.templates_dir, template_name)
    metadata_path = os.path.join(template_path, "metadata.json")
    
    assert os.path.exists(metadata_path), f"metadata.json not found for template '{template_name}'"
    
    with open(metadata_path, 'r') as f:
        context.template_metadata = json.load(f)


@then('the template should have fonts "{heading_font}" and "{body_font}"')
def step_impl(context, heading_font, body_font):
    """Verify the template has the correct fonts."""
    typography = context.template_metadata.get('typography', {})
    assert typography.get('heading_font') == heading_font, \
        f"Expected heading font '{heading_font}', got '{typography.get('heading_font')}'"
    assert typography.get('body_font') == body_font, \
        f"Expected body font '{body_font}', got '{typography.get('body_font')}'"


@then('the template should have text color "{text_color}"')
def step_impl(context, text_color):
    """Verify the template has the correct text color."""
    colors = context.template_metadata.get('colors', {})
    assert colors.get('text') == text_color, \
        f"Expected text color '{text_color}', got '{colors.get('text')}'"


@then('the template should have background color "{bg_color}"')
def step_impl(context, bg_color):
    """Verify the template has the correct background color."""
    colors = context.template_metadata.get('colors', {})
    assert colors.get('background') == bg_color, \
        f"Expected background color '{bg_color}', got '{colors.get('background')}'"


@then('the template should have accent colors "{accent1}" and "{accent2}"')
def step_impl(context, accent1, accent2):
    """Verify the template has the correct accent colors."""
    colors = context.template_metadata.get('colors', {})
    accents = colors.get('accents', [])
    
    assert len(accents) >= 2, f"Expected at least 2 accent colors, got {len(accents)}"
    assert accents[0] == accent1, f"Expected first accent '{accent1}', got '{accents[0]}'"
    assert accents[1] == accent2, f"Expected second accent '{accent2}', got '{accents[1]}'"


@then('the output should not contain "{text}"')
def step_impl(context, text):
    """Verify that the output does NOT contain specific text."""
    output = context.result.output if hasattr(context, 'result') and context.result else ""
    assert text not in output, \
        f"Output should not contain '{text}', but it does:\n{output}"

