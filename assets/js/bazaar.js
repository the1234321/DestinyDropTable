let CURRENCY_NOTES, SPECIAL_DROPS, MILLENNIUM_DROPS, SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUESTS, NAME_ZH, NAME_RE;
let ITEM_DATA = {};
const SECTION_BY_ID = {
  'bz-quick': 'currency', 'bz-drops': 'special', 'bz-mpc': 'tpd',
  'bz-services': 'services', 'bz-exchange': 'exchange', 'bz-effects': 'effects', 'bz-quests': 'quests'
};

function appendRichText(node, text) {
  const source = String(text);
  let lastIndex = 0;
  source.replace(NAME_RE, (match, offset) => {
    if (offset > lastIndex) {
      node.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
    }
    const term = document.createElement("span");
    term.className = "bazaar-term";
    term.appendChild(document.createTextNode(NAME_ZH[match]));
    const original = document.createElement("span");
    original.className = "bazaar-term-en";
    original.textContent = `（${match}）`;
    term.appendChild(original);
    term.title = match;
    const itemName = ITEM_DATA[NAME_ZH[match]] ? NAME_ZH[match] : (ITEM_DATA[match] ? match : null);
    if (itemName) {
      term.dataset.item = itemName;
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
  card.appendChild(el("h4", null, item.title));
  const ul = el("ul");
  item.lines.forEach(line => ul.appendChild(el("li", null, line)));
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

function addTable(parent, headers, rows) {
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
    row.forEach(cell => r.appendChild(el("td", null, cell)));
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
    card.appendChild(el("p", null, "位置 / NPC：" + exchange.location));
    const ul = el("ul");
    exchange.materials.forEach(line => ul.appendChild(el("li", null, line)));
    card.appendChild(ul);
    grid.appendChild(card);
  });
  parent.appendChild(grid);
}

function addQuest(parent, quest) {
  const details = el("details", "bazaar-details");
  details.appendChild(el("summary", null, quest.title));

  const meta = el("div", "bazaar-meta");
  [
    ["位置", quest.location],
    ["难度", quest.difficulty],
    ["进入条件", quest.requirement],
    ["奖励 / 用途", quest.reward]
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

export function renderBazaarInfo(target = "#bazaar-info") {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) return;

  root.replaceChildren();
  const panel = el("section", "bazaar-panel");
  const quick = addSection(panel, "货币说明", "bz-quick");
  const quickGrid = el("div", "bazaar-grid");
  CURRENCY_NOTES.forEach(note => addListCard(quickGrid, note));
  quick.appendChild(quickGrid);

  const drops = addSection(panel, "特殊掉落 / 货币来源", "bz-drops");
  addTable(drops, ["物品", "任务 / 来源", "掉率 / 条件", "备注"], SPECIAL_DROPS);

  const millennium = addSection(panel, "The Phantasmal Dimension 特殊掉落", "bz-mpc");
  addTable(millennium, ["物品", "怪物", "掉率 / 备注"], MILLENNIUM_DROPS);

  const services = addSection(panel, "集市服务", "bz-services");
  addServiceCards(services);

  const exchanges = addSection(panel, "集市兑换", "bz-exchange");
  addExchangeCards(exchanges);

  const effects = addSection(panel, "装备效果 / 组合强化", "bz-effects");
  const effectGrid = el("div", "bazaar-grid");
  EQUIPMENT_EFFECTS.forEach(item => addListCard(effectGrid, { ...item, kind: "gear" }));
  effects.appendChild(effectGrid);

  const quests = addSection(panel, "任务资料", "bz-quests");
  QUESTS.forEach(quest => addQuest(quests, quest));

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
  const names = ['currency-notes', 'special-drops', 'tpd-drops', 'bazaar-services', 'exchanges', 'equipment-effects', 'quests', 'translations'];
  const values = await Promise.all(names.map(name => fetch('assets/data/bazaar/' + name + '.json').then(res => res.json())));
  [CURRENCY_NOTES, SPECIAL_DROPS, MILLENNIUM_DROPS, SERVICES, EXCHANGES, EQUIPMENT_EFFECTS, QUESTS, NAME_ZH] = values;
  ITEM_DATA = await fetch('assets/data/items.json').then(res => res.json());
  const escapeRegex = value => value.replace(/[-/\^$*+?.()|[\]{}]/g, String.fromCharCode(92) + "$&");
  NAME_RE = new RegExp(Object.keys(NAME_ZH).sort((a, b) => b.length - a.length).map(escapeRegex).join('|'), 'g');
  renderBazaarInfo();
  applyBazaarSection();
  if (window.bindItemTooltips) window.bindItemTooltips(document.querySelector('#bazaar-info'));
}

loadBazaarData();
