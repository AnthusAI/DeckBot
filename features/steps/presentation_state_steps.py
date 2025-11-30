from behave import given, when, then
import os
import json
from unittest.mock import patch
from deckbot.state import StateManager
from deckbot.webapp import app
import deckbot.webapp as webapp_module

@when('I load the presentation "{name}" via the API')
def step_impl(context, name):
    """Load a presentation using the API endpoint."""
    # Setup test client
    app.config['TESTING'] = True
    context.client = app.test_client()
    
    # Mock request
    response = context.client.post('/api/load', json={'name': name})
    assert response.status_code == 200
    context.last_response = response

@then('the persisted state should indicate "{name}" is the current presentation')
def step_impl(context, name):
    """Verify the state manager has recorded the presentation."""
    state_manager = StateManager()
    current = state_manager.get_current_presentation()
    assert current == name, f"Expected state to be '{name}', but got '{current}'"

@given('the persisted state indicates "{name}" is the current presentation')
def step_impl(context, name):
    """Manually set the state for testing."""
    state_manager = StateManager()
    state_manager.set_current_presentation(name)

@when('I request the current presentation state')
def step_impl(context):
    """Call the state API endpoint."""
    app.config['TESTING'] = True
    context.client = app.test_client()
    
    response = context.client.get('/api/state/current-presentation')
    context.last_response = response

@then('the state response should contain name "{name}"')
def step_impl(context, name):
    """Verify API response."""
    assert context.last_response.status_code == 200
    data = context.last_response.get_json()
    assert data['name'] == name, f"Expected response name to be '{name}', got '{data.get('name')}'"

@given('I have a persisted presentation state')
def step_impl(context):
    """Ensure some state exists."""
    state_manager = StateManager()
    state_manager.set_current_presentation("test-deck-state")
    # Also set a dummy service in webapp to test unloading
    webapp_module.current_service = "dummy_service"

@when('I clear the current presentation state')
def step_impl(context):
    """Call the clear state endpoint."""
    app.config['TESTING'] = True
    context.client = app.test_client()
    
    response = context.client.delete('/api/state/current-presentation')
    assert response.status_code == 200

@then('the persisted state should be empty')
def step_impl(context):
    """Verify state is cleared."""
    state_manager = StateManager()
    current = state_manager.get_current_presentation()
    assert current is None, f"Expected empty state, but got '{current}'"

@when('I request to close the presentation via API')
def step_impl(context):
    """Call the API endpoint used by the Close menu item."""
    app.config['TESTING'] = True
    context.client = app.test_client()
    
    response = context.client.delete('/api/state/current-presentation')
    assert response.status_code == 200

@then('the current service should be unloaded')
def step_impl(context):
    """Verify current_service is None in webapp."""
    assert webapp_module.current_service is None, "Expected current_service to be None"
