# Discord DM Archive

**A local, open-source Chrome/Edge extension for exporting Discord direct messages with a familiar Discord-style interface.** It captures messages from both participants as they appear in your own logged-in Discord Web tab. No copying authentication tokens, no bot setup, no paid API, and no third-party upload service.

> **Unofficial project.** Not affiliated with or endorsed by Discord. This is a DOM-based browser tool, not a Discord API client. Discord's Terms of Service restrict unauthorized scraping; make sure you have the necessary permission before using automated capture. A capture is **not guaranteed complete**, especially for long histories, deleted messages, or expired media.

## Why use it?

| Benefit | What it means |
| --- | --- |
| **No Discord tokens** | Sign in normally on discord.com. Never paste a user token, session cookie, or password into the extension. |
| **Open source** | Review and modify the JavaScript, HTML, and CSS yourself. MIT-licensed source is included under [`extension/`](extension/). |
| **Both sides of a DM** | Captures messages displayed for both participants, unlike Discord's own account data download that focuses on your sent messages. |
| **Automatic upward scrolling** | Start auto-capture in one DM. The extension repeatedly scrolls toward older messages and checks the rendered chat. |
| **Resume after reload** | Captured message records persist in local browser extension storage, and the selected DM resumes auto-capture when reloaded. |
| **Discord-inspired HTML export** | Read chat-style message rows with avatars, usernames, timestamps, day dividers, grouped messages, and a dark interface. |
| **Images, animated GIFs, video and audio** | Media shown in the chat can appear as inline previews or HTML5 players when an accessible URL is present. |
| **Offline-media ZIP** | Optionally download accessible images, GIFs, videos, audio and avatars into one portable ZIP; media limitations apply. |
| **Multiple file formats** | Export HTML, JSON, TXT, or HTML + media ZIP. Import older JSON captures from v1. |
| **Privacy by design** | Message records remain in your browser until you export/share them. No analytics, backend, account-token collection, or server uploads. |

## Installation (Windows, macOS, Linux)

**Chrome**

