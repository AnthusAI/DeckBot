# DeckBot Help

Welcome to **DeckBot**! This guide covers slash commands, keyboard shortcuts, and tips for getting the most out of your AI-powered presentation tool.

---

## Slash Commands

Slash commands provide **quick programmatic actions** without AI interpretation. Type them at the start of a message in the chat input.



### `/fast`

**Toggle fast mode on/off**

- When enabled, uses the **secondary model** (faster, lower cost) for all messages

- Type `/fast` alone to toggle the mode

- Current mode status shown in UI with orange border


**Example:**
```
/fast
```

---

### `/fast <message>`

**Send a single message in fast mode**

- Sends one message using the secondary model

- Does **not** change your current mode setting

- Useful for quick, simple requests


**Example:**
```
/fast Generate a simple title slide
```

---

### `/export`

**Export presentation to PDF**

- Converts your current presentation to PDF using Marp CLI

- Saves to temporary location and triggers download

- Requires Marp CLI to be available


**Example:**
```
/export
```

---

### `/help`

**Display this help information**

- Shows available commands, shortcuts, and tips

- Your go-to reference guide


**Example:**
```
/help
```

---

### `/tools`

**List available AI agent tools**

- Shows all tools the AI has access to

- Useful for understanding agent capabilities

- See what functions the agent can call


**Example:**
```
/tools
```

---

## Keyboard Shortcuts


### Chat Input

- **Enter** — Send message

- **Shift + Enter** — New line in message

- **⌘/Ctrl + V** — Paste images directly into chat


### View Switching

- **^1** (Ctrl+1) — Switch to **Preview** view

- **^2** (Ctrl+2) — Switch to **Layouts** view

- **^3** (Ctrl+3) — Switch to **Code** view

- **^4** (Ctrl+4) — Switch to **Settings** view


### Menu Navigation

- **⌘,** (Cmd+Comma on Mac) — Open **Preferences**

---

## UI Tips


### Chat Interface

- **Image Upload** — Click the image icon next to Send button to upload reference images

- **Multi-line Messages** — Use Shift+Enter to add line breaks in your messages

- **Chat History** — Scroll through previous messages and AI responses in the chat panel

- **Tool Visibility** — Watch real-time tool execution in the chat (file operations, image generation, compilation)


### Views

**1. Preview View** — Live preview of your compiled presentation

   - Navigate slides using on-screen controls

   - Preview updates automatically when deck is modified

   - Click slides to jump to specific pages


**2. Layouts View** — Manage reusable slide layouts

   - Define custom CSS and layout templates

   - Layouts are merged with main deck CSS

   - Reference layouts in your slides with Marp directives


**3. Code View** — Direct markdown editing

   - Monaco editor with syntax highlighting

   - Edit `deck.marp.md` directly

   - Changes sync with AI context


**4. Settings View** — Presentation configuration

   - Aspect ratio (16:9, 4:3, etc.)

   - Theme colors and fonts

   - Design opinions for image generation

   - Metadata configuration

### Presentation Management
- **New Presentation**: File → New Presentation
- **Open Presentation**: File → Open Presentation
- **Save As**: File → Save As (duplicate existing presentation)
- **Close Presentation**: File → Close Presentation
- **Export PDF**: File → Export PDF

### Image Generation Workflow
1. Ask AI to generate images naturally in chat
2. AI creates 4 candidate images and shows them in modal
3. Select your preferred image
4. AI incorporates selected image into presentation
5. All generated images saved to `images/` folder
6. Drafts organized in `drafts/` folder by batch

### Style Reference
- Add `images/style.png` to your presentation directory
- This image guides the aesthetic for all generated images
- AI uses it as a style reference automatically
- Great for brand consistency

### Theme Customization
- Theme colors and fonts from CSS guide image generation
- Design opinions in Settings affect image prompts
- Background images and layouts apply to generated slides

---

## Presentation Structure

Your presentation is stored as a simple folder with these files:

```
presentations/YourDeck/
├── deck.marp.md       # Main markdown file
├── metadata.json      # Configuration (aspect ratio, theme, etc.)
├── layouts.md         # Reusable layout templates
├── images/            # Generated and uploaded images
│   ├── style.png      # Optional style reference
│   └── ...
├── drafts/            # Image generation batches
└── chat_history.jsonl # Conversation log
```

Everything is plain text and Git-ready! Edit in any text editor.

---

## AI Agent Tools

The AI has access to these tools to help build your presentation:

### File Management
- `list_files` - Show all files in presentation
- `read_file` - Read file contents
- `write_file` - Create or overwrite files
- `replace_text` - Find and replace in files
- `copy_file` - Duplicate files
- `move_file` - Rename or move files
- `delete_file` - Remove files

### Image Generation
- `generate_image` - Create 4 image candidates with AI
- `remix_slide` - Regenerate images for existing slide
- `remix_image` - Create variations of an image

### Compilation & Export
- `compile_presentation` - Convert Markdown → HTML preview
- `export_pdf` - Generate PDF for sharing
- `validate_deck` - Check for syntax errors

### Navigation & Inspection
- `go_to_slide` - Jump to specific slide
- `inspect_slide` - Visual QA using Gemini Vision
- `list_drafts` - Show all image generation batches

---

## Tips & Best Practices

### Working with the AI
- **Be specific**: "Create a title slide with blue background" works better than "make a slide"
- **Iterate**: Ask for changes incrementally rather than complete rewrites
- **Reference slides**: "Change slide 3" or "add an image to the intro slide"
- **Upload references**: Share example images for style guidance

### Fast Mode
- Use for simple requests, quick iterations, or when rate-limited
- Toggle on when doing lots of small edits
- Toggle off for complex designs or critical content

### Image Generation
- First generation creates 4 candidates—review before selecting
- Use style reference (`images/style.png`) for consistency
- Describe desired mood, colors, style in requests
- Remix if initial results don't match vision

### Organizing Presentations
- Use descriptive names for presentations
- Keep `style.png` for brand consistency
- Edit `layouts.md` for reusable components
- Version control with Git for collaboration

### Performance
- Compilation is automatic after file changes
- Large images may slow preview—optimize if needed
- Fast mode reduces latency for simple requests

---

## Troubleshooting

### "Failed to compile presentation"
- Check `deck.marp.md` for syntax errors
- Use `/help` to validate markdown
- Look for unclosed YAML frontmatter

### "Image generation failed"
- Verify API keys in Preferences
- Check internet connection
- Try simpler prompt or different aspect ratio

### "Preview not updating"
- Refresh preview manually if needed
- Check for compilation errors in chat
- Restart presentation if persistent

### "Model rate limit exceeded"
- Toggle `/fast` mode to use secondary model
- Wait a few moments before retrying
- Consider upgrading API quota

---

## API Keys & Profiles

DeckBot uses profile-based API key management:

1. Open **Preferences** (⌘,)
2. Go to **API Keys** section
3. Add/edit profiles with your Google Gemini API key
4. Select active profile for current session
5. Configure primary, secondary, and image models

Multiple profiles let you switch between personal/team accounts easily.

---

## Need More Help?

- **GitHub Issues**: Report bugs or request features at https://github.com/anthropics/deckbot/issues
- **Documentation**: Check the README for detailed setup instructions
- **Community**: Join discussions in GitHub Discussions

---

**DeckBot Version**: 1.0
**Built with**: Marp, Google Gemini, React, Flask, and Electron

Happy presenting! 🎉
