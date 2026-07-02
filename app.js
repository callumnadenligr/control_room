/* ============================================================
   LIGR Control Room — Interactions
   ============================================================ */

// ---- AUTO GFX Toggle ----
const autoGfxToggle = document.getElementById('autoGfxToggle');
const autoGfxSwitch = document.getElementById('autoGfxSwitch');

if (autoGfxToggle && autoGfxSwitch) {
  autoGfxToggle.addEventListener('click', () => {
    autoGfxSwitch.classList.toggle('active');
  });
}

// ---- Sidebar Section Collapse/Expand ----
document.querySelectorAll('.sidebar-section__header').forEach(header => {
  const section = header.dataset.section;
  const bodyId = section + 'Body';
  const body = document.getElementById(bodyId);
  const chevron = header.querySelector('.sidebar-section__chevron');

  if (!body) return;

  // Set initial max-height for animation — respect collapsed initial state
  if (body.classList.contains('collapsed')) {
    body.style.maxHeight = '0px';
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
  }

  header.addEventListener('click', () => {
    const isOpen = !body.classList.contains('collapsed');

    if (isOpen) {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        body.style.paddingTop = '0';
        body.style.paddingBottom = '0';
      });
      chevron?.classList.remove('open');
      chevron?.classList.add('closed');
      body.classList.add('collapsed');
    } else {
      body.classList.remove('collapsed');
      body.style.paddingTop = '';
      body.style.paddingBottom = '';
      body.style.opacity = '1';
      body.style.maxHeight = body.scrollHeight + 'px';
      chevron?.classList.remove('closed');
      chevron?.classList.add('open');
    }
  });
});

// ---- Content Type Tabs ----
function switchContentPane(paneId) {
  document.querySelectorAll('.content-pane').forEach(p => {
    p.classList.toggle('content-pane--hidden', p.dataset.pane !== paneId);
  });
}

document.querySelectorAll('.content-type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.content-type-tab').forEach(t => t.classList.remove('content-type-tab--active'));
    tab.classList.add('content-type-tab--active');
    switchContentPane(tab.dataset.tab);
  });
});

// ---- Tab Management System ----
let activeTabId = null;

function getAllTabs() {
  return Array.from(document.querySelectorAll('#tabBar .category-tab:not(.category-tab--add)'));
}

function switchTab(tabId) {
  activeTabId = tabId;

  // Update tab active states
  getAllTabs().forEach(tab => {
    tab.classList.toggle('category-tab--active', tab.dataset.tabId === tabId);
  });

  // Show/hide graphic groups based on tab
  let visibleCount = 0;
  document.querySelectorAll('.graphic-group').forEach(group => {
    const show = group.dataset.tab === tabId;
    group.classList.toggle('graphic-group--hidden', !show);
    if (show) visibleCount++;
  });

  // Show empty state if no groups in this tab
  const emptyState = document.getElementById('graphicsEmptyState');
  if (emptyState) emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
}

function updateTabBadges() {
  getAllTabs().forEach(tab => {
    const tabId = tab.dataset.tabId;
    const liveCount = document.querySelectorAll(`.graphic-group[data-tab="${tabId}"] .group-cards > .graphic-card--on-air`).length;
    let badge = tab.querySelector('.category-tab__badge');
    if (liveCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'category-tab__badge';
        const closeBtn = tab.querySelector('.category-tab__close');
        tab.insertBefore(badge, closeBtn || null);
      }
      const dot = document.createElement('span');
      dot.className = 'category-tab__badge-dot';
      badge.innerHTML = '';
      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(liveCount));
    } else if (badge) {
      badge.remove();
    }
  });
}

function renameTab(tab) {
  if (tab.querySelector('.category-tab__input')) return;
  const labelEl = tab.querySelector('.category-tab__label');
  if (!labelEl) return;
  const currentName = labelEl.textContent.trim();

  const input = document.createElement('input');
  input.className = 'category-tab__input';
  input.value = currentName;
  labelEl.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const newName = input.value.trim() || currentName;
    const newLabel = document.createElement('span');
    newLabel.className = 'category-tab__label';
    newLabel.textContent = newName;
    input.replaceWith(newLabel);
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = currentName; input.blur(); }
  });
  input.addEventListener('click', (e) => e.stopPropagation());
}

const _CLOSE_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M8 2 2 8M2 2l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

function wireTabEvents(tab) {
  tab.addEventListener('click', (e) => {
    if (e.target.closest('.category-tab__close')) return;
    if (tab.querySelector('.category-tab__input')) return;
    switchTab(tab.dataset.tabId);
  });

  tab.addEventListener('dblclick', (e) => {
    if (e.target.closest('.category-tab__close')) return;
    e.preventDefault();
    renameTab(tab);
  });

  const closeBtn = tab.querySelector('.category-tab__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTab(tab.dataset.tabId);
    });
  }
}

function createTab() {
  const newId = `tab-${Date.now()}`;
  const addBtn = document.getElementById('addTabBtn');

  const tab = document.createElement('button');
  tab.className = 'category-tab';
  tab.dataset.tabId = newId;
  tab.innerHTML = `<span class="category-tab__label">New Tab</span><span class="category-tab__close" role="button" tabindex="-1" title="Remove tab">${_CLOSE_SVG}</span>`;

  addBtn.before(tab);
  wireTabEvents(tab);
  switchTab(newId);
  setTimeout(() => renameTab(tab), 30);
}

function deleteTab(tabId) {
  const tabs = getAllTabs();
  if (tabs.length <= 1) return; // protect last tab

  const tab = tabs.find(t => t.dataset.tabId === tabId);
  if (!tab) return;

  const idx = tabs.indexOf(tab);
  const nextTab = tabs[idx + 1] || tabs[idx - 1];
  const nextId = nextTab?.dataset.tabId;

  // Reassign orphaned groups to the adjacent tab
  if (nextId) {
    document.querySelectorAll(`.graphic-group[data-tab="${tabId}"]`).forEach(group => {
      group.dataset.tab = nextId;
    });
  }

  tab.remove();
  if (nextId) switchTab(nextId);
}

// Wire existing tabs on load
getAllTabs().forEach(wireTabEvents);

// Wire + Tab button
document.getElementById('addTabBtn')?.addEventListener('click', createTab);

// ---- Team Tabs (Quick Events) ----
document.querySelectorAll('#teamTabs .team-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#teamTabs .team-tab').forEach(t => t.classList.remove('team-tab--active'));
    tab.classList.add('team-tab--active');
  });
});

// ---- Clock Quick Buttons (period control) ----
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('quick-btn--active'));
    btn.classList.add('quick-btn--active');
    const period = btn.dataset.value;
    const statusLabel = document.querySelector('.scoreboard__status-label');
    if (period === '1st') {
      clockSeconds = 0; stopClock(); updateClockDisplay(); startClock();
      if (statusLabel) statusLabel.textContent = 'Live 1st Half';
    } else if (period === 'HT') {
      stopClock();
      if (statusLabel) statusLabel.textContent = 'Half Time';
    } else if (period === '2nd') {
      clockSeconds = 45 * 60; stopClock(); updateClockDisplay(); startClock();
      if (statusLabel) statusLabel.textContent = 'Live 2nd Half';
    } else if (period === 'FT') {
      stopClock();
      if (statusLabel) statusLabel.textContent = 'Full Time';
    } else if (period === 'ET') {
      clockSeconds = 90 * 60; stopClock(); updateClockDisplay(); startClock();
      if (statusLabel) statusLabel.textContent = 'Extra Time';
    }
  });
});

// ---- Group Collapse/Expand ----
document.querySelectorAll('.group-header__collapse').forEach(btn => {
  const groupId = btn.dataset.group;
  const cards = document.getElementById(groupId + '-cards');
  if (!cards) return;

  let collapsed = false;

  btn.addEventListener('click', () => {
    collapsed = !collapsed;
    if (collapsed) {
      cards.style.maxHeight = cards.scrollHeight + 'px';
      requestAnimationFrame(() => {
        cards.style.transition = 'max-height 0.25s ease, opacity 0.2s ease';
        cards.style.maxHeight = '0px';
        cards.style.opacity = '0';
        cards.style.overflow = 'hidden';
      });
      btn.querySelector('svg path')?.setAttribute('d', 'M4 6l4 4 4-4');
    } else {
      cards.style.maxHeight = '2000px';
      cards.style.opacity = '1';
      cards.style.overflow = 'visible';
      btn.querySelector('svg path')?.setAttribute('d', 'M4 10l4-4 4 4');
    }
  });
});

// ---- Card Helpers ----
function flashCard(card) {
  card.classList.remove('graphic-card--cascade-flash');
  void card.offsetWidth; // force reflow to restart animation
  card.classList.add('graphic-card--cascade-flash');
  setTimeout(() => card.classList.remove('graphic-card--cascade-flash'), 600);
}

// ---- Header buttons: Live badge, Clear All, To Air (when previewing) ----
let _previewCardId = null;

function updateHeaderToAirButton() { updateHeaderButtons(); }

function updateHeaderButtons() {
  const liveCount = document.querySelectorAll('.graphic-card--on-air').length;
  const liveBadge = document.querySelector('.match-header__actions .badge--live');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const headerToAirBtn = document.getElementById('headerToAirBtn');

  // Live badge + Clear All only when cards are on-air
  if (liveBadge) {
    liveBadge.style.display = liveCount > 0 ? '' : 'none';
    const dot = liveBadge.querySelector('.badge__dot');
    const textNode = dot ? dot.nextSibling : liveBadge.lastChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = liveCount === 1 ? '1 Live' : `${liveCount} Live`;
    } else {
      liveBadge.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = `${liveCount} Live`; });
    }
  }
  if (clearAllBtn) clearAllBtn.style.display = liveCount > 0 ? '' : 'none';

  // To Air in header when a card is being previewed (and not yet on-air)
  const previewCard = _previewCardId ? document.querySelector(`[data-card-id="${_previewCardId}"]`) : null;
  const isActivePreviewing = previewCard && !previewCard.classList.contains('graphic-card--on-air');
  if (headerToAirBtn) headerToAirBtn.style.display = isActivePreviewing ? '' : 'none';
}

// Header To Air click: send the previewed card to air
document.getElementById('headerToAirBtn')?.addEventListener('click', () => {
  if (!_previewCardId) return;
  const card = document.querySelector(`[data-card-id="${_previewCardId}"]`);
  if (card) { setCardState(card, 'on-air'); flashCard(card); }
  _previewCardId = null;
  updateHeaderButtons();
});

function updateGroupBadges() {
  document.querySelectorAll('.graphic-group').forEach(group => {
    const liveCards = group.querySelectorAll('.group-cards > .graphic-card--on-air');
    const liveCount = liveCards.length;
    const header = group.querySelector('.group-header');
    if (!header) return;
    let badge = header.querySelector('.group-header__live-badge');
    if (liveCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'group-header__live-badge';
        const menu = header.querySelector('.group-header__menu');
        header.insertBefore(badge, menu || null);
      }
      badge.textContent = liveCount === 1 ? '1 Live' : `${liveCount} Live`;
    } else {
      badge?.remove();
    }
  });
  updateTabBadges();
}

// ---- Card State Management ----
const _SVG_EDIT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.876 18.116c.046-.414.069-.62.131-.814a2 2 0 0 1 .234-.485c.111-.17.259-.317.553-.61L17 3a2.828 2.828 0 1 1 4 4L7.794 20.206c-.294.294-.442.442-.611.553a2 2 0 0 1-.485.233c-.193.063-.4.086-.814.132L2.5 21.5l.376-3.384Z"/></svg>`;
const _SVG_PREVIEW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`;
const _SVG_TO_AIR = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.243 7.757a6 6 0 0 1 0 8.486m-8.486 0a6 6 0 0 1 0-8.486M4.93 19.071c-3.905-3.905-3.905-10.237 0-14.142m14.142 0c3.905 3.905 3.905 10.237 0 14.142M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>`;
const _SVG_OFF_AIR = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

function setCardState(card, state) {
  const oldEditBtn = card.querySelector('.btn-icon--edit');
  const cardId = oldEditBtn?.dataset.card || card.dataset.cardId || '';
  const cardName = oldEditBtn?.dataset.name || '';
  const cardVars = oldEditBtn?.dataset.vars || '2';
  const isActive = oldEditBtn?.classList.contains('btn-icon--active') || false;

  const cardType = oldEditBtn?.dataset.cardType || '';
  const editHtml = `<button class="btn-icon btn-icon--edit${isActive ? ' btn-icon--active' : ''}" data-card="${cardId}" data-name="${cardName}" data-vars="${cardVars}"${cardType ? ` data-card-type="${cardType}"` : ''} title="Edit">${_SVG_EDIT}</button>`;

  let actionsHtml;
  if (state === 'on-air') {
    actionsHtml = `${editHtml}<button class="btn btn--off-air">${_SVG_OFF_AIR} Off Air</button>`;
    if (isActive && typeof closePanel === 'function') closePanel();
  } else {
    actionsHtml = `${editHtml}<button class="btn btn--secondary btn--md btn--preview">${_SVG_PREVIEW} Preview</button><button class="btn btn--to-air-outline">${_SVG_TO_AIR} To Air</button>`;
  }

  const actionsEl = card.querySelector('.graphic-card__actions');
  if (actionsEl) actionsEl.innerHTML = actionsHtml;

  card.classList.remove('graphic-card--default', 'graphic-card--on-air', 'graphic-card--preview-state', 'graphic-card--queued');
  if (state === 'on-air') card.classList.add('graphic-card--on-air');
  else card.classList.add('graphic-card--default');

  // Remove any stale state badges
  const titleRow = card.querySelector('.graphic-card__title-row');
  if (titleRow) {
    titleRow.querySelectorAll('.badge--queued, .badge--preview-state').forEach(b => b.remove());
  }

  updateGroupBadges();
  updatePanelButtons();
  updateHeaderToAirButton();
}

// Card state delegation: preview sends to preview URL, To Air → on-air
document.addEventListener('click', (e) => {
  const previewBtn = e.target.closest('.btn--preview');
  if (previewBtn) {
    const card = previewBtn.closest('.graphic-card__extension, .graphic-card');
    if (!card || card.classList.contains('graphic-card--on-air')) return;
    // Toggle: second click cancels preview
    if (card.classList.contains('graphic-card--preview-state')) {
      card.classList.remove('graphic-card--preview-state');
      _previewCardId = null;
      updateHeaderButtons();
      updatePanelButtons();
      return;
    }
    const cardId = card.dataset.cardId;
    const cardName = card.querySelector('.graphic-card__name')?.textContent || 'Graphic';
    document.querySelectorAll('.graphic-card--preview-state').forEach(c => c.classList.remove('graphic-card--preview-state'));
    card.classList.add('graphic-card--preview-state');
    _previewCardId = cardId;
    writeLigrPreview(cardId, cardName);
    flashCard(card);
    updateHeaderButtons();
    updatePanelButtons();
    return;
  }

  const toAirBtn = e.target.closest('.btn--to-air-outline');
  if (toAirBtn) {
    // Only handle card-level To Air buttons (not panel/modal — those have their own handlers)
    const card = toAirBtn.closest('.graphic-card__extension, .graphic-card');
    if (!card) return;
    // Extensions can only go live if their parent card is already on-air
    if (card.classList.contains('graphic-card__extension')) {
      const parentCard = card.closest('.graphic-card:not(.graphic-card__extension)');
      if (!parentCard?.classList.contains('graphic-card--on-air')) return;
    }
    if (_previewCardId === card.dataset.cardId) _previewCardId = null;
    setCardState(card, 'on-air');
    flashCard(card);
    return;
  }

});

// ---- Off Air hold-to-confirm (0.5s) ----
// Handled via mousedown/up so the hold fill animation can show before action fires
let _offAirTimer = null;
let _offAirBtn = null;

