Feature: Layout CSS Integration
  As a user
  I want layouts CSS to be automatically included in my presentation
  So that the layout styles render correctly in my slides

  Background:
    Given the system is initialized

  Scenario: New presentation includes layouts CSS in deck
    When I create a presentation "css-test"
    Then the presentation "css-test" should have a "layouts.md" file
    And the presentation "css-test" should have a "deck.marp.md" file
    And the "deck.marp.md" should contain the layouts CSS styles
    And the "deck.marp.md" should contain ".full-width-header"
    And the "deck.marp.md" should contain ".two-column"

  @wip
  Scenario: Presentation from template includes template's layout CSS
    Given there is a template "StyledTemplate" with custom layouts and CSS
    When I create a presentation "styled-test" from template "StyledTemplate"
    Then the "deck.marp.md" should contain the template's layout CSS
    And the CSS should be merged into the front matter

  @wip
  Scenario: Presentation from template without layouts includes default CSS
    Given there is a template "BasicTemplate" without a "layouts.md" file
    When I create a presentation "basic-test" from template "BasicTemplate"
    Then the "deck.marp.md" should contain the default layouts CSS
    And the "deck.marp.md" should contain ".full-width-header"

  @wip
  Scenario: CSS is properly merged with existing deck styles
    Given there is a template "CustomStyle" with custom deck CSS
    When I create a presentation "merge-test" from template "CustomStyle"
    Then the "deck.marp.md" should contain both template CSS and layouts CSS
    And the styles should be in the correct order
    And there should be no duplicate style blocks

  Scenario: CSS extraction from layouts.md front matter
    Given I have a "layouts.md" file with CSS in the front matter
    When I extract the CSS from the layouts file
    Then I should get the complete style block
    And it should include all layout classes
    And it should not include the front matter delimiters

  @wip
  Scenario: Layouts work correctly after CSS merge
    Given I create a presentation "working-test"
    And I add a slide using the "two-column" layout
    When I compile the presentation
    Then the compiled HTML should include the two-column CSS
    And the two-column layout should be styled correctly

  @wip
  Scenario: Updating layouts.md updates deck CSS
    Given I have a presentation "update-test"
    When I modify the layouts.md CSS
    And I request to update the deck styles
    Then the deck.marp.md should reflect the updated CSS
    And the old layout CSS should be replaced

  Scenario: CSS comments are preserved
    Given the default layouts have CSS comments
    When I create a presentation "comments-test"
    Then the "deck.marp.md" should preserve CSS comments
    And the comments should explain layout purposes