1. Download the [source ZIP](https://github.com/boormajor/discord-chat-export/archive/refs/heads/main.zip) or clone the repository.
2. Extract it and open **`chrome://extensions`**.
3. Enable **Developer mode** in the upper-right corner.
4. Select **Load unpacked**.
5. Choose the **`extension`** directory (the folder containing `manifest.json`).
6. Sign into [Discord Web](https://discord.com/app) in Chrome, open a **direct message** and **refresh** the Discord tab.
7. Pin the extension if you want easy access.

**Microsoft Edge:** Follow the same instructions using **`edge://extensions`** and **Load unpacked**.

If you previously installed v1, disable/remove it first to avoid competing captures.

## How to export a full DM conversation

1. Open **Discord Web** and select the DM you want to save. The URL should look like `https://discord.com/channels/@me/<DM_ID>`.
2. Click the **DM Archive** extension icon.
3. Click **Start auto capture**. The extension reads the currently rendered messages and scrolls upward toward older ones. Keep the tab open, ideally in the foreground.
4. Watch the captured message counter. It stops when it detects the apparent beginning of the loaded history, but **do not treat that alone as proof of completeness**.
5. If you refresh the **same** DM, auto-capture resumes without clicking Start again. Only the DM you explicitly started is configured for automatic restart.
6. Use **Pause** to stop (including automatic restart), **Scan again** to repeat a pass, or **Clear archive** to remove this DM's local stored records.
7. Export using one of the options below. Check the oldest message and any expected gaps before relying on the archive.

### Export options

| Option | Contents | Best for |
| --- | --- | --- |
| **HTML** | One read-only Discord-style HTML file; media is referenced online | Easy reading/sharing |
| **HTML + offline media ZIP** | `index.html`, `messages.json`, a report and downloaded `media/` files | Backups with playable media |
| **JSON** | Structured message IDs, text, authors, timestamps and available media/link metadata | Importing, analysis, programmatic processing |
| **TXT** | Plain text transcript with timestamps and media links | Lightweight archive |

For **offline media ZIP**, extract the ZIP and open `index.html` in Chrome/Edge. Local GIF files animate, supported videos/audio show player controls, and images appear inline. Files that could not be downloaded may remain online links.

### What media is supported?

- Images: PNG, JPG, WebP, and other browser-supported image formats.
- GIFs: true animated GIF files and some Discord looping-video GIF previews.
- Videos: accessible MP4/WebM etc. with browser playback support.
- Audio and voice-message audio: when the page exposes an accessible URL.
- Other file attachments: downloadable links/cards where detected.
- Avatar images: included in offline ZIP if their URLs remain accessible.

**Not every media file is recoverable.** Discord signed attachment URLs expire, and some embeds, stickers, reactions, voice messages, or external GIFs are not exposed as downloadable media in the page. Media ZIP fetching supports only allowlisted Discord/CDN, Tenor, Giphy, and Imgur hosts and does not send auth headers. The current safety limits are **28 MB per media file, 250 MB combined media, and 1,500 media files**. Missing or oversized files remain linked online where possible.

## Privacy and security

- **No token needed:** The extension does not ask for, read, or transmit your Discord account token, cookies, or password.
- **No Discord API calls:** Message capture reads the content already rendered in the open Discord Web page.
- **Local storage:** Captured message records are stored using `chrome.storage.local`, scoped to their DM IDs.
- **No telemetry / developer servers:** There is no analytics endpoint, remote backend, or upload of your chat history.
- **Media downloads are optional:** For offline ZIP, the extension fetches only allowlisted media URLs already observed in the chat.
- **Sensitive exports:** HTML/JSON/TXT/ZIP files may contain private messages. Keep backups secure, get consent where appropriate, and **never commit your private exports to a public repository**.

## Limitations and important notes

- **No completeness guarantee:** The script depends on Discord's rendered UI, virtualized scroll history, and page structure. It can miss rows or author context. Verify the oldest and newest messages.
- **No deleted-message recovery:** Content no longer available to your account isn't restored.
- **No guarantee of permanently playable remote media:** Use offline ZIP promptly for accessible assets; expired or unsupported URLs may fail.
- **Website changes can break it:** If Discord updates its HTML/CSS, the selectors or scroll behavior may need maintenance.
- **Browser permissions:** The extension uses `storage` and `unlimitedStorage`. Its content script runs only on DM pages under `discord.com/channels/@me/`; media-download host permissions are restricted to supported CDN/media domains.
- **Testing:** JavaScript syntax, ZIP integrity, and static export output were checked locally. Live account behavior on Discord Web has **not** been verified by the author of this version.
- **Account policy:** Discord restricts unauthorized scraping and account automation. Review the current [Discord Terms](https://discord.com/terms) and use only where authorized.

## Troubleshooting

| Problem | Try this |
| --- | --- |
| Popup says **Not connected** | Open a DM in **discord.com**, refresh the tab, then reopen the extension. |
| **0 messages** | Start capture; ensure the URL is a DM (`/channels/@me/<ID>`), not a server channel or group view with different markup. |
| Scroll stops early | Keep the tab visible, try **Scan again**, verify what the page actually loaded, and inspect missing ranges. |
| Media missing from HTML | Export **HTML + offline media ZIP** while the attachment URLs are still valid. |
| Can't open ZIP media | Extract the ZIP fully; open `index.html` from its extracted folder. |
| An import fails | Import a JSON export from the **same DM ID**. HTML exports aren't importable. |
| Huge chat slows down | Export in stages. Storage and ZIP building are constrained by browser resources. |
| It stopped after a refresh | Open the same DM; if you pressed **Pause**, click **Start auto capture** again. |

## How the project works

```text
extension/
├── manifest.json      Chrome Manifest V3 permissions and content-script registration
├── popup.html          Extension controls
├── popup.css           Popup styling
├── popup.js            Start / pause / export / import actions
├── capture.js          Reads visible message rows, scrolls up, stores and merges messages
├── renderer.js         Creates the read-only Discord-style HTML
├── zip.js              Dependency-free ZIP generator
└── background.js       Fetches allowlisted media for optional offline ZIP
```

No npm install, build pipeline, external JavaScript runtime, API key, or server is required. Read or edit the files, then click **Reload** on the extension card in `chrome://extensions` to apply code changes.

## Contributing

Issues and pull requests are welcome, especially for Discord UI compatibility, improved media detection, archive completeness checks, accessibility, and automated tests. Do **not** include real chat histories, tokens, or other personal information in bug reports.

## License

MIT License. See [LICENSE](LICENSE). Discord and its marks belong to their respective owners.

---

**Project:** [boormajor/discord-chat-export](https://github.com/boormajor/discord-chat-export) · **Version:** 2.0 (prototype; live Discord compatibility unverified)
