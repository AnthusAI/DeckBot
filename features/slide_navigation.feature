Feature: Slide Navigation
  As a user building a deck
  I want to be able to navigate to specific slides reliably
  And I don't want unnecessary tool calls like aspect ratio checks

  Scenario: Agent tools are correctly named
    Given a presentation exists
    Then the agent should have a tool named "compile_presentation"
    And the tool "compile_presentation" should be callable

  Scenario: Navigate to specific slide
    Given a presentation exists
    When I ask the agent "Show me slide 3"
    Then the agent should call compile_presentation with slide_number=3
    And the system should open the HTML file with fragment "#3"

  Scenario: Navigate via Web UI
    Given a presentation exists
    When I ask the agent "Go to slide 5"
    Then the agent should call compile_presentation with slide_number=5
    And the Web UI should receive an update event with slide_number=5

  Scenario: Inject IDs for navigation
    Given a presentation exists
    And the generated HTML file contains sections without IDs
    When I manually trigger the compile_presentation tool
    Then the HTML file should contain sections with numeric IDs
