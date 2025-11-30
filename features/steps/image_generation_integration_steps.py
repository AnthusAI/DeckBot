"""
Integration test steps for real image generation.
These steps make actual API calls and are not mocked.
"""
from behave import given, when, then
from deckbot.nano_banana import NanoBananaClient
from deckbot.manager import PresentationManager
import os
import PIL.Image
from io import StringIO
import sys


@given('I have a valid GOOGLE_API_KEY')
def step_check_api_key(context):
    """Verify GOOGLE_API_KEY is set."""
    api_key = os.getenv('GOOGLE_API_KEY')
    assert api_key, "GOOGLE_API_KEY environment variable must be set for integration tests"
    assert len(api_key) > 20, "GOOGLE_API_KEY appears to be invalid"
    context.api_key = api_key


@given('I have a test presentation "{name}"')
def step_create_test_presentation(context, name):
    """Create a real test presentation."""
    # Stop any active mocks for integration tests
    if hasattr(context, 'new_genai_client_patch'):
        context.new_genai_client_patch.stop()
        delattr(context, 'new_genai_client_patch')
    
    # Use a separate variable for the integration test directory
    # Do NOT overwrite context.temp_dir as that is managed by the fixture
    # and will be deleted (along with its contents) after the scenario!
    root_presentations_dir = os.path.abspath("presentations")
    
    # Make sure directory exists (in case it was deleted)
    if not os.path.exists(root_presentations_dir):
        os.makedirs(root_presentations_dir)
    
    context.root_presentations_dir = root_presentations_dir
    manager = PresentationManager(root_dir=root_presentations_dir)
    
    # Clean up specific test deck if exists
    if manager.get_presentation(name):
        import shutil
        pres_dir = os.path.join(root_presentations_dir, name)
        shutil.rmtree(pres_dir, ignore_errors=True)
    
    manager.create_presentation(name, "Integration test presentation")
    context.presentation = manager.get_presentation(name)
    context.presentation_name = name
    
    # Create NanoBananaClient for this presentation
    # This will create a REAL client since mocks are stopped
    context.nano_client = NanoBananaClient(context.presentation, root_dir=root_presentations_dir)


@given('the presentation has a style reference image')
def step_add_style_reference(context):
    """Add a style reference image to the presentation."""
    # Create a simple test image as style reference
    import PIL.Image
    
    # Use root_presentations_dir if available (integration test), otherwise temp_dir
    root_dir = getattr(context, 'root_presentations_dir', context.temp_dir)
    pres_dir = os.path.join(root_dir, context.presentation_name)
    images_dir = os.path.join(pres_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    
    # Create a simple colored image
    img = PIL.Image.new('RGB', (100, 100), color='blue')
    style_ref_path = os.path.join(images_dir, "style_reference.png")
    img.save(style_ref_path)
    
    # Update metadata to include style reference
    import json
    metadata_path = os.path.join(pres_dir, "metadata.json")
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    if 'image_style' not in metadata:
        metadata['image_style'] = {}
    metadata['image_style']['style_reference'] = "images/style_reference.png"
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)


@when('I generate 4 image candidates with prompt "{prompt}"')
def step_generate_images(context, prompt):
    """Actually generate images using the API."""
    # Capture console output
    captured_output = StringIO()
    
    # Generate candidates (this makes real API calls!)
    result = context.nano_client.generate_candidates(
        prompt, 
        status_spinner=None,
        progress_callback=None
    )
    context.candidates = result['candidates']
    context.batch_slug = result['batch_slug']
    
    context.generation_prompt = prompt


@when('I generate an image with aspect_ratio "{aspect_ratio}"')
def step_generate_with_aspect_ratio(context, aspect_ratio):
    """Generate image with specific aspect ratio."""
    result = context.nano_client.generate_candidates(
        "a test image",
        aspect_ratio=aspect_ratio,
        status_spinner=None,
        progress_callback=None
    )
    context.candidates = result['candidates']
    context.requested_aspect_ratio = aspect_ratio


