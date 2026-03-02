# LockedIn Buddy

Chrome Extension (Manifest V3) for faster studying from web content.  
It can summarize, quiz, build mindmaps, explain highlights, track focus sessions, and show learning analytics in a side panel.

## Current Feature Set

### Study Page
- Summarize current source (highlight first, else full tab)
- Generate quiz from current source (highlight first, else full tab)
- Create expandable mindmap from current source
- Highlight Assistant with `Ask Your Buddy`
- Explain-like modes:
  - Balanced student mode
  - Beginner friendly
  - Exam focused
  - Analogy mode
  - Mnemonic mode
- Interactive quiz:
  - Per-question answer checking
  - Right/wrong tracking
  - Accuracy-based feedback and weak-topic suggestions
  - Follow-up prompt after quiz
- Source Citation View:
  - Citation tags in output
  - Click citation tags to jump to matching citation details
- LaTeX and equation rendering:
  - Parses LaTeX delimiters (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`)
  - Auto-detects equation-like lines and renders readable math
  - Converts special symbols/operators to proper math symbols

### Focus Page
- Pomodoro timer
- Optional focus/rest cycle mode (custom durations and cycle count)
- Optional camera-based focus reminders
- Heuristic local detection with reminder banner + audio reminder

### Analytics Page
- Learning analytics dashboard with recent trend bars
- Tracks study actions, quiz accuracy, focus time, streak
- Theme/palette-aware chart colors

### Settings (`options.html`)
- OpenAI API key
- Model selection (default: `gpt-5-mini`)
- Color mode: `light`, `dark`, `system`
- Background palette presets
- Feedback email drafting flow (`mailto:`)

## Project Structure

- `manifest.json` - Extension manifest and permissions
- `background.js` - Side panel behavior + highlight selection relay/storage per tab
- `content-script.js` - Selection capture from webpage
- `sidepanel.html`, `sidepanel.css` - Main app UI
- `popup.js` - Main logic (study/focus/analytics + model requests + rendering)
- `popup.html`, `popup.css` - Popup shell/styles
- `options.html`, `options.css`, `options.js` - Settings UI and storage
- `icons/` - Extension icons

## Quick Start

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder:
   `lockedin_buddy_extension`
5. Open extension **Settings** and set:
   - OpenAI API key
   - Model (optional, defaults to `gpt-5-mini`)
6. Open a normal `http/https` page with text content.
7. Open the side panel and use Study / Focus / Analytics.

## Permissions

- `activeTab`, `scripting`, `storage`, `sidePanel`
- Host permissions:
  - `https://api.openai.com/*`
  - `https://*/*`
  - `http://*/*`

## Notes and Limitations

- Chrome internal pages (`chrome://`, Web Store, etc.) cannot be read.
- Some pages block script access due to browser/site restrictions.
- Best results come from text-heavy pages.
- The app currently reads one active tab/source at a time.

## Model/API Notes

- Uses OpenAI Responses API from the extension client.
- `gpt-5` family models do not support `temperature` in this implementation.
- If model output is not valid JSON, UI will show: `Model returned non-JSON output. Try again.`

## Troubleshooting

- `This tab type cannot be read by extensions.`
  - Switch to a standard `http/https` page.

- `Cannot access contents of the page. Extension manifest must request permission...`
  - Reload extension and retry on allowed host pages.

- `Uncaught TypeError: Cannot read properties of undefined (reading 'sendMessage')` in `content-script.js`
  - Usually stale injected script after extension reload/update.
  - Fix:
    1. Reload extension in `chrome://extensions`
    2. Hard refresh / reopen the affected tab
    3. Ensure only one active unpacked copy is enabled

- Camera access problems during focus session
  - Allow camera permission in browser + OS privacy settings
  - Reload extension after permission changes

## Privacy

- Content is processed locally in the extension for extraction/interaction.
- Model requests are sent directly to OpenAI using the user-provided API key.
- Focus-camera processing is local heuristic logic in-browser.
