Feature: Navigation Tool
  As a user
  I want the agent to have a dedicated tool for navigating to slides
  So that I can move around the presentation without recompiling it

  Scenario: Go to slide via CLI
    Given a compiled presentation exists
    When the agent uses the "go_to_slide" tool with slide_number=3 in CLI mode
    Then the system should open the HTML file with fragment "#3" via go_to_slide
    And no compilation should occur

  Scenario: Go to slide via Web UI
    Given a compiled presentation exists
    When the agent uses the "go_to_slide" tool with slide_number=5 in Web mode
    Then the Web UI should receive an update event with slide_number=5
    And no compilation should occur

  Scenario: Handle missing slide number
    Given a compiled presentation exists
    When the agent uses the "go_to_slide" tool without arguments
    Then the tool should return an error message requesting a slide number
