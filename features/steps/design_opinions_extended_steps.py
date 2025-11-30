from behave import given, when
import os
import json
from unittest.mock import patch
from deckbot.manager import PresentationManager

@given('the presentation "{name}" has metadata with design opinions:')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    # Ensure presentation exists
    if not manager.get_presentation(name):
        manager.create_presentation(name)
        
    metadata_path = os.path.join(context.temp_dir, name, "metadata.json")
    with open(metadata_path, 'r') as f:
        data = json.load(f)
    
    opinions = {}
    for row in context.table:
        opinions[row['key']] = row['value']
        
    data['design_opinions'] = opinions
    
    with open(metadata_path, 'w') as f:
        json.dump(data, f)

from deckbot.agent import Agent

@when('the design agent is initialized for "{name}"')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    presentation = manager.get_presentation(name)
    # Mock client to avoid API key error
    with patch('deckbot.agent.genai.Client'):
        context.agent = Agent(presentation, root_dir=context.temp_dir)
