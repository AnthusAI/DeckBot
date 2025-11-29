Feature: Branded Image Generation
  As a user
  I want my generated images to follow a specific brand style
  So that they fit seamlessly into my presentation

  Scenario: Generate image with style instructions
    Given a presentation "branded-deck" exists
    And the presentation "branded-deck" has image style "Use flat vector art style with blue palette"
    When I request an image "A rocket ship" for "branded-deck"
    Then the image generation prompt should contain "Use flat vector art style with blue palette"

  Scenario: Generate image with reference image
    Given a presentation "ref-deck" exists
    And the presentation "ref-deck" has a reference image "brand_logo.png"
    When I request an image "A meeting room" for "ref-deck"
    Then the image generation request should include the reference image "brand_logo.png"

