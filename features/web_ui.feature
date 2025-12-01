Feature: Web UI
  As a user
  I want to use a web interface for the presentation agent
  So that I can have a richer experience with images

  Scenario: List Presentations via API
    Given a presentation "web-demo-1" exists
    When I request the list of presentations via API
    Then the response should contain "web-demo-1"

  Scenario: Load Presentation via API
    Given a presentation "web-demo-2" exists
    When I load the presentation "web-demo-2" via API
    Then the response status code should be 200
    And the response should contain "history"

  Scenario: Send Chat Message via API
    Given a presentation "web-chat-test" exists
    And I load the presentation "web-chat-test" via API
    When I send a chat message "Hello" via API
    Then the response status code should be 200
    And the response should contain "processing"

  Scenario: Image Generation via API
    Given a presentation "web-image-test" exists
    And I load the presentation "web-image-test" via API
    When I request image generation for "A blue circle" via API
    Then the response status code should be 200
    And the response should contain "started"

  Scenario: Resume Session via API
    Given a presentation "web-resume-test" exists
    And the presentation "web-resume-test" has history
    When I load the presentation "web-resume-test" via API
    Then the response should contain "history"
    And the response should contain "Mock user message"

  Scenario: Images Appear in Chat During Generation
    Given a presentation "ui-image-gen-test" exists
    And I load the presentation "ui-image-gen-test" via API
    When image generation starts
    Then image request details should appear in chat
    And individual image candidates should appear as chat messages
    And the preview view should remain visible

  Scenario: User Selects Image from Chat
    Given a presentation "ui-selection-test" exists
    And I load the presentation "ui-selection-test" via API
    And image candidates are displayed in chat
    When the user clicks on an image candidate
    Then the image should be marked as selected
    And the selection should be sent to the backend
    And the preview view should remain visible

  Scenario: Theme Persistence
    Given I set the theme to "light"
    When I reload the web application
    Then the theme should be "light"

  Scenario: Sidebar Resizing
    Given the sidebar has a default width
    When I drag the resizer to adjust the width
    Then the sidebar width should change
    And the width should stay within min/max bounds

  Scenario: File Menu - New Presentation
    When I click the "File" menu
    And I click "New Presentation"
    Then the create presentation dialog should appear

  Scenario: File Menu - Open Presentation
    Given a presentation "menu-test" exists
    When I click the "File" menu
    And I click "Open Presentation"
    Then the presentation selector dialog should appear
    And the list should contain "menu-test"

  Scenario: Create Presentation from Web UI
    When I create a presentation named "web-created" via the UI
    Then the presentation "web-created" should exist
    And the preview should load automatically

  Scenario: Color Theme Selection - Miami Theme
    Given I open the preferences dialog
    When I select the "miami" color theme
    And I save the preferences
    Then the color theme should be "miami"
    And the primary color should be blue
    And the secondary color should be fuchsia

  Scenario: Color Theme Selection - Midwest Theme
    Given I open the preferences dialog
    When I select the "midwest" color theme
    And I save the preferences
    Then the color theme should be "midwest"
    And the primary color should be blue
    And the secondary color should be cyan

  Scenario: Color Theme Selection - California Theme
    Given I open the preferences dialog
    When I select the "california" color theme
    And I save the preferences
    Then the color theme should be "california"
    And the primary color should be orange
    And the secondary color should be teal

  Scenario: Color Theme Persistence
    Given I set the color theme to "california" via API
    When I reload the web application
    Then the color theme should be "california"

  Scenario: Color Theme Default
    Given no color theme preference is set
    When I load the web application
    Then the color theme should be "miami"

  Scenario: Preferences Dialog - Cancel Button Styling
    Given I open the preferences dialog
    Then the cancel button should have a muted gray background
    And the cancel button should not be primary blue
    When I hover over the cancel button
    Then the cancel button should lighten to accent color

  Scenario: Preferences Dialog - Cancel Discards Changes
    Given I open the preferences dialog
    And the current color theme is "miami"
    When I select the "california" color theme
    And I click cancel
    Then the color theme should still be "miami"
    And the preferences dialog should be closed

  Scenario: Preferences Dialog - Save Persists Changes
    Given I open the preferences dialog
    And the current color theme is "miami"
    When I select the "midwest" color theme
    And I save the preferences
    Then the color theme should be "midwest"
    And the preference should be saved to the backend

  Scenario: Color Theme Swatches Display
    Given I open the preferences dialog
    Then I should see three color theme options
    And "miami" should show blue and fuchsia swatches
    And "midwest" should show blue and cyan swatches
    And "california" should show orange and teal swatches

  Scenario: Light/Dark Mode with Color Themes
    Given the color theme is "miami"
    And the light/dark mode is "light"
    When I change to "dark" mode
    Then the color theme should remain "miami"
    And the colors should adapt to dark mode

  Scenario: Theme Icons Visibility
    Given the light/dark mode is "light"
    Then the sun icon should be visible
    And the moon icon should be visible
    And the monitor icon should be visible

  Scenario: User Deletes Presentation via API
    Given a presentation "delete-me" exists
    When I delete the presentation "delete-me" via API
    Then the response status code should be 200
    And the presentation "delete-me" should no longer exist

  Scenario: User Tries to Delete Non-Existent Presentation
    Given a presentation "delete-me-not" does not exist
    When I delete the presentation "delete-me-not" via API
    Then the response status code should be 404
    And the response should contain "Presentation not found"

  Scenario: User Browses Available Templates
    Given templates "1. Alpine Minimal", "2. Editorial Modern", and "5. Midnight Grid" exist
    When I request the template list via API
    Then the response should contain "1. Alpine Minimal"
    And the response should contain "2. Editorial Modern"
    And the response should contain "5. Midnight Grid"

  Scenario: Template Images Copied on Creation
    Given a template "ImageTemplate" exists with a background image
    When I create a presentation "img-deck" using "ImageTemplate" via API
    Then the presentation "img-deck" should exist
    And "img-deck/images" should contain the background image

  Scenario: Serve Draft Images
    Given draft images exist at "tmp/drafts/draft.png"
    When I request the draft image at "tmp/drafts/draft.png" via API
    Then the response status code should be 200
    And the response should contain image data

  Scenario: API Error - Missing Parameters
    When I send a chat message "" via API
    Then the response status code should be 400
    And the response should contain "Empty message"

  Scenario: API Error - Invalid JSON
    When I send invalid JSON to "/api/chat" via API
    Then the response status code should be 400

  Scenario: API Error - Non-existent Presentation Load
    Given a presentation "missing-deck" does not exist
    When I load the presentation "missing-deck" via API
    Then the response status code should be 404

  Scenario: Welcome Screen - Create Card Spacing
    When I load the web application
    Then the create-new-card icon should have adequate vertical spacing
    And the icon margin-bottom should be at least 20px
