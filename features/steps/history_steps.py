from behave import given, when, then
from unittest.mock import patch, MagicMock
import os
import json
from deckbot.cli import cli
from deckbot.agent import Agent
from deckbot.manager import PresentationManager

@then('the message "{message}" should be logged to "{filepath}"')
def step_impl(context, message, filepath):
    # filepath format: "presentation-name/chat_history.jsonl"
    # Need to use PresentationManager to get encoded directory name
    parts = filepath.split('/')
    presentation_name = parts[0]
    filename = parts[1] if len(parts) > 1 else 'chat_history.jsonl'

    manager = PresentationManager(root_dir=context.temp_dir)
    pres = manager.get_presentation(presentation_name)
    dir_name = pres.get('_dir_name', presentation_name)
    full_path = os.path.join(context.temp_dir, 'presentations', dir_name, filename)

    assert os.path.exists(full_path), f"Log file {full_path} not found"

    found = False
    with open(full_path, 'r') as f:
        for line in f:
            entry = json.loads(line)
            # Agent uses 'content' key, step used 'message'. Fix test to use 'content'.
            if entry.get('content') == message:
                found = True
                break
    assert found, f"Message '{message}' not found in {filepath}"

@given('the presentation contains a chat history with a message "{message}"')
def step_impl(context, message):
    # Create the history file
    manager = PresentationManager(root_dir=context.temp_dir)
    # Ensure presentation exists (assumed from previous step or created here)
    presentation_name = "history-test" # Default fallback
    if hasattr(context, 'current_presentation_name') and context.current_presentation_name:
        presentation_name = context.current_presentation_name

    if not manager.get_presentation(presentation_name):
        manager.create_presentation(presentation_name, "History Test")

    pres = manager.get_presentation(presentation_name)
    dir_name = pres.get('_dir_name', presentation_name)
    presentation_dir = os.path.join(context.temp_dir, 'presentations', dir_name)
    history_file = os.path.join(presentation_dir, "chat_history.jsonl")

    with open(history_file, 'w') as f:
        # Agent uses 'content' key
        f.write(json.dumps({"role": "user", "content": message}) + "\n")
        f.write(json.dumps({"role": "model", "content": "I remember that."}) + "\n")

@given('the presentation contains a chat history with the last agent message "{message}"')
def step_impl(context, message):
    # Helper to get current presentation name (set in cli_steps or tools_steps)
    presentation_name = getattr(context, 'current_presentation_name', None)
    if not presentation_name:
        # Default fallback
        presentation_name = "resume-msg-deck"

    manager = PresentationManager(root_dir=context.temp_dir)
    if not manager.get_presentation(presentation_name):
        manager.create_presentation(presentation_name, "History Test")

    pres = manager.get_presentation(presentation_name)
    dir_name = pres.get('_dir_name', presentation_name)
    presentation_dir = os.path.join(context.temp_dir, 'presentations', dir_name)
    os.makedirs(presentation_dir, exist_ok=True)
    history_file = os.path.join(presentation_dir, "chat_history.jsonl")

    with open(history_file, 'w') as f:
        f.write(json.dumps({"role": "user", "content": "Previous prompt"}) + "\n")
        f.write(json.dumps({"role": "model", "content": message}) + "\n")

@when('I run the load command for "{name}" with the --continue flag')
def step_impl(context, name):
    with patch('deckbot.cli.start_repl') as mock_repl:
        import shlex
        # Make sure the patch is applied to where it is IMPORTED in cli.py
        # context.runner.invoke loads the module, so the patch must be active during invoke
        context.mock_repl = mock_repl
        args = shlex.split(f"load {name} --continue")
        context.result = context.runner.invoke(cli, args, env={'VIBE_PRESENTATION_ROOT': context.temp_dir})

@then('the conversation history should be loaded into the agent')
def step_impl(context):
    # Verify start_repl called with resume=True
    assert context.mock_repl.called
    _, kwargs = context.mock_repl.call_args
    assert kwargs.get('resume') is True
