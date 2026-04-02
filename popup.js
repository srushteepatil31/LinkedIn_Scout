document.addEventListener('DOMContentLoaded', function () {

  var globalData = [];
  var currentCategory = 'All';

  var cardsContainer = document.getElementById('cards-container');
  var tabsContainer  = document.getElementById('tabs-container');
  var exportBtn      = document.getElementById('export-btn');
  var clearBtn       = document.getElementById('clear-btn');

  /* Bootstrap*/
  loadData();

  exportBtn.addEventListener('click', exportCSV);
  clearBtn.addEventListener('click', clearAll);

  /* Load from storage */
  function loadData() {
    chrome.storage.local.get(['linkedin_crm_data'], function (result) {
      globalData = result.linkedin_crm_data || [];
      renderTabs();
      renderCards();
    });
  }

  /* Tabs  */
  function renderTabs() {
    tabsContainer.innerHTML = '';
    var categories = ['All'].concat(
      Array.from(new Set(globalData.map(function (i) { return i.category; }).filter(Boolean)))
    );

    categories.forEach(function (cat) {
      var count = cat === 'All'
        ? globalData.length
        : globalData.filter(function (i) { return i.category === cat; }).length;

      var btn = document.createElement('button');
      btn.className = 'tab-btn' + (cat === currentCategory ? ' active' : '');
      btn.textContent = cat + ' (' + count + ')';
      btn.addEventListener('click', function () {
        currentCategory = cat;
        renderTabs();
        renderCards();
      });
      tabsContainer.appendChild(btn);
    });
  }

  /* Cards */
  function renderCards() {
    cardsContainer.innerHTML = '';

    var filtered = currentCategory === 'All'
      ? globalData
      : globalData.filter(function (i) { return i.category === currentCategory; });

    if (filtered.length === 0) {
      cardsContainer.innerHTML =
        '<div class="empty-state">' +
        '  <span class="empty-state-icon">🪣</span>' +
        '  <p>No saved entries yet.</p>' +
        '  <p>Visit a LinkedIn profile and click<br><strong>⭐ Save Details</strong> on any entry.</p>' +
        '</div>';
      return;
    }

    filtered.forEach(function (item) {
      var card = buildCard(item);
      cardsContainer.appendChild(card);
    });
  }

  /*  Build a single card */
  function buildCard(item) {
    var card = document.createElement('div');
    card.className = 'crm-card';
    card.dataset.id = item.id;

    //  Header row 
    var headerDiv = document.createElement('div');
    headerDiv.className = 'card-header';

    var leftDiv = document.createElement('div');
    leftDiv.className = 'card-header-left';

    var nameEl = document.createElement('p');
    nameEl.className = 'card-profile-name';
    nameEl.title = item.profileName || 'Unknown';
    nameEl.textContent = item.profileName || 'Unknown';

    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = item.category || 'General';

    leftDiv.appendChild(nameEl);
    leftDiv.appendChild(badge);

    var delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.title = 'Remove this entry';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', function () {
      deleteItem(item.id);
    });

    headerDiv.appendChild(leftDiv);
    headerDiv.appendChild(delBtn);

    //  Details list 
    var ul = document.createElement('ul');
    ul.className = 'card-details';
    var detailsArr = Array.isArray(item.details) ? item.details : [item.details || ''];
    detailsArr.forEach(function (d) {
      if (!d || !d.trim()) return;
      var li = document.createElement('li');
      li.textContent = d;
      ul.appendChild(li);
    });

    //  Profile URL link 
    var urlRow = '';
    if (item.profileUrl) {
      var link = document.createElement('a');
      link.href = item.profileUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'card-profile-link';
      link.textContent = '🔗 View Profile';
    }

    // Notes area 
    var noteArea = document.createElement('textarea');
    noteArea.className = 'note-input';
    noteArea.placeholder = 'Add a personal note…';
    noteArea.rows = 2;
    noteArea.value = item.notes || '';

    var noteFooter = document.createElement('div');
    noteFooter.className = 'note-footer';

    var saveNoteBtn = document.createElement('button');
    saveNoteBtn.className = 'save-note-btn';
    saveNoteBtn.textContent = '💾 Save Note';
    saveNoteBtn.addEventListener('click', function () {
      saveNote(item.id, noteArea.value.trim(), saveNoteBtn);
    });

    noteFooter.appendChild(saveNoteBtn);

    //  Timestamp
    var ts = document.createElement('div');
    ts.className = 'card-timestamp';
    ts.textContent = item.timestamp
      ? 'Saved: ' + new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    //  Assemble 
    card.appendChild(headerDiv);
    card.appendChild(ul);
    if (item.profileUrl) card.appendChild(link);
    card.appendChild(noteArea);
    card.appendChild(noteFooter);
    card.appendChild(ts);

    return card;
  }

  /* ─Delete one item  */
  function deleteItem(id) {
    globalData = globalData.filter(function (i) { return i.id !== id; });
    chrome.storage.local.set({ linkedin_crm_data: globalData }, function () {
      renderTabs();
      renderCards();
    });
  }

  /*  Save note on a card  */
  function saveNote(id, noteText, btn) {
    var item = globalData.find(function (i) { return i.id === id; });
    if (!item) return;
    item.notes = noteText;
    chrome.storage.local.set({ linkedin_crm_data: globalData }, function () {
      var original = btn.textContent;
      btn.textContent = '✅ Saved!';
      setTimeout(function () { btn.textContent = original; }, 1500);
    });
  }

  /*Clear all (with confirmation) */
  function clearAll() {
    if (!confirm('⚠️ Delete ALL saved entries? This cannot be undone.')) return;
    globalData = [];
    chrome.storage.local.set({ linkedin_crm_data: [] }, function () {
      currentCategory = 'All';
      renderTabs();
      renderCards();
    });
  }

  /*  Export CSV */
  function exportCSV() {
    if (globalData.length === 0) {
      alert('No data to export yet.');
      return;
    }

    var rows = [['Profile Name', 'Category', 'Details', 'Notes', 'Profile URL', 'Saved At']];

    globalData.forEach(function (item) {
      var detailsStr = Array.isArray(item.details)
        ? item.details.join(' | ')
        : (item.details || '');

      rows.push([
        escapeCsv(item.profileName || ''),
        escapeCsv(item.category || ''),
        escapeCsv(detailsStr),
        escapeCsv(item.notes || ''),
        escapeCsv(item.profileUrl || ''),
        escapeCsv(item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : '')
      ]);
    });

    var csvContent = rows.map(function (row) { return row.join(','); }).join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'linkedin_bucket_saver_' + Date.now() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeCsv(val) {
    var str = String(val).replace(/"/g, '""');
    return '"' + str + '"';
  }

});
