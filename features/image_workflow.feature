Feature: Image Generation Workflow
  As a user
  I want a clear, sequential image generation process
  So that I can select the right image without confusion

  Background:
    Given a presentation "workflow-test" exists

  Scenario: Image generation shows candidates before selection
    Given the agent is active for "workflow-test"
    When I type "Generate an image of a robot"
    Then the agent should call the generate_image tool
    And I should see "Image generation started" in the response
    And I should NOT see any "[SYSTEM] User selected" message yet
    And the pending_candidates should be empty until generation completes

  Scenario: User selects image after candidates are ready
    Given the agent is active for "workflow-test"
    And I have requested an image "a robot"
    And 3 image candidates have been generated
    When the user picks image candidate 2
    Then a "[SYSTEM] User selected an image" message should appear
    And the image should be saved to the images folder
    And the agent should be notified to incorporate the image

  Scenario: Cannot select image before generation completes
    Given the agent is active for "workflow-test"
    And I have requested an image "a robot"
    But image generation is still in progress
    When the user attempts to pick candidate 0
    Then the selection should fail with "No candidates available"
    And no "[SYSTEM] User selected" message should appear

  Scenario: Chat history does not confuse old selection messages with new requests
    Given the agent is active for "workflow-test"
    And the presentation has a previous image selection in history
    When I request a new image "a spaceship"
    Then I should see image generation start
    And I should NOT see the old "[SYSTEM] User selected" message
    And the old message should only appear when loading history

  Scenario: Selection message only appears after user action
    Given the agent is active for "workflow-test"
    And I have requested an image "a cat"
    And 3 image candidates have been generated
    When I wait without selecting anything
    Then no "[SYSTEM] User selected" message should appear automatically
    And the candidates should remain available for selection

