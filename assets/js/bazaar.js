let SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUEST_CATALOG, QUEST_DATA, NAME_RE, SCOPED_NAME_RE;
let ITEM_DATA = {};
let ITEM_ID_BY_TERM = {};
let MONSTER_ID_BY_TERM = {};
const SECTION_ID_NAMES = ['Viridia', 'Greenill', 'Skyly', 'Bluefull', 'Purplenum', 'Pinkal', 'Redria', 'Oran', 'Yellowboze', 'Whitill'];
const SECTION_ID_BY_TERM = Object.fromEntries(SECTION_ID_NAMES.map((name, id) => [name.toLowerCase(), { name, id }]));
let questFilter = '';
let BAZAAR_LANGUAGE = '';
const SECTION_BY_ID = {
  'bz-quick': 'currency', 'bz-drops': 'special', 'bz-mpc': 'special',
  'bz-services': 'bazaar', 'bz-exchange': 'bazaar', 'bz-effects': 'effects', 'bz-quests': 'quests'
};

function localized(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[window.WIKI_I18N.language] || value.en || value.cn || '';
  return value || '';
}

function appendRichText(node, text, includeSectionIds = false) {
  const source = String(text);
  let lastIndex = 0;
  const pattern = includeSectionIds ? SCOPED_NAME_RE : NAME_RE;
  const fragment = document.createDocumentFragment();
  source.replace(pattern, (match, offset) => {
    if (offset > lastIndex) {
      fragment.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
    }
    const key = match.toLowerCase();
    const sectionId = includeSectionIds ? SECTION_ID_BY_TERM[key] : null;
    const monsterId = MONSTER_ID_BY_TERM[match] || MONSTER_ID_BY_TERM[key];
    const itemId = monsterId ? null : (ITEM_ID_BY_TERM[match] || ITEM_ID_BY_TERM[key]);
    const displayName = sectionId ? '' : monsterId ? window.WIKI_I18N.getMonster(monsterId) : (itemId ? (window.WIKI_I18N.getItem(itemId).name || match) : match);
    if (sectionId) {
      const icon = document.createElement('img');
      icon.className = 'bazaar-section-id-icon';
      icon.src = `images/ids/${sectionId.name}.png`;
      icon.alt = sectionId.name;
      icon.title = `${sectionId.name} (${sectionId.id})`;
      fragment.appendChild(icon);
      lastIndex = offset + match.length;
      return match;
    }
    const term = document.createElement("span");
    term.className = monsterId ? "bazaar-monster" : "bazaar-term";
    term.appendChild(document.createTextNode(displayName));
    term.title = match;
    if (itemId) {
      term.dataset.item = itemId;
      term.classList.add('wiki-item-link');
    }
    fragment.appendChild(term);
    lastIndex = offset + match.length;
  });
  if (lastIndex < source.length) {
    fragment.appendChild(document.createTextNode(source.slice(lastIndex)));
  }
  node.appendChild(fragment);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) appendRichText(node, text);
  return node;
}

function addListCard(parent, item) {
  const card = el("article", "bazaar-card" + (item.kind === "gear" ? " bazaar-card--gear" : ""));
  card.appendChild(el("h4", null, localized(item.title)));
  const ul = el("ul");
  (localized(item.lines) || item.lines || []).forEach(line => ul.appendChild(el("li", null, line)));
  card.appendChild(ul);
  parent.appendChild(card);
}

function addSection(parent, title, id) {
  const section = el("section", "bazaar-section");
  if (id) {
    section.id = id;
    section.dataset.view = SECTION_BY_ID[id] || 'currency';
  }
  section.appendChild(el("h3", null, title));
  parent.appendChild(section);
  return section;
}

function addBlock(parent, label, text) {
  const wrap = el("div", "bazaar-blockwrap");
  wrap.appendChild(el("div", "bazaar-block-label", label));
  const content = el("pre", "bazaar-block");
  appendRichText(content, localizeQuestText(text), true);
  wrap.appendChild(content);
  parent.appendChild(wrap);
}

function formatQuestDrops(drops) {
  return Object.entries(drops || {}).flatMap(([boss, entries]) =>
    Object.entries(entries || {}).map(([condition, reward]) => `${boss}：${condition}，${reward}`)
  ).join("\n");
}

function questNotes(notes) {
  if (Array.isArray(notes)) return notes;
  return notes?.[window.WIKI_I18N.language] || notes?.en || notes?.cn || [];
}

function questBaseTitle(title) {
  return title.replace(/\s+⭐+$/, '');
}

