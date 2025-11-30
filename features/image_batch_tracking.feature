Feature: Image Batch Tracking
  As a user
  I want each image generation to have a unique batch ID
  So that I can track which images came from which request and avoid confusion

  Scenario: Each image batch gets a unique slug
    Given a presentation "batch-test" exists
    When I generate images with prompt "robot"
    Then a batch slug should be created based on the prompt
    And the returned batch slug should contain "robot"
    And the returned batch slug should include a timestamp for uniqueness

  Scenario: Images are saved in batch-specific folders
    Given a presentation "batch-folders-test" exists
    When I generate images with prompt "spaceship"
    Then the images should be saved in "drafts/{slug}/" folder
    And the returned slug should be based on "spaceship"

  Scenario: SYSTEM message includes batch ID
    Given a presentation "batch-message-test" exists
    And images have been generated with batch slug "feedback-loop-12345"
    When the user selects image 2 from the batch
    Then the selection SYSTEM message should contain "(batch: feedback-loop-12345)"
    And the selection SYSTEM message should reference the selected image path

  Scenario: Multiple image requests create different batches
    Given a presentation "multi-batch-test" exists
    When I generate images with prompt "cat"
    And I note the batch slug as "batch1"
    When I generate images with prompt "dog"
    And I note the batch slug as "batch2"
    Then "batch1" and "batch2" should be different

  Scenario: Agent ignores old batch selections during new generation
    Given a presentation "ignore-old-test" exists
    And the chat history contains "[SYSTEM] User selected an image from (batch: old-batch-123)"
    When I generate images with prompt "new image"
    And the new batch slug is "new-batch-456"
    Then the agent should only act on selections from "new-batch-456"
    And the agent should ignore the old batch "old-batch-123" message

  Scenario: Batch folder persists for later reference
    Given a presentation "persist-test" exists
    And images were generated with batch slug "diagram-98765"
    When I list the drafts folder
    Then I should see a folder named "diagram-98765"
    And the folder should contain 4 candidate images

