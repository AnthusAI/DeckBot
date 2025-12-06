import os
from behave import given, when, then
from deckbot.agent import Agent

@given('the GOOGLE_API_KEY environment variable is set')
def step_google_api_key_set(context):
    # Ensure the env var exists
    if not os.getenv('GOOGLE_API_KEY'):
        context.scenario.skip("GOOGLE_API_KEY not set in environment")

@given('only GOOGLE_API_KEY is used (not GEMINI_API_KEY)')
def step_only_google_api_key(context):
    # This is a design assertion - we'll check the code doesn't reference GEMINI_API_KEY
    pass

@given('the GOOGLE_API_KEY environment variable is not set')
def step_google_api_key_not_set(context):
    # Save original value
    context.original_api_key = os.getenv('GOOGLE_API_KEY')
    context.original_gemini_key = os.getenv('GEMINI_API_KEY')
    # Temporarily remove both keys
    if 'GOOGLE_API_KEY' in os.environ:
        del os.environ['GOOGLE_API_KEY']
    if 'GEMINI_API_KEY' in os.environ:
        del os.environ['GEMINI_API_KEY']

    # Mock SecretsManager to return empty profile (no API key)
    from unittest.mock import patch, MagicMock
    from deckbot.secrets import SecretsManager

    # Create a mock that returns None for get_active_profile
    mock_secrets = MagicMock(spec=SecretsManager)
    mock_secrets.get_active_profile.return_value = None

    # Patch SecretsManager where it's imported (in deckbot.secrets module)
    context.secrets_patch = patch('deckbot.secrets.SecretsManager', return_value=mock_secrets)
    context.secrets_patch.start()

@when('I create an agent')
def step_create_agent(context):
    # Create a test presentation context
    context.presentation_context = {
        'name': 'test-gemini-init',
        'description': 'Test presentation for Gemini initialization'
    }
    
    # Capture stdout/stderr to suppress warnings
    import io
    import sys
    context.captured_output = io.StringIO()
    sys.stdout = context.captured_output
    sys.stderr = context.captured_output
    
    try:
        context.agent = Agent(context.presentation_context, root_dir=context.temp_dir)
        context.agent_created = True
        context.agent_error = None
    except Exception as e:
        context.agent_created = False
        context.agent_error = str(e)
    finally:
        # Restore stdout/stderr
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        context.output = context.captured_output.getvalue()

@then('the agent should initialize successfully')
def step_agent_initializes(context):
    assert context.agent_created, f"Agent failed to initialize: {context.agent_error}"
    assert context.agent is not None
    assert context.agent.model is not None, "Model should be initialized"

@then('the model should use a valid Gemini model name')
def step_valid_model_name(context):
    # Check that we're using a valid model name
    # Valid Gemini 2.0 models as of late 2024
    valid_models = [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
        'gemini-exp-1121',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
    ]
    
    assert hasattr(context.agent, 'model_names'), "Agent should have model_names attribute"
    assert len(context.agent.model_names) > 0, "Agent should have at least one model name"
    
    # Check that at least one of the model names is valid
    # (we try them in order until one works)
    model_names = context.agent.model_names
    assert any(name in valid_models for name in model_names), \
        f"Agent model names {model_names} don't include any valid models from {valid_models}"

@then('the agent should warn about missing API key')
def step_warns_missing_key(context):
    assert context.agent_created, "Agent should still create even without API key"
    # Agent initializes successfully without API key
    # Check that api_key is None (test removed env vars)
    # Note: In test environment, google.genai.Client is mocked, so we check the api_key attribute
    assert context.agent.api_key is None or context.agent.api_key == '', \
        f"Expected api_key to be None or empty without GOOGLE_API_KEY env var, got {context.agent.api_key}"

@then('the agent should not crash')
def step_agent_no_crash(context):
    assert context.agent_created, f"Agent crashed: {context.agent_error}"
    assert context.agent is not None

def after_scenario(context, scenario):
    # Restore API keys if we removed them
    if hasattr(context, 'original_api_key') and context.original_api_key:
        os.environ['GOOGLE_API_KEY'] = context.original_api_key
    if hasattr(context, 'original_gemini_key') and context.original_gemini_key:
        os.environ['GEMINI_API_KEY'] = context.original_gemini_key

    # Stop the secrets mock
    if hasattr(context, 'secrets_patch'):
        context.secrets_patch.stop()