function localizeQuestText(value) {
  return String(value || '')
    .replace(/\bexcept\b/gi, window.WIKI_I18N.getTerm('except'))
    .replace(/\ball\s*ids\b|全\s*ID/gi, window.WIKI_I18N.getTerm('allIds'));
}

function questDropRows(episode) {
  const rows = [];
  Object.entries(QUEST_CATALOG[episode] || {}).forEach(([category, quests]) => {
    Object.entries(quests).forEach(([title, quest]) => {
      Object.entries(quest.drops || {}).forEach(([boss, entries]) => {
        Object.entries(entries || {}).forEach(([drop, note]) => {
          const match = drop.match(/^(.*?)(?:\s+(\d+\/\d+))?$/);
          rows.push([match?.[1] || drop, `${category} > ${questBaseTitle(title)}`, `${boss}${match?.[2] ? `：${match[2]}` : ''}`, note || '']);
        });
      });
    });
  });
  return rows;
}

function addScopedTable(parent, headers, rows, plainTextColumns = []) {
  const wrap = el("div", "bazaar-table-wrap");
  const table = el("table", "bazaar-table bazaar-table--" + headers.length);
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach(header => headRow.appendChild(el('th', null, header)));
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach((cell, index) => {
      const td = document.createElement('td');
      if (plainTextColumns.includes(index)) td.textContent = cell;
      else appendRichText(td, localizeQuestText(cell), true);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  parent.appendChild(wrap);
}

function bindSectionIdTooltips(root) {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  root.querySelectorAll('.bazaar-section-id-icon').forEach(icon => {
    const move = event => {
      tooltip.className = 'tooltip-section-id';
      tooltip.innerHTML = `<img src="${icon.src}" alt=""><strong>${icon.alt}</strong><span class="tooltip-section-id-number"> : ${icon.title.match(/\d+/)?.[0] || ''}</span>`;
      tooltip.style.display = 'block';
      const rect = tooltip.getBoundingClientRect();
      const left = Math.max(8, Math.min(event.clientX + 14, window.innerWidth - rect.width - 8));
      const top = Math.max(8, Math.min(event.clientY + 14, window.innerHeight - rect.height - 8));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    icon.addEventListener('mousemove', move);
    icon.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      tooltip.className = '';
    });
  });
}

function normalizeSearch(value) {
  return String(value || '').toLocaleLowerCase();
}

function monsterTerms(name) {
  return String(name).split(/\s*\/\s*/).flatMap(term => {
    const id = MONSTER_ID_BY_TERM[term] || MONSTER_ID_BY_TERM[normalizeSearch(term)];
    return [term, id, id ? window.WIKI_I18N.getMonster(id) : ''].filter(Boolean);
  });
}

function matchingMonsterIds(keyword) {
  if (!keyword) return new Set();
  return new Set(Object.entries(MONSTER_ID_BY_TERM)
    .filter(([term]) => normalizeSearch(term).includes(keyword))
    .map(([, id]) => id));
}

function questMonsterDataForKeyword(data, keyword) {
  if (!data || !keyword) return data;
  const matchingIds = matchingMonsterIds(keyword);
  if (!matchingIds.size) return data;
  const floors = Object.fromEntries(Object.entries(data.floors || {}).map(([floorId, floor]) => [floorId, {
    ...floor,
    monsters: Object.fromEntries(Object.entries(floor.monsters || {}).filter(([name]) => {
      const terms = monsterTerms(name).map(normalizeSearch);
      return terms.some(term => term.includes(keyword)) || terms.some(term => {
        const id = MONSTER_ID_BY_TERM[name] || MONSTER_ID_BY_TERM[normalizeSearch(name)];
        return id && matchingIds.has(id);
      });
    }))
  }]));
  return { ...data, floors };
}

function questCountText(data) {
  if (!data) return '';
  return Object.values(data.floors || {}).map(floor => [
    floor.floor_name,
    window.WIKI_I18N.getQuestArea(floor.floor_name),
    ...Object.entries(floor.monsters || {}).flatMap(([name, count]) => [name, ...monsterTerms(name), count])
  ]).flat().join(' ');
}

function addQuestCounts(parent, data, keyword = '') {
  if (!data) return;
  const wrap = el("div", "bazaar-blockwrap");
  wrap.appendChild(el("div", "bazaar-block-label", window.WIKI_I18N.text('label.monsters', 'Monster Counts / BOSS Info')));
  const grid = el("div", "quest-monster-grid");
  const displayData = questMonsterDataForKeyword(data, keyword);
  Object.values(displayData.floors || {}).forEach(floor => {
    if (!floor.total) return;
    const monsters = Object.entries(floor.monsters || {});
    if (!monsters.length) return;
    const area = el("section", "quest-monster-area");
    const areaName = window.WIKI_I18N.getQuestArea
      ? window.WIKI_I18N.getQuestArea(floor.floor_name)
      : floor.floor_name;
    area.appendChild(el("h4", null, areaName));
    const list = el("ul");
    monsters.forEach(([name, count]) => {
      const item = el("li");
      appendRichText(item, `${name}：${count}`, true);
      list.appendChild(item);
    });
    area.appendChild(list);
    grid.appendChild(area);
  });
  if (grid.children.length) {
    wrap.appendChild(grid);
    parent.appendChild(wrap);
  }
}

function highlightMatches(root, keyword) {
  if (!keyword) return;
  const terms = [keyword, ...Array.from(matchingMonsterIds(keyword)).map(id => window.WIKI_I18N.getMonster(id))]
    .filter(Boolean).sort((a, b) => b.length - a.length);
  if (!terms.length) return;
  const pattern = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    if (!pattern.test(node.nodeValue)) {
      pattern.lastIndex = 0;
      return;
    }
    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    node.nodeValue.replace(pattern, (match, _, offset) => {
      fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, offset)));
      const mark = document.createElement('mark');
      mark.className = 'quest-search-highlight';
      mark.textContent = match;
      fragment.appendChild(mark);
      lastIndex = offset + match.length;
      return match;
    });
    fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)));
    node.parentNode.replaceChild(fragment, node);
  });
}

