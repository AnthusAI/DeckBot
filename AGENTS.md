# Agent Guidelines

This project follows a strict **Behavior Driven Development (BDD)** workflow.

As an agent working on this project, you **MUST** adhere to the following cycle for every new feature or modification:

1.  **Write the Spec First (RED)**:
    *   Create or update a `.feature` file in the `features/` directory.
    *   Define the desired behavior using Gherkin syntax (Given/When/Then).
    *   **Verify Failure**: Run the tests (`behave features/your_feature.feature`) and confirm they fail (or are undefined). Do *not* skip this step. Seeing the failure ensures your test is actually testing something.

2.  **Implement the Feature (GREEN)**:
    *   Write the minimum code necessary to implement the feature.
    *   Implement the step definitions in `features/steps/`.

3.  **Test and Refine (REFACTOR)**:
    *   Run the tests again.
    *   If new scenarios or edge cases are discovered during implementation, **add them to the feature file immediately** as failing tests, then make them pass.
    *   Ensure *all* tests pass before declaring the task complete.

## Project Structure
*   `features/`: BDD feature specifications.
*   `features/steps/`: Python step definitions for Behave.
*   `src/`: Source code.
*   `tests/`: Unit tests (optional, BDD is primary).
*   `pyproject.toml`: Project configuration and dependencies (prefer this over requirements.txt).

## Key Rules
*   **Never write code without a failing test.**
*   **Don't guess**; if a test fails, read the error, understand it, and fix the code or the test.
*   **Verify visually** if possible (e.g. "Run it and see") in addition to automated tests, but automated tests are the source of truth for behavior.
*   **CRITICAL: Run tests after EVERY code change.** Do not declare a task complete, do not commit, do not move on until you have:
    1. Run `behave` (or the relevant subset of tests)
    2. Confirmed that ALL tests PASS (0 failed, 0 error)
    3. If tests fail or error, FIX THEM IMMEDIATELY before doing anything else
*   **Never assume tests pass.** Always verify. A BDD project with failing tests is a broken project.

## Testing Strategy

### Unit & Feature Tests (Default)
By default, `behave` runs **fast, isolated tests** that mock external API calls. These tests:
- Run in seconds
- Don't require API keys
- Don't consume quota
- Are automatically run on every code change

**Run all unit/feature tests:**
```bash
behave
```

### Integration Tests (Manual, Requires API Key)
Integration tests make **real API calls** to verify end-to-end functionality. These tests:
- Are **excluded from normal test runs** (tagged with `@integration` and `@manual`)
- Require `GOOGLE_API_KEY` environment variable
- Make real API calls that consume quota
- Take longer to run
- Verify actual API integration (e.g., image generation with Gemini)

**Run integration tests:**
```bash
./run_integration_tests.sh
```

Or manually:
```bash
behave --tags=integration features/image_generation_integration.feature
```

**When to use integration tests:**
- After changing API integration code (e.g., `nano_banana.py`)
- Before major releases to verify external services work
- When debugging issues that only appear with real API calls
- To verify prompt engineering changes produce expected results

**Do NOT run integration tests:**
- During normal feature development
- In automated CI/CD pipelines (unless quota is acceptable)
- When iterating rapidly on code changes

The `.behaverc` file excludes integration tests by default with `default_tags = -integration,-manual`.

## Image Generation Architecture

### Batch Tracking System
Every image generation request creates a **unique batch** with a slug-based identifier (e.g., `cybernetic-feedback-loop-12345`). This enables:

- **Context Preservation**: Each batch has a unique ID derived from the prompt + timestamp
- **Organized Storage**: Images saved in `drafts/{batch-slug}/` for easy reference
- **Clear Provenance**: SYSTEM messages include batch IDs: `"[SYSTEM] User selected an image from (batch: slug-12345)..."`
- **History Tracking**: Batch IDs in chat history allow the agent to distinguish between old and new image requests

### Image Generation Workflow
When implementing or testing image-related features:

1. **Generation**: `generate_candidates()` returns:
   ```python
   {
       'candidates': [list of image paths],
       'batch_slug': 'unique-identifier',
       'batch_folder': 'drafts/unique-identifier'
   }
   ```

2. **Selection**: User selects an image, triggering a SYSTEM message with batch context
3. **Incorporation**: Agent uses the SYSTEM message to incorporate the correct image
4. **Batch Awareness**: Agent ignores SYSTEM messages from old batches when working on new requests

**Key Files:**
- `src/deckbot/nano_banana.py`: Batch slug generation and image storage
- `src/deckbot/session_service.py`: SYSTEM message creation with batch IDs
- `src/deckbot/agent.py`: Agent instructions for batch-aware behavior
- `features/image_batch_tracking.feature`: BDD tests for batch system

