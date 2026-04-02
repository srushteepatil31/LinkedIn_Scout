/**
 * LinkedIn Bucket Saver — content.js v11 FINAL
 *
 * Features:
 * - Main profile page: scoped to recognized <section> tags only (no layout breaking)
 * - "Show all" detail pages (/details/experience/ etc): full page scan, category from URL
 * - Extension context invalidation handled gracefully
 * - Zero el.style mutations — buttons are fully self-contained
 */

console.log('🪣 LBS v11 FINAL loaded on', location.href);

const LBS = {
  storageKey: 'linkedin_crm_data',
  profilePattern: /linkedin\.com\/in\//,
  detailPagePattern: /linkedin\.com\/in\/[^/]+\/details\//,
  dateSignal: /\d{4}|present|\bmos\b|\byr\b/i,
  eduSignal: /\b(school|college|university|institute|bachelor|master|b\.e\b|b\.tech|diploma|secondary)/i,
  minLen: 20,
  minLines: 2,
  maxLines: 11,
  skipTags: {
    SCRIPT:1, STYLE:1, SVG:1, IMG:1, INPUT:1,
    BUTTON:1, A:1, SPAN:1, P:1,
    H1:1, H2:1, H3:1, H4:1, H5:1, H6:1
  },
  categoryMap: [
    { key: 'Experience',     terms: ['experience'] },
    { key: 'Education',      terms: ['education'] },
    { key: 'Projects',       terms: ['project'] },
    { key: 'Certifications', terms: ['certification', 'license', 'licence', 'credential'] },
    { key: 'Volunteering',   terms: ['volunteer'] },
    { key: 'Skills',         terms: ['skills'] },
    { key: 'Awards',         terms: ['honor', 'honour', 'award'] },
    { key: 'Publications',   terms: ['publication', 'patent'] },
  ]
};

/* ── SPA Watcher ── */
let _lastUrl = location.href, _timer = null;
function _schedule(ms) { clearTimeout(_timer); _timer = setTimeout(runInjection, ms); }

setInterval(function() {
  try {
    if (location.href !== _lastUrl) { _lastUrl = location.href; _schedule(1200); }
  } catch(e) {}
}, 800);

try {
  new MutationObserver(function() { _schedule(700); })
    .observe(document.body, { childList: true, subtree: true });
} catch(e) {}

setTimeout(function() { runInjection(); }, 1500);
setTimeout(function() { runInjection(); }, 3500);
setTimeout(function() { runInjection(); }, 6000);
setTimeout(function() { runInjection(); }, 10000);

/* ── Main ── */
function runInjection() {
  if (!LBS.profilePattern.test(location.href)) return;
  try {
    chrome.storage.local.get([LBS.storageKey], function(res) {
      if (chrome.runtime.lastError) return;
      var savedIds = new Set((res[LBS.storageKey] || []).map(function(i) { return i.id; }));
      findAndInject(savedIds);
    });
  } catch(e) {
    console.log('🪣 LBS: Extension context lost, ignoring.');
  }
}

