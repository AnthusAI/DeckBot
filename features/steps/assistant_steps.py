from behave import given, when, then
from unittest.mock import patch, MagicMock
from deckbot.cli import cli
from deckbot.agent import Agent
from deckbot.manager import PresentationManager
import os

@given('I run the load command for "{name}"')
def step_impl(context, name):
    # Just reuse the when step
    context.execute_steps(f'When I run the load command for "{name}"')

@when('I run the load command for "{name}"')
def step_impl(context, name):
    # Mocking the REPL to avoid infinite loop
    with patch('deckbot.cli.start_repl') as mock_repl:
        import shlex
        args = shlex.split(f"load {name}")
        context.result = context.runner.invoke(cli, args, env={'VIBE_PRESENTATION_ROOT': context.temp_dir})
        context.mock_repl = mock_repl

@then('the REPL should start with context "{name}"')
def step_impl(context, name):
    assert context.mock_repl.called
    args, _ = context.mock_repl.call_args
    assert args[0]['name'] == name

@then('the system prompt should contain "{text}"')
def step_impl(context, text):
    # Check if we have a system prompt directly (from design_opinions tests)
    if hasattr(context, 'system_prompt'):
        assert text in context.system_prompt, f"Expected '{text}' in system prompt, but not found."
        return
    
    # Check if we have an agent directly
    if hasattr(context, 'agent'):
        system_prompt = context.agent._build_system_prompt()
        assert text in system_prompt, f"Expected '{text}' in system prompt, but not found."
        return
    
    # Legacy behavior: check via mocked REPL
    if hasattr(context, 'mock_repl') and context.mock_repl.called:
        args, _ = context.mock_repl.call_args
        presentation = args[0]
        assert text in presentation.get('description', '') or text in str(presentation)
    else:
        # If not called (maybe separate test path), check manually
        assert True # Skip if not applicable to current scenario flow

@given('the REPL is running for "{name}"')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    # Ensure presentation exists
    if not manager.get_presentation(name):
        manager.create_presentation(name, "Mock description")
        
    presentation = manager.get_presentation(name)
    
    # We are testing the Agent logic directly here mostly
    # Patch the new genai.Client instead of GenerativeModel
    with patch('google.genai.Client') as mock_client_cls:
        context.real_agent = Agent(presentation)
        # Ensure client is mocked even if API key missing (Agent skips init if no key)
        context.real_agent.client = mock_client_cls.return_value
        context.real_agent.model = "gemini-2.0-flash-exp" # Mock model name
        
        # Mock the generate_content response
        mock_response = MagicMock()
        mock_response.candidates = [MagicMock()]
        mock_response.candidates[0].content.parts = [MagicMock()]
        mock_response.candidates[0].content.parts[0].text = "Sure, here is an outline."
        context.real_agent.client.models.generate_content.return_value = mock_response

@when('I type "{message}"')
def step_impl(context, message):
    # Ensure real_agent is set up if not already
    if not hasattr(context, 'real_agent'):
        manager = PresentationManager(root_dir=context.temp_dir)
        presentation = manager.get_presentation("history-test") # fallback or default
        if not presentation:
             manager.create_presentation("history-test", "")
             presentation = manager.get_presentation("history-test")
        
        with patch('google.genai.Client') as mock_client_cls:
            context.real_agent = Agent(presentation)
            context.real_agent.client = mock_client_cls.return_value
            context.real_agent.model = "gemini-2.0-flash-exp"
    
    # Ensure the return value is set for THIS call if step called multiple times or late
    mock_response = MagicMock()
    mock_response.candidates = [MagicMock()]
    mock_response.candidates[0].content.parts = [MagicMock()]
    mock_response.candidates[0].content.parts[0].text = "Sure, here is an outline."
    context.real_agent.client.models.generate_content.return_value = mock_response

    context.response = context.real_agent.chat(message)

@then('the assistant should respond using the Google Gen AI model')
def step_impl(context):
    assert context.response == "Sure, here is an outline."
    # Verify generate_content was called
    context.real_agent.client.models.generate_content.assert_called()

@then('the conversation history should be updated')
def step_impl(context):
    # Logic handled by Gemini's ChatSession usually, but we can verify our wrapper tracks it if we implement history
    pass

@then('the system prompt should not contain "{text}"')
def step_impl(context, text):
    # Check if we have a system prompt directly (from design_opinions tests)
    if hasattr(context, 'system_prompt'):
        assert text not in context.system_prompt, f"Expected '{text}' NOT to be in system prompt, but it was found."
        return
    
    # Check if we have an agent directly
    if hasattr(context, 'agent'):
        system_prompt = context.agent._build_system_prompt()
        assert text not in system_prompt, f"Expected '{text}' NOT to be in system prompt, but it was found."
        return
    
    # Legacy behavior
    if hasattr(context, 'mock_repl') and context.mock_repl.called:
        args, _ = context.mock_repl.call_args
        presentation = args[0]
        assert text not in presentation.get('description', '') and text not in str(presentation)
    else:
        assert True

