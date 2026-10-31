const panels = {
  drops: document.querySelector("#drop-table-panel"),
  bazaar: document.querySelector("#bazaar-panel"),
  commands: document.querySelector("#commands-panel"),
  localization: document.querySelector("#localization-panel"),
  dictionary: document.querySelector("#dictionary-panel"),
  database: document.querySelector("#database-panel")
};

const siteNav = document.querySelector(".wiki-site-nav");
const updateStickyOffset = () => {
  document.documentElement.style.setProperty("--wiki-nav-height", `${siteNav.getBoundingClientRect().height}px`);
};
updateStickyOffset();
new ResizeObserver(updateStickyOffset).observe(siteNav);

function selectView(view, updateHash = true) {
  const isDrops = view === "drops";
  const isCommands = view === "commands";
  const isLocalization = view === "localization";
  const isDictionary = view === "dictionary";
  const isDatabase = view === "database";
  window.WIKI_ACTIVE_VIEW = view;
  panels.drops.hidden = !isDrops;
  panels.bazaar.hidden = isDrops || isCommands || isLocalization || isDictionary || isDatabase;
  panels.commands.hidden = !isCommands;
  panels.localization.hidden = !isLocalization;
  panels.dictionary.hidden = !isDictionary;
  panels.database.hidden = !isDatabase;
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (!isDrops && !isCommands && !isLocalization && !isDictionary && !isDatabase && window.setBazaarSection) window.setBazaarSection(view);
  if (updateHash) history.replaceState(null, "", "#" + view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".wiki-nav-button").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.view));
});

const views = ["drops", "commands", "localization", "dictionary", "special", "bazaar", "effects", "quests", "database"];
const initialView = location.hash.slice(1);
selectView(views.includes(initialView) ? initialView : "drops", false);

window.addEventListener("wiki-language-change", event => {
  if (event.detail.language === "en" && ["localization", "dictionary"].includes(window.WIKI_ACTIVE_VIEW)) {
    selectView("drops");
  }
});

async function renderBilingualDictionary() {
  const root = document.querySelector("#bilingual-dictionary");
  if (!root || window.WIKI_I18N.language !== "cn") { if (root) root.replaceChildren(); return; }
  await window.WIKI_I18N.ready;
  try {
    const [items, translation] = await Promise.all([
      fetch("assets/data/item-catalog.json").then(res => res.json()),
      fetch("assets/data/translation/cn.json").then(res => res.json())
    ]);
    const rows = Object.entries(items).map(([en, value]) => [en, value.name?.cn || ""])
      .filter(([en, cn]) => en || cn).sort((a, b) => a[0].localeCompare(b[0]));
    const monsters = Object.entries(translation.monsters || {}).map(([en, value]) => [en, value.name || ""])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const table = (title, data, kind) => `<section class="dictionary-section" data-dictionary-kind="${kind}"><h2>${title}</h2><div class="dictionary-table-wrap"><table><thead><tr><th>English</th><th>中文</th></tr></thead><tbody>${data.map(([en, cn]) => `<tr data-search="${`${en} ${cn}`.toLowerCase()}"><td>${en}</td><td>${cn}</td></tr>`).join("")}</tbody></table></div></section>`;
    root.innerHTML = `<article class="dictionary-panel"><p class="dictionary-panel__intro">中英名称速查</p><input id="dictionarySearch" class="dictionary-search" type="search" placeholder="搜索英文或中文名称…">${table("道具名称", rows, "items")}${table("怪物名称", monsters, "monsters")}</article>`;
    const search = root.querySelector("#dictionarySearch");
    window.WIKI_SEARCH.bind(search, query => {
      root.querySelectorAll(".dictionary-section").forEach(section => {
        let matches = 0;
        section.querySelectorAll("tbody tr").forEach(row => {
          const visible = !query || row.dataset.search.includes(query);
          row.hidden = !visible;
          if (visible) matches += 1;
        });
        section.hidden = matches === 0;
      });
    });
  } catch (error) {
    root.textContent = "中英对照数据加载失败。";
    console.error(error);
  }
}
window.addEventListener("wiki-language-change", renderBilingualDictionary);
renderBilingualDictionary();

