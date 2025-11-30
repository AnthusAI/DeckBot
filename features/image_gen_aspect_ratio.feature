Feature: Image Generation with Aspect Ratio

  Scenario: Generate image with default aspect ratio
    Given I have a presentation for image testing named "Test Image Gen"
    When I generate a default image with prompt "A beautiful sunset"
    Then the image generation should be attempted
    And 4 candidate images should be created

  Scenario: Generate image with specific aspect ratio
    Given I have a presentation for image testing named "Test Image Gen"
    When I generate an image with prompt "A tall tree" and aspect ratio "9:16"
    Then the image generation should be attempted with aspect ratio "9:16"
    And 4 candidate images should be created

