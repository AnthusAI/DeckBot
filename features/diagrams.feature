Feature: Diagram Support
  As a user creating presentations
  I want to include diagrams using text-based syntax
  So that I can create technical diagrams without image editing tools

  Background:
    Given the template directory exists

  Scenario: New presentations include marp.config.js for diagram support
    When I create a presentation "Diagram Test" without a template
    Then the presentation "Diagram Test" should have a file "marp.config.js"
    And the file "Diagram Test/marp.config.js" should contain "@kazumatu981/markdown-it-kroki"

  Scenario: Templates include marp.config.js for diagram support
    Given a basic template "TestTemplate" exists
    When I create a presentation "Template Test" from template "TestTemplate"
    Then the presentation "Template Test" should have a file "marp.config.js"
    And the file "Template Test/marp.config.js" should contain "@kazumatu981/markdown-it-kroki"

  Scenario: Create presentation with Mermaid flowchart diagram
    When I create a presentation "Mermaid Test" without a template
    And I add a Mermaid flowchart to "deck.marp.md"
    And I compile the presentation "Mermaid Test"
    Then the HTML output should contain diagram content
    And the compilation should succeed

  Scenario: Create presentation with Mermaid sequence diagram
    When I create a presentation "Sequence Test" without a template
    And I add a Mermaid sequence diagram to "deck.marp.md"
    And I compile the presentation "Sequence Test"
    Then the HTML output should contain diagram content
    And the compilation should succeed

  Scenario: Create presentation with Excalidraw diagram
    When I create a presentation "Excalidraw Test" without a template
    And I add an Excalidraw diagram to "deck.marp.md"
    And I compile the presentation "Excalidraw Test"
    Then the HTML output should contain diagram content
    And the compilation should succeed

  Scenario: Multiple diagram types in one presentation
    When I create a presentation "Multi Diagram" without a template
    And I add a Mermaid flowchart to "deck.marp.md"
    And I add an Excalidraw diagram to "deck.marp.md"
    And I compile the presentation "Multi Diagram"
    Then the HTML output should contain both diagram types
    And the compilation should succeed

  Scenario: DiagramDemo template contains working examples
    Given a basic template "DiagramDemo" exists
    When I create a presentation "Demo Test" from template "DiagramDemo"
    Then the presentation "Demo Test" should have a file "deck.marp.md"
    And the file "Demo Test/deck.marp.md" should contain "```mermaid"
    And the file "Demo Test/deck.marp.md" should contain "```excalidraw"
    And the file "Demo Test/deck.marp.md" should contain "graph TD"
    And I compile the presentation "Demo Test"
    Then the compilation should succeed



