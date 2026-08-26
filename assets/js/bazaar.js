let CURRENCY_NOTES, SPECIAL_DROPS, MILLENNIUM_DROPS, SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUESTS, QUEST_CATALOG, NAME_RE;
let ITEM_DATA = {};
let ITEM_ID_BY_TERM = {};
let MONSTER_ID_BY_TERM = {};
let questFilter = '';
const SECTION_BY_ID = {
  'bz-quick': 'currency', 'bz-drops': 'special', 'bz-mpc': 'special',
  'bz-services': 'bazaar', 'bz-exchange': 'bazaar', 'bz-effects': 'effects', 'bz-quests': 'quests'
};

function localized(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[window.WIKI_I18N.language] || value.en || value.cn || '';
  return value || '';
}

function appendRichText(node, text) {
  const source = String(text);
  let lastIndex = 0;
  source.replace(NAME_RE, (match, offset) => {
    if (offset > lastIndex) {
      node.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
    }
    const key = match.toLowerCase();
    const monsterId = MONSTER_ID_BY_TERM[match] || MONSTER_ID_BY_TERM[key];
    const itemId = monsterId ? null : (ITEM_ID_BY_TERM[match] || ITEM_ID_BY_TERM[key]);
    const displayName = monsterId ? window.WIKI_I18N.getMonster(monsterId) : (itemId ? (window.WIKI_I18N.getItem(itemId).name || match) : match);
    const term = document.createElement("span");
    term.className = monsterId ? "bazaar-monster" : "bazaar-term";
    term.appendChild(document.createTextNode(displayName));
    if (window.WIKI_I18N.language === "cn" && displayName !== match) {
      const original = document.createElement("span");
      original.className = monsterId ? "bazaar-monster-en" : "bazaar-term-en";
      original.textContent = `（${match}）`;
      term.appendChild(original);
    }
    term.title = match;
    if (itemId) {
      term.dataset.item = itemId;
      term.classList.add('wiki-item-link');
    }
    node.appendChild(term);
    lastIndex = offset + match.length;
  });
  if (lastIndex < source.length) {
    node.appendChild(document.createTextNode(source.slice(lastIndex)));
  }
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

function addBlock(parent, label, text, cols) {
  const wrap = el("div", "bazaar-blockwrap");
  wrap.appendChild(el("div", "bazaar-block-label", label));
  wrap.appendChild(el("pre", "bazaar-block" + (cols ? " bazaar-block--cols" : ""), text));
  parent.appendChild(wrap);
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
  const searchable = [quest.title, quest.location, quest.difficulty, quest.requirement, quest.reward, quest.counts, ...(quest.drops || []), ...(quest.notes || [])].join(' ').toLowerCase();
  if (keyword && searchable.includes(keyword)) { details.open = true; details.classList.add('is-search-match'); }

  const meta = el("div", "bazaar-meta");
  [
    [window.WIKI_I18N.language === 'cn' ? "位置" : "Location", quest.location],
    [window.WIKI_I18N.language === 'cn' ? "难度" : "Difficulty", quest.difficulty],
    [window.WIKI_I18N.language === 'cn' ? "进入条件" : "Entry requirements", quest.requirement],
    [window.WIKI_I18N.language === 'cn' ? "奖励 / 用途" : "Rewards / purpose", quest.reward]
  ].forEach(([key, value]) => {
    const box = el("div");
    const label = el("b", null, key + "：");
    box.appendChild(label);
    appendRichText(box, value || "-");
    meta.appendChild(box);
  });
  details.appendChild(meta);

  if (quest.drops?.length) {
    addBlock(details, "特殊掉落", quest.drops.join("\n"));
  }
  if (quest.counts) {
    addBlock(details, "怪物数量 / BOSS 信息", quest.counts, true);
  }
  if (quest.notes?.length) {
    addBlock(details, "备注", quest.notes.join("\n"));
  }
  parent.appendChild(details);
}

function addQuestDirectory(parent) {
  const keyword = questFilter;
  const detailsByTitle = new Map(QUESTS.map(quest => [quest.title.replace(/ \[EP\d\]$/, ''), quest]));
  Object.entries(QUEST_CATALOG).forEach(([episode, categories]) => {
    const ep = el('details', 'quest-episode');
    ep.open = Boolean(keyword);
    const epSummary = document.createElement('summary');
    epSummary.className = 'quest-episode__heading';
    epSummary.textContent = episode;
    ep.appendChild(epSummary);
    Object.entries(categories).forEach(([category, names]) => {
      const categoryDetails = el('details', 'quest-category');
      categoryDetails.open = Boolean(keyword);
      const categorySummary = document.createElement('summary');
      categorySummary.className = 'quest-category__heading';
      categorySummary.textContent = category;
      categoryDetails.appendChild(categorySummary);
      names.forEach(title => {
        const source = detailsByTitle.get(title);
        const quest = source ? { ...source, title, location: source.location || '' } : {
          title, location: '', difficulty: '', requirement: '', reward: '', drops: [], counts: '', notes: []
        };
        const haystack = [quest.title, quest.location, quest.difficulty, quest.requirement, quest.reward, quest.counts, ...(quest.drops || []), ...(quest.notes || [])].join(' ').toLowerCase();
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
  const quick = addSection(panel, "货币说明", "bz-quick");
  const quickGrid = el("div", "bazaar-grid");
  CURRENCY_NOTES.forEach(note => addListCard(quickGrid, note));
  quick.appendChild(quickGrid);

  const drops = addSection(panel, window.WIKI_I18N.language === 'cn' ? "特殊掉落 / 货币来源" : "Special drops / currency sources", "bz-drops");
  addTable(drops, ["物品", "任务 / 来源", "掉率 / 条件", "备注"], SPECIAL_DROPS, [1]);

  const millennium = addSection(panel, "The Phantasmal Dimension — special drops", "bz-mpc");
  addTable(millennium, ["物品", "怪物", "掉率 / 备注"], MILLENNIUM_DROPS);

  const services = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市服务" : "Bazaar services", "bz-services");
  addServiceCards(services);

  const exchanges = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市兑换" : "Bazaar exchanges", "bz-exchange");
  addExchangeCards(exchanges);

  const effects = addSection(panel, "装备效果 / 组合强化", "bz-effects");
  const effectGrid = el("div", "bazaar-grid");
  EQUIPMENT_EFFECTS.forEach(item => addListCard(effectGrid, { ...item, kind: "gear" }));
  effects.appendChild(effectGrid);

  const quests = addSection(panel, window.WIKI_I18N.language === 'cn' ? "任务速查" : "Quest quick reference", "bz-quests");
  const search = document.createElement('input');
  search.id = 'questSearchInput'; search.className = 'quest-search'; search.placeholder = window.WIKI_I18N.language === 'cn' ? '搜索任务名称、掉落物或怪物名称…' : 'Search quest, drop, or monster…';
  search.value = questFilter;
  search.addEventListener('input', () => { questFilter = search.value.trim().toLowerCase(); renderBazaarInfo(); applyBazaarSection(); document.querySelector('#questSearchInput').focus(); });
  quests.appendChild(search);
  addQuestDirectory(quests);

  root.appendChild(panel);
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
  root.dataset.activeSection = section;
  applyBazaarSection();
};

async function loadBazaarData() {
  await window.WIKI_I18N.ready;
  const names = ['currency-notes', 'special-drops', 'tpd-drops', 'bazaar-services', 'exchanges', 'endgame-gear', 'quests', 'quest-catalog'];
  const values = await Promise.all(names.map(name => fetch('assets/data/bazaar/' + name + '.json').then(res => res.json())));
  [CURRENCY_NOTES, SPECIAL_DROPS, MILLENNIUM_DROPS, SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUESTS, QUEST_CATALOG] = values;
  const [items, translation] = await Promise.all([
    fetch('assets/data/items.json').then(res => res.json()),
    fetch('assets/data/translation/cn.json').then(res => res.json())
  ]);
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
    [id, monster.name].filter(Boolean).forEach(term => {
      MONSTER_ID_BY_TERM[term] = id;
      MONSTER_ID_BY_TERM[term.toLowerCase()] = id;
    });
  });
  const escapeRegex = value => value.replace(/[-/\^$*+?.()|[\]{}]/g, String.fromCharCode(92) + "$&");
  NAME_RE = new RegExp([...new Set([...Object.keys(ITEM_ID_BY_TERM), ...Object.keys(MONSTER_ID_BY_TERM)])]
    .sort((a, b) => b.length - a.length).map(escapeRegex).join('|'), 'gi');
  renderBazaarInfo();
  applyBazaarSection();
  if (window.bindItemTooltips) window.bindItemTooltips(document.querySelector('#bazaar-info'));
}

loadBazaarData();

window.addEventListener("wiki-language-change", () => {
  if (ITEM_DATA && NAME_RE) {
    renderBazaarInfo();
    applyBazaarSection();
    if (window.bindItemTooltips) window.bindItemTooltips(document.querySelector('#bazaar-info'));
  }
});
