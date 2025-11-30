Feature: Chat History with Tools

  Scenario: Agent loads tool usage history from file
    Given a presentation "HistoryTest" exists
    And the presentation "HistoryTest" has a history log containing a tool call:
      | key    | value                                         |
      | tool   | write_file                                    |
      | args   | {"filename": "test.txt", "content": "Hello"}  |
      | result | Successfully wrote to test.txt                |
    When the agent is initialized for "HistoryTest"
    And I send the message "What just happened?"
    Then the API request should contain the tool call "write_file" in history
    And the API request should contain the tool output "Successfully wrote to test.txt" in history