## Image Generation Context Engineering

### Overview
The image generation system uses Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`) with carefully constructed prompts that incorporate presentation style, theme, and design opinions. The prompt construction logic is centralized in the `ImagePromptBuilder` class for easy understanding, testing, and tweaking.

### Three Use Cases

The system supports three distinct image generation workflows:

1. **Fresh Image Generation** (`generate_image` tool)
   - User requests a new image from scratch
   - Location: `tools.py:generate_image()`
   - Context: User prompt + presentation style + theme + design opinions

2. **Slide Remix** (`remix_slide` tool)
   - User asks to remix an entire slide (rendered as image)
   - Location: `tools.py:remix_slide()`
   - Context: Same as Fresh Image Generation PLUS entire slide rendered as reference image
   - The remixed image replaces the entire slide contents

3. **Image Remix** (`remix_image` tool)
   - User asks to remix a specific existing image file
   - Location: `tools.py:remix_image()`
   - Context: Same as Fresh Image Generation PLUS specific image file as reference
   - The remixed image replaces the original image file

### Context Sources (Priority Order)

For each generation, the system gathers context from multiple sources in this order:

1. **User Prompt** - Direct user request (highest priority, goes into user message)
2. **Aspect Ratio** - From presentation settings (`metadata.json` → `aspect_ratio`) or explicit request
3. **Style Reference** - From `images/style.png` (if exists) - used as visual style guide
4. **Theme Info** - Fonts/colors extracted from `deck.marp.md` CSS frontmatter
5. **Color Settings** - From `metadata.json` → `color_settings` - official color palette for the presentation
6. **Font Settings** - From `metadata.json` → `font_settings` - typography settings (primary/secondary fonts)
7. **Style Prompt** - From `metadata.json` → `image_style.prompt` - style instructions for all images
8. **Design Opinions** - From `metadata.json` → `design_opinions` - design preferences (icons, colors, typography)
9. **Remix Reference** - Slide or image to remix (for remix operations only)

### Prompt Structure

The final prompts sent to Gemini are constructed as follows:

**User Message** (sent as last part in contents array):
```
[style reference prefix if style.png exists] + 
[remix prefix if remixing] + 
user_prompt + 
[theme_info from CSS] + 
[color_and_font_info from color_settings + font_settings] + 
[style_prompt from metadata]
```

**System Instructions** (sent as text part before user message):
```
1. Generate a {aspect_ratio_instruction}.
2. [Style reference instructions if style.png exists]
3. [Remix instructions if remixing]
4. {theme_info from CSS}
5. {color_and_font_info from color_settings + font_settings}
6. Style instructions: {style_prompt}
7. Design opinions: {design_opinions}
```

**Contents Array** (sent to Gemini API in this order):
```
[
  style_reference_image (if exists),
  remix_reference_image (if remixing),
  system_message (system instructions as text),
  user_message (user prompt with prefixes)
]
```

### Metadata Schema for Image Generation

The `metadata.json` file can contain the following fields that affect image generation:

```json
{
  "color_settings": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "danger": "#hex",
    "muted": "#hex",
    "foreground": "#hex",
    "background": "#hex"
  },
  "font_settings": {
    "primary": "Font Name",
    "secondary": "Font Name"
  },
  "image_style": {
    "prompt": "Style instructions that apply to all generated images. This is added to both system instructions and user message."
  },
  "design_opinions": {
    "icons": "lucide|emoji|none",
    "color_palette": ["#hex", "#hex"],
    "typography_style": "description",
    "any_other_key": "value"
  },
  "aspect_ratio": "16:9"
}
```

**Field Details:**
- `color_settings`: Official color palette for the presentation (sent to both agents as style reference colors)
- `font_settings`: Typography settings (primary for headings, secondary for body)
- `image_style.prompt`: Added to both system instructions and user message for emphasis
- `design_opinions`: All key-value pairs are formatted as "key: value" and added to system instructions
- `aspect_ratio`: Default aspect ratio for the presentation (can be overridden per request)

### Code Organization

**Prompt Building:**
- `src/deckbot/nano_banana.py`:
  - `PROMPT_TEMPLATES`: All prompt text templates (easy to tweak)
  - `ImagePromptBuilder`: Class that builds prompts from context
  - `NanoBananaClient.generate_candidates()`: Orchestrates context gathering and API calls

**Tool Wrappers:**
- `src/deckbot/tools.py`:
  - `generate_image()`: Fresh image generation
  - `remix_slide()`: Slide remix (renders slide first)
  - `remix_image()`: Image file remix

**Workflow Coordination:**
- `src/deckbot/session_service.py`: Web mode workflow (async generation, user selection, agent notification)

### Tweaking Prompts

All prompt text is centralized in `PROMPT_TEMPLATES` at the top of `nano_banana.py`:

```python
PROMPT_TEMPLATES = {
    'aspect_ratio': { ... },  # Aspect ratio descriptions
    'system_instructions': { ... },  # System instruction templates
    'user_message_prefixes': { ... }  # User message prefixes
}
```

To tweak prompt language:
1. Edit the relevant template in `PROMPT_TEMPLATES`
2. No need to touch complex logic in `generate_candidates()` or `ImagePromptBuilder`
3. Test with integration tests to verify changes produce expected results

### Example: Complete Prompt Construction

For a fresh image generation with:
- User prompt: "a blue circle"
- Presentation has `style.png`
- `metadata.json` has `image_style.prompt: "minimalist, clean"`
- `design_opinions: {"icons": "lucide"}`
- Aspect ratio: "16:9"

**System Instructions:**
```
Generate a wide landscape image (16:9 aspect ratio). You MUST use the provided style reference image as a visual style guide. Ignore the specific content, subjects, or objects in the reference image. However, you MUST closely match its visual style, color palette, artistic technique, and overall aesthetic. Study the reference image carefully and apply its style characteristics to your generated image. Presentation color palette (use these as style reference colors): Primary: #3B82F6, Secondary: #8B5CF6, Accent: #60A5FA, Text: #2C4074, Background: #EEE5D3. Typography: Headings: Inter, Body: Source Serif Pro. Style instructions: minimalist, clean. Design opinions: icons: lucide
```

**User Message:**
```
Using the provided style reference image as a visual style guide (match its style, colors, and aesthetic), generate: a blue circle. Presentation color palette (use these as style reference colors): Primary: #3B82F6, Secondary: #8B5CF6, Accent: #60A5FA, Text: #2C4074, Background: #EEE5D3. Typography: Headings: Inter, Body: Source Serif Pro. Style instructions: minimalist, clean
```

**Contents Array:**
```
[
  <PIL.Image: style.png>,
  "Generate a wide landscape image (16:9 aspect ratio). Using the provided style reference image ONLY as a style reference. Ignore the content of the reference image; copy only its visual style, color palette, and vibe. Style instructions: minimalist, clean. Design opinions: icons: lucide",
  "Using the provided style reference image as a visual style guide, generate: a blue circle. Style instructions: minimalist, clean"
]
```

## Secrets Management & API Key Profiles

DeckBot uses a profile-based system to manage API keys and model configurations. This allows you to:
- Store multiple API keys (work, personal, different providers)
- Switch between profiles easily via the UI
- Configure models per-profile
- Keep secrets out of version control

### Profile System

**Configuration File**: `.deckbot.secrets.yaml` (automatically gitignored)

Each profile stores:
```yaml
active_profile: "default"
profiles:
  default:
    name: "Default"
    description: "My primary API key"
    provider: "google_gemini"
    api_key: "AIzaSy..."
    created_at: "2025-12-06T10:00:00"
    updated_at: "2025-12-06T10:00:00"
    model_config:
      primary_model: "gemini-3-pro-preview"
      secondary_model: "gemini-2.0-flash-exp"
      image_model: "gemini-3-pro-image-preview"
