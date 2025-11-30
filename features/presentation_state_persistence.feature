Feature: Presentation State Persistence
  As a user
  I want DeckBot to remember which presentation I was working on
  So that I can reload the page without losing my context

  Scenario: Presentation context is saved when loaded
    Given I have a presentation named "my-saved-deck"
    When I load the presentation "my-saved-deck" via the API
    Then the persisted state should indicate "my-saved-deck" is the current presentation

  Scenario: Presentation is automatically restored on page reload
    Given the persisted state indicates "restored-deck" is the current presentation
    And I have a presentation named "restored-deck"
    When I request the current presentation state
    Then the state response should contain name "restored-deck"

  Scenario: State is cleared when no presentation is active
    Given I have a persisted presentation state
    When I clear the current presentation state
    Then the persisted state should be empty

  Scenario: User closes the presentation via the UI
    Given I have a persisted presentation state
    When I request to close the presentation via API
    Then the persisted state should be empty
    And the current service should be unloaded
