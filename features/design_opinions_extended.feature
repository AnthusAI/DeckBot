Feature: Extended Design Opinions

  Scenario: Template defines custom free-form design opinions
    Given a presentation "CustomDesign" exists
    And the presentation "CustomDesign" has metadata with design opinions:
      | key   | value             |
      | fonts | Roboto, Open Sans |
      | mood  | Professional      |
    When the design agent is initialized for "CustomDesign"
    Then the system prompt should contain "fonts"
    And the system prompt should contain "Roboto, Open Sans"
    And the system prompt should contain "mood"
    And the system prompt should contain "Professional"

  Scenario: Image generation uses extended design opinions
    Given a presentation "ImageDesign" exists
    And the presentation "ImageDesign" has metadata with design opinions:
      | key   | value      |
      | style | Watercolor |
    When I request an image "A cat" for "ImageDesign"
    Then the image generation prompt should contain "style: Watercolor"