document.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('.btn--off-air');
  if (!btn) return;
  _offAirBtn = btn;
  btn.classList.add('holding');
  _offAirTimer = setTimeout(() => {
    const card = btn.closest('.graphic-card__extension, .graphic-card');
    if (card) setCardState(card, 'default');
    btn.classList.remove('holding');
    _offAirBtn = null;
    _offAirTimer = null;
  }, 500);
});

document.addEventListener('mouseup', () => {
  if (_offAirBtn) {
    clearTimeout(_offAirTimer);
    _offAirBtn.classList.remove('holding');
    _offAirBtn = null;
    _offAirTimer = null;
  }
});

// ---- Score Controls ----
function syncScoreHeader() {
  const homeEl = document.getElementById('scoreHome');
  const awayEl = document.getElementById('scoreAway');
  const headerScores = document.querySelectorAll('.scoreboard__score');
  if (homeEl && headerScores[0]) headerScores[0].textContent = homeEl.textContent;
  if (awayEl && headerScores[1]) headerScores[1].textContent = awayEl.textContent;
}

const _MENU_DOT_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="2.5" r="1.2" fill="#667085"/><circle cx="7" cy="7" r="1.2" fill="#667085"/><circle cx="7" cy="11.5" r="1.2" fill="#667085"/></svg>`;

function addMatchEvent(typeLabel, dotClass, typeClass, teamLabel, teamClass, minute) {
  const list = document.querySelector('.match-events-list');
  if (!list) return;
  const el = document.createElement('div');
  el.className = 'match-event';
  el.dataset.eventTime = minute;
  el.dataset.eventType = typeLabel;
  el.dataset.eventPlayer = '—';
  el.dataset.eventTeam = teamLabel;
  el.dataset.dotClass = dotClass;
  el.dataset.typeClass = typeClass;
  el.innerHTML = `<span class="match-event__time">${minute}'</span><span class="match-event__dot${dotClass ? ' ' + dotClass : ''}"></span><span class="match-event__type${typeClass ? ' ' + typeClass : ''}">${typeLabel}</span><span class="match-event__player">—</span><span class="match-event__team ${teamClass}">${teamLabel}</span><button class="match-event__menu-btn" title="Event options">${_MENU_DOT_SVG}</button>`;
  list.prepend(el);
  const badge = document.querySelector('.sidebar-section__header[data-section="matchEvents"] .sidebar-badge');
  if (badge) badge.textContent = `${list.children.length} events`;
  const body = document.getElementById('matchEventsBody');
  if (body && !body.classList.contains('collapsed')) body.style.maxHeight = body.scrollHeight + 'px';
}

function removeLatestGoalEvent(teamLabel) {
  const list = document.querySelector('.match-events-list');
  if (!list) return;
  const match = Array.from(list.querySelectorAll('.match-event')).find(
    ev => ev.dataset.eventType === 'Goal' && ev.dataset.eventTeam === teamLabel
  );
  if (!match) return;
  match.remove();
  const badge = document.querySelector('.sidebar-section__header[data-section="matchEvents"] .sidebar-badge');
  if (badge) badge.textContent = `${list.children.length} events`;
  const body = document.getElementById('matchEventsBody');
  if (body && !body.classList.contains('collapsed')) body.style.maxHeight = body.scrollHeight + 'px';
}

document.querySelectorAll('.number-input').forEach(input => {
  const display = input.querySelector('.number-input__value');
  const [minusBtn, plusBtn] = input.querySelectorAll('.number-input__btn');
  if (!display) return;

  minusBtn?.addEventListener('click', () => {
    const v = parseInt(display.textContent) || 0;
    if (v > 0) {
      display.textContent = v - 1;
      syncScoreHeader();
      if (display.id === 'scoreHome') removeLatestGoalEvent('MEL');
      else if (display.id === 'scoreAway') removeLatestGoalEvent('SYD');
    }
  });
  plusBtn?.addEventListener('click', () => {
    const v = parseInt(display.textContent) || 0;
    display.textContent = v + 1;
    syncScoreHeader();
    if (display.id === 'scoreHome' || display.id === 'scoreAway') {
      const isHome = display.id === 'scoreHome';
      const minute = document.getElementById('clockValue')?.textContent?.split(':')[0] || '0';
      addMatchEvent('Goal', 'match-event__dot--goal', 'match-event__type--goal',
        isHome ? 'MEL' : 'SYD',
        isHome ? 'match-event__team--mel' : 'match-event__team--syd',
        minute);
    }
  });
});

// ---- Clock State (module-level, shared by all clock controls) ----
let clockSeconds = 89 * 60 + 2;
let clockRunning = false;
let clockInterval = null;

function formatClockTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function updateClockDisplay() {
  const val = document.getElementById('clockValue');
  if (val) val.textContent = formatClockTime(clockSeconds);
  const matchClock = document.getElementById('matchClock');
  if (matchClock) matchClock.textContent = formatClockTime(clockSeconds);
}

function startClock() {
  if (clockRunning) return;
  clockRunning = true;
  const cd = document.getElementById('clockDisplay');
  if (cd) cd.classList.add('running');
  clockInterval = setInterval(() => { clockSeconds++; updateClockDisplay(); }, 1000);
}

function stopClock() {
  if (!clockRunning) return;
  clockRunning = false;
  const cd = document.getElementById('clockDisplay');
  if (cd) cd.classList.remove('running');
  clearInterval(clockInterval);
  clockInterval = null;
}

// ---- Quick Events ----
document.querySelectorAll('.event-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.style.filter = 'brightness(0.88)';
    setTimeout(() => { btn.style.filter = ''; }, 250);

    const activeTeamBtn = document.querySelector('.team-tab--active');
    const team = activeTeamBtn?.dataset.team || 'melbourne';
    const isHome = team === 'melbourne';
    const teamLabel = isHome ? 'MEL' : 'SYD';
    const teamClass = isHome ? 'match-event__team--mel' : 'match-event__team--syd';

    const clockText = document.getElementById('clockValue')?.textContent || '0:00';
    const minute = clockText.split(':')[0];

    let dotClass = '', typeClass = '', typeLabel = '', scoreChange = 0;
    if (btn.classList.contains('event-btn--goal')) {
      dotClass = 'match-event__dot--goal'; typeClass = 'match-event__type--goal'; typeLabel = 'Goal'; scoreChange = 1;
    } else if (btn.classList.contains('event-btn--yellow')) {
      dotClass = 'match-event__dot--yellow'; typeClass = 'match-event__type--yellow'; typeLabel = 'Yellow';
    } else if (btn.classList.contains('event-btn--red')) {
      dotClass = 'match-event__dot--red'; typeClass = 'match-event__type--red'; typeLabel = 'Red';
    } else if (btn.classList.contains('event-btn--sub')) {
      typeLabel = 'Sub';
    } else if (btn.classList.contains('event-btn--penalty')) {
      typeLabel = 'Penalty';
    } else if (btn.classList.contains('event-btn--injury')) {
      typeLabel = 'Injury +';
    } else if (btn.classList.contains('event-btn--var')) {
      typeLabel = 'VAR';
    } else if (btn.classList.contains('event-btn--ht')) {
      typeLabel = 'Half Time';
    } else if (btn.classList.contains('event-btn--ft')) {
      typeLabel = 'Full Time';
    }

    // Update score for goals
    if (scoreChange) {
      const scoreId = isHome ? 'scoreHome' : 'scoreAway';
      const sidebarEl = document.getElementById(scoreId);
      if (sidebarEl) {
        sidebarEl.textContent = (parseInt(sidebarEl.textContent) || 0) + scoreChange;
        syncScoreHeader();
      }
    }

    // Add event row to match events list
    const list = document.querySelector('.match-events-list');
    if (list) {
      const el = document.createElement('div');
      el.className = 'match-event';
      el.dataset.eventTime = minute;
      el.dataset.eventType = typeLabel;
      el.dataset.eventPlayer = '—';
      el.dataset.eventTeam = teamLabel;
      el.dataset.dotClass = dotClass;
      el.dataset.typeClass = typeClass;
      el.innerHTML = `<span class="match-event__time">${minute}'</span><span class="match-event__dot${dotClass ? ' ' + dotClass : ''}"></span><span class="match-event__type${typeClass ? ' ' + typeClass : ''}">${typeLabel}</span><span class="match-event__player">—</span><span class="match-event__team ${teamClass}">${teamLabel}</span><button class="match-event__menu-btn" title="Event options">${_MENU_DOT_SVG}</button>`;
      list.prepend(el);

      const badge = document.querySelector('.sidebar-section__header[data-section="matchEvents"] .sidebar-badge');
      if (badge) badge.textContent = `${list.children.length} events`;

      const body = document.getElementById('matchEventsBody');
      if (body && !body.classList.contains('collapsed')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    }

    // AUTO GFX: when enabled and a game event fires, auto-preview the next default card
    const isGameEvent = !btn.classList.contains('event-btn--ht') && !btn.classList.contains('event-btn--ft');
    if (isGameEvent && autoGfxSwitch?.classList.contains('active')) {
      const nextDefaultCard = document.querySelector(
        `.graphic-group[data-tab="${activeTabId}"] .group-cards > .graphic-card--default`
      );
      if (nextDefaultCard) {
        setCardState(nextDefaultCard, 'preview');
        flashCard(nextDefaultCard);
      }
    }
  });
});

// ---- Clock Controls (wired to module-level clock state) ----
const clockDisplay = document.getElementById('clockDisplay');
if (clockDisplay) {
  clockDisplay.addEventListener('click', () => {
    if (clockRunning) stopClock(); else startClock();
  });
  clockDisplay.title = 'Click to start/stop clock';
}

const clockPauseBtn = document.getElementById('clockPauseBtn');
if (clockPauseBtn) {
  clockPauseBtn.addEventListener('click', () => stopClock());
}

// Clock −1 min button
const clockDecrBtn = document.getElementById('clockDecrBtn');
if (clockDecrBtn) {
  clockDecrBtn.addEventListener('click', () => {
    clockSeconds = Math.max(0, clockSeconds - 60);
    updateClockDisplay();
  });
}

// Clock +1 min button
const clockIncrBtn = document.getElementById('clockIncrBtn');
if (clockIncrBtn) {
  clockIncrBtn.addEventListener('click', () => {
    clockSeconds += 60;
    updateClockDisplay();
  });
}

// Inline clock editing: click the time value to type a new time (when stopped)
const clockValEl = document.getElementById('clockValue');
if (clockValEl && clockDisplay) {
  clockValEl.addEventListener('click', (e) => {
    e.stopPropagation(); // don't toggle start/stop on the outer display
    if (clockRunning) return; // only editable when stopped
    clockValEl.contentEditable = 'true';
    clockValEl.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(clockValEl);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  const commitClockEdit = () => {
    clockValEl.contentEditable = 'false';
    const text = clockValEl.textContent.trim();
    const match = text.match(/^(\d{1,3}):(\d{2})$/);
    if (match) {
      const m = parseInt(match[1], 10);
      const s = parseInt(match[2], 10);
      if (s < 60) clockSeconds = m * 60 + s;
    }
    updateClockDisplay(); // resets display to parsed (or previous) value
  };

  clockValEl.addEventListener('blur', commitClockEdit);
  clockValEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); clockValEl.blur(); }
    if (e.key === 'Escape') { clockValEl.contentEditable = 'false'; updateClockDisplay(); }
  });
}

// ---- Edit Panel (Slide-out) ----
const editPanel = document.getElementById('editPanel');
const mainLayout = document.getElementById('mainLayout');
const panelTitle = document.getElementById('panelTitle');
const panelSubtitle = document.getElementById('panelSubtitle');
const panelVariables = document.getElementById('panelVariables');
const panelClose = document.getElementById('panelClose');
const panelCancel = document.getElementById('panelCancel');

const VARIABLE_NAMES = {
  // Legacy cards
  'card-selected': ['Competition', 'Home Team', 'Away Team', 'Venue'],
  'card-preview': ['Competition', 'Home Team'],
  'card-sub1': ['Competition', 'Home Team'],
  'card-sub2': ['Competition', 'Home Team'],
  'card-lineup': ['Competition', 'Home Team'],
  'card-g2-1': ['Competition', 'Home Team'],
  'card-g2-2': ['Competition', 'Home Team', 'Away Team'],
  // Break
  'card-background': ['Background Image'],
  'card-intro': ['Competition', 'Home Team', 'Away Team'],
  'card-match-id': ['Competition', 'Home Team', 'Away Team', 'Venue'],
  'card-team-list': ['Home Team', 'Away Team'],
  'card-team-stats': ['Competition', 'Home Team', 'Away Team'],
  // In Game
  'card-event': ['Event Type', 'Player', 'Minute', 'Team'],
  'card-penalties': ['Home Score', 'Away Score'],
  'card-scoreboard': ['Home Team', 'Away Team', 'Score'],
  'card-status': ['Status', 'Info'],
  // Player
  'card-player-card': ['Player Name', 'Number', 'Position', 'Team', 'Photo'],
  'card-player-stats': ['Player Name', 'Stat 1', 'Stat 2', 'Stat 3'],
  'card-player-profile': ['Player Name', 'Team', 'Photo'],
  'card-motm': ['Player Name', 'Team', 'Goals', 'Rating'],
  // Caption
  'card-lower-third': ['Title', 'Name', 'Role'],
  'card-score-bug': ['Home Team', 'Away Team', 'Score'],
  'card-score-bug-live': ['Home Team', 'Away Team', 'Minute'],
  'card-break-bumper': ['Competition', 'Message'],
};

const VARIABLE_VALUES = {
  'Competition': 'Aus Soccer Competition',
  'Home Team': 'Melbourne Dragons',
  'Away Team': 'Sydney Sharks',
  'Venue': 'AAMI Stadium, Melbourne',
  'Score': '3 – 1',
  'Minute': '89',
  'Team': 'Melbourne Dragons',
  'Status': 'LIVE',
  'Info': '2nd Half',
  'Player Name': 'Marcus Lee',
  'Number': '9',
  'Position': 'Forward',
  'Title': 'Goal Scorer',
  'Name': 'Marcus Lee',
  'Role': 'Forward',
};

let activeCardId = 'card-selected';

function buildVariableFields(cardId, numVars) {
  let savedVars = {};
  try {
    const raw = sessionStorage.getItem(`ligr_vars_${cardId}`);
    if (raw) savedVars = JSON.parse(raw);
  } catch(e) {}

  const names = VARIABLE_NAMES[cardId] || Array.from({ length: numVars }, (_, i) => `Variable ${i + 1}`);
  return names.map((name, i) => {
    const defaultVal = VARIABLE_VALUES[name] || '';
    const val = savedVars[name] !== undefined ? savedVars[name] : defaultVal;
    return `
      <div class="variable-field">
        <div class="variable-field__label-row">
          <span class="variable-field__label">${name}</span>
          <span class="variable-field__required">*</span>
          <span class="variable-field__help" title="More info">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#98a2b3" stroke-width="1.4"/><path d="M8 7v5" stroke="#98a2b3" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5.5" r="0.75" fill="#98a2b3"/></svg>
          </span>
        </div>
        <div class="variable-field__input-row">
          <span class="variable-field__drag">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>
          </span>
          <input class="variable-field__input" type="text" value="${val}" placeholder="Enter ${name.toLowerCase()}…" />
        </div>
      </div>`;
  }).join('');
}

