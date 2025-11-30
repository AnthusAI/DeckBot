Feature: File Management Tools
  As an agent
  I want to manage files in the presentation directory
  So that I can reorganize and clean up the project

  Scenario: Agent copies a file
    Given I have a file "slide1.md" with content "# Slide 1"
    When the agent calls copy_file("slide1.md", "slide1_backup.md")
    Then the managed file "slide1_backup.md" should exist
    And the managed file "slide1_backup.md" should contain "# Slide 1"
    
  Scenario: Agent renames a file
    Given I have a file "old.md" with content "# Old"
    When the agent calls move_file("old.md", "new.md")
    Then the managed file "new.md" should exist
    And the managed file "old.md" should not exist
    
  Scenario: Agent deletes a file
    Given I have a file "draft.md"
    When the agent calls delete_file("draft.md")
    Then the managed file "draft.md" should not exist
    
  Scenario: Safety - Cannot escape presentation directory
    Given I have a file "slide.md"
    When the agent tries copy_file("slide.md", "../../../etc/passwd")
    Then the operation should fail
    And an error should be returned
  
  Scenario: Agent lists files in root directory
    Given I have a file "slide1.md"
    And I have a file "slide2.md"
    When the agent calls list_files()
    Then the file list result should contain "slide1.md"
    And the file list result should contain "slide2.md"
  
  Scenario: Agent lists files in subdirectory
    Given I have a subdirectory "images"
    And I have a file "images/logo.png"
    And I have a file "images/background.jpg"
    When the agent calls list_files("images")
    Then the file list result should contain "logo.png"
    And the file list result should contain "background.jpg"
  
  Scenario: Agent lists empty subdirectory
    Given I have a subdirectory "drafts"
    When the agent calls list_files("drafts")
    Then the file list result should contain "empty"

