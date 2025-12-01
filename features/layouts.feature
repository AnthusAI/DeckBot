Feature: Slide Layouts
  As a user
  I want to create slides using pre-designed layouts
  So that I can maintain consistent structure and styling

  Background:
    Given the system is initialized

  Scenario: New presentation includes default layouts
    When I create a presentation "layout-test"
    Then the presentation "layout-test" should have a "layouts.md" file
    And the "layouts.md" file should contain "<!-- layout: full-width-header -->"
    And the "layouts.md" file should contain "<!-- layout: two-column -->"
    And the "layouts.md" file should contain "<!-- layout: title-slide -->"

  Scenario: Presentation from template with layouts uses template layouts
    Given there is a template "CustomTemplate" with a custom "layouts.md" file
    When I create a presentation "custom-layout-test" from template "CustomTemplate"
    Then the presentation "custom-layout-test" should have a "layouts.md" file
    And the "layouts.md" file should match the template's layouts

  Scenario: Presentation from template without layouts gets default layouts
    Given there is a template "MinimalTemplate" without a "layouts.md" file
    When I create a presentation "minimal-test" from template "MinimalTemplate"
    Then the presentation "minimal-test" should have a "layouts.md" file
    And the "layouts.md" file should contain default layouts

  Scenario: Agent is aware of available layouts
    Given I have a presentation "aware-test" with layouts
    When the agent loads the presentation
    Then the agent's system prompt should mention "Available Layouts"
    And the agent's system prompt should list "full-width-header"
    And the agent's system prompt should list "two-column"

  Scenario: Agent can query available layouts
    Given I have a presentation "query-test" with layouts
    When the agent calls "get_layouts"
    Then the response should include layout names
    And the response should include layout markdown content
    And the response should contain "full-width-header"

  Scenario: Agent creates single slide with layout (web mode)
    Given I have a presentation "web-slide-test" in web mode
    When the agent calls "create_slide_with_layout" with title "Test Slide"
    Then the system should show layout selection UI
    And the user should see visual previews of available layouts

  Scenario: User selects a layout
    Given I have a presentation "select-test" in web mode
    And the agent has requested layout selection
    When the user selects the "two-column" layout
    Then a new slide should be created in "deck.marp.md"
    And the new slide should use the "two-column" layout
    And the agent should be notified of the successful creation

  Scenario: Agent creates multiple slides manually
    Given I have a presentation "multi-test"
    When the user asks for "three new slides with different content"
    Then the agent should NOT use "create_slide_with_layout"
    And the agent should create slides by editing "deck.marp.md" directly
    And all three slides should be created

  Scenario: Layout with title replacement
    Given I have a presentation "title-test" in web mode
    When the agent calls "create_slide_with_layout" with title "Custom Title"
    And the user selects the "title-slide" layout
    Then the new slide's first heading should be "# Custom Title"

  Scenario: Layout insertion at end (default position)
    Given I have a presentation "position-test" with 3 existing slides
    When the agent creates a slide with layout at position "end"
    Then the presentation should have 4 slides
    And the new slide should be the last slide

  Scenario: Agent instructions mention create_slide_with_layout tool
    Given the agent is initialized
    Then the system prompt should mention "create_slide_with_layout"
    And the system prompt should explain it's for "ONLY ONE new slide"
    And the system prompt should explain to use manual editing for "multiple slides"

  Scenario: Layouts include image metadata
    Given I have a presentation "metadata-test" with layouts
    When I query the layouts
    Then the "two-column" layout should indicate it is image-friendly
    And the "two-column" layout should recommend aspect ratio "9:16"
    And the "title-slide" layout should indicate it is NOT image-friendly
    And the "image-caption" layout should recommend aspect ratio "16:9"

  Scenario: Agent sees image-friendly layout information
    Given I have a presentation "image-info-test" with layouts
    When the agent loads the presentation
    Then the system prompt should mention layouts are "Image-friendly"
    And the system prompt should mention "recommended aspect ratio"
    And the system prompt should advise using aspect ratios when generating images

  Scenario: get_layouts tool returns image metadata
    Given I have a presentation "tool-metadata-test" with layouts
    When the agent calls "get_layouts"
    Then the response should include "image-friendly" status for each layout
    And the response should include "recommended aspect ratio" where applicable
    And the response should show "9:16" for "two-column" layout
    And the response should show "16:9" for "image-caption" layout

  Scenario: Layout selection UI shows image metadata
    Given I have a presentation "ui-metadata-test" in web mode
    When the layout selection dialog is shown
    Then image-friendly layouts should display a visual indicator
    And the recommended aspect ratio should be shown as a badge
    And the layout description should be visible