function openPanel(cardId, name, numVars) {
  // Deselect previous
  document.querySelectorAll('.graphic-card--selected').forEach(c => c.classList.remove('graphic-card--selected'));
  document.querySelectorAll('.btn-icon--active').forEach(b => b.classList.remove('btn-icon--active'));

  // Select new card
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  const btn = document.querySelector(`.btn-icon--edit[data-card="${cardId}"]`);
  if (card) card.classList.add('graphic-card--selected');
  if (btn) btn.classList.add('btn-icon--active');

  // Populate panel
  activeCardId = cardId;
  panelTitle.textContent = name;

  const isMediaCard = btn?.dataset.cardType === 'media';
  const mediaPlaybackEl = document.getElementById('panelMediaPlayback');

  const panelTabVarsEl = document.getElementById('panelTabVars');
  if (isMediaCard) {
    panelSubtitle.innerHTML = `Media <span>•</span> More Info`;
    if (mediaPlaybackEl) mediaPlaybackEl.style.display = '';
    if (panelVariables) { panelVariables.style.display = 'none'; }
    if (panelTabVarsEl) panelTabVarsEl.textContent = 'Variables';
  } else {
    panelSubtitle.innerHTML = `${numVars} Variable${numVars !== 1 ? 's' : ''}`;
    if (mediaPlaybackEl) mediaPlaybackEl.style.display = 'none';
    if (panelVariables) { panelVariables.style.display = ''; panelVariables.innerHTML = buildVariableFields(cardId, numVars); }
    if (panelTabVarsEl) panelTabVarsEl.textContent = `Variables (${numVars})`;
  }

  // Set panel preview from card thumbnail SVG
  const panelPreviewImg = document.getElementById('panelPreviewImg');
  const panelPreviewEl = panelPreviewImg?.parentElement;
  const thumbSvg = card?.querySelector('.graphic-card__thumbnail svg');
  if (thumbSvg && panelPreviewImg) {
    const svgStr = new XMLSerializer().serializeToString(thumbSvg);
    panelPreviewImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    panelPreviewImg.style.display = 'block';
    panelPreviewEl?.classList.remove('edit-panel__preview--fallback');
  } else if (panelPreviewImg) {
    panelPreviewImg.style.display = 'none';
    panelPreviewEl?.classList.add('edit-panel__preview--fallback');
  }

  // Reset to Variables tab
  _panelSwitchTab('vars');

  // Open panel + compress content
  editPanel.classList.add('open');
  mainLayout.classList.add('panel-open');
  updatePanelButtons();
}

function saveVariableValues() {
  if (!activeCardId) return;
  const values = {};
  document.querySelectorAll('#panelVariables .variable-field').forEach(field => {
    const label = field.querySelector('.variable-field__label')?.textContent?.trim();
    const input = field.querySelector('.variable-field__input');
    if (label && input) values[label] = input.value;
  });
  try { sessionStorage.setItem(`ligr_vars_${activeCardId}`, JSON.stringify(values)); } catch(e) {}
}

function closePanel() {
  saveVariableValues();
  editPanel.classList.remove('open');
  mainLayout.classList.remove('panel-open');

  // Deselect card
  document.querySelectorAll('.graphic-card--selected').forEach(c => c.classList.remove('graphic-card--selected'));
  document.querySelectorAll('.btn-icon--active').forEach(b => b.classList.remove('btn-icon--active'));
  activeCardId = null;
}

// Card click delegation: clicking anywhere on a card (or extension) opens/closes the edit panel
// Extensions are found before the parent card so they get selected independently
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn--preview, .btn--to-air-outline, .btn--off-air, .btn--cancel-queue, .graphic-card__drag')) return;
  const ext = e.target.closest('.graphic-card__extension');
  const card = ext || e.target.closest('.graphic-card');
  if (!card) return;
  const editBtn = card.querySelector('.btn-icon--edit');
  if (!editBtn) return;
  const cardId = editBtn.dataset.card;
  const name = editBtn.dataset.name || 'Graphic';
  const numVars = parseInt(editBtn.dataset.vars) || 2;
  if (activeCardId === cardId && editPanel.classList.contains('open')) {
    closePanel();
  } else {
    openPanel(cardId, name, numVars);
  }
});

// Close panel on X or Cancel
panelClose?.addEventListener('click', closePanel);
panelCancel?.addEventListener('click', closePanel);

// ---- Panel State Awareness ----
function updatePanelButtons() {
  if (!activeCardId || !editPanel?.classList.contains('open')) return;
  const card = document.querySelector(`[data-card-id="${activeCardId}"]`);
  const toAirBtn = document.getElementById('panelToAirBtn');
  const localBtn = document.getElementById('panelLocalBtn');
  const previewBtn = document.getElementById('panelUrlBtn');
  if (!card || !toAirBtn) return;

  const isOnAir = card.classList.contains('graphic-card--on-air');
  const isPreviewing = card.classList.contains('graphic-card--preview-state');

  if (isOnAir) {
    toAirBtn.className = 'btn btn--off-air btn--flex';
    toAirBtn.innerHTML = `${_SVG_OFF_AIR} Off Air`;
  } else {
    toAirBtn.className = 'btn btn--to-air-outline btn--flex';
    toAirBtn.innerHTML = `${_SVG_TO_AIR} To Air`;
  }

  localBtn?.classList.remove('btn--preview-active');

  if (isPreviewing) {
    previewBtn?.classList.add('btn--preview-active');
  } else {
    previewBtn?.classList.remove('btn--preview-active');
  }
}

// ---- Overlay config & preview routing ----
let activePreviewOverlayId = null;

function getOverlayConfig() {
  const overlays = [];
  document.querySelectorAll('.overlay-row').forEach(row => {
    const toggle = row.querySelector('.overlay-toggle');
    const nameEl = row.querySelector('.overlay-row__name');
    const id = toggle?.dataset.overlayId;
    const name = nameEl?.textContent?.trim();
    if (id && name) overlays.push({ id, name });
  });
  return overlays;
}

function writeOverlayConfig() {
  const overlays = getOverlayConfig();
  try { localStorage.setItem('ligr_overlay_config', JSON.stringify(overlays)); } catch(e) {}
  return overlays;
}

function initOverlaySelector() {
  const overlays = writeOverlayConfig();
  if (!overlays.length) return;

  activePreviewOverlayId = overlays[0].id;

  const nameEl = document.getElementById('overlaySelectorName');
  if (nameEl) nameEl.textContent = overlays[0].name;

  const menu = document.getElementById('overlaySelectorMenu');
  if (!menu) return;
  menu.innerHTML = overlays.map(o => `
    <button class="overlay-selector__item${o.id === activePreviewOverlayId ? ' overlay-selector__item--active' : ''}" data-overlay-id="${o.id}" data-overlay-name="${o.name}">
      <svg class="overlay-selector__check" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${o.name}</span>
    </button>
  `).join('');
}

document.getElementById('overlaySelectorBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('overlaySelectorMenu')?.classList.toggle('open');
});

document.addEventListener('click', () => {
  document.getElementById('overlaySelectorMenu')?.classList.remove('open');
});

document.getElementById('overlaySelectorMenu')?.addEventListener('click', (e) => {
  const item = e.target.closest('.overlay-selector__item');
  if (!item) return;
  activePreviewOverlayId = item.dataset.overlayId;
  const nameEl = document.getElementById('overlaySelectorName');
  if (nameEl) nameEl.textContent = item.dataset.overlayName;
  document.querySelectorAll('.overlay-selector__item').forEach(i => {
    i.classList.toggle('overlay-selector__item--active', i === item);
  });
  document.getElementById('overlaySelectorMenu')?.classList.remove('open');
});

// ---- Panel Preview Actions ----
function writeLigrPreview(overrideCardId, overrideName) {
  const cardId = overrideCardId || activeCardId;
  const card = cardId ? document.querySelector(`[data-card-id="${cardId}"]`) : null;
  const imgEl = document.getElementById('panelPreviewImg');
  const overlays = getOverlayConfig();
  const activeOverlay = overlays.find(o => o.id === activePreviewOverlayId) || overlays[0];
  const state = {
    cardId: cardId,
    name: overrideName || panelTitle?.textContent || 'Graphic',
    imgSrc: imgEl?.src || '',
    state: card?.classList.contains('graphic-card--on-air') ? 'on-air' : 'default',
    timestamp: Date.now(),
    overlayId: activeOverlay?.id || null,
    overlayName: activeOverlay?.name || ''
  };
  try {
    localStorage.setItem('ligr_preview_state', JSON.stringify(state));
    if (activeOverlay) {
      localStorage.setItem(`ligr_preview_${activeOverlay.id}`, JSON.stringify(state));
    }
  } catch(e) {}
}

// Maximize — open expanded preview modal
const previewModal = document.getElementById('previewModal');

function openPreviewModal() {
  if (!activeCardId) return;

  // Populate right panel: graphic name + vars count
  const titleEl = document.getElementById('previewModalTitle');
  const metaEl = document.getElementById('previewModalVarsMeta');
  const varsEl = document.getElementById('previewModalVariables');
  const name = panelTitle?.textContent || '—';
  const editBtn = document.querySelector(`.btn-icon--edit[data-card="${activeCardId}"]`);
  const numVars = (VARIABLE_NAMES[activeCardId] || []).length || parseInt(editBtn?.dataset.vars) || 0;

  if (titleEl) titleEl.textContent = name;
  if (metaEl) metaEl.innerHTML = `${numVars} Variable${numVars !== 1 ? 's' : ''} <span>•</span> <span class="more-info" data-tooltip="View graphic template documentation and usage notes">More Info</span>`;
  if (varsEl) varsEl.innerHTML = buildVariableFields(activeCardId, numVars);

  // Populate preview image from panel
  const panelImg = document.getElementById('panelPreviewImg');
  const modalImg = document.getElementById('previewModalImg');
  const modalPlaceholder = document.getElementById('previewModalPlaceholder');
  if (panelImg?.src && panelImg.style.display !== 'none') {
    modalImg.src = panelImg.src;
    modalImg.style.display = 'block';
    if (modalPlaceholder) modalPlaceholder.style.display = 'none';
  } else {
    modalImg.style.display = 'none';
    if (modalPlaceholder) modalPlaceholder.style.display = 'flex';
  }

  // Reset to Variables tab
  _pmSwitchTab('vars');

  previewModal?.classList.add('open');
}

function _pmSwitchTab(tab) {
  const varsPane = document.getElementById('pmVarsPane');
  const displayPane = document.getElementById('pmDisplayPane');
  const tabVars = document.getElementById('pmTabVars');
  const tabDisplay = document.getElementById('pmTabDisplay');
  if (!varsPane || !displayPane || !tabVars || !tabDisplay) return;

  if (tab === 'vars') {
    varsPane.style.display = '';
    displayPane.style.display = 'none';
    tabVars.classList.add('pm-tab--active');
    tabDisplay.classList.remove('pm-tab--active');
  } else {
    varsPane.style.display = 'none';
    displayPane.style.display = '';
    tabVars.classList.remove('pm-tab--active');
    tabDisplay.classList.add('pm-tab--active');
  }
}

document.getElementById('pmTabVars')?.addEventListener('click', () => _pmSwitchTab('vars'));
document.getElementById('pmTabDisplay')?.addEventListener('click', () => _pmSwitchTab('display'));

function savePreviewModalVariables() {
  if (!activeCardId) return;
  const values = {};
  document.querySelectorAll('#previewModalVariables .variable-field').forEach(field => {
    const label = field.querySelector('.variable-field__label')?.textContent?.trim();
    const input = field.querySelector('.variable-field__input');
    if (label && input) values[label] = input.value;
  });
  if (Object.keys(values).length) {
    try { sessionStorage.setItem(`ligr_vars_${activeCardId}`, JSON.stringify(values)); } catch(e) {}
  }
}

function closePreviewModal() {
  savePreviewModalVariables();
  previewModal?.classList.remove('open');
}

document.getElementById('panelMaximizeBtn')?.addEventListener('click', openPreviewModal);
document.getElementById('previewModalClose')?.addEventListener('click', closePreviewModal);
document.getElementById('previewModalBackdrop')?.addEventListener('click', closePreviewModal);
document.getElementById('previewModalCancelBtn')?.addEventListener('click', closePreviewModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && previewModal?.classList.contains('open')) closePreviewModal(); });

// Overlay tab switching
document.getElementById('previewOverlayTabs')?.addEventListener('click', (e) => {
  const tab = e.target.closest('.overlay-tab');
  if (!tab) return;
  document.querySelectorAll('#previewOverlayTabs .overlay-tab').forEach(t => t.classList.remove('overlay-tab--active'));
  tab.classList.add('overlay-tab--active');
});

// Modal To Air button
document.getElementById('previewModalToAirBtn')?.addEventListener('click', () => {
  if (!activeCardId) return;
  const card = document.querySelector(`[data-card-id="${activeCardId}"]`);
  if (card) setCardState(card, 'on-air');
  closePreviewModal();
});

// Modal Open URL button — just sends graphic to preview, no new tab
document.getElementById('previewModalUrlBtn')?.addEventListener('click', () => {
  writeLigrPreview();
});

// Panel local playback controls — write commands to localStorage for the preview page to consume
function _sendPreviewCmd(cmd) {
  try { localStorage.setItem('ligr_preview_cmd', JSON.stringify({ command: cmd, ts: Date.now() })); } catch(e) {}
}

// Local button — opens LOCAL PREVIEW modal
// panelLocalBtn — disabled for now (no action)

// ---- Panel Tab Switching ----
function _panelSwitchTab(tab) {
  const varsPane = document.getElementById('panelVarsPane');
  const displayPane = document.getElementById('panelDisplayPane');
  const tabVars = document.getElementById('panelTabVars');
  const tabDisplay = document.getElementById('panelTabDisplay');
  if (!varsPane || !displayPane || !tabVars || !tabDisplay) return;

  if (tab === 'vars') {
    varsPane.style.display = '';
    displayPane.style.display = 'none';
    tabVars.classList.add('edit-panel__tab--active');
    tabDisplay.classList.remove('edit-panel__tab--active');
  } else {
    varsPane.style.display = 'none';
    displayPane.style.display = '';
    tabVars.classList.remove('edit-panel__tab--active');
    tabDisplay.classList.add('edit-panel__tab--active');
  }
}

document.getElementById('panelTabVars')?.addEventListener('click', () => _panelSwitchTab('vars'));
document.getElementById('panelTabDisplay')?.addEventListener('click', () => _panelSwitchTab('display'));

// Panel Preview button — toggles preview state for the active card
document.getElementById('panelUrlBtn')?.addEventListener('click', () => {
  if (!activeCardId) return;
  const card = document.querySelector(`[data-card-id="${activeCardId}"]`);
  if (!card || card.classList.contains('graphic-card--on-air')) return;
  // Toggle: second click cancels preview
  if (card.classList.contains('graphic-card--preview-state')) {
    card.classList.remove('graphic-card--preview-state');
    _previewCardId = null;
    updateHeaderButtons();
    updatePanelButtons();
    return;
  }
  document.querySelectorAll('.graphic-card--preview-state').forEach(c => c.classList.remove('graphic-card--preview-state'));
  card.classList.add('graphic-card--preview-state');
  _previewCardId = activeCardId;
  writeLigrPreview();
  updateHeaderButtons();
  updatePanelButtons();
});

// Panel To Air / Off Air button (state-aware)
document.getElementById('panelToAirBtn')?.addEventListener('click', () => {
  if (!activeCardId) return;
  const card = document.querySelector(`[data-card-id="${activeCardId}"]`);
  if (!card) return;
  if (card.classList.contains('graphic-card--on-air')) {
    // Currently on-air — go off air (hold handled by mousedown, but panel button is direct)
    setCardState(card, 'default');
  } else {
    setCardState(card, 'on-air');
    writeLigrPreview();
  }
});