async function loadLocalizationGuide() {
  const guide = await fetch("assets/data/site/localization-guide.json").then(res => res.json());
  document.querySelectorAll("[data-localization-guide]").forEach(root => {
    root.innerHTML = `
    <div class="localization-guide">
      <p class="command-panel__eyebrow">${guide.eyebrow}</p>
      <h2>${guide.title}</h2>
      <div class="command-panel__content">
        <p>${guide.description}</p>
        <ol>${guide.steps.map(step => `<li>${step}</li>`).join("")}</ol>
        <a class="localization-guide__download" href="${guide.download.href}" download>${guide.download.label}</a>
      </div>
    </div>`;
  });
}

loadLocalizationGuide();

let equipmentDatabase = null;
let databaseFilterActive = false;
const databaseKinds = [
  ["weapons", "weapon"],
  ["shields", "shield"],
  ["armors", "armor"],
  ["units", "unit"],
  ["mags", "mag"]
];

function databaseEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function databaseHighlight(value, query, source = value) {
  const escaped = databaseEscape(value);
  const normalizedQuery = window.WIKI_SEARCH.normalize(query);
  if (!normalizedQuery) return escaped;
  if (!window.WIKI_SEARCH.normalize(value).includes(normalizedQuery)) {
    return window.WIKI_SEARCH.normalize(source).includes(normalizedQuery)
      ? `<mark>${escaped}</mark>`
      : escaped;
  }
  const pattern = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
  return escaped.replace(pattern, match => `<mark>${match}</mark>`);
}

function databaseValue(value) {
  if (value == null || value === "") return "-";
  if (typeof value === "object") return Object.values(value).join(" / ");
  return String(value);
}

function databaseDisplayName(name) {
  if (window.WIKI_I18N.language !== "cn") return name;
  return equipmentDatabase.catalog?.[name]?.name?.cn || name;
}

function databaseDisplayValue(value, field) {
  const text = databaseValue(value);
  if ((field === "Boosts" || field === "Special") && window.WIKI_SEARCH.normalize(text) === "none") return "";
  if (text === "-") return text;
  const boost = window.WIKI_I18N.getBoost(text);
  return boost === text ? window.WIKI_I18N.getDatabase(text) : boost;
}

function databaseClassHtml(value, query) {
  const classes = String(value || "").split(/,\s*/).filter(Boolean);
  const allClasses = new Set(["humar", "hunewearl", "hucast", "hucaseal", "ramar", "ramarl", "racast", "racaseal", "fomar", "fomarl", "fonewm", "fonewearl"]);
  if (classes.length === allClasses.size && classes.every(item => allClasses.has(item))) {
    const label = window.WIKI_I18N.text("label.allClasses", "全职业可装备");
    return `<span class="class-badge class-all">${databaseHighlight(label, query, value)}</span>`;
  }
  return classes.map(item => {
    const faction = /^(humar|hunewearl|hucast|hucaseal)$/.test(item) ? "hunter" : /^(ramar|ramarl|racast|racaseal)$/.test(item) ? "ranger" : /^(fomar|fomarl|fonewm|fonewearl)$/.test(item) ? "force" : "";
    const translated = window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getClass(item) : item;
    return `<span class="class-badge ${faction}">${databaseHighlight(translated, query, item)}</span>`;
  }).join(" ");
}

function databaseSpecialHtml(value, query) {
  const translated = window.WIKI_I18N.getBoost(value);
  const tone = window.WIKI_I18N.getBoostTone(value);
  return `<span class="boost-badge ${tone}">${databaseHighlight(translated, query, value)}</span>`;
}

function databaseBoostHtml(value, query) {
  const badges = window.WIKI_I18N.getBoostParts(value).map(part => {
    const tone = window.WIKI_I18N.getBoostTone(part.source);
    return `<span class="boost-badge ${tone}">${databaseHighlight(part.label, query, part.source)}</span>`;
  });
  const rows = [];
  for (let index = 0; index < badges.length; index += 2) rows.push(`<span class="boost-badge-row">${badges.slice(index, index + 2).join("")}</span>`);
  return rows.join("");
}

function databaseCellHtml(value, field, query) {
  if (value == null || value === "" || window.WIKI_SEARCH.normalize(value) === "none" && ["Boosts", "Special"].includes(field)) return "";
  if (field === "Class" && value) return databaseClassHtml(value, query);
  if (field === "Special" && value) return databaseSpecialHtml(value, query);
  if (field === "Boosts" && value) return databaseBoostHtml(value, query);
  return databaseHighlight(databaseDisplayValue(value, field), query, databaseValue(value));
}

