from behave import given, when, then
from unittest.mock import patch, MagicMock
from deckbot.nano_banana import NanoBananaClient
from deckbot.manager import PresentationManager
import os

@given('I have a presentation for image testing named "{name}"')
def step_impl(context, name):
    manager = PresentationManager(root_dir=context.temp_dir)
    if not manager.get_presentation(name):
        manager.create_presentation(name)
    context.presentation = manager.get_presentation(name)
    context.nano_client = NanoBananaClient(context.presentation)

@when('I generate a default image with prompt "{prompt}"')
def step_impl(context, prompt):
    # Mock google.genai.Client
    with patch('google.genai.Client') as mock_client_cls, \
         patch('deckbot.nano_banana.NanoBananaClient._open_folder') as mock_open:
        
        mock_client = mock_client_cls.return_value
        # Need to set it on the instance because it's init-ed in __init__
        context.nano_client.client = mock_client
        
        # Mock successful generation response
        mock_response = MagicMock()
        mock_generated_image = MagicMock()
        mock_generated_image.image.image_bytes = b"fake_image_data"
        mock_response.generated_images = [mock_generated_image]
        
        mock_client.models.generate_images.return_value = mock_response
        
        context.candidates = context.nano_client.generate_candidates(prompt)
        context.last_call_args = mock_client.models.generate_images.call_args

@when('I generate an image with prompt "{prompt}" and aspect ratio "{ratio}"')
def step_impl(context, prompt, ratio):
    # Mock google.genai.Client
    with patch('google.genai.Client') as mock_client_cls, \
         patch('deckbot.nano_banana.NanoBananaClient._open_folder') as mock_open:
        
        mock_client = mock_client_cls.return_value
        context.nano_client.client = mock_client
        
        # Mock successful generation response
        mock_response = MagicMock()
        mock_generated_image = MagicMock()
        mock_generated_image.image.image_bytes = b"fake_image_data"
        mock_response.generated_images = [mock_generated_image]
        
        mock_client.models.generate_images.return_value = mock_response
        
        print(f"DEBUG: Calling generate_candidates with ratio={ratio}")
        context.candidates = context.nano_client.generate_candidates(prompt, aspect_ratio=ratio)
        
        print(f"DEBUG: called={mock_client.models.generate_images.called}")
        context.last_call_args = mock_client.models.generate_images.call_args
        print(f"DEBUG: last_call_args={context.last_call_args}")

@then('the image generation should be attempted')
def step_impl(context):
    assert context.candidates is not None
    assert len(context.candidates) == 4

@then('4 candidate images should be created')
def step_impl(context):
    for path in context.candidates:
        assert os.path.exists(path)

@then('the image generation should be attempted with aspect ratio "{ratio}"')
def step_impl(context, ratio):
    assert context.last_call_args is not None
    kwargs = context.last_call_args.kwargs
    config = kwargs.get('config')
    
    print(f"DEBUG: call_args={context.last_call_args}")
    print(f"DEBUG: kwargs={kwargs}")
    print(f"DEBUG: config={config}")
    if config:
        # GenerateImagesConfig has aspect_ratio attribute directly (or check types)
        print(f"DEBUG: aspect_ratio={config.aspect_ratio}")

    assert config is not None
    assert config.aspect_ratio == ratio