```

### Managing Profiles

**Via UI (Recommended)**:
1. Open DeckBot web UI
2. Click gear icon → Preferences
3. Go to "API Keys" tab
4. Create, edit, delete, or switch active profiles

**Via File (Manual)**:
- Edit `.deckbot.secrets.yaml` directly
- Profiles are identified by slugified names (e.g., "My Gemini" → `my_gemini`)
- Only one profile can be active at a time

### Migration from .env

If you have an existing `.env` file with `GOOGLE_API_KEY`, DeckBot automatically:
1. Detects the key on first run
2. Creates a "Default" profile
3. Migrates the API key and model settings
4. Sets it as the active profile

The `.env` file remains as a fallback for backwards compatibility.

## Model Configuration & Fallback

Each profile can configure three models:
- **Primary Model**: Main chat/coding assistant (default: `gemini-3-pro-preview`)
- **Secondary Model**: Fallback for rate limits (default: `gemini-2.0-flash-exp`)
- **Image Model**: For image generation (default: `gemini-3-pro-image-preview`)

**Automatic Fallback**: If the primary model returns a `429 RESOURCE_EXHAUSTED` error, the agent automatically switches to the secondary model and retries the request transparently.

### Model Selection Priority

1. **Profile model_config** (from active profile in `.deckbot.secrets.yaml`)
2. **Preferences** (from `.deckbot.yaml` - legacy)
3. **Hardcoded defaults**

This allows per-profile model customization while maintaining backwards compatibility.
