Feature: Chat History Display
  As a user
  I want to see my previous conversation when I load a presentation
  So that I can continue where I left off

  Scenario: Loading presentation shows text messages from history
    Given a presentation "history-display-test" exists
    And the presentation has chat history with text messages
    When I load the presentation "history-display-test" via API
    Then the response should contain "history"
    And the history should include the previous text messages

  Scenario: Loading presentation shows tool usage from history
    Given a presentation "tool-history-test" exists  
    And the presentation has chat history with tool calls
    When I load the presentation "tool-history-test" via API
    Then the response should contain "history"
    And the history should include function_call parts
    And the history should include function_response parts

  Scenario: History display handles mixed content types
    Given a presentation "mixed-history-test" exists
    And the presentation has chat history with:
      | type              | content                    |
      | text              | Hello, create a slide      |
      | function_call     | write_file                 |
      | function_response | Successfully wrote file    |
      | text              | Done! I've created a slide |
    When I load the presentation "mixed-history-test" via API
    Then the response should contain all history entries
    And text messages should be displayed
    And function calls should be represented
    And function responses should be included in history data