/* ── Core scanner ── */
function findAndInject(savedIds) {
  var injected = 0;

  // ── DETAIL PAGE: /in/username/details/experience/ etc ──
  // Whole page is one category — read category from URL, scan entire main
  if (LBS.detailPagePattern.test(location.href)) {
    var urlCategory = getCategoryFromUrl();
    var root = document.querySelector('main') || document.body;

    Array.from(root.querySelectorAll('*')).forEach(function(el) {
      if (el.dataset.lbsInjected) return;
      if (LBS.skipTags[el.tagName]) return;
      if (el.closest('[data-lbs-injected]')) return;

      var text = '';
      try { text = el.innerText || ''; } catch(e) {}
      if (!text) try { text = el.textContent || ''; } catch(e) {}
      text = text.trim();

      if (text.length < LBS.minLen) return;
      var lines = text.split('\n').filter(function(l) { return l.trim().length > 0; });
      if (lines.length < LBS.minLines) return;
      if (lines.length > LBS.maxLines) return;
      if (!LBS.dateSignal.test(text) && !LBS.eduSignal.test(text)) return;

      // Leaf check
      var kids = el.children;
      for (var i = 0; i < kids.length; i++) {
        var ct = '';
        try { ct = kids[i].innerText || kids[i].textContent || ''; } catch(e) {}
        ct = ct.trim();
        var cl = ct.split('\n').filter(function(l) { return l.trim().length > 0; }).length;
        if (cl >= 3 && LBS.dateSignal.test(ct)) return;
      }

      var id = makeId(text.slice(0, 120));
      el.dataset.lbsInjected = 'true';
      injectBtn(el, id, urlCategory, savedIds.has(id));
      injected++;
      console.log('🪣 ✅ [detail]', urlCategory, '|', lines[0]);
    });

    console.log('🪣 v11 detail DONE — injected:', injected);
    return;
  }

  // ── MAIN PROFILE PAGE: scan only inside recognized <section> tags ──
  var sections = document.querySelectorAll('section');

  sections.forEach(function(section) {
    var category = getSectionCategory(section);
    if (!category) return; // Not Experience/Education/etc — skip entirely

    Array.from(section.querySelectorAll('*')).forEach(function(el) {
      if (el.dataset.lbsInjected) return;
      if (LBS.skipTags[el.tagName]) return;
      if (el.closest('[data-lbs-injected]')) return;

      var text = '';
      try { text = el.innerText || ''; } catch(e) {}
      if (!text) try { text = el.textContent || ''; } catch(e) {}
      text = text.trim();

      if (text.length < LBS.minLen) return;
      var lines = text.split('\n').filter(function(l) { return l.trim().length > 0; });
      if (lines.length < LBS.minLines) return;
      if (lines.length > LBS.maxLines) return;
      if (!LBS.dateSignal.test(text) && !LBS.eduSignal.test(text)) return;

      // Leaf check: skip if a direct child has 3+ lines + date signal
      var kids = el.children;
      for (var i = 0; i < kids.length; i++) {
        var ct = '';
        try { ct = kids[i].innerText || kids[i].textContent || ''; } catch(e) {}
        ct = ct.trim();
        var cl = ct.split('\n').filter(function(l) { return l.trim().length > 0; }).length;
        if (cl >= 3 && LBS.dateSignal.test(ct)) return;
      }

      var id = makeId(text.slice(0, 120));
      el.dataset.lbsInjected = 'true';
      injectBtn(el, id, category, savedIds.has(id));
      injected++;
      console.log('🪣 ✅', category, '|', lines[0]);
    });
  });

  console.log('🪣 v11 DONE — injected:', injected);
}

/* ── Detect category from /details/experience/ URL ── */
function getCategoryFromUrl() {
  var path = location.pathname.toLowerCase();
  var m = path.match(/\/details\/([^/]+)/);
  if (!m) return 'General';
  var slug = m[1];
  if (slug.includes('experience'))                              return 'Experience';
  if (slug.includes('education'))                               return 'Education';
  if (slug.includes('certification') || slug.includes('license')) return 'Certifications';
  if (slug.includes('volunteer'))                               return 'Volunteering';
  if (slug.includes('project'))                                 return 'Projects';
  if (slug.includes('skill'))                                   return 'Skills';
  if (slug.includes('honor') || slug.includes('award'))        return 'Awards';
  if (slug.includes('publication') || slug.includes('patent')) return 'Publications';
  return 'General';
}

/* ── Detect category from a <section>'s headings ── */
function getSectionCategory(section) {
  var attr = [section.id || '', section.getAttribute('aria-label') || ''].join(' ').toLowerCase();
  for (var i = 0; i < LBS.categoryMap.length; i++) {
    if (LBS.categoryMap[i].terms.some(function(t) { return attr.includes(t); }))
      return LBS.categoryMap[i].key;
  }
  var heads = section.querySelectorAll('h2, h3, span[aria-hidden="true"]');
  for (var h = 0; h < heads.length; h++) {
    var ht = (heads[h].innerText || heads[h].textContent || '').toLowerCase().trim();
    if (!ht || ht.length > 60) continue;
    for (var j = 0; j < LBS.categoryMap.length; j++) {
      if (LBS.categoryMap[j].terms.some(function(t) { return ht === t || ht.startsWith(t); }))
        return LBS.categoryMap[j].key;
    }
  }
  return null;
}