// ---- Group Meta ----
function refreshGroupMeta(group) {
  const meta = group.querySelector('.group-header__meta');
  if (!meta) return;
  const cards = group.querySelectorAll('.group-cards > .graphic-card');
  const extensions = group.querySelectorAll('.graphic-card__extension');
  const parts = [];
  if (cards.length) parts.push(`${cards.length} Graphic${cards.length !== 1 ? 's' : ''}`);
  if (extensions.length) parts.push(`${extensions.length} Extension${extensions.length !== 1 ? 's' : ''}`);
  meta.textContent = parts.join(' • ') || 'Empty';
}

// ---- Add Graphic ----
let _cardCounter = 100;

function createCardHtml(cardId, name, numVars = 2) {
  const svgs = { drag: `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>` };
  const varLabel = numVars === 0 ? 'No Variables' : `${numVars} Variable${numVars !== 1 ? 's' : ''}`;
  return `<div class="graphic-card graphic-card--default" data-card-id="${cardId}">
    <div class="graphic-card__inner">
      <div class="graphic-card__drag">${svgs.drag}</div>
      <div class="graphic-card__thumbnail"></div>
      <div class="graphic-card__info">
        <div class="graphic-card__title-row"><span class="graphic-card__name">${name}</span></div>
        <p class="graphic-card__meta">${varLabel} <span class="meta-dot">•</span> More Info</p>
      </div>
      <div class="graphic-card__actions">
        <button class="btn-icon btn-icon--edit" data-card="${cardId}" data-name="${name}" data-vars="${numVars}" title="Edit variables">${_SVG_EDIT}</button>
        <button class="btn btn--secondary btn--md btn--preview">${_SVG_PREVIEW} Preview</button>
        <button class="btn btn--to-air-outline">${_SVG_TO_AIR} To Air</button>
      </div>
    </div>
  </div>`;
}

function addGraphicToActiveTab() {
  openAddGraphicModal();
}

document.querySelectorAll('.btn--add-graphic').forEach(btn => {
  btn.addEventListener('click', addGraphicToActiveTab);
});

// Open panel for the initially-selected card on page load, seed group badges + clock
(function initPanel() {
  updateClockDisplay(); // sync sidebar + header clock from clockSeconds on load

  // Initialize tab system — activate first tab and filter groups
  const firstTab = getAllTabs()[0];
  if (firstTab) switchTab(firstTab.dataset.tabId);

  // Refresh all group meta counts from actual DOM
  document.querySelectorAll('.graphic-group').forEach(refreshGroupMeta);

  const initialSelected = document.querySelector('.graphic-card--selected');
  const initialBtn = initialSelected?.querySelector('.btn-icon--edit');
  if (initialSelected && initialBtn) {
    const cardId = initialBtn.dataset.card;
    const name = initialBtn.dataset.name || 'Graphic';
    const numVars = parseInt(initialBtn.dataset.vars) || 2;
    openPanel(cardId, name, numVars);
  }
  updateGroupBadges();
})();


// ---- Clear All (hold 1.5s to confirm) ----
const clearAllBtn = document.getElementById('clearAllBtn');
if (clearAllBtn) {
  let holdTimer = null;

  clearAllBtn.addEventListener('mousedown', () => {
    clearAllBtn.classList.add('holding');
    holdTimer = setTimeout(() => {
      document.querySelectorAll('.graphic-card, .graphic-card__extension').forEach(c => {
        if (c.classList.contains('graphic-card--on-air') || c.classList.contains('graphic-card--preview-state')) {
          setCardState(c, 'default');
        }
      });
      _previewCardId = null;
      updateGroupBadges();
      updateHeaderButtons();
      clearAllBtn.classList.remove('holding');
    }, 1500);
  });

  const cancelHold = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    clearAllBtn.classList.remove('holding');
  };
  clearAllBtn.addEventListener('mouseup', cancelHold);
  clearAllBtn.addEventListener('mouseleave', cancelHold);
}

// ---- Media Tab System ----
let activeMediaTabId = null;

function getAllMediaTabs() {
  return Array.from(document.querySelectorAll('#mediaTabBar .category-tab:not(.category-tab--add)'));
}

function switchMediaTab(tabId) {
  activeMediaTabId = tabId;
  getAllMediaTabs().forEach(tab => {
    tab.classList.toggle('category-tab--active', tab.dataset.mediaTabId === tabId);
  });
  document.querySelectorAll('.media-group').forEach(group => {
    group.classList.toggle('graphic-group--hidden', group.dataset.mediaTab !== tabId);
  });
  const emptyState = document.getElementById('mediaEmptyState');
  if (emptyState) {
    const visible = document.querySelectorAll(`.media-group[data-media-tab="${tabId}"]`).length;
    emptyState.style.display = visible === 0 ? 'flex' : 'none';
  }
}

function wireMediaTabEvents(tab) {
  tab.addEventListener('click', (e) => {
    if (e.target.closest('.category-tab__close')) return;
    if (tab.querySelector('.category-tab__input')) return;
    switchMediaTab(tab.dataset.mediaTabId);
  });
  tab.addEventListener('dblclick', (e) => {
    if (e.target.closest('.category-tab__close')) return;
    e.preventDefault();
    renameTab(tab); // reuse graphics rename logic
  });
  const closeBtn = tab.querySelector('.category-tab__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabs = getAllMediaTabs();
      if (tabs.length <= 1) return;
      const idx = tabs.indexOf(tab);
      const next = tabs[idx + 1] || tabs[idx - 1];
      tab.remove();
      if (next) switchMediaTab(next.dataset.mediaTabId);
    });
  }
}

getAllMediaTabs().forEach(wireMediaTabEvents);

document.getElementById('addMediaTabBtn')?.addEventListener('click', () => {
  const newId = `media-tab-${Date.now()}`;
  const addBtn = document.getElementById('addMediaTabBtn');
  const tab = document.createElement('button');
  tab.className = 'category-tab';
  tab.dataset.mediaTabId = newId;
  tab.innerHTML = `<span class="category-tab__label">New Tab</span><span class="category-tab__close" role="button" tabindex="-1" title="Remove tab">${_CLOSE_SVG}</span>`;
  addBtn.before(tab);
  wireMediaTabEvents(tab);
  switchMediaTab(newId);
  setTimeout(() => renameTab(tab), 30);
});

// Init media tabs
const firstMediaTab = getAllMediaTabs()[0];
if (firstMediaTab) switchMediaTab(firstMediaTab.dataset.mediaTabId);

// ---- Match Event Context Menu ----
let _activeContextMenuEl = null;
let _activeContextMenuRow = null;

function closeContextMenu() {
  if (_activeContextMenuEl) {
    _activeContextMenuEl.remove();
    _activeContextMenuEl = null;
    _activeContextMenuRow = null;
  }
}

function openContextMenu(eventRow, menuBtn) {
  closeContextMenu();
  _activeContextMenuRow = eventRow;

  const menu = document.createElement('div');
  menu.className = 'event-context-menu';
  menu.innerHTML = `
    <button class="event-context-menu__item" id="_ctxEdit">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.333 2a1.886 1.886 0 112.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="#344054" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Edit event
    </button>
    <button class="event-context-menu__item event-context-menu__item--destructive" id="_ctxDelete">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10H3z" stroke="#d92d20" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Delete event
    </button>`;

  eventRow.appendChild(menu);
  _activeContextMenuEl = menu;

  menu.querySelector('#_ctxEdit').addEventListener('click', (e) => {
    e.stopPropagation();
    closeContextMenu();
    openEditEventModal(eventRow);
  });
  menu.querySelector('#_ctxDelete').addEventListener('click', (e) => {
    e.stopPropagation();
    closeContextMenu();
    deleteMatchEvent(eventRow);
  });
}

// Match event menu button delegation
document.addEventListener('click', (e) => {
  const menuBtn = e.target.closest('.match-event__menu-btn');
  if (menuBtn) {
    e.stopPropagation();
    const eventRow = menuBtn.closest('.match-event');
    if (_activeContextMenuRow === eventRow && _activeContextMenuEl) {
      closeContextMenu();
    } else {
      openContextMenu(eventRow, menuBtn);
    }
    return;
  }
  // Close context menu on outside click
  if (!e.target.closest('.event-context-menu')) closeContextMenu();
});

function deleteMatchEvent(eventRow) {
  const list = eventRow.closest('.match-events-list');
  eventRow.remove();
  if (list) {
    const badge = document.querySelector('.sidebar-section__header[data-section="matchEvents"] .sidebar-badge');
    if (badge) badge.textContent = `${list.children.length} events`;
    const body = document.getElementById('matchEventsBody');
    if (body && !body.classList.contains('collapsed')) {
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  }
}

// ---- Edit Match Event Modal ----
let _editEventRow = null;

function openEditEventModal(eventRow) {
  _editEventRow = eventRow;
  document.getElementById('editEventTime').value = eventRow.dataset.eventTime || '';
  const typeSelect = document.getElementById('editEventType');
  const typeVal = eventRow.dataset.eventType || 'Goal';
  Array.from(typeSelect.options).forEach(o => { o.selected = o.text === typeVal; });
  const teamSelect = document.getElementById('editEventTeam');
  const teamVal = eventRow.dataset.eventTeam || 'MEL';
  Array.from(teamSelect.options).forEach(o => { o.selected = o.value === teamVal; });
  document.getElementById('editEventPlayer').value = eventRow.dataset.eventPlayer || '';
  document.getElementById('editEventModal').classList.add('open');
}

function saveEditEvent() {
  if (!_editEventRow) return;

  const newTime = document.getElementById('editEventTime').value.trim();
  const newType = document.getElementById('editEventType').value;
  const newTeam = document.getElementById('editEventTeam').value;
  const newPlayer = document.getElementById('editEventPlayer').value.trim();

  // Update data attributes
  _editEventRow.dataset.eventTime = newTime;
  _editEventRow.dataset.eventType = newType;
  _editEventRow.dataset.eventTeam = newTeam;
  _editEventRow.dataset.eventPlayer = newPlayer;

  // Determine dot/type classes
  let dotClass = '', typeClass = '';
  if (newType === 'Goal') { dotClass = 'match-event__dot--goal'; typeClass = 'match-event__type--goal'; }
  else if (newType === 'Yellow Card') { dotClass = 'match-event__dot--yellow'; typeClass = 'match-event__type--yellow'; }
  else if (newType === 'Red Card') { dotClass = 'match-event__dot--red'; typeClass = 'match-event__type--red'; }
  else if (newType === 'Substitution') { dotClass = 'match-event__dot--blue'; typeClass = 'match-event__type--blue'; }
  _editEventRow.dataset.dotClass = dotClass;
  _editEventRow.dataset.typeClass = typeClass;

  const isHome = newTeam === 'MEL';
  const teamClass = isHome ? 'match-event__team--mel' : 'match-event__team--syd';

  const _MENU_DOT_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="2.5" r="1.2" fill="#667085"/><circle cx="7" cy="7" r="1.2" fill="#667085"/><circle cx="7" cy="11.5" r="1.2" fill="#667085"/></svg>`;
  _editEventRow.innerHTML = `<span class="match-event__time">${newTime}'</span><span class="match-event__dot${dotClass ? ' ' + dotClass : ''}"></span><span class="match-event__type${typeClass ? ' ' + typeClass : ''}">${newType}</span><span class="match-event__player">${newPlayer || '—'}</span><span class="match-event__team ${teamClass}">${newTeam}</span><button class="match-event__menu-btn" title="Event options">${_MENU_DOT_SVG}</button>`;

  closeEditEventModal();
}

function closeEditEventModal() {
  document.getElementById('editEventModal')?.classList.remove('open');
  _editEventRow = null;
}

document.getElementById('editEventSaveBtn')?.addEventListener('click', saveEditEvent);
document.getElementById('editEventCancelBtn')?.addEventListener('click', closeEditEventModal);
document.getElementById('editEventModalClose')?.addEventListener('click', closeEditEventModal);
document.getElementById('editEventModalBackdrop')?.addEventListener('click', closeEditEventModal);
document.getElementById('editEventDeleteBtn')?.addEventListener('click', () => {
  if (_editEventRow) deleteMatchEvent(_editEventRow);
  closeEditEventModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('editEventModal')?.classList.contains('open')) closeEditEventModal();
  if (e.key === 'Escape' && document.getElementById('editDetailModal')?.classList.contains('open')) closeEditDetailModal();
});

// ---- Edit Match Detail ----

const _DETAIL_KEY_LABELS = {
  'home-team':   'Home Team',
  'away-team':   'Away Team',
  'venue':       'Venue',
  'competition': 'Competition',
  'date':        'Date',
  'time':        'Time',
  'match-id':    'Match ID',
};

let _editDetailRow = null;

function openDetailContextMenu(row, menuBtn) {
  closeContextMenu();
  _activeContextMenuRow = row;

  const menu = document.createElement('div');
  menu.className = 'event-context-menu';
  menu.innerHTML = `
    <button class="event-context-menu__item" id="_ctxDetailEdit">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.333 2a1.886 1.886 0 112.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="#344054" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Edit
    </button>`;

  row.appendChild(menu);
  _activeContextMenuEl = menu;

  menu.querySelector('#_ctxDetailEdit').addEventListener('click', (e) => {
    e.stopPropagation();
    closeContextMenu();
    openEditDetailModal(row);
  });
}

function openEditDetailModal(row) {
  _editDetailRow = row;
  const key = row.dataset.detailKey;
  const label = _DETAIL_KEY_LABELS[key] || key;
  const currentValue = row.querySelector('.match-detail-row__value').textContent;
  document.getElementById('editDetailModalTitle').textContent = `EDIT ${label.toUpperCase()}`;
  document.getElementById('editDetailLabel').textContent = label;
  document.getElementById('editDetailInput').value = currentValue;
  document.getElementById('editDetailModal').classList.add('open');
  setTimeout(() => document.getElementById('editDetailInput').select(), 50);
}

function saveEditDetail() {
  if (!_editDetailRow) return;
  const newValue = document.getElementById('editDetailInput').value.trim();
  if (!newValue) return;
  const key = _editDetailRow.dataset.detailKey;
  _editDetailRow.querySelector('.match-detail-row__value').textContent = newValue;
  syncDetailToHeader(key, newValue);
  closeEditDetailModal();
}

function syncDetailToHeader(key, value) {
  if (key === 'home-team') {
    const el = document.querySelector('.scoreboard__team--home .scoreboard__team-name');
    if (el) el.textContent = value.toUpperCase();
    const scoreLabels = document.querySelectorAll('.score-control__label');
    if (scoreLabels[0]) scoreLabels[0].textContent = value;
    const teamTab = document.querySelector('#teamTabs .team-tab[data-team="melbourne"]');
    if (teamTab) teamTab.textContent = value;
  } else if (key === 'away-team') {
    const el = document.querySelector('.scoreboard__team--away .scoreboard__team-name');
    if (el) el.textContent = value.toUpperCase();
    const scoreLabels = document.querySelectorAll('.score-control__label');
    if (scoreLabels[1]) scoreLabels[1].textContent = value;
    const teamTab = document.querySelector('#teamTabs .team-tab[data-team="sydney"]');
    if (teamTab) teamTab.textContent = value;
  } else if (key === 'venue') {
    const el = document.querySelector('.competition-text__venue');
    if (el) el.textContent = value;
  } else if (key === 'competition') {
    const el = document.querySelector('.competition-text__name');
    if (el) el.textContent = value;
  }
}

function closeEditDetailModal() {
  document.getElementById('editDetailModal')?.classList.remove('open');
  _editDetailRow = null;
}

document.getElementById('editDetailSaveBtn')?.addEventListener('click', saveEditDetail);
document.getElementById('editDetailCancelBtn')?.addEventListener('click', closeEditDetailModal);
document.getElementById('editDetailModalClose')?.addEventListener('click', closeEditDetailModal);
document.getElementById('editDetailModalBackdrop')?.addEventListener('click', closeEditDetailModal);
document.getElementById('editDetailInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveEditDetail();
});

