let EXCHANGES, RECIPES, SET_BONUSES, QUEST_CATALOG, QUEST_DATA, MAG_DATA, NAME_RE, SCOPED_NAME_RE;
let ITEM_DATA = {};
let ITEM_ID_BY_TERM = {};
let MONSTER_ID_BY_TERM = {};
const SECTION_ID_NAMES = ['Viridia', 'Greenill', 'Skyly', 'Bluefull', 'Purplenum', 'Pinkal', 'Redria', 'Oran', 'Yellowboze', 'Whitill'];
const SECTION_ID_BY_TERM = Object.fromEntries(SECTION_ID_NAMES.map((name, id) => [name.toLowerCase(), { name, id }]));
let questFilter = '';
let exchangeFilter = '';
let recipeFilter = '';
let setFilter = '';
let BAZAAR_LANGUAGE = '';
const QUEST_SEARCH_INDEX = new WeakMap();
const monsterImagePaths = new Set();
const failedMonsterImagePaths = new Set();
let activeMonsterName;
const SECTION_BY_ID = {
  'bz-quick': 'currency', 'bz-drops': 'special', 'bz-mpc': 'special',
  'bz-exchange': 'exchange', 'bz-crafting': 'crafting', 'bz-quests': 'quests'
};

function localized(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[window.WIKI_I18N.language] || value.en || value.cn || '';
  return value || '';
}

