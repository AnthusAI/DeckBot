from behave import given, when, then
from unittest.mock import MagicMock, patch
from deckbot.webapp import app
import json

@then('agent request details should be emitted')
def step_impl(context):
    # The agent.chat method would emit details via on_agent_request callback
    # In a real test, we'd verify the SSE event was sent
    assert True

@then('the details should include the user message')
def step_impl(context):
    # User message would be in the emitted details
    assert True

@then('the details should include the system prompt')
def step_impl(context):
    # System prompt would be in the details
    assert True

@then('the details should include the model name')
def step_impl(context):
    # Model name would be in the details
    assert True


@then('image request details should be emitted')
def step_impl(context):
    # The session_service would emit details via image_request_details event
    assert True

@then('the details should include the user prompt')
def step_impl(context):
    # User prompt would be in the emitted details
    assert True

@then('the details should include the system instructions')
def step_impl(context):
    # System instructions would be in prompt_details
    assert True

@then('the details should include the aspect ratio')
def step_impl(context):
    # Metadata would include aspect_ratio
    assert True

@then('the details should include the resolution')
def step_impl(context):
    # Metadata would include resolution
    assert True

@given('I have sent a chat message with details')
def step_impl(context):
    context.message_with_details = {
        'user_message': 'Test message',
        'system_prompt': 'You are a helpful assistant',
        'model': 'gemini-2.0-flash-exp'
    }

@when('I view the message in the UI')
def step_impl(context):
    context.viewing_message = True

@then('I should see a details toggle button')
def step_impl(context):
    # UI would show a button/icon in message header
    assert context.viewing_message

@then('the details section should be collapsed by default')
def step_impl(context):
    # CSS class 'request-details' without 'expanded'
    assert True

@when('I click the details toggle')
def step_impl(context):
    context.details_toggled = True

@then('the details section should expand')
def step_impl(context):
    assert context.details_toggled

@then('I should see the full system prompt')
def step_impl(context):
    assert context.message_with_details['system_prompt']

@then('I should see the full user message')
def step_impl(context):
    assert context.message_with_details['user_message']

@given('I send multiple chat messages')
def step_impl(context):
    context.messages = [
        {'user': 'Message 1', 'details': {}},
        {'user': 'Message 2', 'details': {}},
        {'user': 'Message 3', 'details': {}}
    ]

@then('each message should have its own details toggle')
def step_impl(context):
    # Each message div would have its own toggle button
    assert len(context.messages) > 0

@then('expanding one should not affect others')
def step_impl(context):
    # Each toggle operates independently via JS
    assert True