function databaseFields(kind, records) {
  return [...new Set(Object.values(records).flatMap(record => Object.keys(record || {})))].filter(field =>
    field !== "Description" && !(kind === "mag" && ["Class", "Notes"].includes(field)) && !(kind === "weapon" && ["Type", "ATP"].includes(field))
  );
}

function databaseRows(records, fields, query) {
  const lowerQuery = window.WIKI_SEARCH.normalize(query);
  return Object.keys(records).filter(name => {
    const record = records[name];
    let searchable = equipmentDatabase.searchIndex.get(record);
    if (searchable == null) {
      const values = [name, databaseDisplayName(name), ...fields.flatMap(field => [
        ["Boosts", "Special"].includes(field) && window.WIKI_SEARCH.normalize(record[field]) === "none"
          ? ""
          : databaseValue(record[field]),
        databaseDisplayValue(record[field], field)
      ])];
      searchable = window.WIKI_SEARCH.normalize(values.join(" "));
      equipmentDatabase.searchIndex.set(record, searchable);
    }
    return !lowerQuery || searchable.includes(lowerQuery);
  });
}

function databaseTable(records, fields, query, kind, typeLabel = "") {
  const rows = databaseRows(records, fields, query);
  if (!rows.length) return "";
  const state = equipmentDatabase.state;
  const sortField = state.sort[kind] || "";
  rows.sort((leftName, rightName) => {
    if (!sortField) return databaseDisplayName(leftName).localeCompare(databaseDisplayName(rightName));
    const left = databaseDisplayValue(records[leftName][sortField], sortField);
    const right = databaseDisplayValue(records[rightName][sortField], sortField);
    const leftNumber = Number.parseFloat(left.replace(/[^\d.+-]/g, ""));
    const rightNumber = Number.parseFloat(right.replace(/[^\d.+-]/g, ""));
    const result = Number.isNaN(leftNumber) || Number.isNaN(rightNumber) ? left.localeCompare(right) : leftNumber - rightNumber;
    return state.direction === "desc" ? -result : result;
  });
  const header = field => {
    const label = window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getDatabase(field) : field;
    return state.sort[kind] === field ? `${label} ${state.direction === "asc" ? "▲" : "▼"}` : label;
  };
  return `<div class="database-table-wrap"><table class="database-table" data-db-kind="${databaseEscape(kind)}"><thead><tr><th data-sort-kind="${kind}" data-sort-field="name">${window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getDatabase("Name") : "Name"}</th>${fields.map(field => `<th data-sort-kind="${kind}" data-sort-field="${databaseEscape(field)}">${databaseEscape(header(field))}</th>`).join("")}</tr></thead><tbody>${rows.map(name => { const rarity = equipmentDatabase.catalog?.[name]?.superitem || 0; const rarityClass = rarity === 2 ? "ultimate-item" : rarity === 1 ? "legend-item" : ""; return `<tr><td><span class="database-item-name ${rarityClass}">${databaseHighlight(databaseDisplayName(name), query)}</span>${window.WIKI_I18N.language === "cn" && databaseDisplayName(name) !== name ? `<small class="database-name-en">${databaseHighlight(name, query)}</small>` : ""}</td>${fields.map(field => `<td data-db-field="${databaseEscape(field)}">${databaseCellHtml(records[name][field], field, query)}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>`;
}

function databaseCategory(file, kind, query) {
  const records = equipmentDatabase[file] || {};
  const fields = equipmentDatabase.fields[file];
  if (kind !== "weapon") {
    const table = databaseTable(records, fields, query, kind);
    if (!table) return "";
    return `<details class="database-category" data-db-key="${file}"${query || equipmentDatabase.state.open.has(file) ? " open" : ""}><summary>${databaseEscape(window.WIKI_I18N.getDatabase(file))}</summary>${table}</details>`;
  }
  const types = Object.keys(equipmentDatabase.weaponTypes);
  const typeSections = types.map(type => {
    const typeRecords = equipmentDatabase.weaponTypes[type];
    const table = databaseTable(typeRecords, fields, query, `${kind}:${type}`);
    const key = `${kind}:${type}`;
    return table ? `<details class="database-subcategory" data-db-key="${databaseEscape(key)}"${query || equipmentDatabase.state.open.has(key) ? " open" : ""}><summary>${databaseEscape(window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getType(type) : type)}</summary>${table}</details>` : "";
  }).join("");
  return typeSections ? `<details class="database-category" data-db-key="${file}"${query || equipmentDatabase.state.open.has(file) ? " open" : ""}><summary>${databaseEscape(window.WIKI_I18N.getDatabase(file))}</summary>${typeSections}</details>` : "";
}

function databaseRender() {
  const root = document.querySelector("#equipment-database");
  if (!root || !equipmentDatabase) return;
  if (!root.querySelector(".database-panel")) {
    root.innerHTML = `<article class="database-panel"><p class="command-panel__eyebrow">Equipment Reference</p><h1></h1><input id="equipmentDatabaseSearch" class="database-search" type="search"><div class="database-sections"></div></article>`;
    const search = root.querySelector("#equipmentDatabaseSearch");
    window.WIKI_SEARCH.bind(search, databaseRender);
  }
  const query = window.WIKI_SEARCH.normalize(root.querySelector("#equipmentDatabaseSearch")?.value);
  if (!query && !databaseFilterActive) {
    root.querySelectorAll("details[data-db-key]").forEach(node => {
      if (node.open) equipmentDatabase.state.open.add(node.dataset.dbKey);
      else equipmentDatabase.state.open.delete(node.dataset.dbKey);
    });
  }
  const sections = databaseKinds.map(([file, kind]) => databaseCategory(file, kind, query)).filter(Boolean).join("");
  root.querySelector("h1").textContent = window.WIKI_I18N.language === "cn" ? "装备数据库" : "Equipment Database";
  const search = root.querySelector("#equipmentDatabaseSearch");
  search.placeholder = window.WIKI_I18N.language === "cn" ? "搜索所有装备信息…" : "Search all equipment information...";
  const sectionsRoot = root.querySelector(".database-sections");
  sectionsRoot.innerHTML = sections || `<p class="database-empty">${window.WIKI_I18N.language === "cn" ? "没有匹配的装备。" : "No matching equipment."}</p>`;
  databaseFilterActive = Boolean(query);
  sectionsRoot.querySelectorAll("details[data-db-key]").forEach(node => node.addEventListener("toggle", () => {
    if (databaseFilterActive) return;
    if (node.open) equipmentDatabase.state.open.add(node.dataset.dbKey);
    else equipmentDatabase.state.open.delete(node.dataset.dbKey);
  }));
  sectionsRoot.querySelectorAll("[data-sort-field]").forEach(header => header.addEventListener("click", () => {
    const kind = header.dataset.sortKind;
    const field = header.dataset.sortField === "name" ? "" : header.dataset.sortField;
    const state = equipmentDatabase.state;
    if (state.sort[kind] === field) state.direction = state.direction === "asc" ? "desc" : "asc";
    else { state.sort[kind] = field; state.direction = "asc"; }
    databaseRender();
  }));
}

async function loadEquipmentDatabase() {
  await window.WIKI_I18N.ready;
  const values = await Promise.all([
    fetch("assets/data/item-catalog.json").then(response => response.json()),
    ...databaseKinds.map(([file]) => fetch(`assets/data/item/${file}.json`).then(response => response.json()))
  ]);
  equipmentDatabase = { catalog: values[0], state: { sort: {}, direction: "asc", open: new Set() } };
  databaseKinds.forEach(([file], index) => { equipmentDatabase[file] = values[index + 1]; });
  equipmentDatabase.fields = Object.fromEntries(databaseKinds.map(([file, kind]) =>
    [file, databaseFields(kind, equipmentDatabase[file])]
  ));
  equipmentDatabase.searchIndex = new WeakMap();
  equipmentDatabase.weaponTypes = Object.fromEntries(
    [...new Set(Object.values(equipmentDatabase.weapons).map(record => record.Type).filter(Boolean))]
      .sort()
      .map(type => [type, Object.fromEntries(
        Object.entries(equipmentDatabase.weapons).filter(([, record]) => record.Type === type)
      )])
  );
  databaseRender();
}

loadEquipmentDatabase();

window.addEventListener("wiki-language-change", () => {
  if (equipmentDatabase) {
    equipmentDatabase.searchIndex = new WeakMap();
    databaseRender();
  }
});
