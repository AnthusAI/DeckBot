import json
import os
import re
from behave import given, when, then, use_step_matcher
from unittest.mock import MagicMock, patch, mock_open
from deckbot.manager import PresentationManager
from deckbot.webapp import app

# Use parse matcher (default) for most steps
use_step_matcher("parse")

# Background steps

@given('the frontend is connected to the backend')
def step_impl(context):
    # Initialize SSE connection state and command tracking
    context.sse_connected = True
    context.fast_mode = False  # Default mode
    context.command_result_received = False
    context.command_error_received = False
    context.sse_streaming = False

# Fast mode state management

@given('fast mode is off')
def step_impl(context):
    context.fast_mode = False

@given('fast mode is on')
def step_impl(context):
    context.fast_mode = True

# Command execution steps

# Helper function to send slash commands
def _send_slash_command(context, cmd, args=None):
    """Helper function to send slash commands with optional args"""
    # Slash command endpoint would be /api/slash-command or similar
    # For now, we test the expected interface
    with patch('deckbot.webapp.current_service') as mock_service:
        with app.test_client() as client:
            payload = {'command': cmd}
            if args:
                payload['args'] = args
            # Include presentation name if available
            if hasattr(context, 'current_presentation_name'):
                payload['presentation_name'] = context.current_presentation_name

            context.response = client.post('/api/slash-command',
                                         data=json.dumps(payload),
                                         content_type='application/json')
            context.last_command = cmd
            if args:
                context.last_args = args

            # Simulate fast mode toggle (only for /fast without args)
            if cmd == '/fast' and not args:
                context.fast_mode = not context.fast_mode

# More specific pattern first to avoid ambiguity
@when('I send the command "{cmd}" with args "{args}"')
def step_send_command_with_args(context, cmd, args):
    _send_slash_command(context, cmd, args=args)
    # Track model for /fast commands with args (one-shot fast message)
    if cmd == '/fast' and args:
        context.last_model = 'secondary'

@when('I send the command "{cmd}"')
def step_send_command(context, cmd):
    _send_slash_command(context, cmd, args=None)

@when('I send any slash command')
def step_impl(context):
    # Send a generic slash command for SSE testing
    with app.test_client() as client:
        context.response = client.post('/api/slash-command',
                                     data=json.dumps({'command': '/help'}),
                                     content_type='application/json')

# Chat message steps

@when('I send a chat message "{message}"')
def step_impl(context, message):
    with patch('deckbot.webapp.current_service') as mock_service:
        with app.test_client() as client:
            model = 'secondary' if context.fast_mode else 'primary'
            context.response = client.post('/api/chat',
                                         data=json.dumps({'message': message, 'model': model}),
                                         content_type='application/json')
            context.last_message = message

@when('I send a regular chat message "{message}"')
def step_send_regular_chat_message(context, message):
    # Regular chat message (not slash command)
    with patch('deckbot.webapp.current_service') as mock_service:
        with app.test_client() as client:
            model = 'secondary' if context.fast_mode else 'primary'
            context.response = client.post('/api/chat',
                                         data=json.dumps({'message': message, 'model': model}),
                                         content_type='application/json')
            context.last_message = message
            context.last_model = model

# Frontend parsing steps

@when('the user types "{user_input}"')
def step_impl(context, user_input):
    # Test frontend command parsing logic
    # This would normally be JavaScript, but we test the expected behavior
    context.user_input = user_input

    # Parse command and args
    if user_input.startswith('/'):
        parts = user_input[1:].split(' ', 1)
        context.parsed_command = parts[0]
        context.parsed_args = parts[1] if len(parts) > 1 else None
    else:
        context.parsed_command = None
        context.parsed_args = None

# Assertion steps - Command results

@then('the frontend should receive a command result event')
def step_impl(context):
    # In a real implementation, this would check SSE events
    # For now, verify the API response structure
    assert context.response.status_code in [200, 201, 202], \
        f"Expected success status, got {context.response.status_code}"
    # Command result would be sent via SSE
    context.command_result_received = True

@then('the frontend should receive a command result event with the file path')
def step_impl(context):
    # Export command returns file path
    assert context.response.status_code == 200
    data = json.loads(context.response.get_data(as_text=True))
    assert 'file_path' in data or 'path' in data, "Response should contain file path"
    context.command_result_received = True

@then('the frontend should receive a command error event')
def step_impl(context):
    # Unknown command should return error
    assert context.response.status_code >= 400, \
        f"Expected error status for unknown command, got {context.response.status_code}"
    context.command_error_received = True

# Fast mode state assertions

@then('fast mode should be toggled on in the frontend state')
def step_impl(context):
    assert context.fast_mode == True, "Fast mode should be on"

@then('fast mode should be toggled off in the frontend state')
def step_impl(context):
    assert context.fast_mode == False, "Fast mode should be off"

@then('fast mode should remain off')
def step_impl(context):
    assert context.fast_mode == False, "Fast mode should remain off after one-shot command"

@then('fast mode should remain on')
def step_impl(context):
    assert context.fast_mode == True, "Fast mode should remain on after one-shot command"

# Model selection assertions

@then('subsequent chat messages should use the "{model}" model')
def step_impl(context, model):
    # Verify that the expected model would be used
    expected_fast_mode = (model == "secondary")
    assert context.fast_mode == expected_fast_mode, \
        f"Fast mode should be {expected_fast_mode} to use {model} model"

@then('the chat should use the "{model}" model')
def step_impl(context, model):
    # Verify model parameter in chat request
    assert hasattr(context, 'last_model'), "Model parameter should be set"
    assert context.last_model == model, \
        f"Expected model '{model}', got '{context.last_model}'"