// Match detail menu button delegation
document.addEventListener('click', (e) => {
  const menuBtn = e.target.closest('.match-detail-row__menu-btn');
  if (menuBtn) {
    e.stopPropagation();
    const row = menuBtn.closest('.match-detail-row');
    if (_activeContextMenuRow === row && _activeContextMenuEl) {
      closeContextMenu();
    } else {
      openDetailContextMenu(row, menuBtn);
    }
    return;
  }
});

// ---- Data Sub-tabs ----
document.querySelectorAll('.data-sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const panelId = tab.dataset.dataTab;
    document.querySelectorAll('.data-sub-tab').forEach(t => t.classList.remove('data-sub-tab--active'));
    tab.classList.add('data-sub-tab--active');
    document.querySelectorAll('.data-sub-panel').forEach(p => {
      p.classList.toggle('data-sub-panel--hidden', p.dataset.dataPanel !== panelId);
    });
  });
});

// ---- Overlay Toggles ----
document.querySelectorAll('.overlay-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('overlay-toggle--on');
    updateOverlayStatusBar();
  });
});

// ---- Add Media Modal ----
function openAddMediaModal() {
  document.getElementById('addMediaModal')?.classList.add('open');
}
function closeAddMediaModal() {
  document.getElementById('addMediaModal')?.classList.remove('open');
}

document.getElementById('addMediaBtn')?.addEventListener('click', openAddMediaModal);
document.getElementById('addMediaBtnEmpty')?.addEventListener('click', openAddMediaModal);
document.getElementById('addMediaCancelBtn')?.addEventListener('click', closeAddMediaModal);
document.getElementById('addMediaModalClose')?.addEventListener('click', closeAddMediaModal);
document.getElementById('addMediaModalBackdrop')?.addEventListener('click', closeAddMediaModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('addMediaModal')?.classList.contains('open')) closeAddMediaModal();
});

// Add Media sub-tabs
document.getElementById('addMediaSubTabs')?.addEventListener('click', (e) => {
  const tab = e.target.closest('.app-modal__sub-tab');
  if (!tab) return;
  document.querySelectorAll('#addMediaSubTabs .app-modal__sub-tab').forEach(t => t.classList.remove('app-modal__sub-tab--active'));
  tab.classList.add('app-modal__sub-tab--active');
});

// Select media item from list
let _mediaCardCounter = 200;
document.getElementById('addMediaList')?.addEventListener('click', (e) => {
  const selectBtn = e.target.closest('.media-list-item__select');
  if (!selectBtn) return;
  const mediaName = selectBtn.dataset.mediaName || 'Media File';
  const mediaMeta = selectBtn.dataset.mediaMeta || '';

  // Highlight briefly then close
  selectBtn.textContent = '✓ Selected';
  selectBtn.disabled = true;
  setTimeout(() => {
    closeAddMediaModal();
    selectBtn.textContent = 'Select';
    selectBtn.disabled = false;

    // Add new media card to active media tab group
    const targetGroup = document.querySelector(`.media-group[data-media-tab="${activeMediaTabId}"]`);
    const cardsContainer = targetGroup?.querySelector('.group-cards');
    if (!cardsContainer) return;

    const cardId = `media-card-new-${++_mediaCardCounter}`;
    const _DRAG_SVG = `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="graphic-card graphic-card--default" data-card-id="${cardId}" data-card-type="media">
      <div class="graphic-card__inner">
        <div class="graphic-card__drag">${_DRAG_SVG}</div>
        <div class="graphic-card__thumbnail media-card__thumbnail"></div>
        <div class="graphic-card__info">
          <div class="graphic-card__title-row"><span class="graphic-card__name">${mediaName}</span></div>
          <p class="graphic-card__meta">${mediaMeta}</p>
        </div>
        <div class="graphic-card__actions">
          <button class="btn-icon btn-icon--edit" data-card="${cardId}" data-name="${mediaName}" data-vars="0" data-card-type="media" title="Edit media">${_SVG_EDIT}</button>
          <button class="btn btn--secondary btn--md btn--preview">${_SVG_PREVIEW} Preview</button>
        </div>
      </div>
    </div>`;
    cardsContainer.appendChild(wrapper.firstElementChild);
  }, 300);
});

// ---- Behind Graphics toggle (panel) ----
document.getElementById('panelBehindGfxToggle')?.addEventListener('click', function() {
  this.classList.toggle('active');
});

// ---- Volume slider live value ----
document.getElementById('panelVolumeSlider')?.addEventListener('input', function() {
  const valEl = document.getElementById('panelVolumeValue');
  if (valEl) valEl.textContent = `${this.value}%`;
});

// ---- Preview URL toolbar button ----
document.getElementById('previewUrlBtn')?.addEventListener('click', () => {
  writeLigrPreview();
  window.open('preview.html', 'ligr_preview');
});

// Init overlay selector on load
initOverlaySelector();

// ============================================================
// DRAG & DROP — Sidebar Sections
// ============================================================
let _dragSrcSection = null;

document.querySelectorAll('.sidebar-section').forEach(section => {
  const handle = section.querySelector('.sidebar-section__drag');
  if (!handle) return;

  handle.setAttribute('draggable', 'true');
  handle.addEventListener('dragstart', (e) => {
    _dragSrcSection = section;
    section.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  handle.addEventListener('dragend', () => {
    section.classList.remove('dragging');
    _dragSrcSection = null;
    document.querySelectorAll('.sidebar-section').forEach(s => s.classList.remove('drag-over'));
  });

  section.addEventListener('dragover', (e) => {
    if (_dragSrcSection && _dragSrcSection !== section) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      section.classList.add('drag-over');
    }
  });
  section.addEventListener('dragleave', () => section.classList.remove('drag-over'));
  section.addEventListener('drop', (e) => {
    e.preventDefault();
    if (_dragSrcSection && _dragSrcSection !== section) {
      const parent = section.parentNode;
      const srcIdx = Array.from(parent.children).indexOf(_dragSrcSection);
      const tgtIdx = Array.from(parent.children).indexOf(section);
      if (srcIdx < tgtIdx) parent.insertBefore(_dragSrcSection, section.nextSibling);
      else parent.insertBefore(_dragSrcSection, section);
    }
    section.classList.remove('drag-over');
  });
});

// ============================================================
// DRAG & DROP — Graphic Cards within groups
// ============================================================
let _dragSrcCard = null;

function initCardDnD() {
  document.querySelectorAll('.graphic-card').forEach(card => {
    const handle = card.querySelector('.graphic-card__drag');
    if (!handle || handle.dataset.dndCard) return;
    handle.dataset.dndCard = '1';

    handle.setAttribute('draggable', 'true');
    handle.addEventListener('dragstart', (e) => {
      _dragSrcCard = card;
      card.classList.add('card-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.stopPropagation();
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('card-dragging');
      _dragSrcCard = null;
      document.querySelectorAll('.graphic-card').forEach(c => c.classList.remove('card-drag-over'));
    });
    card.addEventListener('dragover', (e) => {
      if (_dragSrcCard && _dragSrcCard !== card && !_dragSrcGroup) {
        e.preventDefault();
        card.classList.add('card-drag-over');
      }
    });
    card.addEventListener('dragleave', () => card.classList.remove('card-drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      if (_dragSrcCard && _dragSrcCard !== card) {
        const srcParent = _dragSrcCard.parentNode;
        const tgtParent = card.parentNode;
        const srcIdx = Array.from(srcParent.children).indexOf(_dragSrcCard);
        const tgtIdx = Array.from(tgtParent.children).indexOf(card);
        if (srcParent === tgtParent && srcIdx < tgtIdx) {
          tgtParent.insertBefore(_dragSrcCard, card.nextSibling);
        } else {
          tgtParent.insertBefore(_dragSrcCard, card);
        }
        updateGroupBadges();
      }
      document.querySelectorAll('.graphic-card').forEach(c => c.classList.remove('card-drag-over'));
    });
  });
}

// ============================================================
// DRAG & DROP — Groups
// ============================================================
let _dragSrcGroup = null;

function initGroupDnD() {
  document.querySelectorAll('.graphic-group').forEach(group => {
    const handle = group.querySelector('.group-header__drag');
    if (!handle || handle.dataset.dndGroup) return;
    handle.dataset.dndGroup = '1';

    handle.setAttribute('draggable', 'true');
    handle.addEventListener('dragstart', (e) => {
      _dragSrcGroup = group;
      group.classList.add('group-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    group.addEventListener('dragend', () => {
      group.classList.remove('group-dragging');
      _dragSrcGroup = null;
      document.querySelectorAll('.graphic-group').forEach(g => g.classList.remove('group-drag-over'));
    });
    group.addEventListener('dragover', (e) => {
      if (_dragSrcGroup && _dragSrcGroup !== group) {
        e.preventDefault();
        group.classList.add('group-drag-over');
      }
    });
    group.addEventListener('dragleave', () => group.classList.remove('group-drag-over'));
    group.addEventListener('drop', (e) => {
      e.preventDefault();
      if (_dragSrcGroup && _dragSrcGroup !== group) {
        const parent = group.parentNode;
        const srcIdx = Array.from(parent.children).indexOf(_dragSrcGroup);
        const tgtIdx = Array.from(parent.children).indexOf(group);
        if (srcIdx < tgtIdx) parent.insertBefore(_dragSrcGroup, group.nextSibling);
        else parent.insertBefore(_dragSrcGroup, group);
      }
      document.querySelectorAll('.graphic-group').forEach(g => g.classList.remove('group-drag-over'));
    });
  });
}

initCardDnD();
initGroupDnD();

// ============================================================
// MULTI-SELECT & GROUP CREATION
// ============================================================
let _selectedCards = new Set();

function toggleCardSelection(card) {
  if (_selectedCards.has(card)) {
    _selectedCards.delete(card);
    card.classList.remove('graphic-card--selected');
  } else {
    _selectedCards.add(card);
    card.classList.add('graphic-card--selected');
  }
  updateSelectionPanel();
}

function clearSelection() {
  _selectedCards.forEach(c => c.classList.remove('graphic-card--selected'));
  _selectedCards.clear();
  updateSelectionPanel();
}

function updateSelectionPanel() {
  const panel = document.getElementById('selectionPanel');
  const count = document.getElementById('selectionCount');
  if (!panel) return;
  if (_selectedCards.size === 0) { panel.style.display = 'none'; return; }
  panel.style.display = '';
  if (count) count.textContent = `${_selectedCards.size} Selected`;
}

// ⌘/Ctrl+click to select cards
document.addEventListener('click', (e) => {
  if (!e.metaKey && !e.ctrlKey) return;
  const card = e.target.closest('.graphic-card:not(.graphic-card__extension)');
  if (!card) return;
  e.preventDefault();
  toggleCardSelection(card);
});

// ⌘G / Ctrl+G → create group; Escape → clear
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
    if (_selectedCards.size > 0) { e.preventDefault(); promptCreateGroup(); }
  }
  if (e.key === 'Escape') clearSelection();
});

document.getElementById('selectionGroupBtn')?.addEventListener('click', promptCreateGroup);
document.getElementById('selectionClearBtn')?.addEventListener('click', clearSelection);

let _groupCounter = 10;

function promptCreateGroup() {
  if (_selectedCards.size === 0) return;
  const name = prompt('Group name:', 'New Group');
  if (!name) return;
  createGroupFromSelection(name);
}

function createGroupFromSelection(name) {
  const cards = Array.from(_selectedCards);
  const firstCard = cards[0];
  const contentArea = firstCard.closest('.graphics-content');
  if (!contentArea) return;

  const groupId = `g${++_groupCounter}`;
  const tabAttr = firstCard.closest('.graphic-group')?.dataset.tab || 'tab-pre-match';
  const count = cards.length;

  const _DRAG_DOTS = `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>`;
  const _CHEVRON_UP = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="#344054" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const _DOTS_VERT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="#98a2b3"/><circle cx="8" cy="8" r="1.5" fill="#98a2b3"/><circle cx="8" cy="13" r="1.5" fill="#98a2b3"/></svg>`;

  const group = document.createElement('div');
  group.className = 'graphic-group';
  group.dataset.tab = tabAttr;
  group.innerHTML = `
    <div class="group-header">
      <div class="group-header__drag">${_DRAG_DOTS}</div>
      <button class="group-header__collapse" data-group="${groupId}">${_CHEVRON_UP}</button>
      <div class="group-header__info">
        <span class="group-header__name">${name}</span>
        <span class="group-header__meta">${count} Graphic${count !== 1 ? 's' : ''}</span>
      </div>
      <button class="group-header__menu">${_DOTS_VERT}</button>
    </div>
    <div class="group-cards" id="${groupId}-cards"></div>
  `;

  const groupCards = group.querySelector('.group-cards');
  cards.forEach(card => {
    const origGroup = card.closest('.graphic-group');
    groupCards.appendChild(card);
    const origGroupCards = origGroup?.querySelector('.group-cards');
    if (origGroup && origGroupCards && origGroupCards.children.length === 0) origGroup.remove();
  });

  contentArea.insertBefore(group, contentArea.firstElementChild);
  clearSelection();
  updateGroupBadges();
  initCardDnD();
  initGroupDnD();
  initGroupMenus();

  // Wire collapse for new group
  const collapseBtn = group.querySelector('.group-header__collapse');
  if (collapseBtn) {
    const cards_ = group.querySelector('.group-cards');
    if (cards_) {
      cards_.style.maxHeight = cards_.scrollHeight + 'px';
      collapseBtn.addEventListener('click', () => {
        const isOpen = cards_.style.maxHeight !== '0px';
        if (isOpen) {
          cards_.style.transition = 'max-height 0.25s ease, opacity 0.2s ease';
          cards_.style.maxHeight = '0px';
          cards_.style.opacity = '0';
          cards_.style.overflow = 'hidden';
          collapseBtn.querySelector('svg path')?.setAttribute('d', 'M4 6l4 4 4-4');
        } else {
          cards_.style.maxHeight = '2000px';
          cards_.style.opacity = '1';
          cards_.style.overflow = 'visible';
          collapseBtn.querySelector('svg path')?.setAttribute('d', 'M4 10l4-4 4 4');
        }
      });
    }
  }
}

// ============================================================
// GROUP HEADER MENU — Dropdown with Delete option
// ============================================================
function initGroupMenus() {
  document.querySelectorAll('.group-header__menu').forEach(btn => {
    if (btn.dataset.menuInit) return;
    btn.dataset.menuInit = '1';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close any existing dropdowns
      document.querySelectorAll('.group-dropdown').forEach(d => d.remove());

      const group = btn.closest('.graphic-group');
      if (!group) return;

      const dropdown = document.createElement('div');
      dropdown.className = 'group-dropdown';
      dropdown.innerHTML = `
        <button class="group-dropdown__item group-dropdown__item--danger" data-action="delete">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M13 4l-1 9a2 2 0 01-2 2H6a2 2 0 01-2-2L3 4"/></svg>
          Delete Group
        </button>
      `;

      dropdown.addEventListener('click', (ev) => {
        const action = ev.target.closest('[data-action]')?.dataset.action;
        if (action === 'delete') deleteGroup(group);
        dropdown.remove();
      });

      group.querySelector('.group-header').appendChild(dropdown);
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.group-dropdown').forEach(d => d.remove());
  }, { capture: false });
}

function deleteGroup(group) {
  const contentArea = group.closest('.graphics-content');
  const cards = Array.from(group.querySelectorAll('.group-cards > .graphic-card'));

  if (cards.length > 0 && contentArea) {
    // Find a sibling group to move cards to, or create one
    const sibling = group.previousElementSibling?.matches?.('.graphic-group')
      ? group.previousElementSibling
      : group.nextElementSibling?.matches?.('.graphic-group')
        ? group.nextElementSibling
        : null;

    if (sibling) {
      const tgtCards = sibling.querySelector('.group-cards');
      if (tgtCards) cards.forEach(c => tgtCards.appendChild(c));
      updateGroupMeta(sibling);
    } else {
      // Create a standalone group
      const _DRAG_DOTS = `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>`;
      const _CHEVRON_UP = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="#344054" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const _DOTS_VERT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="#98a2b3"/><circle cx="8" cy="8" r="1.5" fill="#98a2b3"/><circle cx="8" cy="13" r="1.5" fill="#98a2b3"/></svg>`;
      const gid = `g${++_groupCounter}`;
      const newGroup = document.createElement('div');
      newGroup.className = 'graphic-group';
      newGroup.dataset.tab = group.dataset.tab;
      newGroup.innerHTML = `
        <div class="group-header">
          <div class="group-header__drag">${_DRAG_DOTS}</div>
          <button class="group-header__collapse" data-group="${gid}">${_CHEVRON_UP}</button>
          <div class="group-header__info">
            <span class="group-header__name">Ungrouped</span>
            <span class="group-header__meta">${cards.length} Graphics</span>
          </div>
          <button class="group-header__menu">${_DOTS_VERT}</button>
        </div>
        <div class="group-cards" id="${gid}-cards"></div>
      `;
      const newCards = newGroup.querySelector('.group-cards');
      cards.forEach(c => newCards.appendChild(c));
      contentArea.insertBefore(newGroup, group);
    }
  }

  group.remove();
  updateGroupBadges();
  initGroupMenus();
}