function appendRichText(node, text, includeSectionIds = false, preferItems = false) {
  const source = String(text);
  if (includeSectionIds) {
    const trimmed = source.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    const allIdsTerm = String(window.WIKI_I18N.getTerm('allIds') || 'all ids').trim();
    const exceptTerm = String(window.WIKI_I18N.getTerm('except') || 'except').trim();
    let allIdsMatch = trimmed.match(/^all\s+ids(?:\s+except\s+(.+))?$/i);
    let exceptMatch = trimmed.match(/^except\s+(.+)$/i);
    if (!allIdsMatch && lowerTrimmed === allIdsTerm.toLowerCase()) allIdsMatch = [trimmed];
    if (!allIdsMatch && lowerTrimmed.startsWith(allIdsTerm.toLowerCase())) {
      const remainder = trimmed.slice(allIdsTerm.length).trim();
      if (remainder.toLowerCase().startsWith(exceptTerm.toLowerCase())) {
        allIdsMatch = [trimmed, remainder.slice(exceptTerm.length).trim()];
      }
    }
    if (!exceptMatch && lowerTrimmed.startsWith(exceptTerm.toLowerCase())) {
      exceptMatch = [trimmed, trimmed.slice(exceptTerm.length).trim()];
    }
    const excludedText = allIdsMatch?.[1] || exceptMatch?.[1] || "";
    const excludedNames = excludedText.split(/[\s,]+/).filter(Boolean);
    const excludedSections = excludedNames.map(name =>
      SECTION_ID_NAMES.find(sectionName => sectionName.toLowerCase() === name.toLowerCase())
    );
    if ((allIdsMatch || exceptMatch) && excludedSections.every(Boolean)) {
      const fragment = document.createDocumentFragment();
      const names = excludedSections.length
        ? excludedSections
        : SECTION_ID_NAMES;
      if (excludedSections.length) fragment.appendChild(document.createTextNode(window.WIKI_I18N.language === "cn" ? "除" : "Except"));
      names.forEach(name => {
        const sectionId = SECTION_ID_BY_TERM[name.toLowerCase()];
        const icon = document.createElement('img');
        icon.className = 'bazaar-section-id-icon';
        icon.src = `images/ids/${sectionId.name}.png`;
        icon.alt = sectionId.name;
        icon.title = `${sectionId.name} (${sectionId.id})`;
        fragment.appendChild(icon);
      });
      node.appendChild(fragment);
      return;
    }
  }
  let lastIndex = 0;
  const pattern = includeSectionIds ? SCOPED_NAME_RE : NAME_RE;
  const fragment = document.createDocumentFragment();
  source.replace(pattern, (match, offset) => {
    if (offset > lastIndex) {
      fragment.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
    }
    const key = match.toLowerCase();
    const sectionId = includeSectionIds ? SECTION_ID_BY_TERM[key] : null;
    const itemId = ITEM_ID_BY_TERM[match] || ITEM_ID_BY_TERM[key];
    const monsterId = MONSTER_ID_BY_TERM[match] || MONSTER_ID_BY_TERM[key];
    const matchedItemId = preferItems ? itemId : (monsterId ? null : itemId);
    const matchedMonsterId = matchedItemId ? null : monsterId;
    const displayName = sectionId ? '' : matchedMonsterId ? window.WIKI_I18N.getMonster(matchedMonsterId) : (matchedItemId ? (window.WIKI_I18N.getItem(matchedItemId).name || match) : match);
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
    term.className = matchedMonsterId ? "bazaar-monster" : "bazaar-term";
    if (matchedMonsterId) {
      const monsterInfo = window.WIKI_I18N.getMonsterMeta(matchedMonsterId);
      term.dataset.monsterId = matchedMonsterId;
      term.dataset.difficulty = String(monsterInfo.difficulty);
    }
    term.appendChild(document.createTextNode(displayName));
    term.title = match;
    if (matchedItemId) {
      term.dataset.item = matchedItemId;
      const rarity = ITEM_DATA[matchedItemId]?.superitem;
      if (rarity === 2) term.classList.add("ultimate-item");
      else if (rarity === 1) term.classList.add("legend-item");
      if (window.WIKI_HAS_EQUIPMENT?.(matchedItemId)) {
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

function positionMonsterImageTooltip(image, event) {
  const tooltip = document.getElementById("monster-image-tooltip");
  if (!tooltip) return;
  const margin = 8;
  const offset = 14;
  const left = event.clientX + image.naturalWidth + offset + margin <= window.innerWidth
    ? event.clientX + offset
    : event.clientX - image.naturalWidth - offset;
  const top = event.clientY + image.naturalHeight + offset + margin <= window.innerHeight
    ? event.clientY + offset
    : event.clientY - image.naturalHeight - offset;
  tooltip.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - image.naturalWidth - margin))}px`;
  tooltip.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - image.naturalHeight - margin))}px`;
}

document.addEventListener("mouseover", event => {
  const target = event.target instanceof Element ? event.target : null;
  const monster = target?.closest(".bazaar-monster[data-monster-id]");
  if (!monster || monster.contains(event.relatedTarget)) return;
  const imagePath = window.WIKI_I18N.getMonsterMeta(monster.dataset.monsterId).image;
  const tooltip = document.getElementById("monster-image-tooltip");
  const image = tooltip?.querySelector("img");
  if (!imagePath || !tooltip || !image || failedMonsterImagePaths.has(imagePath)) return;
  activeMonsterName = monster;
  image.onload = () => {
    if (activeMonsterName !== monster || image.src !== new URL(imagePath, document.baseURI).href) return;
    monsterImagePaths.add(imagePath);
    image.style.width = `${image.naturalWidth}px`;
    image.style.height = `${image.naturalHeight}px`;
    tooltip.style.display = "block";
    positionMonsterImageTooltip(image, event);
  };
  image.onerror = () => {
    if (activeMonsterName !== monster || image.src !== new URL(imagePath, document.baseURI).href) return;
    failedMonsterImagePaths.add(imagePath);
    tooltip.style.display = "none";
  };
  if (monsterImagePaths.has(imagePath) && image.src === new URL(imagePath, document.baseURI).href) {
    tooltip.style.display = "block";
    positionMonsterImageTooltip(image, event);
  } else {
    tooltip.style.display = "none";
    image.src = imagePath;
  }
});

document.addEventListener("mousemove", event => {
  const tooltip = document.getElementById("monster-image-tooltip");
  const image = tooltip?.querySelector("img");
  if (activeMonsterName && image?.naturalWidth) positionMonsterImageTooltip(image, event);
});

document.addEventListener("mouseout", event => {
  if (!activeMonsterName?.contains(event.target) || activeMonsterName.contains(event.relatedTarget)) return;
  activeMonsterName = null;
  const tooltip = document.getElementById("monster-image-tooltip");
  if (tooltip) tooltip.style.display = "none";
});

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

let sectionIdTooltipsBound = false;
function bindSectionIdTooltips() {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip || sectionIdTooltipsBound) return;
  sectionIdTooltipsBound = true;
  let activeIcon = null;
  const hide = () => {
    activeIcon = null;
    tooltip.style.display = 'none';
    tooltip.className = '';
  };
  document.addEventListener('mousemove', event => {
    const icon = event.target instanceof Element ? event.target.closest('.bazaar-section-id-icon') : null;
    if (!icon) {
      if (activeIcon) hide();
      return;
    }
    activeIcon = icon;
    tooltip.className = 'tooltip-section-id';
    tooltip.innerHTML = `<img src="${icon.src}" alt=""><strong>${icon.alt}</strong><span class="tooltip-section-id-number"> : ${icon.title.match(/\d+/)?.[0] || ''}</span>`;
    tooltip.style.display = 'block';
    const rect = tooltip.getBoundingClientRect();
    const left = Math.max(8, Math.min(event.clientX + 14, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(event.clientY + 14, window.innerHeight - rect.height - 8));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });
  document.addEventListener('mouseout', event => {
    const icon = event.target instanceof Element ? event.target.closest('.bazaar-section-id-icon') : null;
    const nextIcon = event.relatedTarget instanceof Element ? event.relatedTarget.closest('.bazaar-section-id-icon') : null;
    if (icon && icon === activeIcon && nextIcon !== icon) hide();
  });
}
bindSectionIdTooltips();

function monsterTerms(name) {
  return String(name).split(/\s*\/\s*/).flatMap(term => {
    const id = MONSTER_ID_BY_TERM[term] || MONSTER_ID_BY_TERM[window.WIKI_SEARCH.normalize(term)];
    return [term, id, id ? window.WIKI_I18N.getMonster(id) : ''].filter(Boolean);
  });
}

function matchingMonsterIds(keyword) {
  if (!keyword) return new Set();
  return new Set(Object.entries(MONSTER_ID_BY_TERM)
    .filter(([term]) => window.WIKI_SEARCH.matches(keyword, term))
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
      return terms.some(term => window.WIKI_SEARCH.matches(keyword, term)) || terms.some(term => {
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
  const searchParts = [
    quest.episode,
    quest.category,
    quest.title,
    quest.requirement,
    quest.reward,
    formatQuestDrops(quest.drops),
    questCountText(quest.monsterData),
    ...questNotes(quest.notes)
  ];
  const sourceText = searchParts.filter(Boolean).join(" ");
  const localizedItemTerms = [...new Set(sourceText.match(NAME_RE) || [])]
    .map(term => ITEM_ID_BY_TERM[term] || ITEM_ID_BY_TERM[term.toLowerCase()])
    .filter(Boolean)
    .flatMap(item => window.WIKI_I18N.getItemSearchTerms(item));
  const text = window.WIKI_SEARCH.normalize([...searchParts, ...localizedItemTerms].join(" "));
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

function highlightMatches(root, keyword, termGroups = []) {
  root.querySelectorAll("mark.quest-search-highlight").forEach(mark => {
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
  root.normalize();
  if (!keyword) return;
  const terms = new Set([keyword]);
  termGroups.forEach(group => {
    if (group.some(term => window.WIKI_SEARCH.matches(keyword, term))) {
      group.forEach(term => terms.add(term));
    }
  });
  if (!termGroups.length) {
    matchingMonsterIds(keyword).forEach(id => terms.add(window.WIKI_I18N.getMonster(id)));
  }
  const searchableTerms = [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!searchableTerms.length) return;
  const pattern = new RegExp(`(${searchableTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest("[hidden], script, style, mark, input")) textNodes.push(node);
  }
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

function addCraftingTable(parent, headers, className = '', context = null) {
  const wrap = el("div", "crafting-table-wrap");
  if (className) wrap.classList.add(`${className}-wrap`);
  const table = el("table", `crafting-table ${className}`.trim());
  const thead = el("thead");
  const location = String(context?.location ?? "").trim();
  if (location) {
    const contextRow = el("tr", "exchange-table__context");
    const contextCell = el("th");
    contextCell.colSpan = 1;
    contextCell.textContent = location;
    contextRow.appendChild(contextCell);
    thead.appendChild(contextRow);
  }
  if (headers.length) {
    const headingRow = el("tr");
    headers.forEach(header => {
      const heading = el("th");
      heading.textContent = header;
      headingRow.appendChild(heading);
    });
    thead.appendChild(headingRow);
  }
  if (thead.childElementCount) table.appendChild(thead);
  const tbody = el("tbody");
  table.appendChild(tbody);
  wrap.appendChild(table);
  parent.appendChild(wrap);
  return tbody;
}

function addNpcImage(parent, npc) {
  if (!npc.locationImage) return;
  const image = document.createElement("img");
  image.className = "exchange-npc__image";
  image.src = npc.locationImage;
  image.alt = npc.name || "";
  image.loading = "lazy";
  parent.appendChild(image);
}

function addItemText(parent, item, className = '') {
  const text = el("span", className);
  appendRichText(text, item, false, true);
  parent.appendChild(text);
  return text;
}

function catalogItemSearchText(...items) {
  return window.WIKI_SEARCH.normalize(items.flatMap(item =>
    window.WIKI_I18N.getItemSearchTerms(item)
  ).join(" "));
}

function catalogSearchText(...values) {
  return window.WIKI_SEARCH.normalize(values.flat(Infinity).filter(Boolean).join(" "));
}

function addCatalogSearch(parent, id, placeholder, initialValue, onSearch) {
  const search = document.createElement("input");
  search.id = id;
  search.className = "quest-search catalog-search";
  search.type = "search";
  search.placeholder = placeholder;
  search.value = initialValue;
  parent.appendChild(search);
  window.WIKI_SEARCH.bind(search, onSearch);
  onSearch(window.WIKI_SEARCH.normalize(initialValue));
  return search;
}

function filterCatalogRows(root, query, selector = "[data-catalog-search-row]") {
  window.WIKI_SEARCH.filter(root, selector, query);
  const firstInGroup = new Map();
  root.querySelectorAll(selector).forEach(row => {
    const group = row.dataset.searchGroup;
    const body = row.parentElement;
    if (!firstInGroup.has(body)) firstInGroup.set(body, new Set());
    const groups = firstInGroup.get(body);
    const isFirstVisible = !row.hidden && !groups.has(group);
    row.classList.toggle("set-table__row--group-start", isFirstVisible);
    if (isFirstVisible) groups.add(group);
    highlightMatches(row, query, row.searchTermGroups || []);
  });
}

function exchangeSearchText(task, npc, exchange) {
  const itemTerms = value => [
    value,
    ...window.WIKI_I18N.getItemSearchTerms(value),
    ...window.WIKI_I18N.getItemSearchTerms(exchangeItemName(value))
  ];
  return catalogSearchText(
    task,
    npc,
    itemTerms(exchange.item),
    (exchange.materials || []).map(material => itemTerms(material.content))
  );
}

function applyExchangeFilter(root, query) {
  window.WIKI_SEARCH.filter(root, ".exchange-search-row", query);
  root.querySelectorAll(".exchange-npc").forEach(npc => {
    npc.hidden = !npc.querySelector(".exchange-search-row:not([hidden])");
  });
  root.querySelectorAll(".exchange-task").forEach(task => {
    task.hidden = !task.querySelector(".exchange-npc:not([hidden])");
    highlightMatches(task, query, task.searchTermGroups || []);
  });
}

function addExchangeFormula(parent, exchange) {
  const formula = el("div", "exchange-line");
  const target = addItemText(formula, exchange.item, "exchange-line__target");
  target.title = exchange.item;
  formula.appendChild(el("span", "exchange-line__arrow", "←"));
  const materials = el("div", "exchange-line__materials");
  exchange.materials.forEach((material, index) => {
    const slot = el("div", `exchange-line__material-slot${index < exchange.materials.length - 1 ? " exchange-line__material-slot--joined" : ""}`);
    const component = el("span", "exchange-line__material");
    addItemText(component, material.content, "exchange-line__material-name");
    component.title = material.quantity != null
      ? `${material.content} × ${material.quantity}`
      : material.content;
    if (material.quantity != null && material.quantity !== 1) {
      component.appendChild(el("span", "exchange-line__quantity", `× ${material.quantity}`));
    }
    slot.appendChild(component);
    materials.appendChild(slot);
  });
  formula.appendChild(materials);
  parent.appendChild(formula);
}

function sizeExchangeTableColumns(table) {
  const columnCount = Number(table.dataset.maxMaterialCount) || 1;
  const columnWidths = Array(columnCount).fill(0);
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const manyMaterials = columnCount >= 7;
  const denseMaterials = columnCount >= 9;
  const operatorWidth = manyMaterials
    ? (isMobile ? (denseMaterials ? 5 : 7) : 8)
    : (isMobile ? 10 : 12);
  const material = table.querySelector(".exchange-line__material");
  const materialFontSize = material ? parseFloat(getComputedStyle(material).fontSize) : (isMobile ? 11 : 14);
  let naturalTargetWidth = 0;

  table.querySelectorAll(".exchange-line__target").forEach(target => {
    const measure = target.cloneNode(true);
    measure.style.cssText += ";position:fixed;left:-10000px;top:0;width:max-content;min-width:0;max-width:none;overflow:visible;white-space:nowrap;text-overflow:clip";
    table.appendChild(measure);
    naturalTargetWidth = Math.max(naturalTargetWidth, Math.ceil(measure.getBoundingClientRect().width) + 12);
    measure.remove();
  });

  table.querySelectorAll(".exchange-line__materials").forEach(materials => {
    materials.querySelectorAll(".exchange-line__material").forEach((material, index) => {
      const measure = material.cloneNode(true);
      measure.style.cssText += ";position:fixed;left:-10000px;top:0;width:max-content;max-width:none;overflow:visible;flex:none";
      const name = measure.querySelector(".exchange-line__material-name");
      if (name) name.style.cssText += ";width:max-content;max-width:none;overflow:visible;text-overflow:clip";
      table.appendChild(measure);
      columnWidths[index] = Math.max(columnWidths[index], Math.ceil(measure.getBoundingClientRect().width));
      measure.remove();
    });
  });

  const line = table.querySelector(".exchange-line");
  if (!line) return;
  const lineStyle = getComputedStyle(line);
  const arrowWidth = parseFloat(getComputedStyle(line.querySelector(".exchange-line__arrow")).width);
  const columnGap = parseFloat(lineStyle.columnGap);
  const materialPadding = isMobile ? 2 : 6;
  const minimumNameWidth = manyMaterials ? materialFontSize * 2 + materialPadding : 0;
  const minTracks = columnWidths.map((_, index) => manyMaterials
    ? minimumNameWidth + (index < columnCount - 1 ? operatorWidth : 0)
    : index < columnCount - 1 ? (isMobile ? 18 : 74) : (isMobile ? 12 : 60)
  );
  const minMaterialWidth = minTracks.reduce((sum, width) => sum + width, 0);
  const availableTargetWidth = line.clientWidth - arrowWidth - columnGap * 2 - minMaterialWidth;
  const maxTargetRatio = manyMaterials ? (isMobile ? 0.2 : 0.24) : 1;
  const targetWidth = Math.min(
    naturalTargetWidth,
    Math.max(32, Math.min(availableTargetWidth, line.clientWidth * maxTargetRatio))
  );
  table.style.setProperty("--exchange-target-column-width", `${targetWidth}px`);

  const availableWidth = line.clientWidth - targetWidth - arrowWidth - columnGap * 2;
  const naturalTracks = columnWidths.map((width, index) =>
    width + (index < columnCount - 1 ? operatorWidth : 0)
  );
  const desiredTracks = naturalTracks.map((width, index) => Math.max(width, minTracks[index]));
  const desiredTotal = desiredTracks.reduce((sum, width) => sum + width, 0);
  let trackWidths = desiredTracks;

  if (desiredTotal > availableWidth) {
    const minTotal = minTracks.reduce((sum, width) => sum + width, 0);
    if (minTotal >= availableWidth) {
      const scale = availableWidth / minTotal;
      trackWidths = minTracks.map(width => width * scale);
    } else {
      let extraAvailable = availableWidth - minTotal;
      const remaining = desiredTracks.map((width, index) => Math.max(0, width - minTracks[index]));
      trackWidths = [...minTracks];
      let activeTracks = remaining
        .map((width, index) => width > 0 ? index : -1)
        .filter(index => index >= 0);
      while (extraAvailable > 0 && activeTracks.length) {
        const share = extraAvailable / activeTracks.length;
        let allocated = 0;
        const nextActiveTracks = [];
        activeTracks.forEach(index => {
          const addition = Math.min(remaining[index], share);
          trackWidths[index] += addition;
          remaining[index] -= addition;
          allocated += addition;
          if (remaining[index] > 0) nextActiveTracks.push(index);
        });
        if (!allocated) break;
        extraAvailable -= allocated;
        activeTracks = nextActiveTracks;
      }
    }
  } else if (availableWidth > desiredTotal && trackWidths.length) {
    const extraPerTrack = (availableWidth - desiredTotal) / trackWidths.length;
    trackWidths = trackWidths.map(width => width + extraPerTrack);
  }

  const tracks = trackWidths.map(width => `${Math.max(1, width)}px`);
  table.style.setProperty("--exchange-material-columns", tracks.join(" "));
}

function addExchangeCards(parent) {
  EXCHANGES.forEach(task => {
    const taskSection = el("section", "exchange-task");
    taskSection.appendChild(el("h4", "exchange-task__title", task.task));
    (task.npcs || []).forEach(npc => {
      const npcSection = el("section", "exchange-npc");
      if (npc.name) npcSection.appendChild(el("h5", "exchange-npc__title", npc.name));
      addNpcImage(npcSection, npc);
      const body = addCraftingTable(npcSection, [], "exchange-table", npc);
      const exchanges = npc.exchanges || [];
      const table = body.closest(".exchange-table");
      const maxMaterialCount = Math.max(1, ...exchanges.map(exchange => exchange.materials.length));
      table.dataset.maxMaterialCount = String(maxMaterialCount);
      table.classList.toggle("exchange-table--many-materials", maxMaterialCount >= 7);
      table.classList.toggle("exchange-table--dense-materials", maxMaterialCount >= 9);
      table.classList.toggle("exchange-table--single-material", maxMaterialCount === 1);
      exchanges.forEach(exchange => {
        const row = el("tr", "exchange-search-row");
        row.dataset.search = exchangeSearchText(task.task, npc.name, exchange);
        row.searchTermGroups = [
          [task.task, npc.name].filter(Boolean),
          ...[exchange.item, ...(exchange.materials || []).map(material => material.content)]
            .map(item => window.WIKI_I18N.getItemSearchTerms(exchangeItemName(item)))
        ];
        if (!taskSection.searchTermGroups) taskSection.searchTermGroups = [];
        taskSection.searchTermGroups.push(...row.searchTermGroups);
        const formulaCell = el("td", "exchange-table__formula-cell");
        addExchangeFormula(formulaCell, exchange);
        row.appendChild(formulaCell);
        body.appendChild(row);
      });
      taskSection.appendChild(npcSection);
    });
    parent.appendChild(taskSection);
  });
}

function appendRecipeRows(recipeBody, recipes) {
  const componentCounts = new Map();
  recipes.forEach(recipe => recipe.components.forEach(component => {
    componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
  }));
  const recipeGroups = new Map();
  const ungroupedRecipes = [];
  recipes.forEach(recipe => {
    const sharedComponents = recipe.components
      .filter(component => componentCounts.get(component) > 1)
      .sort((a, b) => componentCounts.get(b) - componentCounts.get(a));
    if (!sharedComponents.length) {
      ungroupedRecipes.push(recipe);
      return;
    }
    const groupKey = sharedComponents[0];
    if (!recipeGroups.has(groupKey)) recipeGroups.set(groupKey, []);
    recipeGroups.get(groupKey).push(recipe);
  });
  const recipeGroupList = [...recipeGroups.entries()].map(([key, group]) => [key, group]);
  if (ungroupedRecipes.length) recipeGroupList.push(["ungrouped", ungroupedRecipes]);
  recipeGroupList.forEach(([groupKey, group]) => {
    group.forEach((recipe, index) => {
      const row = el("tr", "set-table__row recipe-table__row catalog-search-row");
      row.dataset.catalogSearchRow = "true";
      row.dataset.searchGroup = groupKey;
      row.dataset.search = catalogItemSearchText(recipe.result, ...recipe.components);
      row.searchTermGroups = [recipe.result, ...recipe.components]
        .map(item => window.WIKI_I18N.getItemSearchTerms(item));
      if (index === 0) row.classList.add("set-table__row--group-start");
      const formulaCell = el("td");
      const formula = el("div", "recipe-line");
      recipe.components.forEach((component, componentIndex) => {
        if (componentIndex) formula.appendChild(el("span", "recipe-line__operator", "+"));
        addItemText(formula, component, "recipe-formula__item");
      });
      formula.appendChild(el("span", "recipe-line__operator recipe-line__operator--equals", "="));
      addItemText(formula, recipe.result, "recipe-formula__item recipe-line__result");
      formulaCell.appendChild(formula);
      row.appendChild(formulaCell);
      recipeBody.appendChild(row);
    });
  });
}

function addCraftingTables(parent) {
  const magNames = new Set(Object.keys(MAG_DATA || {}).map(name => name.toLowerCase()));
  const magRecipes = RECIPES.filter(recipe =>
    [recipe.result, ...recipe.components].some(item => magNames.has(item.toLowerCase()))
  );
  const magRecipeSet = new Set(magRecipes);
  const regularRecipes = RECIPES.filter(recipe => !magRecipeSet.has(recipe));

  const recipes = el("section", "crafting-subsection");
  recipes.dataset.craftingSection = "recipes";
  recipes.appendChild(el("h3", null, window.WIKI_I18N.language === 'cn' ? "合成公式" : "Crafting recipes"));
  addCatalogSearch(
    recipes,
    "recipeSearchInput",
    window.WIKI_I18N.language === "cn" ? "搜索合成道具…" : "Search crafting items ...",
    recipeFilter,
    query => {
      recipeFilter = query;
      filterCatalogRows(parent, query, ".recipe-table__row");
    }
  );
  parent.appendChild(recipes);
  appendRecipeRows(addCraftingTable(recipes, [], "recipe-table"), regularRecipes);
  filterCatalogRows(parent, recipeFilter, ".recipe-table__row");

  if (magRecipes.length) {
    const magSection = el("section", "crafting-subsection");
    magSection.dataset.craftingSection = "recipes";
    const heading = el("h3");
    heading.textContent = window.WIKI_I18N.language === 'cn' ? "玛古合成" : "MAG crafting";
    magSection.appendChild(heading);
    parent.appendChild(magSection);
    appendRecipeRows(addCraftingTable(magSection, [], "recipe-table"), magRecipes);
    filterCatalogRows(parent, recipeFilter, ".recipe-table__row");
  }

  const sets = el("section", "crafting-subsection");
  sets.dataset.craftingSection = "sets";
  sets.appendChild(el("h3", null, window.WIKI_I18N.language === 'cn' ? "套装效果" : "Set bonuses"));
  addCatalogSearch(
    sets,
    "setSearchInput",
    window.WIKI_I18N.language === "cn" ? "搜索套装或效果…" : "Search sets or effects...",
    setFilter,
    query => {
      setFilter = query;
      filterCatalogRows(sets, query);
    }
  );
  parent.appendChild(sets);
  const setBody = addCraftingTable(sets, [], "set-table");
  const setGroups = new Map();
  SET_BONUSES.forEach(set => {
    const commonItem = set.items.find(Boolean) || (window.WIKI_I18N.language === 'cn' ? "未分类" : "Uncategorized");
    if (!setGroups.has(commonItem)) setGroups.set(commonItem, []);
    setGroups.get(commonItem).push(set);
  });
  setGroups.forEach((group, commonItem) => {
    group.forEach((set, index) => {
      const effects = Object.entries(set.effect || {}).filter(([, value]) =>
        value !== false && value != null && value !== ""
      );
      const row = el("tr");
      row.classList.add("set-table__row");
      row.classList.add("catalog-search-row");
      row.dataset.catalogSearchRow = "true";
      row.dataset.searchGroup = commonItem;
      row.dataset.search = catalogSearchText(
        ...set.items.flatMap(item => window.WIKI_I18N.getItemSearchTerms(item)),
        effects.flatMap(([key, value]) => [
          key,
          window.WIKI_I18N.text(`effect.${key}`, key),
          value,
          value === true ? "" : window.WIKI_I18N.getEffectValue(key, value)
        ])
      );
      row.searchTermGroups = [
        ...set.items.filter(Boolean).map(item => window.WIKI_I18N.getItemSearchTerms(item)),
        ...effects.map(([key, value]) => [
          key,
          window.WIKI_I18N.text(`effect.${key}`, key),
          value,
          value === true ? "" : window.WIKI_I18N.getEffectValue(key, value)
        ])
      ];
      if (index === 0) row.classList.add("set-table__row--group-start");
      const combinationCell = el("td", "set-table__combination");
      const combination = el("div", "set-combination");
      set.items.filter(Boolean).forEach((item, itemIndex) => {
        if (itemIndex) combination.appendChild(el("span", "recipe-formula__join", "+"));
        addItemText(combination, item, "recipe-formula__item");
      });
      combinationCell.appendChild(combination);
      row.appendChild(combinationCell);

      const effectsCell = el("td");
      const effectsContent = el("div", "set-effects");
      effects.forEach(([key, value]) => {
        const effect = el("div", "set-effect");
        const term = el("span", "set-effect__label");
        term.textContent = window.WIKI_I18N.text(`effect.${key}`, key);
        const description = el("span", "set-effect__value");
        description.textContent = value === true ? "" : window.WIKI_I18N.getEffectValue(key, value);
        effect.append(term, description);
        effectsContent.appendChild(effect);
      });
      effectsCell.appendChild(effectsContent);
      row.appendChild(effectsCell);
      setBody.appendChild(row);
    });
  });
  filterCatalogRows(sets, setFilter);
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
        const quest = { ...source, episode, category, title, monsterData: QUEST_DATA[episode]?.[questBaseTitle(title)] };
        if (window.WIKI_SEARCH.matches(keyword, questSearchText(quest, source))) addQuest(categoryDetails, quest, keyword);
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

  const exchanges = addSection(panel, window.WIKI_I18N.text('quests.exchange', '任务兑换'), "bz-exchange");
  addCatalogSearch(
    exchanges,
    "exchangeSearchInput",
    window.WIKI_I18N.language === "cn" ? "搜索任务、道具）…" : "Search quests and items ...",
    exchangeFilter,
    query => {
      exchangeFilter = query;
      applyExchangeFilter(exchanges, query);
    }
  );
  addExchangeCards(exchanges);
  applyExchangeFilter(exchanges, exchangeFilter);

  const crafting = addSection(panel, window.WIKI_I18N.language === 'cn' ? "合成/套装" : "Crafting / Sets", "bz-crafting");
  if (window.WIKI_ACTIVE_VIEW === 'crafting') addCraftingTables(crafting);

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
  if (section === 'exchange') {
    root.querySelectorAll('#bz-exchange .exchange-table').forEach(sizeExchangeTableColumns);
  }
  root.querySelectorAll('#bz-crafting .crafting-subsection').forEach(node => {
    node.hidden = node.dataset.craftingSection !== (window.WIKI_CRAFTING_SECTION || 'recipes');
  });
}

let exchangeResizeFrame = 0;
window.addEventListener("resize", () => {
  if (exchangeResizeFrame) return;
  exchangeResizeFrame = requestAnimationFrame(() => {
    exchangeResizeFrame = 0;
    const root = document.querySelector('#bazaar-info');
    if (root?.dataset.activeSection === 'exchange') {
      root.querySelectorAll('#bz-exchange .exchange-table').forEach(sizeExchangeTableColumns);
    }
  });
}, { passive: true });

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
  applyBazaarSection();
}

window.setBazaarSection = section => {
  const root = document.querySelector('#bazaar-info');
  if (!root) return;
  root.dataset.activeSection = section;
  if (!EXCHANGES) {
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
    || (section === 'crafting' && !root.querySelector('#bz-crafting .crafting-table'))) {
    renderAndBindBazaar(root);
  }
  applyBazaarSection();
};

async function loadBazaarData() {
  await window.WIKI_I18N.ready;
  const [exchanges, recipes, bonuses, questCatalog, mags] = await Promise.all([
    window.WIKI_DATA.loadJson('assets/data/bazaar/exchanges.json?v=20261103-3'),
    window.WIKI_DATA.loadJson('assets/data/drop-table/recipes.json?v=20261103-2'),
    window.WIKI_DATA.loadJson('assets/data/drop-table/bonuses.json'),
    window.WIKI_DATA.loadJson('assets/data/bazaar/quest-catalog.json'),
    window.WIKI_DATA.loadJson('assets/data/item/mags.json')
  ]);
  [EXCHANGES, RECIPES, SET_BONUSES, QUEST_CATALOG] = [exchanges, recipes, bonuses, questCatalog];
  MAG_DATA = mags;
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