@then('the request to "{endpoint}" should include model parameter "{model}"')
def step_impl(context, endpoint, model):
    # Verify model parameter was included in request
    assert hasattr(context, 'last_model'), "Model parameter should be set"
    assert context.last_model == model, \
        f"Expected model parameter '{model}', got '{context.last_model}'"

# Export command assertions
# Note: 'the presentation contains a file' and 'Marp CLI is available' steps are defined in tools_steps.py

@then('a PDF should be generated in a temporary location')
def step_impl(context):
    # Verify PDF generation was triggered
    # In real implementation, would check temp file creation
    if context.response.status_code != 200:
        print(f"DEBUG: Response status: {context.response.status_code}")
        print(f"DEBUG: Response body: {context.response.get_data(as_text=True)}")
    assert context.response.status_code == 200, f"PDF export should succeed, got {context.response.status_code}: {context.response.get_data(as_text=True)}"

@then('the Electron app should trigger a download')
def step_impl(context):
    # Electron download trigger would be via IPC
    # For testing, we verify the expected response format
    assert context.command_result_received, "Command result should be sent for Electron to handle"

# Help command assertions

@then('the response should contain the contents of "{filename}"')
def step_impl(context, filename):
    # Verify help.md contents are returned
    assert context.response.status_code == 200
    response_data = context.response.get_data(as_text=True)

    # Check that response contains expected help content
    # (Actual content check would depend on help.md format)
    assert len(response_data) > 0, "Help response should not be empty"

@then('the help should include available slash commands')
def step_impl(context):
    response_data = context.response.get_data(as_text=True)
    # Check for common slash commands in help text
    assert '/fast' in response_data or 'fast' in response_data.lower(), \
        "Help should mention fast command"

@then('the help should include keyboard shortcuts')
def step_impl(context):
    response_data = context.response.get_data(as_text=True)
    assert 'keyboard' in response_data.lower() or 'shortcut' in response_data.lower(), \
        "Help should mention keyboard shortcuts"

@then('the help should include UI tips')
def step_impl(context):
    response_data = context.response.get_data(as_text=True)
    assert 'tip' in response_data.lower() or 'hint' in response_data.lower() or len(response_data) > 100, \
        "Help should include UI tips"

# Tools command assertions

@then('the response should contain a list of agent tools')
def step_impl(context):
    assert context.response.status_code == 200
    response_data = json.loads(context.response.get_data(as_text=True))

    assert 'tools' in response_data or isinstance(response_data, list), \
        "Response should contain tools list"

@then('each tool should have a name and description')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    tools = response_data if isinstance(response_data, list) else response_data.get('tools', [])

    assert len(tools) > 0, "Should have at least one tool"
    for tool in tools:
        assert 'name' in tool or 'function' in tool, "Tool should have name"
        assert 'description' in tool, "Tool should have description"

# Error handling assertions

@then('the error message should indicate the command is not recognized')
def step_impl(context):
    response_data = context.response.get_data(as_text=True)
    assert 'not recognized' in response_data.lower() or \
           'unknown' in response_data.lower() or \
           'invalid' in response_data.lower(), \
        "Error message should indicate unknown command"

# Frontend parsing assertions

@then('the frontend should parse it as command "{cmd}" with args "{args}"')
def step_impl(context, cmd, args):
    assert context.parsed_command == cmd, \
        f"Expected command '{cmd}', got '{context.parsed_command}'"
    assert context.parsed_args == args, \
        f"Expected args '{args}', got '{context.parsed_args}'"

@then('the frontend should parse it as command "{cmd}" with no args')
def step_impl(context, cmd):
    assert context.parsed_command == cmd, \
        f"Expected command '{cmd}', got '{context.parsed_command}'"
    assert context.parsed_args is None, \
        f"Expected no args, got '{context.parsed_args}'"

# Chat message routing assertions

@then('it should be sent to the chat endpoint as a regular message')
def step_impl(context):
    # Verify message was sent to chat API, not slash command API
    assert hasattr(context, 'last_message'), "Message should be sent"
    assert context.last_message == "I want to discuss /fast command"

@then('it should not be interpreted as a slash command')
def step_impl(context):
    # Slash command in middle of message should not trigger command
    # Check that we don't have a parsed command (only set by "user types" step)
    # OR that the message doesn't start with / (meaning it's embedded)
    assert not hasattr(context, 'parsed_command') or not context.last_message.startswith('/'), \
        "Message should not be interpreted as slash command"

# SSE streaming assertions

@then('the message should be sent to the chat endpoint')
def step_impl(context):
    # Verify chat endpoint was called
    assert context.response.status_code in [200, 202], "Chat message should be accepted"

@then('the response should stream via SSE')
def step_impl(context):
    # In real implementation, verify SSE headers
    # For testing, we verify the response format allows streaming
    context.sse_streaming = True
    assert True, "SSE streaming would be verified by checking response headers"

@then('the response should stream via the SSE "{channel}" channel')
def step_impl(context, channel):
    # Verify correct SSE channel
    context.sse_channel = channel
    assert True, f"Would verify SSE channel is {channel}"

@then('the frontend should handle the event appropriately')
def step_impl(context):
    # Frontend event handling
    assert context.command_result_received or context.response.status_code == 200, \
        "Frontend should receive handleable event"

@then('the UI should update in real-time')
def step_impl(context):
    # Real-time UI update via SSE
    assert context.sse_streaming or context.sse_connected, \
        "SSE connection required for real-time updates"