function updateGroupMeta(group) {
  const count = group.querySelectorAll('.group-cards > .graphic-card').length;
  const meta = group.querySelector('.group-header__meta');
  if (meta) meta.textContent = `${count} Graphic${count !== 1 ? 's' : ''}`;
}

initGroupMenus();

// ============================================================
// OVERLAY STATUS BAR — header chips reflecting overlay toggle state
// ============================================================
function updateOverlayStatusBar() {
  const bar = document.getElementById('overlayStatusBar');
  if (!bar) return;

  const rows = document.querySelectorAll('.overlay-row');
  if (!rows.length) { bar.innerHTML = ''; return; }

  bar.innerHTML = Array.from(rows).map(row => {
    const name = row.querySelector('.overlay-row__name')?.textContent?.trim() || 'Overlay';
    const isOn = row.querySelector('.overlay-toggle')?.classList.contains('overlay-toggle--on');
    const dotClass = isOn ? 'overlay-status-chip__dot--live' : 'overlay-status-chip__dot--offline';
    const stateLabel = isOn ? 'On' : 'Off';
    return `<span class="overlay-status-chip" title="${name} · ${stateLabel}">
      <span class="overlay-status-chip__dot ${dotClass}"></span>
      <span class="overlay-status-chip__label">${name}</span>
    </span>`;
  }).join('');
}

updateOverlayStatusBar();

// Initial header buttons state
updateHeaderButtons();

// ---- Media props real-time preview sync ----
// When any media property changes, push the state to localStorage so the overlay reacts
const _mediaPropInputs = ['panelVolumeSlider','panelMediaW','panelMediaH','panelMediaX','panelMediaY','panelMediaRotation','panelMediaOpacity'];
_mediaPropInputs.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    // Update volume display
    if (id === 'panelVolumeSlider') {
      const valEl = document.getElementById('panelVolumeValue');
      if (valEl) valEl.textContent = el.value + '%';
    }
    // Write preview state so overlay reflects media changes
    writeLigrPreview();
  });
});

console.log('[LIGR Control Room] Loaded ✓');

// ============================================================
// ADD GRAPHIC MODAL
// ============================================================
const GRAPHIC_TEMPLATES = [
  { id: 'lower-third',     name: 'Lower Third',      category: 'Broadcast', vars: 2, varNames: ['Player Name', 'Club / Position'] },
  { id: 'score-bug',       name: 'Score Bug',         category: 'Score',     vars: 2, varNames: ['Home Score', 'Away Score'] },
  { id: 'player-card',     name: 'Player Card',       category: 'Broadcast', vars: 3, varNames: ['First Name', 'Surname', 'Position'] },
  { id: 'stat-bar',        name: 'Stat Bar',          category: 'Stats',     vars: 2, varNames: ['Stat Label', 'Value'] },
  { id: 'match-clock',     name: 'Match Clock',       category: 'Clock',     vars: 0, varNames: [] },
  { id: 'team-lineup',     name: 'Team Lineup',       category: 'Broadcast', vars: 1, varNames: ['Team'] },
  { id: 'sponsored-banner',name: 'Sponsored Banner',  category: 'Sponsors',  vars: 1, varNames: ['Sponsor Name'] },
];

let _agSelectedTemplate = null;
let _agCurrentStep = 1;
let _agLastAddedCard = null;

function openAddGraphicModal() {
  _agSelectedTemplate = null;
  _agCurrentStep = 1;
  const searchEl = document.getElementById('agSearchInput');
  if (searchEl) searchEl.value = '';
  const nameEl = document.getElementById('agNameInput');
  if (nameEl) nameEl.value = '';
  const extToggle = document.getElementById('agExtensionToggle');
  if (extToggle) extToggle.classList.remove('active');
  const contBtn = document.getElementById('agContinueBtn');
  if (contBtn) contBtn.disabled = true;
  _agShowStep(1);
  _agRenderTemplates('');
  _agPopulateTabSelect();
  _agPopulateOverlaySelect();
  document.getElementById('agModal')?.classList.add('open');
  setTimeout(() => document.getElementById('agSearchInput')?.focus(), 120);
}

function closeAddGraphicModal() {
  document.getElementById('agModal')?.classList.remove('open');
}

function _agShowStep(step) {
  _agCurrentStep = step;
  document.getElementById('agStep1')?.classList.toggle('ag-step--hidden', step !== 1);
  document.getElementById('agStep2')?.classList.toggle('ag-step--hidden', step !== 2);
  const backBtn = document.getElementById('agBackBtn');
  if (backBtn) backBtn.classList.toggle('ag-modal__back--visible', step === 2);
  const titleEl = document.getElementById('agModalTitle');
  if (titleEl) titleEl.textContent = step === 1 ? 'ADD GRAPHIC' : 'CONFIGURE GRAPHIC';
}

