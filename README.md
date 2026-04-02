LinkedIn Bucket Saver
A Chrome extension I built because I was tired of losing track of people I found on LinkedIn. No third-party CRM, no subscriptions, no data leaving your browser just a simple save button on every profile section that stores everything locally.

What it does
Injects a ⭐ Save Details button on Experience, Education, Certification, and other section entries on any LinkedIn profile. Click it, the entry gets saved. Open the extension popup to see everything you've collected, filter by category, add notes, and export to CSV whenever you want.

That's it. No signup. No backend. No funny business.

Features
Save any profile entry: works on Experience, Education, Certifications, Volunteering, Projects, and more

Works on "Show all" pages too: the /details/experience/ pages LinkedIn hides most entries behind

Popup CRM: filter saved entries by category (tabs auto-generate based on what you've saved)

Notes on every card: add personal context to any entry, saved instantly

No duplicates: already-saved entries show a green ✅ Saved! button instead

Export CSV: one click downloads everything: name, category, details, notes, profile URL, timestamp

Individual delete: remove any single entry without wiping everything

SPA-aware: LinkedIn is a single page app and navigates without full page reloads. The extension handles this correctly with a URL watcher + MutationObserver combo

Survives LinkedIn DOM changes: all selectors live in a single CONFIG object at the top of content.js. If LinkedIn changes their class names, you update one place

Installation
There's no Chrome Web Store listing. Load it manually, takes about 30 seconds.

Download or clone this repo

Open Chrome and go to chrome://extensions

Toggle on Developer Mode (top right)

Click Load unpacked

Select the project folder

You'll see the 🪣 icon appear in your toolbar. Navigate to any LinkedIn profile and scroll to Experience or Education — the Save Details buttons will appear on each entry.

File structure
text
linkedin-bucket-saver/
├── manifest.json      # MV3 manifest, permissions, content script declaration
├── content.js         # Injected into LinkedIn — finds entries, injects buttons, saves data
├── content.css        # Styles for the injected buttons (also has inline fallbacks)
├── popup.html         # Extension popup shell
├── popup.js           # Popup logic — tabs, cards, delete, notes, CSV export
└── styles.css         # Popup styles
How the detection works
LinkedIn is a pain to build on. Their class names change constantly, they use React so the DOM rebuilds on navigation, and profile entries aren't even <li> elements anymore — they use custom div structures.

The approach here:

On the main profile page, the script scopes itself strictly to <section> elements that have a recognizable heading (Experience, Education, etc). This prevents it from touching the profile header or sidebar and breaking LinkedIn's layout.

On detail pages (/in/username/details/experience/), the category is read directly from the URL so the whole page can be scanned.

Entry detection uses content signals (year patterns, "Present", "mos", "yr") rather than specific class names — so it keeps working even after LinkedIn's UI updates.

The leaf container check ensures the button attaches to the most specific element per entry, not a wrapper that contains 10 entries at once.

Updating selectors if LinkedIn breaks things
Open content.js. At the top you'll find the LBS config object. The categoryMap array controls what section headings map to what category names. The dateSignal and eduSignal regexes control which elements get treated as valid entries. These are the only things you'd ever need to touch.

Data & privacy
Everything is stored in chrome.storage.local, your browser, your machine, your data. The extension has no network permissions, makes no external requests, and can't access any site other than linkedin.com/in/*.

Export your data regularly using the CSV button if you care about keeping it long-term. Clearing Chrome's extension storage or uninstalling will delete everything.

Known limitations
Only runs on profile pages (linkedin.com/in/*) not the feed, search results, or company pages

LinkedIn's "Show all" modal popups (the ones that open as overlays rather than new pages) aren't supported — only the full detail pages work

If LinkedIn does a major structural overhaul, buttons may stop appearing. Check the browser console for 🪣 v11 DONE injected: 0 as a quick diagnostic

Built with
Vanilla JS, no frameworks, no build step. Just five files you can read start to finish in 20 minutes.
