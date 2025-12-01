Feature: View Menu
  As a user
  I want to control what appears in the sidebar using a View menu
  So that I can easily switch between different sidebar views without UI clutter

  Background:
    Given the web UI is running
    And I have a presentation loaded

  Scenario: View menu exists in menu bar
    When I look at the menu bar
    Then I should see a "View" menu item
    And it should be positioned between "File" and other menus

  Scenario: View menu contains Preview option
    When I click the "View" menu
    Then I should see a "Preview" menu item
    And it should have an eye icon
    And it should show the current state (checked if active)

  Scenario: View menu contains Layouts option
    When I click the "View" menu
    Then I should see a "Layouts" menu item
    And it should have a layout-template icon
    And it should show the current state (checked if active)

  Scenario: Selecting Preview from View menu
    Given the sidebar is showing layouts
    When I click the "View" menu
    And I select "Preview"
    Then the sidebar should switch to show the preview
    And the Preview option should be checked in the menu
    And the Layouts option should be unchecked in the menu

  Scenario: Selecting Layouts from View menu
    Given the sidebar is showing preview
    When I click the "View" menu
    And I select "Layouts"
    Then the sidebar should switch to show layouts
    And the Layouts option should be checked in the menu
    And the Preview option should be unchecked in the menu

  Scenario: Sidebar tabs are removed
    When I look at the sidebar
    Then I should NOT see sidebar tabs for "Preview" and "Layouts"
    And the sidebar should only show the active view content
    And the sidebar should have more vertical space for content

  Scenario: Keyboard shortcuts for View menu
    When I press "⌘1" or "Ctrl+1"
    Then the sidebar should switch to Preview
    When I press "⌘2" or "Ctrl+2"
    Then the sidebar should switch to Layouts

  Scenario: View menu shows checkmarks for active view
    Given the sidebar is showing preview
    When I click the "View" menu
    Then the "Preview" option should have a checkmark
    And the "Layouts" option should NOT have a checkmark

  Scenario: Default view is Preview
    When I first load the web UI
    Then the sidebar should show Preview by default
    And the "Preview" option in View menu should be checked

  Scenario: View state persists across sessions
    Given the sidebar is showing layouts
    When I refresh the page
    Then the sidebar should still show layouts
    And the "Layouts" option in View menu should be checked

