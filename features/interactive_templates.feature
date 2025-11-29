Feature: Interactive Template Selection
  As a user
  I want to choose a template when creating a presentation interactively
  So that I don't have to remember the CLI flags

  Scenario: Create presentation with template interactively
    Given the template directory exists
    Given a basic template "Light" exists
    When I start the interactive CLI
    And I choose to create a new presentation
    And I choose to use the "Light" template
    And I enter details for "interactive-deck"
    Then a presentation "interactive-deck" should exist
    And the file "interactive-deck/deck.marp.md" should contain "# Template"

