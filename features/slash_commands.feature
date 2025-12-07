Feature: Slash Commands
  As a user
  I want to use slash commands for quick programmatic actions
  So that I can control the application without relying on AI interpretation

  Background:
    Given I have a presentation named "TestDeck"
    And the frontend is connected to the backend

  Scenario: Toggle fast mode on
    Given fast mode is off
    When I send the command "/fast"
    Then the frontend should receive a command result event
    And fast mode should be toggled on in the frontend state
    And subsequent chat messages should use the "secondary" model

  Scenario: Toggle fast mode off
    Given fast mode is on
    When I send the command "/fast"
    Then the frontend should receive a command result event
    And fast mode should be toggled off in the frontend state
    And subsequent chat messages should use the "primary" model

  Scenario: One-shot fast message in normal mode
    Given fast mode is off
    When I send the command "/fast" with args "Generate a title slide"
    Then the message should be sent to the chat endpoint
    And the chat should use the "secondary" model
    And the response should stream via SSE
    And fast mode should remain off

  Scenario: One-shot fast message while in fast mode
    Given fast mode is on
    When I send the command "/fast" with args "Generate a title slide"
    Then the message should be sent to the chat endpoint
    And the chat should use the "secondary" model
    And the response should stream via SSE
    And fast mode should remain on

  Scenario: Export presentation to PDF
    Given the presentation contains a file "deck.marp.md" with content "# Title Slide"
    And Marp CLI is available
    When I send the command "/export"
    Then a PDF should be generated in a temporary location
    And the frontend should receive a command result event with the file path
    And the Electron app should trigger a download

  Scenario: Display help information
    When I send the command "/help"
    Then the frontend should receive a command result event
    And the response should contain the contents of "help.md"
    And the help should include available slash commands
    And the help should include keyboard shortcuts
    And the help should include UI tips

  Scenario: List available agent tools
    When I send the command "/tools"
    Then the frontend should receive a command result event
    And the response should contain a list of agent tools
    And each tool should have a name and description

  Scenario: Unknown command
    When I send the command "/unknown"
    Then the frontend should receive a command error event
    And the error message should indicate the command is not recognized

  Scenario: Frontend parses slash commands correctly
    When the user types "/fast turn on fast mode"
    Then the frontend should parse it as command "fast" with args "turn on fast mode"
    When the user types "/export"
    Then the frontend should parse it as command "export" with no args
    When the user types "/help"
    Then the frontend should parse it as command "help" with no args

  Scenario: Regular messages starting with forward slash in text
    When I send a chat message "I want to discuss /fast command"
    Then it should be sent to the chat endpoint as a regular message
    And it should not be interpreted as a slash command

  Scenario: Model parameter in chat API
    Given fast mode is off
    When I send a regular chat message "Hello"
    Then the request to "/api/chat" should include model parameter "primary"
    Given fast mode is on
    When I send a regular chat message "Hello"
    Then the request to "/api/chat" should include model parameter "secondary"

  Scenario: All command responses use SSE
    When I send any slash command
    Then the response should stream via the SSE "/api/events" channel
    And the frontend should handle the event appropriately
    And the UI should update in real-time