function _agRenderTemplates(query) {
  const list = document.getElementById('agTemplateList');
  if (!list) return;
  const q = query.toLowerCase().trim();
  const filtered = GRAPHIC_TEMPLATES.filter(t =>
    !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
  );
  if (!filtered.length) {
    list.innerHTML = '<div class="ag-template-empty">No graphics found</div>';
    return;
  }
  list.innerHTML = filtered.map(t => {
    const varLabel = t.vars === 0 ? 'No variables' : `${t.vars} variable${t.vars !== 1 ? 's' : ''}`;
    return `<div class="ag-tpl-card" data-template-id="${t.id}" role="button" tabindex="0">
      <div class="ag-tpl-thumb ag-tpl-thumb--${t.id}"></div>
      <div class="ag-tpl-card__body">
        <span class="ag-tpl-card__name">${t.name}</span>
        <span class="ag-tpl-card__meta">${t.category} · ${varLabel}</span>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.ag-tpl-card').forEach(item => {
    item.addEventListener('click', () => _agSelectTemplate(item.dataset.templateId));
    item.addEventListener('dblclick', () => {
      _agSelectTemplate(item.dataset.templateId);
      _agGoToStep2();
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _agSelectTemplate(item.dataset.templateId);
        if (e.key === 'Enter') _agGoToStep2();
      }
    });
  });

  // Re-apply selection highlight if a template was already chosen
  if (_agSelectedTemplate) {
    const existing = list.querySelector(`[data-template-id="${_agSelectedTemplate.id}"]`);
    if (existing) existing.classList.add('ag-tpl-card--selected');
    else { _agSelectedTemplate = null; const c = document.getElementById('agContinueBtn'); if (c) c.disabled = true; }
  }
}

function _agSelectTemplate(id) {
  _agSelectedTemplate = GRAPHIC_TEMPLATES.find(t => t.id === id) || null;
  document.querySelectorAll('.ag-tpl-card').forEach(el => {
    el.classList.toggle('ag-tpl-card--selected', el.dataset.templateId === id);
  });
  const contBtn = document.getElementById('agContinueBtn');
  if (contBtn) contBtn.disabled = !_agSelectedTemplate;
}

function _agPopulateTabSelect() {
  const sel = document.getElementById('agTabSelect');
  if (!sel) return;
  const tabs = getAllTabs();
  sel.innerHTML = tabs.map(tab => {
    const label = tab.querySelector('.category-tab__label')?.textContent?.trim() || 'Tab';
    const tabId = tab.dataset.tabId;
    return `<option value="${tabId}"${tabId === activeTabId ? ' selected' : ''}>${label}</option>`;
  }).join('') || '<option value="">No tabs</option>';
  _agUpdateDefaultBtn();
}

function _agUpdateDefaultBtn() {
  const sel = document.getElementById('agTabSelect');
  const btn = document.getElementById('agAddDefaultBtn');
  if (!sel || !btn) return;
  const selectedText = sel.options[sel.selectedIndex]?.text || 'Default';
  btn.textContent = `Add to ${selectedText}`;
}

function _agPopulateOverlaySelect() {
  const sel = document.getElementById('agOverlaySelect');
  if (!sel) return;
  const rows = document.querySelectorAll('.overlay-row');
  if (rows.length) {
    sel.innerHTML = Array.from(rows).map((row, i) => {
      const name = row.querySelector('.overlay-row__name')?.textContent?.trim() || `Overlay ${i + 1}`;
      const ovId = row.querySelector('.overlay-toggle')?.dataset.overlayId || i;
      return `<option value="${ovId}">${name}</option>`;
    }).join('');
  } else {
    sel.innerHTML = '<option value="0">Default Overlay</option>';
  }
}

function _agGoToStep2() {
  if (!_agSelectedTemplate) return;
  // Populate preview card
  const previewName = document.getElementById('agPreviewName');
  if (previewName) previewName.textContent = _agSelectedTemplate.name;
  const previewMeta = document.getElementById('agPreviewMeta');
  const varLabel = _agSelectedTemplate.vars === 0 ? 'No variables' : `${_agSelectedTemplate.vars} variable${_agSelectedTemplate.vars !== 1 ? 's' : ''}`;
  if (previewMeta) previewMeta.textContent = `${_agSelectedTemplate.category} · ${varLabel}`;
  const nameEl = document.getElementById('agNameInput');
  if (nameEl) nameEl.value = _agSelectedTemplate.name;
  _agRenderVarFields();
  const varsSection = document.getElementById('agVarsSection');
  if (varsSection) varsSection.style.display = _agSelectedTemplate.vars > 0 ? '' : 'none';
  _agShowStep(2);
  setTimeout(() => { document.getElementById('agNameInput')?.select(); }, 80);
}

function _agRenderVarFields() {
  const container = document.getElementById('agVarFields');
  if (!container || !_agSelectedTemplate) return;
  if (_agSelectedTemplate.vars === 0) { container.innerHTML = ''; return; }
  container.innerHTML = _agSelectedTemplate.varNames.map((varName, i) => `
    <div class="ag-field">
      <label class="ag-field__label">${varName}</label>
      <input class="ag-field__input" type="text" id="agVar${i}" placeholder="Enter ${varName.toLowerCase()}…" />
    </div>
  `).join('');
}

function _agCommitCard(action) {
  if (!_agSelectedTemplate) return;
  const name = document.getElementById('agNameInput')?.value.trim() || _agSelectedTemplate.name;
  const tabId = document.getElementById('agTabSelect')?.value || activeTabId;
  const numVars = _agSelectedTemplate.vars;
  const hasExtension = document.getElementById('agExtensionToggle')?.classList.contains('active');

  const targetGroup = document.querySelector(`.graphic-group[data-tab="${tabId}"]`);
  if (!targetGroup) return;
  const cardsContainer = targetGroup.querySelector('.group-cards');
  if (!cardsContainer) return;

  const cardId = `card-new-${++_cardCounter}`;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = createCardHtml(cardId, name, numVars);
  const cardEl = wrapper.firstElementChild;

  if (hasExtension) {
    const extHtml = `<div class="graphic-card__extensions">
      <div class="graphic-card__extension graphic-card--default" data-card-id="${cardId}-ext">
        <div class="graphic-card__inner graphic-card__inner--sm">
          <div class="graphic-card__drag"><svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg></div>
          <div class="graphic-card__thumbnail graphic-card__thumbnail--sm"></div>
          <div class="graphic-card__info">
            <div class="graphic-card__title-row"><span class="graphic-card__name">${name} — Ext</span></div>
            <p class="graphic-card__meta">Extension</p>
          </div>
          <div class="graphic-card__actions">
            <button class="btn btn--secondary btn--md btn--preview">${_SVG_PREVIEW} Preview</button>
            <button class="btn btn--to-air-outline">${_SVG_TO_AIR} To Air</button>
          </div>
        </div>
      </div>
    </div>`;
    cardEl.insertAdjacentHTML('beforeend', extHtml);
  }

  cardsContainer.appendChild(cardEl);
  if (tabId !== activeTabId) switchTab(tabId);
  refreshGroupMeta(targetGroup);
  initCardDnD();
  _agLastAddedCard = { cardId, name, cardEl, tabId };

  closeAddGraphicModal();

  if (action === 'default') {
    _agShowToast(`"${name}" added to Default`);
  } else if (action === 'preview') {
    document.querySelectorAll('.graphic-card--preview-state').forEach(c => c.classList.remove('graphic-card--preview-state'));
    cardEl.classList.add('graphic-card--preview-state');
    openPanel(cardId, name, numVars);
    _previewCardId = cardId;
    writeLigrPreview(cardId, name);
    updateHeaderButtons();
    _agShowToast(`"${name}" added · now in Preview`);
  } else if (action === 'live') {
    setCardState(cardEl, 'on-air');
    updateGroupBadges();
    updateHeaderButtons();
    _agShowToast(`"${name}" sent Live`);
  }
}

function _agShowToast(msg) {
  const toast = document.getElementById('agToast');
  if (!toast) return;
  document.getElementById('agToastMsg').textContent = msg;
  toast.style.display = 'flex';
  // Force reflow for transition
  toast.offsetHeight; // eslint-disable-line
  toast.classList.add('ag-toast--visible');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('ag-toast--visible');
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 4500);
}

// ---- Wire up AG modal events ----
document.getElementById('agModalBackdrop')?.addEventListener('click', closeAddGraphicModal);
document.getElementById('agModalClose')?.addEventListener('click', closeAddGraphicModal);
document.getElementById('agBackBtn')?.addEventListener('click', () => _agShowStep(1));
document.getElementById('agCancelBtn')?.addEventListener('click', closeAddGraphicModal);
document.getElementById('agCancelBtn2')?.addEventListener('click', closeAddGraphicModal);
document.getElementById('agContinueBtn')?.addEventListener('click', _agGoToStep2);
document.getElementById('agAddDefaultBtn')?.addEventListener('click', () => _agCommitCard('default'));
document.getElementById('agAddPreviewBtn')?.addEventListener('click', () => _agCommitCard('preview'));
document.getElementById('agTabSelect')?.addEventListener('change', _agUpdateDefaultBtn);

// Extension toggle
document.getElementById('agExtensionToggle')?.addEventListener('click', function() {
  this.classList.toggle('active');
});

// Search filter
document.getElementById('agSearchInput')?.addEventListener('input', (e) => {
  _agRenderTemplates(e.target.value);
});

// Toast Undo
document.getElementById('agToastUndo')?.addEventListener('click', () => {
  if (_agLastAddedCard) {
    _agLastAddedCard.cardEl?.remove();
    const group = document.querySelector(`.graphic-group[data-tab="${_agLastAddedCard.tabId}"]`);
    if (group) refreshGroupMeta(group);
    updateGroupBadges();
    updateHeaderButtons();
    _agLastAddedCard = null;
  }
  const toast = document.getElementById('agToast');
  if (toast) {
    toast.classList.remove('ag-toast--visible');
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('agModal')?.classList.contains('open')) {
    closeAddGraphicModal();
  }
});

/* ============================================================
   TEAMS TAB
   ============================================================ */

const PITCH_SLOTS = [
  { left: 50, top: 91 },   // 0 GK
  { left: 80, top: 81 },   // 1 RB
  { left: 62, top: 81 },   // 2 CB-R
  { left: 38, top: 81 },   // 3 CB-L
  { left: 20, top: 81 },   // 4 LB
  { left: 50, top: 71 },   // 5 DM
  { left: 68, top: 63 },   // 6 CM-R
  { left: 32, top: 63 },   // 7 CM-L
  { left: 80, top: 55 },   // 8 RW
  { left: 50, top: 55 },   // 9 ST
  { left: 20, top: 55 },   // 10 LW
];

const _teamData = {
  home: {
    name: 'Melbourne Dragons',
    color: 'home',
    starting: [
      { num: 1,  name: 'Bertagnoli', pos: 'GK', slot: 0 },
      { num: 2,  name: 'Williams',   pos: 'RB', slot: 1 },
      { num: 4,  name: 'Thompson',   pos: 'CB', slot: 2 },
      { num: 5,  name: 'Johnson',    pos: 'CB', slot: 3 },
      { num: 3,  name: 'Davis',      pos: 'LB', slot: 4 },
      { num: 6,  name: 'Martinez',   pos: 'DM', slot: 5 },
      { num: 8,  name: 'Wilson',     pos: 'CM', slot: 6 },
      { num: 10, name: 'Anderson',   pos: 'CM', slot: 7 },
      { num: 7,  name: 'Garcia',     pos: 'RW', slot: 8 },
      { num: 9,  name: 'Harris',     pos: 'ST', slot: 9 },
      { num: 11, name: 'Taylor',     pos: 'LW', slot: 10 },
    ],
    bench: [
      { num: 12, name: 'Robinson', pos: 'GK' },
      { num: 14, name: 'Lewis',    pos: 'CB' },
      { num: 15, name: 'Walker',   pos: 'CM' },
      { num: 16, name: 'Scott',    pos: 'RW' },
      { num: 17, name: 'Evans',    pos: 'ST' },
    ],
  },
  away: {
    name: 'Sydney Sharks',
    color: 'away',
    starting: [
      { num: 1,  name: 'Mason',    pos: 'GK', slot: 0 },
      { num: 2,  name: 'Brown',    pos: 'RB', slot: 1 },
      { num: 4,  name: 'Turner',   pos: 'CB', slot: 2 },
      { num: 5,  name: 'Collins',  pos: 'CB', slot: 3 },
      { num: 3,  name: 'Adams',    pos: 'LB', slot: 4 },
      { num: 7,  name: 'Mitchell', pos: 'RM', slot: 6 },
      { num: 6,  name: 'Parker',   pos: 'CM', slot: 5 },
      { num: 8,  name: 'Cooper',   pos: 'CM', slot: 7 },
      { num: 11, name: 'Morgan',   pos: 'LM', slot: 10 },
      { num: 9,  name: 'Bailey',   pos: 'ST', slot: 9 },
      { num: 10, name: 'Reed',     pos: 'ST', slot: 8 },
    ],
    bench: [
      { num: 12, name: 'Murphy',  pos: 'GK' },
      { num: 13, name: 'Ward',    pos: 'CB' },
      { num: 14, name: 'Bell',    pos: 'CM' },
      { num: 15, name: 'Hughes',  pos: 'RW' },
      { num: 16, name: 'Wood',    pos: 'ST' },
    ],
  },
};

let _activeTeamTab = 'home';
let _dragSourceBench = null; // { teamKey, playerIndex }

function _renderTeamTab(teamKey) {
  const team = _teamData[teamKey];
  const pitchId = teamKey === 'home' ? 'teamPitch' : 'teamPitchAway';
  const pitch = document.getElementById(pitchId);
  if (!pitch) return;

  // Clear existing player nodes
  pitch.querySelectorAll('.pitch-player').forEach(n => n.remove());

  // Render pitch players
  team.starting.forEach((player, idx) => {
    const slot = PITCH_SLOTS[player.slot];
    const node = document.createElement('div');
    node.className = 'pitch-player is-drop-zone' + (teamKey === 'away' ? ' pitch-player--away' : '');
    node.style.left = slot.left + '%';
    node.style.top = slot.top + '%';
    node.dataset.startingIdx = idx;
    node.dataset.teamKey = teamKey;
    node.innerHTML = `
      <div class="pitch-player__badge">${player.num}</div>
      <div class="pitch-player__name">${player.name.split(' ')[0]}</div>
    `;

    node.addEventListener('dragover', (e) => {
      if (_dragSourceBench !== null) {
        e.preventDefault();
        node.classList.add('drag-over');
      }
    });
    node.addEventListener('dragleave', () => node.classList.remove('drag-over'));
    node.addEventListener('drop', (e) => {
      e.preventDefault();
      node.classList.remove('drag-over');
      if (_dragSourceBench === null) return;
      const { teamKey: srcTeam, benchIdx } = _dragSourceBench;
      if (srcTeam !== teamKey) return;

      const benchPlayer = team.bench[benchIdx];
      const pitchPlayer = { ...player };

      // Swap into pitch
      team.starting[idx] = { ...benchPlayer, slot: player.slot };
      // Move old pitch player to bench
      team.bench[benchIdx] = { num: pitchPlayer.num, name: pitchPlayer.name, pos: pitchPlayer.pos };

      _renderTeamTab(teamKey);
      _renderRoster(teamKey);
      _dragSourceBench = null;
    });

    pitch.appendChild(node);
  });

  _renderRoster(teamKey);
}

function _renderRoster(teamKey) {
  const team = _teamData[teamKey];
  const awayClass = teamKey === 'away' ? ' roster-row--away' : '';

  // Starting XI
  const xiEl = document.getElementById(teamKey === 'home' ? 'startingXiHome' : 'startingXiAway');
  if (xiEl) {
    xiEl.innerHTML = team.starting.map((p, idx) => `
      <div class="roster-row">
        <span class="roster-row__badge${awayClass ? ' roster-row--away' : ''}"
              style="${teamKey==='away' ? 'background:#991b1b' : ''}">${p.num}</span>
        <span class="roster-row__name">${p.name}</span>
        <span class="roster-row__pos">${p.pos}</span>
        <button class="roster-row__edit" data-ep-team="${teamKey}" data-ep-type="starting" data-ep-idx="${idx}"
                title="Edit player">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `).join('');
    xiEl.querySelectorAll('.roster-row__edit').forEach(btn => {
      btn.addEventListener('click', () => openEditPlayerModal(btn.dataset.epTeam, btn.dataset.epType, +btn.dataset.epIdx));
    });
  }

  // Bench
  const benchEl = document.getElementById(teamKey === 'home' ? 'benchHome' : 'benchAway');
  if (benchEl) {
    benchEl.innerHTML = team.bench.map((p, idx) => `
      <div class="roster-row roster-row--bench" draggable="true"
           data-team-key="${teamKey}" data-bench-idx="${idx}">
        <div class="roster-row__drag">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#d1d5db"/><circle cx="6" cy="2" r="1.5" fill="#d1d5db"/><circle cx="2" cy="7" r="1.5" fill="#d1d5db"/><circle cx="6" cy="7" r="1.5" fill="#d1d5db"/><circle cx="2" cy="12" r="1.5" fill="#d1d5db"/><circle cx="6" cy="12" r="1.5" fill="#d1d5db"/></svg>
        </div>
        <div class="roster-row__avatar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 14c0-2.4-2.4-4.3-5.3-4.3S2.7 11.6 2.7 14" stroke="#9ca3af" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="5" r="2.7" stroke="#9ca3af" stroke-width="1.3"/></svg>
        </div>
        <div class="roster-row__num-badge">${p.num}</div>
        <div class="roster-row__info">
          <span class="roster-row__name">${p.name}</span>
          <span class="roster-row__pos">${p.pos}</span>
        </div>
        <button class="roster-row__edit" data-ep-team="${teamKey}" data-ep-type="bench" data-ep-idx="${idx}"
                title="Edit player">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `).join('');

    benchEl.querySelectorAll('.roster-row--bench').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        const idx = +row.dataset.benchIdx;
        const tKey = row.dataset.teamKey;
        _dragSourceBench = { teamKey: tKey, benchIdx: idx };
        row.classList.add('roster-row--dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('roster-row--dragging');
        _dragSourceBench = null;
      });
    });

    benchEl.querySelectorAll('.roster-row__edit').forEach(btn => {
      btn.addEventListener('click', () => openEditPlayerModal(btn.dataset.epTeam, btn.dataset.epType, +btn.dataset.epIdx));
    });
  }
}

// Team Home/Away tab switching
document.querySelectorAll('.team-tabs-bar .team-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.teamTab;
    _activeTeamTab = key;
    document.querySelectorAll('.team-tabs-bar .team-tab').forEach(t => t.classList.toggle('team-tab--active', t.dataset.teamTab === key));
    document.getElementById('rosterPaneHome')?.classList.toggle('roster-pane--hidden', key !== 'home');
    document.getElementById('rosterPaneAway')?.classList.toggle('roster-pane--hidden', key !== 'away');
    _renderTeamTab(key);
  });
});

// Stats data — [home, label, away]
const _statsData = {
  top: [
    [43, 'Ball Possession', 57],
    [0.97, 'Expected Goals (xG)', 0.95],
    [6, 'Total Shots', 16],
    [6, 'Shots On Target', 10],
    [1, 'Big Chances', 2],
    [1, 'Big Chances Missed', 2],
    ['89.5%', 'Accurate Passes', '88.1%'],
    [7, 'Corners', 3],
  ],
  shots: [
    [6, 'Total Shots', 16],
    [6, 'Shots On Target', 10],
    [0, 'Shots Off Target', 6],
    [0, 'Blocked Shots', 1],
    [1, 'Big Chances', 2],
    [1, 'Big Chances Missed', 2],
    [4, 'Shots Inside Box', 11],
    [2, 'Shots Outside Box', 5],
    [0, 'Header Goals', 1],
    [1, 'Set Piece Goals', 0],
  ],
  passes: [
    [312, 'Total Passes', 348],
    ['89.5%', 'Pass Accuracy', '88.1%'],
    [18, 'Long Balls', 24],
    ['72.2%', 'Long Ball Accuracy', '66.7%'],
    [14, 'Crosses', 19],
    ['35.7%', 'Cross Accuracy', '31.6%'],
    [11, 'Throw-Ins', 14],
    [22, 'Final Third Entries', 31],
    [38, 'Clearances', 24],
    [7, 'Corners', 3],
  ],
  defence: [
    [18, 'Tackles', 22],
    ['61.1%', 'Tackle Success', '59.1%'],
    [14, 'Interceptions', 11],
    [38, 'Clearances', 24],
    [0, 'Blocked Shots', 1],
    [2, 'Errors Leading to Shot', 0],
    [3, 'Offsides', 1],
    [1, 'Penalty Conceded', 0],
  ],
  duels: [
    [54, 'Total Duels', 62],
    ['48.1%', 'Duels Won', '51.6%'],
    [38, 'Ground Duels', 44],
    ['47.4%', 'Ground Duels Won', '52.3%'],
    [16, 'Aerial Duels', 18],
    [9, 'Aerial Duels Won', 10],
    [22, 'Fouls Committed', 18],
    [18, 'Fouls Won', 22],
  ],
  xg: [
    [0.97, 'Expected Goals (xG)', 0.95],
    [0.84, 'xG On Target', 0.71],
    [0.13, 'xG Off Target', 0.24],
    [0.97, 'Non-Penalty xG', 0.95],
    [3, 'Goals Scored', 1],
    [0.31, 'xG Per Shot', 0.06],
    [2.03, 'xG Overperformance', 0.05],
  ],
  discipline: [
    [2, 'Yellow Cards', 3],
    [0, 'Red Cards', 0],
    [22, 'Fouls Committed', 18],
    [18, 'Fouls Won', 22],
    [3, 'Offsides', 1],
    [1, 'Penalty Conceded', 0],
    [0, 'Penalty Won', 1],
  ],
};

function _renderStatsBody(cat) {
  const body = document.getElementById('statsBody');
  if (!body) return;
  const rows = _statsData[cat] || [];
  body.innerHTML = rows.map(([home, label, away]) => {
    const hNum = parseFloat(home);
    const aNum = parseFloat(away);
    const isNum = !isNaN(hNum) && !isNaN(aNum);
    const total = isNum ? hNum + aNum : 100;
    const homePct = (isNum && total > 0) ? Math.round((hNum / total) * 100) : 50;
    const awayPct = 100 - homePct;
    return `<div class="stat-card">
      <div class="stat-card__row">
        <span class="stat-card__val">${home}</span>
        <span class="stat-card__label">${label}</span>
        <span class="stat-card__val">${away}</span>
      </div>
      <div class="stat-card__bar-track">
        <div class="stat-card__bar-home" style="width:${homePct}%"></div>
        <div class="stat-card__bar-away" style="width:${awayPct}%"></div>
      </div>
    </div>`;
  }).join('');
}

// Stats category tabs
document.querySelectorAll('.stats-cat').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stats-cat').forEach(b => b.classList.remove('stats-cat--active'));
    btn.classList.add('stats-cat--active');
    _renderStatsBody(btn.dataset.statsCat);
  });
});

// Initial render
_renderStatsBody('top');

// Set team names on tab buttons at startup
(function _initTeamTabNames() {
  const homeBtn = document.querySelector('.team-tab[data-team-tab="home"]');
  const awayBtn = document.querySelector('.team-tab[data-team-tab="away"]');
  if (homeBtn) homeBtn.textContent = _teamData.home.name;
  if (awayBtn) awayBtn.textContent = _teamData.away.name;
})();

// Init teams tab on first activation
document.querySelectorAll('.data-sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.dataset.dataTab === 'team' && !document.getElementById('teamPitch')?.querySelector('.pitch-player')) {
      _renderTeamTab(_activeTeamTab);
    }
  });
});

/* ============================================================
   EDIT PLAYER MODAL
   ============================================================ */

let _epContext = null; // { teamKey, type ('starting'|'bench'), idx }

function openEditPlayerModal(teamKey, type, idx) {
  const team = _teamData[teamKey];
  const player = type === 'starting' ? team.starting[idx] : team.bench[idx];
  if (!player) return;
  _epContext = { teamKey, type, idx };

  document.getElementById('epFirstName').value = player.name.split(' ')[0] || '';
  document.getElementById('epSecondName').value = player.name.split(' ').slice(1).join(' ') || '';
  document.getElementById('epNumber').value = player.num;
  const posEl = document.getElementById('epPosition');
  if (posEl) posEl.value = player.pos;

  document.getElementById('editPlayerModal')?.classList.add('open');
}

function closeEditPlayerModal() {
  document.getElementById('editPlayerModal')?.classList.remove('open');
  _epContext = null;
}

document.getElementById('editPlayerModalClose')?.addEventListener('click', closeEditPlayerModal);
document.getElementById('editPlayerModalBackdrop')?.addEventListener('click', closeEditPlayerModal);
document.getElementById('editPlayerCancelBtn')?.addEventListener('click', closeEditPlayerModal);

document.getElementById('editPlayerSaveBtn')?.addEventListener('click', () => {
  if (!_epContext) return;
  const { teamKey, type, idx } = _epContext;
  const team = _teamData[teamKey];
  const player = type === 'starting' ? team.starting[idx] : team.bench[idx];

  const first = document.getElementById('epFirstName').value.trim();
  const second = document.getElementById('epSecondName').value.trim();
  const num = parseInt(document.getElementById('epNumber').value, 10);
  const pos = document.getElementById('epPosition').value;

  player.name = [first, second].filter(Boolean).join(' ') || player.name;
  if (!isNaN(num) && num > 0) player.num = num;
  player.pos = pos;

  closeEditPlayerModal();
  _renderTeamTab(teamKey);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('editPlayerModal')?.classList.contains('open')) {
    closeEditPlayerModal();
  }
});

/* ============================================================
   SEARCH
   ============================================================ */

let _lastActivePaneId = 'graphics';
let _activeEventEl = null;
let _activeEventQuery = '';

const _searchField = document.getElementById('contentSearchField');
const _searchClearBtn = document.getElementById('searchClearBtn');
const _searchWrapper = document.getElementById('searchInputWrapper');
const _topbar = document.getElementById('contentTopbar');
const _topbarLeft = document.getElementById('contentTopbarLeft');
const _searchIconBtn = document.getElementById('searchIconBtn');

// ---- Responsive topbar ----

const _TOPBAR_COMPACT_PX  = 660; // below: preview icon-only, search shrinks
const _TOPBAR_MINIMAL_PX  = 490; // below: search hides, becomes icon

function _openTopbarSearch() {
  if (!_topbarLeft || !_topbar) return;
  // Fix current width so CSS can transition it to 0
  const w = _topbarLeft.offsetWidth;
  _topbarLeft.style.width = w + 'px';
  // Force reflow so the explicit width is registered before the transition
  // eslint-disable-next-line no-unused-expressions
  _topbarLeft.offsetWidth;
  _topbarLeft.style.width = '0';
  _topbar.classList.add('content-topbar--search-open');
  _searchField?.focus();
}

function _closeTopbarSearch() {
  if (!_topbarLeft || !_topbar) return;
  // scrollWidth returns actual content width even when overflow:hidden + width:0
  const targetW = _topbarLeft.scrollWidth;
  _topbar.classList.remove('content-topbar--search-open');
  _topbarLeft.style.width = targetW + 'px';
  _topbarLeft.addEventListener('transitionend', () => {
    _topbarLeft.style.width = ''; // Return to auto after animation
  }, { once: true });
}

function _isTopbarSearchOpen() {
  return _topbar?.classList.contains('content-topbar--search-open') ?? false;
}

_searchIconBtn?.addEventListener('click', () => {
  _openTopbarSearch();
});

// Close topbar search on Escape or when field loses focus with no value
_searchField?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && _isTopbarSearchOpen()) {
    _searchField.value = '';
    _searchWrapper?.classList.remove('search-input--active');
    _closeSearchPane();
    _closeTopbarSearch();
  }
});

_searchField?.addEventListener('blur', () => {
  if (_isTopbarSearchOpen() && !_searchField.value.trim()) {
    _closeTopbarSearch();
  }
});

// ResizeObserver — toggle compact/minimal classes
if (_topbar && typeof ResizeObserver !== 'undefined') {
  const _topbarRO = new ResizeObserver(entries => {
    const w = entries[0].contentRect.width;
    if (w < _TOPBAR_MINIMAL_PX) {
      _topbar.classList.remove('content-topbar--compact');
      _topbar.classList.add('content-topbar--minimal');
    } else if (w < _TOPBAR_COMPACT_PX) {
      _topbar.classList.add('content-topbar--compact');
      _topbar.classList.remove('content-topbar--minimal');
      // If we were in search-open, close it (now search is visible)
      if (_isTopbarSearchOpen()) _closeTopbarSearch();
    } else {
      _topbar.classList.remove('content-topbar--compact', 'content-topbar--minimal');
      if (_isTopbarSearchOpen()) _closeTopbarSearch();
    }
  });
  _topbarRO.observe(_topbar);
}

const _SVG_DRAG_DOTS = `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1.5" fill="#98a2b3"/><circle cx="6" cy="2" r="1.5" fill="#98a2b3"/><circle cx="2" cy="7" r="1.5" fill="#98a2b3"/><circle cx="6" cy="7" r="1.5" fill="#98a2b3"/><circle cx="2" cy="12" r="1.5" fill="#98a2b3"/><circle cx="6" cy="12" r="1.5" fill="#98a2b3"/></svg>`;
const _SVG_SLIDERS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H14M10 4H3M21 12H12M8 12H3M21 20H16M12 20H3"/><circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="20" r="2"/></svg>`;
const _SVG_EYE_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`;
const _SVG_SIGNAL_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.243 7.757a6 6 0 0 1 0 8.486m-8.486 0a6 6 0 0 1 0-8.486M4.93 19.071c-3.905-3.905-3.905-10.237 0-14.142m14.142 0c3.905 3.905 3.905 10.237 0 14.142M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>`;
const _SVG_X_CIRCLE_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;

function _openSearchPane(query) {
  _renderSearchResults(query);
  document.querySelectorAll('.content-pane').forEach(p => p.classList.add('content-pane--hidden'));
  document.getElementById('paneSearch')?.classList.remove('content-pane--hidden');
  document.querySelectorAll('.content-type-tab').forEach(t => t.classList.remove('content-type-tab--active'));
}

function _closeSearchPane() {
  _activeEventEl?.classList.remove('match-event--active');
  _activeEventEl = null;
  _activeEventQuery = '';
  _updateEventFilterChip();
  switchContentPane(_lastActivePaneId);
  document.querySelectorAll('.content-type-tab').forEach(t => {
    t.classList.toggle('content-type-tab--active', t.dataset.tab === _lastActivePaneId);
  });
}

function _currentQuery() {
  return _searchField?.value.trim() || _activeEventQuery || '';
}

function _updateEventFilterChip() {
  const chip = document.getElementById('eventFilterClear');
  const label = document.getElementById('eventFilterLabel');
  if (!chip) return;
  if (_activeEventEl) {
    const parts = [_activeEventEl.dataset.eventType];
    const player = _activeEventEl.dataset.eventPlayer;
    if (player && player !== '—') parts.push(player);
    if (_activeEventEl.dataset.eventTeam) parts.push(_activeEventEl.dataset.eventTeam);
    if (label) label.textContent = parts.join(' · ');
    chip.style.display = '';
  } else {
    chip.style.display = 'none';
  }
}

function _openEventFilter(eventEl) {
  const eventType = eventEl.dataset.eventType || '';
  const player = eventEl.dataset.eventPlayer || '';
  const team = eventEl.dataset.eventTeam || '';

  // Clear text search if active
  if (_searchField?.value) {
    _searchField.value = '';
    _searchWrapper?.classList.remove('search-input--active');
  }

  _activeEventEl?.classList.remove('match-event--active');
  _activeEventEl = eventEl;
  _activeEventEl.classList.add('match-event--active');
  _activeEventQuery = eventType;

  _renderSearchResults(eventType, { player, team });
  _updateEventFilterChip();
  document.querySelectorAll('.content-pane').forEach(p => p.classList.add('content-pane--hidden'));
  document.getElementById('paneSearch')?.classList.remove('content-pane--hidden');
  document.querySelectorAll('.content-type-tab').forEach(t => t.classList.remove('content-type-tab--active'));
}

function _buildSearchResultCardHtml(card) {
  const cardId = card.dataset.cardId;
  const isOnAir = card.classList.contains('graphic-card--on-air');
  const isPreviewing = card.classList.contains('graphic-card--preview-state');
  const name = card.querySelector('.graphic-card__name')?.textContent || '';
  const meta = card.querySelector('.graphic-card__meta')?.innerHTML || '';
  const numVars = parseInt(card.querySelector('[data-vars]')?.dataset.vars) || 0;
  const stateClass = isOnAir ? 'search-result-card--on-air' : (isPreviewing ? 'search-result-card--preview' : '');
  const previewExtraClass = isPreviewing ? 'btn--preview-active' : '';

  const rightBtn = isOnAir
    ? `<button class="btn btn--to-air btn--md" data-search-action="off-air" data-search-card="${cardId}">${_SVG_X_CIRCLE_SM} Off Air</button>`
    : `<button class="btn btn--to-air-outline btn--md" data-search-action="to-air" data-search-card="${cardId}">${_SVG_SIGNAL_SM} To Air</button>`;

  return `<div class="search-result-card ${stateClass}" data-search-result="${cardId}">
    <div class="search-result-card__inner">
      <div class="graphic-card__drag">${_SVG_DRAG_DOTS}</div>
      <div class="search-result-card__thumb"></div>
      <div class="search-result-card__info">
        <div class="search-result-card__name">${name}</div>
        <div class="search-result-card__meta">${meta}</div>
      </div>
      <div class="search-result-card__actions">
        <button class="btn-icon btn-icon--edit" data-search-action="edit" data-search-card="${cardId}" data-card="${cardId}" data-name="${name}" data-vars="${numVars}" title="Edit">
          ${_SVG_SLIDERS}
        </button>
        <button class="btn btn--secondary btn--md ${previewExtraClass}" data-search-action="preview" data-search-card="${cardId}">
          ${_SVG_EYE_SM} Preview
        </button>
        ${rightBtn}
      </div>
    </div>
  </div>`;
}

function _renderSearchResults(query, eventCtx) {
  const q = query.toLowerCase();

  const graphicCards = Array.from(document.querySelectorAll(
    '#paneGraphics .graphic-card:not(.graphic-card__extension):not([data-card-type="media"])'
  )).filter(c => (c.querySelector('.graphic-card__name')?.textContent || '').toLowerCase().includes(q));

  const mediaCards = Array.from(document.querySelectorAll(
    '#paneMedia .graphic-card[data-card-type="media"]'
  )).filter(c => (c.querySelector('.graphic-card__name')?.textContent || '').toLowerCase().includes(q));

  const totalCount = graphicCards.length + mediaCards.length;
  const onAirCount = [...graphicCards, ...mediaCards].filter(c => c.classList.contains('graphic-card--on-air')).length;

  const tabLabel = document.getElementById('searchTabLabel');
  const tabBadge = document.getElementById('searchTabBadge');
  const badgeCount = tabBadge?.querySelector('.search-tab-badge__count');

  if (tabLabel) {
    if (eventCtx) {
      const parts = [query];
      if (eventCtx.player && eventCtx.player !== '—') parts.push(eventCtx.player);
      if (eventCtx.team) parts.push(eventCtx.team);
      tabLabel.textContent = parts.join(' — ') + ` (${totalCount})`;
    } else {
      tabLabel.textContent = `All Results (${totalCount})`;
    }
  }
  if (tabBadge) tabBadge.style.display = onAirCount > 0 ? '' : 'none';
  if (badgeCount) badgeCount.textContent = onAirCount;

  const body = document.getElementById('searchResultsBody');
  if (!body) return;

  if (totalCount === 0) {
    body.innerHTML = `<div class="search-empty">
      <p class="search-empty__title">No results for "${query}"</p>
      <p class="search-empty__sub">Try a different graphic or media name</p>
    </div>`;
    return;
  }

  let html = '';
  if (graphicCards.length > 0) {
    html += `<div class="search-section">
      <h3 class="search-section__header">Graphics (${graphicCards.length})</h3>
      <div class="search-section__cards">${graphicCards.map(_buildSearchResultCardHtml).join('')}</div>
    </div>`;
  }
  if (mediaCards.length > 0) {
    html += `<div class="search-section">
      <h3 class="search-section__header">Media (${mediaCards.length})</h3>
      <div class="search-section__cards">${mediaCards.map(_buildSearchResultCardHtml).join('')}</div>
    </div>`;
  }
  body.innerHTML = html;
}

// Input handler
_searchField?.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  _searchWrapper?.classList.toggle('search-input--active', query.length > 0);
  if (query.length > 0) {
    _openSearchPane(query);
  } else {
    _closeSearchPane();
  }
});

// Clear button
_searchClearBtn?.addEventListener('click', () => {
  if (_searchField) _searchField.value = '';
  _searchWrapper?.classList.remove('search-input--active');
  _closeSearchPane();
  if (_isTopbarSearchOpen()) {
    _closeTopbarSearch();
  } else {
    _searchField?.focus();
  }
});

// ⌘K focus shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    _searchField?.focus();
  }
});

