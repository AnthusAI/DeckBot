Feature: Template Overhaul - Professional Theme Presets
  As a user
  I want to have access to professional, well-designed templates
  So that I can create beautiful presentations quickly

  Background:
    Given the template directory exists

  Scenario: All 8 templates are available
    Given the template "1. Alpine Minimal" exists
    And the template "2. Editorial Modern" exists
    And the template "3. Classic Tech" exists
    And the template "4. Warm Studio" exists
    And the template "5. Midnight Grid" exists
    And the template "6. Neon Minimal" exists
    And the template "7. Quartz Future" exists
    And the template "8. Terminal Chic" exists
    When I list templates via CLI
    Then the output should contain "1. Alpine Minimal"
    And the output should contain "2. Editorial Modern"
    And the output should contain "3. Classic Tech"
    And the output should contain "4. Warm Studio"
    And the output should contain "5. Midnight Grid"
    And the output should contain "6. Neon Minimal"
    And the output should contain "7. Quartz Future"
    And the output should contain "8. Terminal Chic"

  Scenario Outline: Light theme templates have correct metadata
    Given the template "<template_name>" exists
    When I read the template metadata for "<template_name>"
    Then the template should have fonts "<heading_font>" and "<body_font>"
    And the template should have text color "<text_color>"
    And the template should have background color "<bg_color>"
    And the template should have accent colors "<accent1>" and "<accent2>"

    Examples:
      | template_name         | heading_font    | body_font         | text_color | bg_color | accent1 | accent2 |
      | 1. Alpine Minimal     | Inter           | Source Serif Pro  | #0A0A0A    | #FFFFFF  | #2F80ED | #EB5757 |
      | 2. Editorial Modern   | Montserrat      | Merriweather      | #222222    | #FAFAFA  | #009688 | #F9A825 |
      | 3. Classic Tech       | IBM Plex Sans   | IBM Plex Serif    | #1C1C1C    | #FFFFFF  | #0F62FE | #DA1E28 |
      | 4. Warm Studio        | Crimson Pro     | Work Sans         | #2D2D2D    | #FFF8F0  | #D84315 | #6D4C41 |

  Scenario Outline: Dark theme templates have correct metadata
    Given the template "<template_name>" exists
    When I read the template metadata for "<template_name>"
    Then the template should have fonts "<heading_font>" and "<body_font>"
    And the template should have text color "<text_color>"
    And the template should have background color "<bg_color>"
    And the template should have accent colors "<accent1>" and "<accent2>"

    Examples:
      | template_name      | heading_font | body_font  | text_color | bg_color | accent1 | accent2 |
      | 5. Midnight Grid   | Work Sans    | Inter      | #ECECEC    | #121212  | #64B5F6 | #E57373 |
      | 6. Neon Minimal    | Poppins      | Open Sans  | #F5F5F5    | #0D0D0D  | #26C6DA | #F06292 |
      | 7. Quartz Future   | Outfit       | Manrope    | #E0E0E0    | #101014  | #7C4DFF | #26C6DA |
      | 8. Terminal Chic   | System-UI    | Segoe UI   | #F2F2F2    | #0A0A0A  | #66BB6A | #FFDD33 |

  Scenario: Create presentation from Alpine Minimal template
    Given the template "1. Alpine Minimal" exists
    When I run the command "create alpine-test --template '1. Alpine Minimal'"
    Then a presentation "alpine-test" should exist
    And the file "alpine-test/deck.marp.md" should contain "Inter"
    And the file "alpine-test/deck.marp.md" should contain "#0A0A0A"

  Scenario: Create presentation from dark theme template
    Given the template "5. Midnight Grid" exists
    When I run the command "create dark-test --template '5. Midnight Grid'"
    Then a presentation "dark-test" should exist
    And the file "dark-test/deck.marp.md" should contain "Work Sans"
    And the file "dark-test/deck.marp.md" should contain "#121212"

  Scenario: Template provides design opinions to agent
    Given the template "2. Editorial Modern" exists
    And I create a presentation "editorial-test" from template "2. Editorial Modern"
    When I load the presentation "editorial-test"
    Then the agent system prompt should contain "Montserrat"
    And the agent system prompt should contain "#009688"

  Scenario: Old templates are removed
    When I list templates via CLI
    Then the output should not contain "Simple"
    And the output should not contain "Candy"
    And the output should not contain "Light"
    And the output should not contain "Dark"

