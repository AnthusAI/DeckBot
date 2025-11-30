from behave import given, when, then
from deckbot.agent import Agent
from deckbot.manager import PresentationManager
from unittest.mock import MagicMock, patch
import os
import json
import shutil

@given('a template "{name}" exists with design opinions')
def step_impl(context, name):
    # Ensure templates dir exists in temp environment
    templates_dir = os.path.join(context.temp_dir, "templates")
    os.makedirs(templates_dir, exist_ok=True)
    
    template_path = os.path.join(templates_dir, name)
    os.makedirs(template_path, exist_ok=True)
    
    # Create metadata.json with design_opinions
    design_opinions = {}
    for row in context.table:
        design_opinions[row['key']] = row['value']
        
    metadata = {
        "name": name,
        "description": "Test template with opinions",
        "design_opinions": design_opinions
    }
    
    with open(os.path.join(template_path, "metadata.json"), "w") as f:
        json.dump(metadata, f)
        
    # Create dummy deck.marp.md
    with open(os.path.join(template_path, "deck.marp.md"), "w") as f:
        f.write("---\nmarp: true\n---\n\n# Template Slide")

@given('a template "{name}" exists without design opinions')
def step_impl(context, name):
    templates_dir = os.path.join(context.temp_dir, "templates")
    os.makedirs(templates_dir, exist_ok=True)
    
    template_path = os.path.join(templates_dir, name)
    os.makedirs(template_path, exist_ok=True)
    
    metadata = {
        "name": name,
        "description": "Test template without opinions"
    }
    
    with open(os.path.join(template_path, "metadata.json"), "w") as f:
        json.dump(metadata, f)
        
    with open(os.path.join(template_path, "deck.marp.md"), "w") as f:
        f.write("---\nmarp: true\n---\n\n# Template Slide")

@given('a presentation uses the "{name}" template')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    # Create presentation from template
    pres_name = f"Pres_{name}"
    context.presentation_context = manager.create_presentation(pres_name, template=name)

@when('I initialize the agent')
def step_impl(context):
    # We need to mock environment variables or ensure the Agent can initialize
    with patch('os.getenv') as mock_getenv:
        def getenv_side_effect(key, default=None):
            if key == 'GOOGLE_API_KEY':
                return 'fake_key'
            return default
            
        mock_getenv.side_effect = getenv_side_effect
        
        context.agent = Agent(context.presentation_context, root_dir=context.temp_dir)
        # Store the system prompt for testing
        context.system_prompt = context.agent._build_system_prompt()