function addTable(parent, headers, rows, plainTextColumns = []) {
  const wrap = el("div", "bazaar-table-wrap");
  const table = el("table", "bazaar-table bazaar-table--" + headers.length);
  const widths = headers.length === 4 ? [24, 30, 28, 18] : headers.length === 3 ? [34, 40, 26] : [];
  if (widths.length) {
    const colgroup = el("colgroup");
    widths.forEach(width => {
      const col = el("col");
      col.style.width = width + "%";
      colgroup.appendChild(col);
    });
    table.appendChild(colgroup);
  }
  const thead = el("thead");
  const tr = el("tr");
  headers.forEach(header => tr.appendChild(el("th", null, header)));
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach(row => {
    const r = el("tr");
    row.forEach((cell, index) => {
      const td = el("td");
      // 任务/来源是完整任务名，不参与道具名称替换。
      if (plainTextColumns.includes(index)) td.textContent = cell;
      else appendRichText(td, cell);
      r.appendChild(td);
    });
    tbody.appendChild(r);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  parent.appendChild(wrap);
}

function addServiceCards(parent) {
  const grid = el("div", "bazaar-grid");
  SERVICES.forEach(service => {
    const card = el("article", "bazaar-card");
    card.appendChild(el("h4", null, service.title));
    card.appendChild(el("p", null, service.detail));
    grid.appendChild(card);
  });
  parent.appendChild(grid);
}

function addExchangeCards(parent) {
  const grid = el("div", "bazaar-grid");
  EXCHANGES.forEach(exchange => {
    const card = el("article", "bazaar-card");
    card.appendChild(el("h4", null, exchange.title));
    card.appendChild(el("p", null, "" + exchange.location));
    const ul = el("ul");
    exchange.materials.forEach(line => ul.appendChild(el("li", null, line)));
    card.appendChild(ul);
    grid.appendChild(card);
  });
  parent.appendChild(grid);
}

function addQuest(parent, quest, keyword = '') {
  const details = el("details", "bazaar-details");
  const summary = document.createElement("summary");
  summary.textContent = quest.title; // 任务名保持英文，不与道具/怪物名称混淆。
  details.appendChild(summary);
  const searchable = [quest.title, quest.requirement, quest.reward, formatQuestDrops(quest.drops), questCountText(quest.monsterData), ...questNotes(quest.notes)].join(' ').toLowerCase();
  if (keyword && searchable.includes(keyword)) { details.open = true; details.classList.add('is-search-match'); }

  const meta = el("div", "bazaar-meta");
  [
    [window.WIKI_I18N.language === 'cn' ? "进入条件" : "Entry requirements", quest.requirement],
    [window.WIKI_I18N.language === 'cn' ? "奖励 / 用途" : "Rewards / purpose", quest.reward]
  ].filter(([, value]) => value).forEach(([key, value]) => {
    const box = el("div");
    const label = el("b", null, key + "：");
    box.appendChild(label);
    appendRichText(box, value);
    meta.appendChild(box);
  });
  if (meta.children.length) details.appendChild(meta);

  if (Object.keys(quest.drops || {}).length) {
    addBlock(details, window.WIKI_I18N.text('label.questDrops', 'Special Drops'), formatQuestDrops(quest.drops));
  }
  addQuestCounts(details, quest.monsterData, keyword);
  const notes = questNotes(quest.notes);
  if (notes.length) {
    addBlock(details, window.WIKI_I18N.text('label.notes', 'Notes'), notes.join("\n"));
  }
  highlightMatches(details, keyword);
  parent.appendChild(details);
}

function addQuestDirectory(parent) {
  const keyword = questFilter;
  Object.entries(QUEST_CATALOG).forEach(([episode, categories]) => {
    const ep = el('details', 'quest-episode');
    ep.open = Boolean(keyword);
    const epSummary = document.createElement('summary');
    epSummary.className = 'quest-episode__heading';
    epSummary.textContent = episode;
    ep.appendChild(epSummary);
    Object.entries(categories).forEach(([category, quests]) => {
      const categoryDetails = el('details', 'quest-category');
      categoryDetails.open = Boolean(keyword);
      const categorySummary = document.createElement('summary');
      categorySummary.className = 'quest-category__heading';
      categorySummary.textContent = category;
      categoryDetails.appendChild(categorySummary);
      Object.entries(quests).forEach(([title, source]) => {
        const quest = { ...source, title, monsterData: QUEST_DATA[episode]?.[questBaseTitle(title)] };
        const haystack = [quest.title, quest.requirement, quest.reward, formatQuestDrops(quest.drops), questCountText(quest.monsterData), ...questNotes(quest.notes)].join(' ').toLowerCase();
        if (!keyword || haystack.includes(keyword)) addQuest(categoryDetails, quest, keyword);
      });
      if (!categoryDetails.querySelector('.bazaar-details')) categoryDetails.hidden = true;
      else ep.appendChild(categoryDetails);
    });
    if (!ep.querySelector('.quest-category:not([hidden])')) ep.hidden = true;
    else parent.appendChild(ep);
  });
}

export function renderBazaarInfo(target = "#bazaar-info") {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) return;

  root.replaceChildren();
  const panel = el("section", "bazaar-panel");
  const drops = addSection(panel, window.WIKI_I18N.language === 'cn' ? "特殊掉落 / 货币来源" : "Special drops / currency sources", "bz-drops");
  ["EP1", "EP2", "EP4"].forEach(episode => {
    const tableTitle = `${episode} ${window.WIKI_I18N.text('label.specialDrops', 'Special Drops')}`;
    drops.appendChild(el("h4", "quest-drop-table-title", tableTitle));
    addScopedTable(drops, [window.WIKI_I18N.text('label.item', 'Item'), window.WIKI_I18N.text('label.source', 'Quest / Source'), window.WIKI_I18N.text('label.rate', 'Rate / Condition'), window.WIKI_I18N.text('label.notes', 'Notes')], questDropRows(episode), [1]);
  });

  const services = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市服务" : "Bazaar services", "bz-services");
  addServiceCards(services);

  const exchanges = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市兑换" : "Bazaar exchanges", "bz-exchange");
  addExchangeCards(exchanges);

  const effects = addSection(panel, "装备效果 / 组合强化", "bz-effects");
  const effectGrid = el("div", "bazaar-grid");
  EQUIPMENT_EFFECTS.forEach(item => addListCard(effectGrid, { ...item, kind: "gear" }));
  effects.appendChild(effectGrid);

  if (window.WIKI_ACTIVE_VIEW === 'quests') {
    const quests = addSection(panel, window.WIKI_I18N.language === 'cn' ? "任务速查" : "Quest quick reference", "bz-quests");
    const search = document.createElement('input');
    search.id = 'questSearchInput'; search.className = 'quest-search'; search.placeholder = window.WIKI_I18N.language === 'cn' ? '搜索任务名称、掉落物或怪物名称…' : 'Search quest, drop, or monster…';
    search.value = questFilter;
    let isComposing = false;
    let skipNextInput = false;
    const updateQuestSearch = () => {
      questFilter = normalizeSearch(search.value.trim());
      renderBazaarInfo();
      applyBazaarSection();
      const nextSearch = document.querySelector('#questSearchInput');
      nextSearch?.focus();
      nextSearch?.setSelectionRange(questFilter.length, questFilter.length);
    };
    search.addEventListener('compositionstart', () => { isComposing = true; });
    search.addEventListener('compositionend', () => { isComposing = false; skipNextInput = true; updateQuestSearch(); });
    search.addEventListener('input', () => {
      if (skipNextInput) { skipNextInput = false; return; }
      if (!isComposing) updateQuestSearch();
    });
    quests.appendChild(search);
    addQuestDirectory(quests);
  }

  root.appendChild(panel);
  BAZAAR_LANGUAGE = window.WIKI_I18N.language;
}

function applyBazaarSection() {
  const root = document.querySelector('#bazaar-info');
  if (!root) return;
  const section = root.dataset.activeSection || window.WIKI_ACTIVE_VIEW || 'currency';
  root.querySelectorAll('.bazaar-section').forEach(node => {
    node.hidden = node.dataset.view !== section;
  });
}

window.setBazaarSection = section => {
  const root = document.querySelector('#bazaar-info');
  if (!root) return;
  if (BAZAAR_LANGUAGE !== window.WIKI_I18N.language || (section === 'quests' && !root.querySelector('#bz-quests'))) {
    renderBazaarInfo(root);
    if (window.bindItemTooltips) window.bindItemTooltips(root);
    bindSectionIdTooltips(root);
  }
  root.dataset.activeSection = section;
  applyBazaarSection();
};

async function loadBazaarData() {
  await window.WIKI_I18N.ready;
  const names = ['bazaar-services', 'exchanges', 'endgame-gear', 'quest-catalog'];
  const values = await Promise.all(names.map(name => fetch('assets/data/bazaar/' + name + '.json').then(res => res.json())));
  [SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUEST_CATALOG] = values;
  const questEpisodes = await Promise.all(['EP1', 'EP2', 'EP4'].map(episode =>
    fetch(`assets/data/quest/quest_${episode}.json`).then(res => res.json())
  ));
  QUEST_DATA = Object.fromEntries(['EP1', 'EP2', 'EP4'].map((episode, index) => [
    episode,
    Object.fromEntries(questEpisodes[index].map(quest => [quest.name.replace(/ \[EP\d\]$/, ''), quest]))
  ]));
  const items = await fetch('assets/data/items.json').then(res => res.json());
  const translation = { monsters: Object.fromEntries(window.WIKI_I18N.getMonsterEntries()) };
  ITEM_DATA = items;
  window.WIKI_I18N.setItems(ITEM_DATA);
  ITEM_ID_BY_TERM = {};
  Object.entries(ITEM_DATA).forEach(([id, item]) => {
    [id, item.name?.cn].filter(Boolean).forEach(term => {
      ITEM_ID_BY_TERM[term] = id;
      ITEM_ID_BY_TERM[term.toLowerCase()] = id;
    });
  });
  MONSTER_ID_BY_TERM = {};
  Object.entries(translation.monsters || {}).forEach(([id, monster]) => {
    [id, monster.name, monster.name?.cn, monster.name?.en].filter(Boolean).forEach(term => {
      MONSTER_ID_BY_TERM[term] = id;
      MONSTER_ID_BY_TERM[term.toLowerCase()] = id;
    });
  });
  const escapeRegex = value => value.replace(/[-/\^$*+?.()|[\]{}]/g, String.fromCharCode(92) + "$&");
  const nameTerms = [...new Set([...Object.keys(ITEM_ID_BY_TERM), ...Object.keys(MONSTER_ID_BY_TERM)])]
    .sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
  NAME_RE = new RegExp(nameTerms, 'gi');
  const scopedTerms = [...new Set([...Object.keys(SECTION_ID_BY_TERM), ...Object.keys(ITEM_ID_BY_TERM), ...Object.keys(MONSTER_ID_BY_TERM)])]
    .sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
  SCOPED_NAME_RE = new RegExp(scopedTerms, 'gi');
  renderBazaarInfo();
  applyBazaarSection();
  if (window.bindItemTooltips) window.bindItemTooltips(document.querySelector('#bazaar-info'));
  bindSectionIdTooltips(document.querySelector('#bazaar-info'));
}

loadBazaarData();

window.addEventListener("wiki-language-change", () => {
  if (ITEM_DATA && NAME_RE) {
    if (['special', 'bazaar', 'effects', 'quests'].includes(window.WIKI_ACTIVE_VIEW)) renderBazaarInfo();
    applyBazaarSection();
    if (window.bindItemTooltips) window.bindItemTooltips(document.querySelector('#bazaar-info'));
    bindSectionIdTooltips(document.querySelector('#bazaar-info'));
  }
});
