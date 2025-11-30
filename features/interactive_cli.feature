Feature: Interactive CLI Entry
  As a user
  I want to start the tool in text mode with --text flag
  So that I can select a presentation interactively

  Scenario: Start with --text flag and select existing presentation
    Given I have a presentation named "deck-A"
    And I have a presentation named "deck-B"
    When I run the CLI with --text flag and select "deck-A"
    Then the REPL should start with context "deck-A"

  Scenario: Start with --text flag and create new
    Given the presentation directory is empty
    When I run the CLI with --text flag and choose to create "new-deck"
    Then a new directory "new-deck" should be created
    And the REPL should start with context "new-deck"
    And the REPL output should NOT contain "Analyzing presentation..."

