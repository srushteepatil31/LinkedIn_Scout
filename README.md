# 🪣 LinkedIn Scout: My Personal Web Scraper & CRM

Hey! 👋 Welcome to LinkedIn Scout. 

I built this Chrome extension because I was spending way too much time manually copy-pasting data from LinkedIn while putting together research decks for consulting case comps and analyzing startup founders. 

Native LinkedIn tools are great, but they are rigid. I wanted a "sniper" tool that would let me grab just one specific certification or job experience, attach a quick personal note to it (like *"Great background for the Fintech case"*), and instantly export it all to a spreadsheet. So, I built one!

---

## 📸 See it in Action

Here are details extracted from my own LinkedIn profile:
<img width="474" height="748" alt="image" src="https://github.com/user-attachments/assets/c82a1c4e-35cf-4143-b7af-101f36b86343" />

---

## 🛠️ What it actually does

Instead of a bulky dashboard, this extension injects tiny blue **"⭐ Save Details"** buttons directly into the LinkedIn UI as you scroll through someone's profile. 

* **Sniper Extraction:** Click the button to save exactly what you want (Experience, Certs, Projects) without grabbing the whole page.
* **Smart Memory:** It remembers what you've saved. If you revisit a profile, the button turns into a green `✅ Saved!` to stop you from making duplicates.
* **Auto-Tagging:** It automatically figures out if you are saving a "Skill" vs an "Experience" and categorizes it for you.
* **Mini-Notes:** Inside the extension popup, you can add quick context/comments to anything you've saved.
* **One-Click Export:** Hit the Export button, and boom—your entire bucket downloads as a clean CSV file, ready for Excel or Google Sheets.

## 💻 How I Built It

I wanted to keep this incredibly lightweight, so I skipped the heavy frameworks and built it entirely with Vanilla web tech:
* **Frontend:** HTML/CSS and Vanilla JS.
* **Background Magic:** Chrome's `content.js` to read and modify the live LinkedIn webpage, and `popup.js` to handle the UI.
* **Database:** I used the `chrome.storage.local` API so the data saves directly to the browser (meaning it's fast and 100% private).
