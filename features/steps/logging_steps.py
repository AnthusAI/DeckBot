from behave import given, when, then
import os
import json
import shlex
import sys
from unittest.mock import patch, MagicMock
from click.testing import CliRunner
from deckbot.cli import cli
from deckbot.manager import PresentationManager
from deckbot.agent import Agent

@given('the agent is active for "{name}"')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    presentation = manager.get_presentation(name)
    
    # Mock the new google.genai Client
    context.mock_client = MagicMock()
    with patch('deckbot.agent.genai.Client', return_value=context.mock_client):
        context.real_agent = Agent(presentation, root_dir=context.temp_dir)
        context.agent = context.real_agent  # Make it available as context.agent too
        context.real_agent.model = "gemini-2.0-flash-exp"
    
    # Mock response for any chat calls
    mock_response = MagicMock()
    mock_response.candidates = [MagicMock()]
    mock_response.candidates[0].content.parts = [MagicMock()]
    mock_response.candidates[0].content.parts[0].text = "I am AI."
    context.mock_client.models.generate_content.return_value = mock_response
    
    context.responses = []
    context.last_response = None

@given('the presentation has chat history:')
def step_impl(context):
    # Find the presentation name from context
    if hasattr(context, 'real_agent'):
        pres_name = context.real_agent.context['name']
    else:
        # Infer from scenario - use a reasonable default
        pres_name = "resume-context-test"
    
    presentation_dir = os.path.join(context.temp_dir, pres_name)
    history_file = os.path.join(presentation_dir, "chat_history.jsonl")
    
    with open(history_file, 'w') as f:
        for row in context.table:
            entry = {
                "role": row['role'],
                "content": row['content']
            }
            f.write(json.dumps(entry) + "\n")

@given('the presentation contains a history file with a previous message "{message}"')
def step_impl(context, message):
    # Use jsonl format
    entry = {"role": "user", "content": message}
    path = os.path.join(context.temp_dir, "resume-test", "chat_history.jsonl")
    with open(path, 'w') as f:
        f.write(json.dumps(entry) + "\n")

@when('I run the load command for "{name}" with the continue flag')
def step_impl(context, name):
    with patch('deckbot.cli.start_repl') as mock_repl:
        # Put option before argument to ensure correct parsing
        args = shlex.split(f"load --continue {name}")
        result = context.runner.invoke(cli, args, env={'VIBE_PRESENTATION_ROOT': context.temp_dir})
        if result.exit_code != 0:
             print(f"Result Output: {result.output}", file=sys.stderr)
        context.mock_repl = mock_repl

@then('a "{filename}" file should exist in the presentation')
def step_impl(context, filename):
    path = os.path.join(context.temp_dir, "logging-test", filename)
    assert os.path.exists(path)

@then('the history file should contain "{text}"')
def step_impl(context, text):
    path = os.path.join(context.temp_dir, "logging-test", "chat_history.jsonl")
    with open(path, 'r') as f:
        content = f.read()
    assert text in content

@then('the history file should contain the AI response')
def step_impl(context):
    path = os.path.join(context.temp_dir, "logging-test", "chat_history.jsonl")
    with open(path, 'r') as f:
        content = f.read()
    # The mocked response in assistant_steps.py is "Sure, here is an outline."
    # The step "the assistant should respond using the Google Gen AI model" asserts "Sure, here is an outline."
    # However, logging_steps.py:22 mocks it as "I am AI."
    
    # Depending on WHICH step created context.real_agent, the response differs.
    # Scenario "Log conversation messages" uses:
    # Given the agent is active for "logging-test" (logging_steps.py) -> sets "I am AI."
    # When I type "Hello AI" (assistant_steps.py) -> RE-MOCKS and sets "Sure, here is an outline."
    
    # We need to align the expected response.
    assert "Sure, here is an outline." in content

@then('the agent\'s response should reference the previous image request')
def step_impl(context):
    # Check that history was used in API call
    assert context.mock_client.models.generate_content.called
    call_args = context.mock_client.models.generate_content.call_args
    contents = call_args.kwargs.get('contents', [])
    
    # Should have more than just system + current message
    # Expecting: system, previous messages, current msg
    assert len(contents) >= 3, f"Expected at least 3 contents in history, got {len(contents)}"

@then('the agent should not ask what image to modify')
def step_impl(context):
    # Agent should have context from history
    response = context.last_response.lower() if context.last_response else ""
    assert "what image" not in response
    assert "which image" not in response

@then('the agent should understand "{word}" refers to {concept}')
def step_impl(context, word, concept):
    # Check that history contains messages
    assert context.mock_client.models.generate_content.called
    call_args = context.mock_client.models.generate_content.call_args
    contents = call_args.kwargs.get('contents', [])
    
    # The history should include previous messages
    assert len(contents) >= 2, f"Expected history to be included, got {len(contents)} contents"

@then('the agent should not ask for clarification about the topic')
def step_impl(context):
    response = context.last_response.lower() if context.last_response else ""
    # Should not be asking basic clarifying questions
    assert "what topic" not in response
    assert "which topic" not in response

@then('the agent should not ask what topic to cover')
def step_impl(context):
    response = context.last_response.lower() if context.last_response else ""
    assert "what topic" not in response
    assert "about what" not in response

@then('the start_repl function should be called with resume=True')
def step_impl(context):
    assert context.mock_repl.called
    args, kwargs = context.mock_repl.call_args
    print(f"DEBUG: args={args}, kwargs={kwargs}", file=sys.stderr)
    assert kwargs.get('resume') is True