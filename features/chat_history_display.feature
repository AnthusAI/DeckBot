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

  Scenario: Loading presentation shows image request details from history
    Given a presentation "image-history-test" exists
    And the presentation has an image request in chat history
    When I load the presentation "image-history-test" via API
    Then the history should include image_request_details message type
    And the image request should have user_message data
    And the image request should have system_message data
    And the image request should have aspect_ratio data
    And the image request should have batch_slug data

  Scenario: Loading presentation shows image candidates from history
    Given a presentation "image-candidates-test" exists
    And the presentation has 4 image candidates in chat history
    When I load the presentation "image-candidates-test" via API
    Then the history should include 4 image_candidate message types
    And each candidate should have image_path data
    And each candidate should have index data
    And each candidate should have batch_slug data

  Scenario: Loading presentation preserves image selection state
    Given a presentation "image-selection-test" exists
    And the presentation has image candidates in chat history
    And the presentation has an image selection in chat history
    When I load the presentation "image-selection-test" via API
    Then the history should include image_selection message type
    And the selection should have index data
    And the selection should have batch_slug data
    And the selection should have filename data

  Scenario: Loading presentation shows agent request details from history
    Given a presentation "agent-request-test" exists
    And the presentation has an agent request in chat history
    When I load the presentation "agent-request-test" via API
    Then the history should include agent_request_details message type
    And the agent request should have user_message data
    And the agent request should have system_prompt data
    And the agent request should have model data


