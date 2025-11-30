Feature: Aspect Ratio Management

  Scenario: New presentation has default aspect ratio
    Given I create a new presentation for aspect ratio testing named "Default Ratio Test"
    Then the presentation aspect ratio should be "4:3"
    And the marp file should contain "size: 4:3"

  Scenario: Change presentation aspect ratio
    Given I have a presentation for aspect ratio testing named "Ratio Change Test"
    When I set the aspect ratio to "16:9"
    Then the presentation aspect ratio should be "16:9"
    And the marp file should contain "size: 16:9"

  Scenario: Save As copies presentation and aspect ratio
    Given I have a presentation for aspect ratio testing named "Source Deck"
    And I set the aspect ratio to "16:9"
    When I save the presentation as "Cloned Deck"
    Then I should have a presentation named "Cloned Deck"
    And the presentation "Cloned Deck" should have aspect ratio "16:9"
    And the presentation "Cloned Deck" marp file should contain "size: 16:9"