// Track last active pane when user clicks tabs normally
document.querySelectorAll('.content-type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    _lastActivePaneId = tab.dataset.tab;
    if (_searchField?.value) {
      _searchField.value = '';
      _searchWrapper?.classList.remove('search-input--active');
    }
    _activeEventEl?.classList.remove('match-event--active');
    _activeEventEl = null;
    _activeEventQuery = '';
  });
});

// Delegated handler for search result card actions
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-search-action]');
  if (!action) return;

  const cardId = action.dataset.searchCard;
  const actualCard = cardId ? document.querySelector(`[data-card-id="${cardId}"]`) : null;
  if (!actualCard) return;

  const act = action.dataset.searchAction;

  if (act === 'edit') {
    actualCard.querySelector('.btn-icon--edit')?.click();
  } else if (act === 'preview') {
    if (actualCard.classList.contains('graphic-card--on-air')) return;
    // Toggle: second click cancels preview
    if (actualCard.classList.contains('graphic-card--preview-state')) {
      actualCard.classList.remove('graphic-card--preview-state');
      _previewCardId = null;
      updateHeaderButtons();
      updatePanelButtons();
      _renderSearchResults(_currentQuery());
      return;
    }
    document.querySelectorAll('.graphic-card--preview-state').forEach(c => c.classList.remove('graphic-card--preview-state'));
    actualCard.classList.add('graphic-card--preview-state');
    _previewCardId = cardId;
    writeLigrPreview(cardId, actualCard.querySelector('.graphic-card__name')?.textContent || '');
    flashCard(actualCard);
    updateHeaderButtons();
    updatePanelButtons();
    _renderSearchResults(_currentQuery());
  } else if (act === 'to-air') {
    setCardState(actualCard, 'on-air');
    if (_previewCardId === cardId) _previewCardId = null;
    flashCard(actualCard);
    updateGroupBadges();
    updateHeaderButtons();
    updatePanelButtons();
    _renderSearchResults(_currentQuery());
  } else if (act === 'off-air') {
    setCardState(actualCard, 'default');
    updateGroupBadges();
    updateHeaderButtons();
    updatePanelButtons();
    _renderSearchResults(_currentQuery());
  }
}, true); // capture phase so it fires before other delegated handlers

// Event filter clear button
document.getElementById('eventFilterClear')?.addEventListener('click', () => {
  _closeSearchPane();
});

// ---- Match event click → filter search ----
document.getElementById('matchEventsList')?.addEventListener('click', (e) => {
  if (e.target.closest('.match-event__menu-btn')) return;
  const eventRow = e.target.closest('.match-event');
  if (!eventRow) return;

  if (eventRow.classList.contains('match-event--active')) {
    // Clicking the active event again deselects and closes the filter
    eventRow.classList.remove('match-event--active');
    _activeEventEl = null;
    _activeEventQuery = '';
    _closeSearchPane();
  } else {
    _openEventFilter(eventRow);
  }
});


// ---- Dark Mode Toggle ----
(function () {
  const html = document.documentElement;
  const btn = document.getElementById('darkModeToggle');
  if (!btn) return;

  // Default to dark mode; respect explicit saved preference only
  const saved = localStorage.getItem('cr-dark');
  if (saved !== '0') {
    html.classList.add('dark');
  }

  btn.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('cr-dark', html.classList.contains('dark') ? '1' : '0');
  });
})();