@when('I attempt to generate {count:d} images rapidly')
def step_generate_many_images(context, count):
    """Generate many images to potentially hit quota limits."""
    context.all_candidates = []
    for i in range(count // 4):  # Generate in batches of 4
        result = context.nano_client.generate_candidates(
            f"test image {i}",
            status_spinner=None,
            progress_callback=None
        )
        candidates = result['candidates']
        context.all_candidates.extend(candidates)


@then('all 4 candidates should be real PNG files')
def step_verify_real_images(context):
    """Verify all generated files are actual PNG images."""
    assert len(context.candidates) == 4, f"Expected 4 candidates, got {len(context.candidates)}"
    
    for i, candidate_path in enumerate(context.candidates):
        assert os.path.exists(candidate_path), f"Candidate {i+1} file does not exist: {candidate_path}"
        
        # Verify it's a real PNG image
        try:
            img = PIL.Image.open(candidate_path)
            assert img.format == 'PNG', f"Candidate {i+1} is not a PNG: {img.format}"
            # Verify it has actual image data
            assert img.size[0] > 0 and img.size[1] > 0, f"Candidate {i+1} has invalid dimensions"
        except Exception as e:
            raise AssertionError(f"Candidate {i+1} is not a valid image: {e}")


@then('each file should be larger than {min_bytes:d} bytes')
def step_verify_file_sizes(context, min_bytes):
    """Verify files are not just dummy placeholders."""
    for i, candidate_path in enumerate(context.candidates):
        file_size = os.path.getsize(candidate_path)
        assert file_size > min_bytes, \
            f"Candidate {i+1} is only {file_size} bytes (expected > {min_bytes}). " \
            f"This suggests a dummy/placeholder image instead of a real generation."


@then('the files should exist in the drafts directory')
def step_verify_drafts_location(context):
    """Verify files are in the drafts directory."""
    drafts_dir = context.nano_client.drafts_dir
    
    for candidate_path in context.candidates:
        assert candidate_path.startswith(drafts_dir), \
            f"Candidate not in drafts directory: {candidate_path}"


@then('I should see the complete generation prompt in the logs')
def step_verify_prompt_logging(context):
    """Verify detailed logging is present (this is a manual check)."""
    # In a real scenario, we'd capture console output
    # For now, this is a manual verification step
    print("\n=== Manual Verification Required ===")
    print("Check terminal output for:")
    print("  - IMAGE GENERATION REQUEST header")
    print("  - Prompt, aspect ratio, resolution")
    print("  - Final prompt sent to model")
    print("  - Response details and file sizes")


@then('the generation should include the style reference image')
def step_verify_style_reference_used(context):
    """Verify style reference was included (manual check)."""
    print("\n=== Manual Verification Required ===")
    print("Check terminal output for:")
    print("  - 'Including style reference image' message")
    print("  - Image size information")


@then('I should see "{text}" in the logs')
def step_verify_log_text(context, text):
    """Verify specific text appears in logs (manual check)."""
    print(f"\n=== Manual Verification Required ===")
    print(f"Check that logs contain: '{text}'")


@then('the generated image should have a landscape orientation')
def step_verify_landscape(context):
    """Verify image has landscape orientation."""
    for candidate_path in context.candidates:
        if os.path.getsize(candidate_path) > 1000:  # Real image
            img = PIL.Image.open(candidate_path)
            width, height = img.size
            assert width > height, \
                f"Expected landscape (width > height), got {width}x{height}"
            break


@then('the prompt should mention "{text}"')
def step_verify_prompt_contains(context, text):
    """Verify the prompt construction (manual check)."""
    print(f"\n=== Manual Verification Required ===")
    print(f"Check that final prompt contains: '{text}'")


@then('I should see quota exceeded warnings for some candidates')
def step_verify_quota_warnings(context):
    """Check for quota warnings (manual check)."""
    print("\n=== Manual Verification Required ===")
    print("Check for 'Quota exceeded' or 'ResourceExhausted' messages")


@then('fallback images should be created for failed requests')
def step_verify_fallbacks(context):
    """Verify fallback images were created for failures."""
    # Count dummy vs real images
    real_count = 0
    dummy_count = 0
    
    for candidate_path in context.all_candidates:
        if os.path.exists(candidate_path):
            file_size = os.path.getsize(candidate_path)
            if file_size > 1000:
                real_count += 1
            else:
                dummy_count += 1
    
    print(f"\nGenerated {real_count} real images and {dummy_count} fallback images")
    assert dummy_count > 0, "Expected some fallback images due to quota limits"


@then('the system should report the actual success count')
def step_verify_success_reporting(context):
    """Verify truthful success reporting (manual check)."""
    print("\n=== Manual Verification Required ===")
    print("Check that success summary accurately reports:")
    print("  - Number of successful vs failed generations")
    print("  - No 'Generated 4 candidates' when some failed")