/* ── Profile name — 5 fallback strategies ── */
function getProfileName() {
  var selectors = ['main h1', '.pv-text-details__left-panel h1', '.ph5 h1', 'section h1', 'h1'];
  for (var i = 0; i < selectors.length; i++) {
    var els = document.querySelectorAll(selectors[i]);
    for (var j = 0; j < els.length; j++) {
      var t = (els[j].innerText || els[j].textContent || '').trim();
      if (t.length >= 4 && t.length <= 60 && t.split(' ').length >= 2 && !t.includes('\n')) return t;
    }
  }
  var title = document.title || '';
  if (title.includes('|')) { var c = title.split('|')[0].trim(); if (c.length > 3) return c; }
  return 'Unknown';
}

/* ── Button — zero parent style mutations, fully self-contained ── */
function injectBtn(el, id, category, isSaved) {
  var wrap = document.createElement('div');
  wrap.setAttribute('style',
    'display:flex!important;justify-content:flex-end!important;' +
    'padding:8px 2px 2px 0!important;width:100%!important;' +
    'margin-top:6px!important;z-index:99999!important;'
  );
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = isSaved ? '✅ Saved!' : '⭐ Save Details';
  btn.disabled = isSaved;
  btn.setAttribute('style',
    'display:inline-flex!important;align-items:center!important;gap:5px!important;' +
    'background:' + (isSaved ? '#057642' : '#0a66c2') + '!important;' +
    'color:#fff!important;border:none!important;padding:6px 16px!important;' +
    'border-radius:16px!important;font-size:12px!important;font-weight:600!important;' +
    'cursor:' + (isSaved ? 'default' : 'pointer') + '!important;' +
    'box-shadow:0 2px 6px rgba(0,0,0,.28)!important;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;' +
    'white-space:nowrap!important;line-height:1.5!important;' +
    'z-index:99999!important;-webkit-appearance:none!important;'
  );
  if (!isSaved) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      doSave(el, id, category, btn);
    });
  }
  wrap.appendChild(btn);
  el.appendChild(wrap);
}

/* ── Save to storage ── */
function doSave(el, id, category, btn) {
  btn.textContent = '⏳'; btn.disabled = true;
  var name = getProfileName();

  var spans = Array.from(el.querySelectorAll('span')).filter(function(s) {
    if (s.closest('[data-lbs-injected]') !== el) return false;
    var t = (s.innerText || s.textContent || '').trim();
    return t.length > 1 && s.children.length === 0;
  });
  var details = Array.from(new Set(
    spans.map(function(s) { return (s.innerText || s.textContent || '').trim(); })
  )).filter(function(t) { return t.length > 1; }).slice(0, 6);

  if (!details.length) {
    details = (el.innerText || el.textContent || '').trim()
      .split('\n').map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 1; }).slice(0, 5);
  }

  try {
    chrome.storage.local.get([LBS.storageKey], function(res) {
      if (chrome.runtime.lastError) return;
      var data = res[LBS.storageKey] || [];
      if (data.some(function(i) { return i.id === id; })) { markDone(btn); return; }
      data.push({
        id: id, profileName: name, category: category, details: details,
        notes: '', timestamp: new Date().toISOString(),
        profileUrl: location.href.split('?')[0]
      });
      chrome.storage.local.set({ [LBS.storageKey]: data }, function() {
        markDone(btn);
        console.log('🪣 Saved:', name, '/', category);
      });
    });
  } catch(e) { console.log('🪣 Save failed: context lost'); }
}

function markDone(btn) {
  btn.textContent = '✅ Saved!'; btn.disabled = true;
  btn.style.setProperty('background', '#057642', 'important');
  btn.style.setProperty('cursor', 'default', 'important');
}

function makeId(text) {
  try { return btoa(encodeURIComponent(text)).replace(/[^a-zA-Z0-9]/g,'').slice(0,64); }
  catch(e) { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
}
