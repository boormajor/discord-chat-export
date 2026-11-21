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

**Project:** [boormajor/discord-chat-export](https://github.com/boormajor/discord-chat-export) · **Version:** 2.7 (Discord-style HTML redesign; live Discord compatibility unverified)

## v2.1 layout fix

Fixed a rendering bug in grouped Discord messages: when the compact timestamp column was hidden, message text and attachments moved into the 72px-wide column, causing one-word-per-line wrapping and broken alignment. Grouped messages now always occupy the correct chat content column. Sticker previews are limited to 128px, normal images to 320×250px, and videos to 350×250px. The archive header is also more compact.

**How to fix an existing export:** Reload the extension at `chrome://extensions`, refresh your open Discord DM, and export HTML again. **You do not have to recapture the whole conversation.** Stored records and JSON are preserved. The fix applies to newly exported HTML, not HTML files already saved on disk.

## v2.2: Faster and more resilient capture

A slow Discord Web connection can make fixed-timer scrolling appear stuck. The capture loop now:

- **Scans only new or changed rendered message rows** rather than reparsing all visible media/text on every pass.
- **Caches the active scroll container** instead of repeatedly searching the whole ancestor chain.
- **Uses adaptive scroll scheduling**, generally ~450 ms while the tab is visible and ~900 ms while hidden. It scans before every scroll step to reduce skipped messages.
- **Waits for older messages to load** at the top, retries carefully when Discord stalls, and stops with a visible **Capture stalled** status if the page cannot make progress after several retries. This is *not* proof that every message was captured.
- **Batches browser-storage saves to about every 8 seconds** instead of rewriting the growing archive every 1.6 seconds. Pause and ordinary exports remain available. Captured records remain stored under the same v2 local-storage keys.

**To update:** install the current `extension/` folder over the old version (use **Reload** on the existing extension where possible), refresh the Discord DM, and select **Retry capture** or **Start auto capture**. Existing local captures are retained when you reload the same installed extension. **Removing the extension may delete its browser-local data, so export a JSON backup before uninstalling.**

**Limit:** A browser extension cannot make Discord's servers send history faster. Aggressive scrolling risks skipped messages; adaptive waits favor reliability over guaranteed speed. This version has passed syntax validation but not live Discord regression testing.

## v2.3: Optional blocked-message reveal

When messages from a blocked user appear as collapsed **“1 blocked message — Show”** or **“2 blocked messages — Show”** rows, the extension can now click the visible **Show** controls while capturing the current DM. It pauses briefly to let Discord render the revealed text before scrolling upward. **Automatically show blocked messages** is enabled by default in the extension popup; uncheck it to leave blocked messages collapsed. This feature **does not unblock the user**, change Discord account settings, or access hidden messages that Discord does not expose. It only automates clicking Show buttons in the open DM. The relevant messages' timestamps and dates are recorded whenever Discord exposes a timestamp, with message-ID-derived fallback.

**Compatibility:** Discord's DOM can change and blocked-message reveal hasn't been tested on a live blocked conversation; check the capture count and exported JSON. Export JSON before updating, and use **Reload** on the existing extension rather than uninstalling it to preserve saved chat history.

## v2.4: Blocked message reveal fix

Discord may render the entire `1 blocked message — Show` banner as a single clickable element, rather than a separate Show button. v2.4 detects full banners and nested Show controls. **Reveal visible blocked messages now** in the popup lets you test detection while viewing an affected DM. It reports how many controls were found or clicked. Auto capture also tries to reveal them before moving further up the page. This does not unblock users or recover deleted content. Live Discord support remains unverified; you may still need to click Show manually if Discord's structure differs.

Before updating, export a JSON backup and **Reload** the existing extension rather than uninstalling it.

## v2.5: Two-pass archive verification (200-message batches)

**Problem:** 12,000 messages in a 4 MB file is not evidence that the full conversation was captured. Discord Web may not load older messages, may skip rows during virtualization, or may leave blocked groups collapsed.

**How to use:**

1. Save your existing **JSON** export as a backup. Do not remove the installed extension or clear its storage.
2. Capture the DM normally. If capture stalls, do **not** assume the history is complete.
3. Click **Verify archive (second pass)** in the popup. The extension snapshots the currently archived message IDs and goes toward older messages, then back toward newer ones while re-reading the visible rows. It attempts to expand blocked-message groups if that setting is enabled.
4. The audit compares the second-pass observations with the original set in **batches of 200 message IDs**. Newly observed messages are merged into the archive. The process can be interrupted with **Pause**; that produces an incomplete-pass result.
5. Click **Report JSON** to download a verification report. Check the verdict, per-batch `rechecked` and `notRechecked` counts, `unrecheckedIdsSample`, `newlyRecovered`, `unknownAuthors`, `emptyPayload`, and whether the apparent top and bottom of history were reached.
6. Export updated **HTML / JSON / ZIP** after the verification pass to include recovered messages.

**What is verified:** existing captured IDs seen again, field inconsistencies, newly recovered messages, empty payloads, unknown authors, and per-batch coverage. The report distinguishes `incomplete-pass`, `needs-review` and `observed-records-rechecked`.

**What cannot be proved:** whether Discord delivered every server-side message, whether inaccessible/deleted messages existed, or whether a numerical gap between Snowflake IDs implies a missing message. A completed verification certifies only the *observed* records and is not evidence of a perfectly complete chat export. Some old IDs may not be reobserved due to Discord load stalls; review those batches. A media link being present does not guarantee its file remains downloadable. The two-pass mode uses the normal visible conversation and does not access the Discord API, tokens or cookies.

**Compatibility:** static JavaScript tests are run, but live Discord Web history traversal remains unverified. Browser tab must remain open; Discord may throttle rendering. After upgrading, replace the existing extension files and click **Reload**. Do not uninstall if you want to retain browser-local message storage.

## v2.6: Author attribution protection

**Why this change matters:** Older builds could attach the preceding user's name to a different speaker's message when Discord virtualized/reordered the list. A username inside a reply preview could also be mistaken for the actual message author.

**Changes:**

- The exporter first seeks the **username header whose DOM ID matches the message ID**. Reply/embed headers are excluded.
- Compact grouped messages inherit a speaker only when the rendered rows are directly adjacent siblings, the previous attribution is trusted, the current row does not start a new group, and their message-ID-derived timestamps are within seven minutes and in order. Otherwise, the author is **unknown** rather than guessed.
- Stored messages from v2.5 and older with old header/visible-context attribution are **migrated to `unverified-legacy`**. The old name is saved separately in `legacyAuthor` for your inspection but is **not displayed as the verified author**. Text, message IDs, timestamps and media are kept. Re-scan or verify the affected DM to recover reliable author labels.
- JSON verification now reports unknown/unverified author counts and marks the result as `needs-review` when author attribution is incomplete. HTML displays **Unknown sender (unverified)** for uncertain messages.

**Recommended update:** First export your existing archive as JSON and keep it secure. Replace files in your existing extension folder, click Reload in `chrome://extensions`, refresh Discord, then run a new capture or verification. Do **not** uninstall the extension or clear local storage. This cannot automatically fix every incorrectly attributed message in the older export without reobserving Discord's message rows. Always spot-check the resulting messages against Discord Web.

## v2.7: Discord-style exported HTML redesign

The generated HTML now more closely resembles Discord Desktop DM chat: a dark navigation rail, a real-looking DM sidebar with the archived conversation selected, a conversation header, avatar/name/timestamp message rows, compact adjacent messages with timestamps on hover, date dividers, inline media, and a noninteractive read-only composer at the bottom. Archive counts and limitations are tucked under **Archive info** in the header rather than in a large strip above the chat.

**Existing captures are preserved:** this is only an HTML renderer and popup version change. Replace the source in your **already installed** extension, click Reload on its card at `chrome://extensions`, refresh the Discord DM tab, and export **HTML** or **HTML + offline media ZIP** again. Previous HTML files do not update in place. Keep a JSON backup before changing the extension. Do not uninstall the old extension if you want to preserve browser-local history.

**Limits:** This is an unofficial read-only recreation of Discord's chat appearance, not a functioning Discord app. Message contents, reactions, replies and attachments are limited to the information the capture engine actually recorded. Missing or unverified authors will remain labelled as such rather than inventing a sender. The HTML structure and exported sample underwent local syntax/smoke tests; this version was not tested against a live Discord conversation. Do not share private conversation archives publicly without permission.
