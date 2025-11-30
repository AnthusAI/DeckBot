@integration @manual @requires_api_key
Feature: Image Generation Integration Test
  As a developer
  I want to verify that real image generation works
  So that I can confirm the API integration is functioning
  
  # This test makes real API calls and is NOT run in the normal test suite
  # Run with: behave --tags=integration features/image_generation_integration.feature
  # Requires: GOOGLE_API_KEY environment variable set
  
  Scenario: Generate real images with Gemini API
    Given I have a valid GOOGLE_API_KEY
    And I have a test presentation "integration-test-deck"
    When I generate 4 image candidates with prompt "a simple blue circle"
    Then all 4 candidates should be real PNG files
    And each file should be larger than 1000 bytes
    And the files should exist in the drafts directory
    And I should see the complete generation prompt in the logs
  
  Scenario: Generate images with style reference
    Given I have a valid GOOGLE_API_KEY
    And I have a test presentation "style-ref-test"
    And the presentation has a style reference image
    When I generate 4 image candidates with prompt "a red square"
    Then all 4 candidates should be real PNG files
    And the generation should include the style reference image
    And I should see "Including style reference image" in the logs
  
  Scenario: Verify aspect ratio support
    Given I have a valid GOOGLE_API_KEY
    And I have a test presentation "aspect-test"
    When I generate an image with aspect_ratio "16:9"
    Then the generated image should have a landscape orientation
    And the prompt should mention "wide landscape image (16:9 aspect ratio)"
  
  Scenario: Handle API quota exceeded gracefully
    Given I have a valid GOOGLE_API_KEY
    And I have a test presentation "quota-test"
    When I attempt to generate 20 images rapidly
    Then I should see quota exceeded warnings for some candidates
    And fallback images should be created for failed requests
    And the system should report the actual success count


