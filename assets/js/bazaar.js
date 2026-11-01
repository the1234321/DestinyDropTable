let SERVICES, EXCHANGES, RECIPES, SET_BONUSES, QUEST_CATALOG, QUEST_DATA, NAME_RE, SCOPED_NAME_RE;
let ITEM_DATA = {};
let ITEM_ID_BY_TERM = {};
let MONSTER_ID_BY_TERM = {};
const SECTION_ID_NAMES = ['Viridia', 'Greenill', 'Skyly', 'Bluefull', 'Purplenum', 'Pinkal', 'Redria', 'Oran', 'Yellowboze', 'Whitill'];
const SECTION_ID_BY_TERM = Object.fromEntries(SECTION_ID_NAMES.map((name, id) => [name.toLowerCase(), { name, id }]));
let questFilter = '';
let BAZAAR_LANGUAGE = '';
const QUEST_SEARCH_INDEX = new WeakMap();
const SECTION_BY_ID = {
  'bz-quick': 'currency', 'bz-drops': 'special', 'bz-mpc': 'special',
  'bz-services': 'bazaar', 'bz-exchange': 'exchange', 'bz-crafting': 'crafting', 'bz-quests': 'quests'
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
    if (monsterId) {
      const monsterInfo = window.WIKI_I18N.getMonsterMeta(monsterId);
      term.dataset.difficulty = String(monsterInfo.difficulty);
      if (monsterInfo.image) {
        const image = document.createElement("img");
        image.className = "bazaar-monster__image";
        image.src = monsterInfo.image;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        term.appendChild(image);
      }
    }
    term.appendChild(document.createTextNode(displayName));
    term.title = match;
    if (itemId) {
      term.dataset.item = itemId;
      if (window.WIKI_HAS_EQUIPMENT?.(itemId)) {
        term.classList.add('wiki-item-link');
        term.dataset.equipmentAvailable = "true";
      }
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

function addQuestDrops(parent, drops) {
  const wrap = el("div", "bazaar-blockwrap quest-drops-wrap");
  wrap.appendChild(el("div", "bazaar-block-label", window.WIKI_I18N.text('nav.special', 'Special Drops')));
  const table = el("table", "quest-drop-table");
  const header = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const labels = window.WIKI_I18N.language === 'cn'
    ? ["怪物", "掉落物", "掉率", "ID"]
    : ["Monster", "Drop item", "Rate", "Section ID"];
  labels.forEach(label => headerRow.appendChild(el("th", null, label)));
  header.appendChild(headerRow);
  table.appendChild(header);

  const body = document.createElement("tbody");
  Object.entries(drops || {}).forEach(([bosses, entries]) => {
    const monsterNames = bosses.split(",").map(name => name.trim()).filter(Boolean);
    Object.entries(entries || {}).forEach(([drop, ids]) => {
      const match = drop.match(/^(.*?)\s+(\d+\/\d+)\s*$/);
      const row = document.createElement("tr");
      const monsterCell = el("td", "quest-drop-table__monster");
      monsterNames.forEach((name, index) => {
        if (index) monsterCell.appendChild(document.createTextNode(" "));
        const monster = el("span", "quest-drop-monster");
        appendRichText(monster, name, true);
        monsterCell.appendChild(monster);
      });
      const itemCell = el("td", "quest-drop-table__item");
      appendRichText(itemCell, match?.[1] || drop, true);
      const rateCell = el("td", "quest-drop-table__rate", match?.[2] || "—");
      const idCell = el("td", "quest-drop-table__ids");
      appendRichText(idCell, localizeQuestText(ids), true);
      row.append(monsterCell, itemCell, rateCell, idCell);
      body.appendChild(row);
    });
  });
  table.appendChild(body);
  wrap.appendChild(table);
  parent.appendChild(wrap);
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

function questDropRows() {
  const rows = [];
  ['EP1', 'EP2', 'EP4'].forEach(episode => {
    Object.entries(QUEST_CATALOG[episode] || {}).forEach(([category, quests]) => {
      Object.entries(quests).forEach(([title, quest]) => {
        Object.entries(quest.drops || {}).forEach(([boss, entries]) => {
          Object.entries(entries || {}).forEach(([drop, note]) => {
            const match = drop.match(/^(.*?)(?:\s+(\d+\/\d+))?$/);
            rows.push([match?.[1] || drop, `${episode} > ${category} > ${questBaseTitle(title)}`, `${boss}${match?.[2] ? `：${match[2]}` : ''}`, note || '']);
          });
        });
      });
    });
  });
  return rows;
}

function addScopedTable(parent, headers, rows, plainTextColumns = [], className = "") {
  const wrap = el("div", "bazaar-table-wrap");
  const table = el("table", `bazaar-table bazaar-table--${headers.length} ${className}`.trim());
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
      if (className === "bazaar-table--special-drops" && index === 1) {
        td.className = "special-drop-source";
        const [episode, category, ...titleParts] = String(cell).split(" > ");
        if (titleParts.length) {
          const episodeLabel = document.createElement("span");
          episodeLabel.className = "special-drop-source__episode";
          episodeLabel.textContent = episode;
          const categoryLabel = document.createElement("span");
          categoryLabel.className = "special-drop-source__category";
          categoryLabel.textContent = category;
          const questLabel = document.createElement("span");
          questLabel.className = "special-drop-source__quest";
          questLabel.textContent = titleParts.join(" > ");
          td.append(episodeLabel, document.createTextNode(" "), categoryLabel, document.createTextNode(" "), questLabel);
        } else {
          td.textContent = cell;
        }
      } else if (plainTextColumns.includes(index)) td.textContent = cell;
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

function monsterTerms(name) {
  return String(name).split(/\s*\/\s*/).flatMap(term => {
    const id = MONSTER_ID_BY_TERM[term] || MONSTER_ID_BY_TERM[window.WIKI_SEARCH.normalize(term)];
    return [term, id, id ? window.WIKI_I18N.getMonster(id) : ''].filter(Boolean);
  });
}

function matchingMonsterIds(keyword) {
  if (!keyword) return new Set();
  return new Set(Object.entries(MONSTER_ID_BY_TERM)
    .filter(([term]) => window.WIKI_SEARCH.normalize(term).includes(keyword))
    .map(([, id]) => id));
}

function questMonsterDataForKeyword(data, keyword) {
  if (!data || !keyword) return data;
  const matchingIds = matchingMonsterIds(keyword);
  if (!matchingIds.size) return data;
  const floors = Object.fromEntries(Object.entries(data.floors || {}).map(([floorId, floor]) => [floorId, {
    ...floor,
    monsters: Object.fromEntries(Object.entries(floor.monsters || {}).filter(([name]) => {
      const terms = monsterTerms(name).map(term => window.WIKI_SEARCH.normalize(term));
      return terms.some(term => term.includes(keyword)) || terms.some(term => {
        const id = MONSTER_ID_BY_TERM[name] || MONSTER_ID_BY_TERM[window.WIKI_SEARCH.normalize(name)];
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

function questSearchText(quest, source) {
  let languageIndex = QUEST_SEARCH_INDEX.get(source);
  if (!languageIndex) {
    languageIndex = new Map();
    QUEST_SEARCH_INDEX.set(source, languageIndex);
  }
  const language = window.WIKI_I18N.language;
  if (languageIndex.has(language)) return languageIndex.get(language);
  const text = window.WIKI_SEARCH.normalize([
    quest.title,
    quest.requirement,
    quest.reward,
    formatQuestDrops(quest.drops),
    questCountText(quest.monsterData),
    ...questNotes(quest.notes)
  ].join(' '));
  languageIndex.set(language, text);
  return text;
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
    const list = el("div", "quest-monster-list");
    monsters.forEach(([name, count]) => {
      const item = el("div", "quest-monster-row");
      const monster = el("span", "quest-monster-row__name");
      appendRichText(monster, name, true);
      const amount = el("span", "quest-monster-row__count", count);
      item.append(monster, amount);
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

function addCraftingCards(parent) {
  const recipes = el("section", "crafting-subsection");
  recipes.dataset.craftingSection = "recipes";
  recipes.appendChild(el("h3", null, window.WIKI_I18N.language === 'cn' ? "合成公式" : "Crafting recipes"));
  parent.appendChild(recipes);
  const recipeGrid = el("div", "crafting-grid");
  RECIPES.forEach(recipe => {
    const card = el("article", "bazaar-card crafting-card");
    card.appendChild(el("h4", "crafting-card__result", recipe.result));
    const label = window.WIKI_I18N.language === 'cn' ? "合成材料" : "Components";
    card.appendChild(el("div", "crafting-card__label", label));
    const components = el("div", "crafting-card__items");
    recipe.components.filter(Boolean).forEach(item => {
      const name = el("span", "crafting-card__item");
      appendRichText(name, item);
      components.appendChild(name);
    });
    card.appendChild(components);
    recipeGrid.appendChild(card);
  });
  recipes.appendChild(recipeGrid);

  const sets = el("section", "crafting-subsection");
  sets.dataset.craftingSection = "sets";
  sets.appendChild(el("h3", null, window.WIKI_I18N.language === 'cn' ? "套装效果" : "Set bonuses"));
  parent.appendChild(sets);
  const setGrid = el("div", "crafting-grid");
  const effectLabels = {
    ATA: ["命中", "Accuracy"], ATP: ["攻击力", "Attack power"],
    attack_range: ["攻击范围", "Attack range"], attack_speed: ["攻击速度", "Attack speed"],
    attack_action: ["攻击动作", "Attack action"], targets: ["目标数", "Targets"],
    hits: ["命中段数", "Hits"], piercing: ["贯穿", "Piercing"]
  };
  SET_BONUSES.forEach(set => {
    const card = el("article", "bazaar-card crafting-card crafting-card--set");
    const items = el("div", "crafting-card__items");
    set.items.filter(Boolean).forEach(item => {
      const name = el("span", "crafting-card__item");
      appendRichText(name, item);
      items.appendChild(name);
    });
    card.appendChild(items);
    const effects = el("dl", "crafting-card__effects");
    Object.entries(set.effect || {}).forEach(([key, value]) => {
      const label = effectLabels[key];
      const term = el("dt", null, label ? label[window.WIKI_I18N.language === 'cn' ? 0 : 1] : key);
      const displayValue = typeof value === "boolean"
        ? (window.WIKI_I18N.language === 'cn' ? (value ? "是" : "否") : (value ? "Yes" : "No"))
        : localizeQuestText(value);
      const description = el("dd", null, displayValue === "increased"
        ? window.WIKI_I18N.text('boost.increased', window.WIKI_I18N.language === 'cn' ? "提升" : "Increased")
        : displayValue);
      effects.append(term, description);
    });
    card.appendChild(effects);
    setGrid.appendChild(card);
  });
  sets.appendChild(setGrid);
}

function addQuest(parent, quest, keyword = '') {
  const details = el("details", "bazaar-details");
  const summary = document.createElement("summary");
  const title = document.createElement("span");
  title.className = "quest-title";
  const stars = quest.title.match(/\s*(⭐+)$/u)?.[1] || "";
  if (quest.requirement) {
    const required = el("span", "quest-ticket-tag quest-ticket-tag--required",
      window.WIKI_I18N.language === 'cn' ? "需要门票" : "Ticket required");
    summary.appendChild(required);
  }
  if (quest.reward) {
    const reward = el("span", "quest-ticket-tag quest-ticket-tag--reward",
      window.WIKI_I18N.language === 'cn' ? "可获得门票" : "Ticket reward");
    summary.appendChild(reward);
  }
  title.textContent = quest.title.replace(/\s*⭐+$/u, "");
  summary.appendChild(title);
  if (stars) {
    const rating = el("span", "quest-rating", stars);
    rating.setAttribute("aria-label", window.WIKI_I18N.language === 'cn' ? `${Array.from(stars).length} 星` : `${Array.from(stars).length} stars`);
    summary.appendChild(rating);
  }
  details.appendChild(summary);
  if (keyword) { details.open = true; details.classList.add('is-search-match'); }

  if (Object.keys(quest.drops || {}).length) {
    addQuestDrops(details, quest.drops);
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
        if (!keyword || questSearchText(quest, source).includes(keyword)) addQuest(categoryDetails, quest, keyword);
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
  const drops = addSection(panel, window.WIKI_I18N.language === 'cn' ? "特殊掉落表" : "Special drops / currency sources", "bz-drops");
  addScopedTable(drops, [window.WIKI_I18N.text('label.item', 'Item'), window.WIKI_I18N.text('label.source', 'Quest / Source'), window.WIKI_I18N.text('label.rate', 'Rate / Condition'), window.WIKI_I18N.text('label.notes', 'Notes')], questDropRows(), [1], "bazaar-table--special-drops");

  const services = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市服务" : "Bazaar services", "bz-services");
  addServiceCards(services);

  const exchanges = addSection(panel, window.WIKI_I18N.language === 'cn' ? "集市兑换" : "Bazaar exchanges", "bz-exchange");
  addExchangeCards(exchanges);

  const crafting = addSection(panel, window.WIKI_I18N.language === 'cn' ? "合成/套装" : "Crafting / Sets", "bz-crafting");
  if (window.WIKI_ACTIVE_VIEW === 'crafting') addCraftingCards(crafting);

  if (window.WIKI_ACTIVE_VIEW === 'quests') {
    const quests = addSection(panel, window.WIKI_I18N.language === 'cn' ? "任务速查" : "Quest quick reference", "bz-quests");
    const search = document.createElement('input');
    search.id = 'questSearchInput'; search.className = 'quest-search'; search.placeholder = window.WIKI_I18N.language === 'cn' ? '搜索任务名称、掉落物或怪物名称…' : 'Search quest, drop, or monster…';
    search.value = questFilter;
    const directory = el('div', 'quest-directory');
    window.WIKI_SEARCH.bind(search, query => {
      questFilter = query;
      directory.replaceChildren();
      addQuestDirectory(directory);
    });
    quests.appendChild(search);
    quests.appendChild(directory);
    addQuestDirectory(directory);
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
  root.querySelectorAll('#bz-crafting .crafting-subsection').forEach(node => {
    node.hidden = node.dataset.craftingSection !== (window.WIKI_CRAFTING_SECTION || 'recipes');
  });
}

let bazaarDataPromise;
function ensureBazaarData() {
  if (!bazaarDataPromise) {
    bazaarDataPromise = loadBazaarData().catch(error => {
      bazaarDataPromise = null;
      throw error;
    });
  }
  return bazaarDataPromise;
}

function renderAndBindBazaar(root) {
  renderBazaarInfo(root);
  if (window.bindItemTooltips) window.bindItemTooltips(root);
  bindSectionIdTooltips(root);
  applyBazaarSection();
}

window.setBazaarSection = section => {
  const root = document.querySelector('#bazaar-info');
  if (!root) return;
  root.dataset.activeSection = section;
  if (!SERVICES) {
    ensureBazaarData().then(() => {
      if (root.dataset.activeSection === section) renderAndBindBazaar(root);
    }).catch(error => {
      root.textContent = window.WIKI_I18N.language === 'cn' ? '资料加载失败，请稍后重试。' : 'Could not load this section. Please try again.';
      console.error('Could not load bazaar data.', error);
    });
    return;
  }
  if (BAZAAR_LANGUAGE !== window.WIKI_I18N.language
    || (section === 'quests' && !root.querySelector('#bz-quests'))
    || (section === 'crafting' && !root.querySelector('#bz-crafting .crafting-grid'))) {
    renderAndBindBazaar(root);
  }
  applyBazaarSection();
};

async function loadBazaarData() {
  await window.WIKI_I18N.ready;
  const [services, exchanges, recipes, bonuses, questCatalog] = await Promise.all([
    window.WIKI_DATA.loadJson('assets/data/bazaar/bazaar-services.json'),
    window.WIKI_DATA.loadJson('assets/data/bazaar/exchanges.json'),
    window.WIKI_DATA.loadJson('assets/data/drop-table/recipes.json'),
    window.WIKI_DATA.loadJson('assets/data/drop-table/bonuses.json'),
    window.WIKI_DATA.loadJson('assets/data/bazaar/quest-catalog.json')
  ]);
  [SERVICES, EXCHANGES, RECIPES, SET_BONUSES, QUEST_CATALOG] = [services, exchanges, recipes, bonuses, questCatalog];
  const questEpisodes = await Promise.all(['EP1', 'EP2', 'EP4'].map(episode =>
    window.WIKI_DATA.loadJson(`assets/data/quest/quest_${episode}.json`)
  ));
  QUEST_DATA = Object.fromEntries(['EP1', 'EP2', 'EP4'].map((episode, index) => [
    episode,
    Object.fromEntries(questEpisodes[index].map(quest => [quest.name.replace(/ \[EP\d\]$/, ''), quest]))
  ]));
  const items = await window.WIKI_DATA.loadJson('assets/data/item-catalog.json');
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
  const monsterEntries = [
    ...Object.entries(translation.monsters || {}),
    ...window.WIKI_I18N.getMonsterCatalogEntries().map(([id]) => [id, { name: window.WIKI_I18N.getMonster(id) }])
  ];
  monsterEntries.forEach(([id, monster]) => {
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
}

if (['special', 'bazaar', 'exchange', 'crafting', 'quests'].includes(window.WIKI_ACTIVE_VIEW)) {
  window.setBazaarSection(window.WIKI_ACTIVE_VIEW);
}

window.addEventListener("wiki-language-change", () => {
  if (ITEM_DATA && NAME_RE) {
    if (['special', 'bazaar', 'exchange', 'crafting', 'quests'].includes(window.WIKI_ACTIVE_VIEW)) {
      window.setBazaarSection(window.WIKI_ACTIVE_VIEW);
    }
  }
});

window.addEventListener("wiki-equipment-database-ready", () => {
  const root = document.querySelector("#bazaar-info");
  if (root) root.querySelectorAll("[data-item]").forEach(node => {
    const available = window.WIKI_HAS_EQUIPMENT(node.dataset.item);
    node.dataset.equipmentAvailable = String(available);
    node.classList.toggle("wiki-item-link", available);
  });
});
