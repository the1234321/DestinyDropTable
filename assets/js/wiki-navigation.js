const panels = {
  drops: document.querySelector("#drop-table-panel"),
  bazaar: document.querySelector("#bazaar-panel"),
  guide: document.querySelector("#guide-panel"),
  dictionary: document.querySelector("#dictionary-panel"),
  database: document.querySelector("#database-panel")
};

const siteNav = document.querySelector(".wiki-site-nav");
const guideViews = ["server-rules", "common-commands", "level-200", "localization"];
const views = ["drops", ...guideViews, "dictionary", "special", "crafting", "crafting-recipes", "exchange", "crafting-sets", "quests", "database"];
const viewFromHash = hash => hash === "commands" ? "common-commands"
  : hash === "effects" ? "crafting-recipes"
    : hash === "bazaar" ? "exchange"
      : views.includes(hash) ? hash : "drops";
const updateStickyOffset = () => {
  document.documentElement.style.setProperty("--wiki-nav-height", `${siteNav.getBoundingClientRect().height}px`);
};
updateStickyOffset();
new ResizeObserver(updateStickyOffset).observe(siteNav);

function selectView(view, updateHash = true, scrollToTop = true) {
  const routeView = view;
  if (view === "crafting-recipes" || view === "crafting-sets") {
    window.WIKI_CRAFTING_SECTION = view === "crafting-sets" ? "sets" : "recipes";
    view = "crafting";
  }
  if (view === "localization" && window.WIKI_I18N.language !== "cn") view = "server-rules";
  const isDrops = view === "drops";
  const isGuide = guideViews.includes(view) || view === "commands";
  if (view === "commands") view = "common-commands";
  const isDictionary = view === "dictionary";
  const isDatabase = view === "database";
  window.WIKI_ACTIVE_VIEW = view;
  panels.drops.hidden = !isDrops;
  panels.bazaar.hidden = isDrops || isGuide || isDictionary || isDatabase;
  panels.guide.hidden = !isGuide;
  panels.dictionary.hidden = !isDictionary;
  panels.database.hidden = !isDatabase;
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const dropdownViews = {
    drops: isDrops || view === "special",
    "locale-tools": view === "localization" || view === "dictionary",
    equipment: view === "crafting" || view === "database",
    quests: view === "quests" || view === "exchange"
  };
  Object.entries(dropdownViews).forEach(([group, active]) => {
    const dropdown = document.querySelector(`.wiki-nav-dropdown[data-nav-group="${group}"]`);
    if (!dropdown) return;
    dropdown.classList.toggle("is-active", active);
    dropdown.querySelector(".wiki-nav-button").setAttribute("aria-selected", String(active));
  });
  if (!isDrops && !isGuide && !isDictionary && !isDatabase && window.setBazaarSection) window.setBazaarSection(view);
  if (updateHash) history.replaceState(null, "", "#" + routeView);
  if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
  if (isGuide) renderGuidePage(view);
  if (isDatabase && window.WIKI_LOAD_EQUIPMENT_DATABASE) {
    window.WIKI_LOAD_EQUIPMENT_DATABASE().catch(error => {
      const root = document.querySelector("#equipment-database");
      if (root) root.textContent = "Could not load the equipment database.";
      console.error("Could not load the equipment database.", error);
    });
  }
}

document.querySelectorAll(".wiki-nav-dropdown").forEach(dropdown => {
  const button = dropdown.querySelector(".wiki-nav-button");
  dropdown.addEventListener("pointerenter", () => {
    dropdown.classList.remove("is-dismissed");
    button.setAttribute("aria-expanded", "true");
  });
  dropdown.addEventListener("focusin", () => {
    dropdown.classList.remove("is-dismissed");
    button.setAttribute("aria-expanded", "true");
  });
  button.addEventListener("click", () => {
    if (button.dataset.defaultView) {
      selectView(button.dataset.defaultView);
      return;
    }
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    dropdown.classList.toggle("is-dismissed", expanded);
  });
  dropdown.addEventListener("pointerleave", () => {
    button.setAttribute("aria-expanded", "false");
    dropdown.classList.add("is-dismissed");
  });
  dropdown.addEventListener("focusout", event => {
    if (!dropdown.contains(event.relatedTarget)) {
      button.setAttribute("aria-expanded", "false");
      dropdown.classList.add("is-dismissed");
    }
  });
});

document.querySelectorAll(".wiki-nav-button[data-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.view));
});
document.querySelectorAll("[data-guide-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.guideView));
});

document.querySelectorAll("[data-locale-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.localeView));
});

document.querySelectorAll("[data-task-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.taskView));
});

document.querySelectorAll("[data-equipment-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.equipmentView));
});

document.querySelectorAll("[data-drop-view]").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.dropView));
});

const initialView = location.hash.slice(1);
selectView(viewFromHash(initialView), false);

window.addEventListener("popstate", () => {
  selectView(viewFromHash(location.hash.slice(1)), false, false);
});

window.addEventListener("wiki-language-change", event => {
  if (event.detail.language === "en" && window.WIKI_ACTIVE_VIEW === "localization") selectView("server-rules");
  else if (event.detail.language === "en" && window.WIKI_ACTIVE_VIEW === "dictionary") selectView("drops");
  else if (guideViews.includes(window.WIKI_ACTIVE_VIEW)) renderGuidePage(window.WIKI_ACTIVE_VIEW);
});

async function renderBilingualDictionary() {
  const root = document.querySelector("#bilingual-dictionary");
  if (!root || window.WIKI_I18N.language !== "cn") { if (root) root.replaceChildren(); return; }
  await window.WIKI_I18N.ready;
  try {
    const [items, translation] = await Promise.all([
      window.WIKI_DATA.loadJson("assets/data/item-catalog.json"),
      window.WIKI_DATA.loadJson("assets/data/translation/cn.json?v=20261103-6")
    ]);
    const rows = Object.entries(items).map(([en, value]) => [en, value.name?.cn || ""])
      .filter(([en, cn]) => en || cn).sort((a, b) => a[0].localeCompare(b[0]));
    const monsterTranslations = translation.monsters || {};
    const monsterNames = new Set([
      ...Object.keys(monsterTranslations),
      ...window.WIKI_I18N.getMonsterCatalogEntries().map(([name]) => name)
    ]);
    const monsters = [...monsterNames].map(en => [en, monsterTranslations[en]?.name || ""])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const table = (title, data, kind) => `<section class="dictionary-section" data-dictionary-kind="${kind}"><h2>${title}</h2><div class="dictionary-table-wrap"><table><thead><tr><th>English</th><th>中文</th></tr></thead><tbody>${data.map(([en, cn]) => {
      return `<tr data-search="${databaseEscape(window.WIKI_SEARCH.normalize(`${en} ${cn}`))}"><td>${databaseEscape(en)}</td><td>${databaseEscape(cn)}</td></tr>`;
    }).join("")}</tbody></table></div></section>`;
    root.innerHTML = `<article class="dictionary-panel"><p class="dictionary-panel__intro">中英名称速查</p><input id="dictionarySearch" class="dictionary-search" type="search" placeholder="搜索英文或中文名称…">${table("道具名称", rows, "items")}${table("怪物名称", monsters, "monsters")}</article>`;
    const search = root.querySelector("#dictionarySearch");
    window.WIKI_SEARCH.bind(search, query => {
      root.querySelectorAll(".dictionary-section").forEach(section => {
        const matches = window.WIKI_SEARCH.filter(section, "tbody tr", query);
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

let newPlayerGuidePromise;
function guideText(value) {
  if (typeof value === "string") return value;
  return value?.[window.WIKI_I18N.language] || value?.cn || value?.en || "";
}

function guideEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function loadNewPlayerGuide() {
  if (!newPlayerGuidePromise) {
    newPlayerGuidePromise = window.WIKI_DATA.loadJson("assets/data/site/new-player-guide.json");
  }
  return newPlayerGuidePromise;
}

function guideHeader(title, subtitle = "") {
  return `<p class="command-panel__eyebrow">${guideEscape(window.WIKI_I18N.text("guide.eyebrow", "D服务器指南"))}</p><h2>${guideEscape(title)}</h2>${subtitle ? `<p class="guide-page__intro">${guideEscape(subtitle)}</p>` : ""}`;
}

function renderRules(guide) {
  const cards = guide.rules.map(rule => `
    <article class="guide-card">
      <h3>${guideEscape(guideText(rule.title))}</h3>
      <p>${guideEscape(guideText(rule.content))}</p>
    </article>`).join("");
  return `${guideHeader(window.WIKI_I18N.text("guide.serverRules", "服务器规则"))}<div class="guide-card-grid">${cards}</div>`;
}

function renderCommands(guide) {
  const groups = guide.commandGroups.map(group => `
    <section class="guide-command-group">
      <h3>${guideEscape(guideText(group.title))}</h3>
      <div class="guide-command-grid">${group.commands.map(command => {
        const name = guideText(command.nameEn ? { cn: command.name, en: command.nameEn } : command.name);
        const details = (command.details?.[window.WIKI_I18N.language] || command.details?.cn || [])
          .map(detail => `<li>${guideEscape(detail)}</li>`).join("");
        const sectionIds = command.sectionIds ? `<div class="guide-section-id-grid">${command.sectionIds.map(section => {
          const label = guideText(section.name);
          const image = guideEscape(section.image);
          return `<div class="guide-section-id"><img src="images/ids/${image}" alt="${guideEscape(label)}" title="${guideEscape(label)}"><span class="guide-section-id__number">${guideEscape(section.id)}</span><span>${guideEscape(label)}</span></div>`;
        }).join("")}</div>` : "";
        return `<article class="guide-command"><h4><code>${guideEscape(name)}</code>${command.recommended ? `<span class="guide-command__tag">${guideEscape(window.WIKI_I18N.text("guide.recommended", "推荐快捷键"))}</span>` : ""}</h4><p>${guideEscape(guideText(command.summary))}</p>${details ? `<ul>${details}</ul>` : ""}${sectionIds}</article>`;
      }).join("")}</div>
    </section>`).join("");
  return `${guideHeader(window.WIKI_I18N.text("guide.commonCommands", "常用命令"))}${groups}`;
}

function statDetails(classBuild, language) {
  const label = (key, fallback) => guideEscape(window.WIKI_I18N.text(`guide.${key}`, fallback));
  const notes = values => values?.[language] || values?.cn || [];
  const renderBuild = build => `
    <dl class="stat-build">
      <div><dt>${label("mag", "玛古配置")}</dt><dd>${guideEscape(build.mag)}</dd></div>
      <div><dt>${label("materials", "药水分配")}</dt><dd>${guideEscape(guideText(build.materials))}</dd></div>
      <div><dt>${label("remaining", "剩余药位")}</dt><dd>${guideEscape(build.remaining)}</dd></div>
    </dl>${notes(build.notes).length ? `<ul class="stat-build__notes">${notes(build.notes).map(note => `<li>${guideEscape(note)}</li>`).join("")}</ul>` : ""}`;
  if (classBuild.routes) {
    return classBuild.routes.map(route => `
      <section class="stat-route">
        <h5>${guideEscape(guideText(route.name))}</h5>
        ${renderBuild(route)}
      </section>`).join("");
  }
  return renderBuild(classBuild);
}

function renderStatPlan(guide) {
  const plan = guide.statPlan;
  const principles = plan.principles.map(item => `
    <article class="guide-card">
      <h3>${guideEscape(guideText(item.title))}</h3>
      <p>${guideEscape(guideText(item.content))}</p>
    </article>`).join("");
  const groups = [...new Set(plan.classes.map(item => JSON.stringify(item.group)))];
  const classes = groups.map(groupKey => {
    const group = JSON.parse(groupKey);
    const entries = plan.classes.filter(item => JSON.stringify(item.group) === groupKey);
    return `<section class="guide-command-group"><h3>${guideEscape(guideText(group))}</h3><div class="guide-build-grid">${entries.map(build => `
      <article class="guide-build-card">
        <h4>${guideEscape(build.name)}${window.WIKI_I18N.language === "cn" && build.nickname ? ` <small>（${guideEscape(build.nickname)}）</small>` : ""}</h4>
        ${statDetails(build, window.WIKI_I18N.language)}
      </article>`).join("")}</div></section>`;
  }).join("");
  return `${guideHeader(guideText(plan.intro))}<div class="guide-card-grid guide-card-grid--principles">${principles}</div>${classes}`;
}

async function renderGuidePage(view) {
  const root = document.querySelector("#guide-content");
  if (!root || !guideViews.includes(view)) return;
  root.dataset.guidePage = view;
  try {
    if (view === "localization") {
      const guide = await window.WIKI_DATA.loadJson("assets/data/site/localization-guide.json");
      root.innerHTML = `
        <div class="localization-guide">
          <p class="command-panel__eyebrow">${guideEscape(guideText(guide.eyebrow))}</p>
          <h2>${guideEscape(guideText(guide.title))}</h2>
          <div class="command-panel__content">
            <p>${guideEscape(guideText(guide.description))}</p>
            <ol>${guide.steps.map(step => `<li>${guideEscape(guideText(step))}</li>`).join("")}</ol>
            <a class="localization-guide__download" href="${guideEscape(guide.download.href)}" download>${guideEscape(guideText(guide.download.label))}</a>
          </div>
        </div>`;
      return;
    }
    const guide = await loadNewPlayerGuide();
    if (view === "server-rules") root.innerHTML = renderRules(guide);
    else if (view === "common-commands") root.innerHTML = renderCommands(guide);
    else root.innerHTML = renderStatPlan(guide);
  } catch (error) {
    root.textContent = window.WIKI_I18N.text("guide.loadError", "指南内容加载失败。");
    console.error("Could not render guide page.", error);
  }
}

let equipmentDatabase = null;
let databaseFilterActive = false;
let databaseTargetItem = "";
let equipmentDatabaseReady;
const equipmentItemIds = new Set();
const normalizedItemId = value => window.WIKI_SEARCH.normalize(value);
window.WIKI_HAS_EQUIPMENT = itemId => equipmentItemIds.has(normalizedItemId(itemId));
window.addEventListener("wiki-drop-data-ready", event => {
  event.detail.equipmentNames.forEach(name => equipmentItemIds.add(normalizedItemId(name)));
  refreshEquipmentLinks();
});

function refreshEquipmentLinks(root = document) {
  root.querySelectorAll("[data-item]:not(.item-cell)").forEach(node => {
    const available = window.WIKI_HAS_EQUIPMENT(node.dataset.item);
    node.dataset.equipmentAvailable = String(available);
    node.classList.toggle("wiki-item-link", available);
  });
}
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

function databaseCellHtml(value, field, query, itemName) {
  if (field === "Drop Source") {
    return databaseDropSourceHtml(
      equipmentDatabase.dropSources.get(databaseItemKey(itemName)) || [],
      query
    );
  }
  if (value == null || value === "" || window.WIKI_SEARCH.normalize(value) === "none" && ["Boosts", "Special"].includes(field)) return "";
  if (field === "Class" && value) return databaseClassHtml(value, query);
  if (field === "Special" && value) return databaseSpecialHtml(value, query);
  if (field === "Boosts" && value) return databaseBoostHtml(value, query);
  return databaseHighlight(databaseDisplayValue(value, field), query, databaseValue(value));
}

function databaseFields(kind, records) {
  return [...new Set(Object.values(records).flatMap(record => Object.keys(record || {})))].filter(field =>
    field !== "Description" && field !== "Grind" && !(kind === "mag" && field === "Notes") && !(kind === "weapon" && ["Type", "ATP"].includes(field))
  ).concat("Drop Source");
}

function databaseItemKey(itemName) {
  return window.WIKI_SEARCH.normalize(itemName).replace(/\s+/g, " ");
}

function databaseSpecialIds(ids, sectionIds) {
  const text = String(ids ?? "").trim();
  const normalized = text.toLocaleLowerCase().replace(/\s+/g, " ");
  const idNames = sectionIds.map((section, index) => ({ name: section.id, index }));
  const allIds = /\ball\s*ids\b/i.test(normalized) || /^except\b/i.test(normalized);
  const excluded = allIds && /\bexcept\b/i.test(normalized)
    ? idNames.filter(({ name }) => normalized.includes(name.toLocaleLowerCase()))
    : [];
  const included = allIds
    ? idNames.filter(({ index }) => !excluded.some(id => id.index === index))
    : idNames.filter(({ name }) => normalized.includes(name.toLocaleLowerCase()));
  return {
    sections: included.map(({ name, index }) => ({ name, id: index })),
    excludedSections: excluded.map(({ name, index }) => ({ name, id: index })),
    idMode: allIds ? "all" : "",
    idCount: sectionIds.length,
    idLabel: included.length ? "" : text
  };
}

function databaseSourceItemKey(itemName) {
  return databaseItemKey(String(itemName || "").replace(/\s+x\d+\s*$/i, ""));
}

function addDatabaseDropSource(index, itemName, source) {
  const key = databaseItemKey(itemName);
  if (!key) return;
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(source);
}

function buildDatabaseDropSources(tables, sectionIds, questCatalog, recipes, exchanges) {
  const sourceIndex = new Map();
  const sectionNumbers = new Map(sectionIds.map((section, index) => [section.id, index]));
  Object.entries(tables || {}).forEach(([difficulty, episodes]) => {
    Object.entries(episodes || {}).forEach(([episode, data]) => {
      (data.monsters || []).forEach(monster => {
        Object.entries(monster.drops || {}).forEach(([section, drop]) => {
          addDatabaseDropSource(sourceIndex, drop.item, {
            kind: "drop",
            monster: monster.name,
            sections: [{ name: section, id: sectionNumbers.get(section) }],
            rate: drop.rate || "",
            difficulty,
            episode
          });
        });
      });
    });
  });

  Object.entries(questCatalog || {}).forEach(([episode, categories]) => {
    Object.entries(categories || {}).forEach(([category, quests]) => {
      Object.entries(quests || {}).forEach(([quest, data]) => {
        Object.entries(data.drops || {}).forEach(([monsters, drops]) => {
          Object.entries(drops || {}).forEach(([drop, ids]) => {
            const match = drop.match(/^(.*?)\s+(\d+\/\d+)\s*$/);
            const itemName = (match?.[1] || drop).trim();
            const rate = match?.[2] || "";
            monsters.split(",").map(monster => monster.trim()).filter(Boolean).forEach(monster => {
              addDatabaseDropSource(sourceIndex, itemName, {
                kind: "special",
                monster,
                ...databaseSpecialIds(ids, sectionIds),
                rate,
                episode,
                category,
                quest
              });
            });
          });
        });
      });
    });
  });

  (recipes || []).forEach(recipe => {
    [recipe.result, ...(recipe.extra || [])].forEach(item => {
      const result = databaseSourceItemKey(item);
      if (!result) return;
      addDatabaseDropSource(sourceIndex, result, {
        kind: "crafting",
        components: recipe.components || [],
        episode: "",
        category: "",
        quest: ""
      });
    });
  });

  (exchanges || []).forEach(task => {
    const match = String(task.task || "").match(/^(EP\d+)\s+([^\s]+)\s+(.+)$/);
    if (!match) return;
    const [, episode, category, quest] = match;
    (task.npcs || []).forEach(npc => (npc.exchanges || []).forEach(exchange => {
      const result = databaseSourceItemKey(exchange.item);
      if (!result) return;
      addDatabaseDropSource(sourceIndex, result, {
        kind: "exchange",
        episode,
        category,
        quest,
        components: (exchange.materials || []).map(material => material.content)
      });
    }));
  });

  const difficultyOrder = { Ultimate: 0, "Very Hard": 1, Hard: 2, Normal: 3 };
  sourceIndex.forEach((sources, itemName) => {
    const contextGroups = new Map();
    sources.forEach(source => {
      const contextKey = source.kind === "drop"
        ? JSON.stringify([source.kind, source.monster, source.rate, source.difficulty, source.episode])
        : JSON.stringify([source.kind, source.monster, source.rate, source.idMode, source.idLabel, source.category, source.quest, source.episode, source.components]);
      if (!contextGroups.has(contextKey)) {
        contextGroups.set(contextKey, {
          ...source,
          sections: [],
          excludedSections: [],
          contexts: []
        });
      }
      const group = contextGroups.get(contextKey);
      (source.sections || []).forEach(section => {
        if (!group.sections.some(entry => entry.id === section.id)) group.sections.push(section);
      });
      (source.excludedSections || []).forEach(section => {
        if (!group.excludedSections.some(entry => entry.id === section.id)) group.excludedSections.push(section);
      });
      const context = source.kind === "drop"
        ? { difficulty: source.difficulty, episode: source.episode }
        : { episode: source.episode };
      if (!group.contexts.some(entry =>
        entry.difficulty === context.difficulty && entry.episode === context.episode
      )) group.contexts.push(context);
    });
    const merged = new Map();
    contextGroups.forEach(source => {
      source.sections.sort((left, right) => left.id - right.id);
      const groupKey = JSON.stringify([
        source.kind,
        source.monster,
        source.rate,
        source.idMode,
        source.idLabel,
        source.category,
        source.quest,
        ...(source.components || []),
        source.sections.map(section => section.id),
        source.excludedSections.map(section => section.id)
      ]);
      if (!merged.has(groupKey)) merged.set(groupKey, { ...source, contexts: [] });
      const group = merged.get(groupKey);
      source.contexts.forEach(context => {
        if (!group.contexts.some(entry =>
          entry.difficulty === context.difficulty && entry.episode === context.episode
        )) group.contexts.push(context);
      });
    });
    merged.forEach(source => {
      source.contexts.sort((left, right) =>
        (difficultyOrder[left.difficulty] ?? 4) - (difficultyOrder[right.difficulty] ?? 4) ||
        left.episode.localeCompare(right.episode)
      );
    });
    sourceIndex.set(itemName, [...merged.values()].sort((left, right) => {
      const sourceOrder = { drop: 0, special: 1, crafting: 2, exchange: 3 };
      if (left.kind !== right.kind) return (sourceOrder[left.kind] ?? 4) - (sourceOrder[right.kind] ?? 4);
      const difficultyDifference = (difficultyOrder[left.difficulty] ?? 4) - (difficultyOrder[right.difficulty] ?? 4);
      if (difficultyDifference) return difficultyDifference;
      const episodeDifference = left.episode.localeCompare(right.episode);
      return episodeDifference || (left.monster || "").localeCompare(right.monster || "") || (left.quest || "").localeCompare(right.quest || "");
    }));
  });
  return sourceIndex;
}

function databaseDropSourceSearchText(sources = []) {
  return sources.flatMap(source => [
    source.monster,
    source.monster ? window.WIKI_I18N.getMonster(source.monster) : "",
    databaseDropSourceIdLabel(source),
    ...source.sections.flatMap(section => [section.id, section.name]),
    ...(source.excludedSections || []).flatMap(section => [section.id, section.name]),
    source.idLabel,
    source.rate,
    source.category,
    source.quest,
    ...(source.components || []),
    ...source.contexts.flatMap(context => [context.difficulty, context.episode])
  ]).filter(Boolean).join(" ");
}

function databaseDropSourceIdLabel(source) {
  if (source.idMode === "all" && source.sections.length) {
    const allIds = Array.from({ length: source.idCount }, (_, index) => index);
    const excluded = allIds.filter(id => !source.sections.some(section => section.id === id));
    return excluded.length
      ? `IDs 0-${allIds.length - 1} except ${excluded.join(", ")}`
      : `IDs 0-${allIds.length - 1}`;
  }
  if (source.sections.length) {
    return source.sections.map(section => `ID ${section.id} ${section.name}`).join(", ");
  }
  return source.idLabel || "";
}

function databaseDropSourceIdHtml(source, query) {
  const label = databaseDropSourceIdLabel(source);
  if (!source.sections.length) {
    return label ? databaseHighlight(label, query, source.idLabel || label) : "";
  }
  const icon = section => `<img class="bazaar-section-id-icon" src="images/ids/${databaseEscape(section.name)}.png" alt="${databaseEscape(section.name)}" title="${databaseEscape(section.name)} (${section.id})">`;
  if (source.idMode === "all") {
    if (source.excludedSections?.length) {
      const excludedIcons = source.excludedSections.map(icon).join("");
      return `${window.WIKI_I18N.language === "cn" ? "除" : "Except"} ${excludedIcons}`;
    }
  }
  return source.sections.map(icon).join("");
}

function databaseDropSourceEntryHtml(source, query) {
  const contexts = source.contexts.map(context => {
    if (source.kind !== "drop") return "";
    const difficulty = window.WIKI_I18N.language === "cn"
      ? ({ Normal: "N", Hard: "H", "Very Hard": "VH", Ultimate: "U" }[context.difficulty] || context.difficulty)
      : context.difficulty;
    return `${context.episode} · ${difficulty}`;
  }).join(", ");
  const monsterName = source.monster ? window.WIKI_I18N.getMonster(source.monster) : "";
  const idLabel = databaseDropSourceIdHtml(source, query);
  const components = source.components?.length
    ? `<span class="database-drop-source__components">${source.components.map((component, index) => `${index ? '<span class="database-drop-source__operator">+</span>' : ""}<span class="database-drop-source__component">${databaseHighlight(window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getExchangeItemName(component) : component, query, component)}</span>`).join("")}</span>`
    : "";
  const parts = [
    contexts ? `<span class="database-drop-source__context">${databaseHighlight(contexts, query, source.contexts.map(context => `${context.difficulty || ""} ${context.episode}`).join(" "))}</span>` : "",
    source.kind === "special" || source.kind === "exchange" ? `<span class="database-drop-source__quest">${databaseHighlight(`${source.episode} · ${source.category} · ${source.quest.replace(/\s+⭐+$/u, "")}`, query, `${source.episode} ${source.category} ${source.quest}`)}</span>` : "",
    source.kind === "crafting" ? `<span class="database-drop-source__quest">${databaseHighlight(window.WIKI_I18N.language === "cn" ? "合成" : "Crafting", query, "Crafting")}</span>` : "",
    components,
    source.monster ? `<span class="database-drop-source__monster" title="${databaseEscape(source.monster)}">${databaseHighlight(monsterName, query, source.monster)}</span>` : "",
    idLabel ? `<span class="database-drop-source__id">${idLabel}</span>` : "",
    source.rate ? `<span class="database-drop-source__rate">${databaseHighlight(source.rate, query)}</span>` : ""
  ].filter(Boolean);
  const title = source.kind === "special" ? ` title="${databaseEscape(source.quest)}"` : "";
  return `<span class="database-drop-source__entry"${title}>${parts.join('<span class="database-drop-source__separator"> · </span>')}</span>`;
}

function databaseDropSourceHtml(sources, query) {
  if (!sources?.length) return "";
  const firstSource = databaseDropSourceEntryHtml(sources[0], query);
  if (sources.length === 1) return firstSource;
  const sourceList = sources.map(source => databaseDropSourceEntryHtml(source, query)).join("");
  const expandLabel = window.WIKI_I18N.language === "cn" ? "展开更多" : "Show more";
  const collapseLabel = window.WIKI_I18N.language === "cn" ? "收起" : "Show less";
  return `<details class="database-drop-sources"><summary>${firstSource}<span class="database-drop-source__more" aria-label="${expandLabel}"><span class="database-drop-source__more-count">+${sources.length - 1}</span><span class="database-drop-source__more-label database-drop-source__more-label--expand">${expandLabel}</span><span class="database-drop-source__more-label database-drop-source__more-label--collapse">${collapseLabel}</span><span class="database-drop-source__more-caret" aria-hidden="true">▾</span></span></summary><div class="database-drop-sources__list">${sourceList}</div></details>`;
}

function databaseRows(records, fields, query) {
  const lowerQuery = window.WIKI_SEARCH.normalize(query);
  return Object.keys(records).filter(name => {
    if (databaseTargetItem) return name === databaseTargetItem;
    const record = records[name];
    let searchable = equipmentDatabase.searchIndex.get(record);
    if (searchable == null) {
      const values = [name, databaseDisplayName(name), ...fields.flatMap(field => [
        field === "Drop Source"
          ? databaseDropSourceSearchText(equipmentDatabase.dropSources.get(databaseItemKey(name)) || [])
          : "",
        ["Boosts", "Special"].includes(field) && window.WIKI_SEARCH.normalize(record[field]) === "none"
          ? ""
          : databaseValue(record[field]),
        databaseDisplayValue(record[field], field)
      ]), record.Grind > 0 ? `+${record.Grind}` : ""];
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
    const fieldValue = name => sortField === "Drop Source"
      ? databaseDropSourceSearchText(equipmentDatabase.dropSources.get(databaseItemKey(name)) || [])
      : records[name][sortField];
    const left = databaseDisplayValue(fieldValue(leftName), sortField);
    const right = databaseDisplayValue(fieldValue(rightName), sortField);
    const leftNumber = Number.parseFloat(left.replace(/[^\d.+-]/g, ""));
    const rightNumber = Number.parseFloat(right.replace(/[^\d.+-]/g, ""));
    const result = Number.isNaN(leftNumber) || Number.isNaN(rightNumber) ? left.localeCompare(right) : leftNumber - rightNumber;
    return state.direction === "desc" ? -result : result;
  });
  const header = field => {
    const label = window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getDatabase(field) : field;
    return state.sort[kind] === field ? `${label} ${state.direction === "asc" ? "▲" : "▼"}` : label;
  };
  return `<div class="database-table-wrap"><table class="database-table" data-db-kind="${databaseEscape(kind)}"><thead><tr><th data-sort-kind="${databaseEscape(kind)}" data-sort-field="name">${databaseEscape(header("Name"))}</th>${fields.map(field => `<th data-sort-kind="${databaseEscape(kind)}" data-sort-field="${databaseEscape(field)}">${databaseEscape(header(field))}</th>`).join("")}</tr></thead><tbody>${rows.map(name => {
    const record = records[name];
    const rarity = equipmentDatabase.catalog?.[name]?.superitem || 0;
    const rarityClass = rarity === 2 ? "ultimate-item" : rarity === 1 ? "legend-item" : "";
    const targetClass = databaseTargetItem === name ? "database-target" : "";
    const grind = Number(record.Grind);
    const grindSuffix = Number.isFinite(grind) && grind > 0 ? `+${grind}` : "";
    const displayName = databaseDisplayName(name);
    const nameTitle = `${displayName}${grindSuffix ? ` ${grindSuffix}` : ""}${displayName !== name ? ` ${name}` : ""}`;
    const englishName = name;
    const shownName = window.WIKI_I18N.language === "cn" ? displayName : name;
    const nameCell = `<td data-db-field="Name"><button class="database-mobile-sort-label" type="button" data-sort-kind="${databaseEscape(kind)}" data-sort-field="name">${databaseEscape(header("Name"))}</button><div class="database-cell-value"><span class="database-item-name ${rarityClass}" title="${databaseEscape(nameTitle)}">${databaseHighlight(shownName, query, name)}${grindSuffix ? ` ${databaseHighlight(grindSuffix, query)}` : ""}</span>${window.WIKI_I18N.language === "cn" && displayName !== name ? `<small class="database-name-en">${databaseHighlight(englishName, query)}</small>` : ""}</div></td>`;
    const cells = fields.map(field =>
      `<td data-db-field="${databaseEscape(field)}"><button class="database-mobile-sort-label" type="button" data-sort-kind="${databaseEscape(kind)}" data-sort-field="${databaseEscape(field)}">${databaseEscape(header(field))}</button><div class="database-cell-value">${databaseCellHtml(record[field], field, query, name)}</div></td>`
    ).join("");
    return `<tr class="${targetClass}">${nameCell}${cells}</tr>`;
  }).join("")}</tbody></table></div>`;
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
    window.WIKI_SEARCH.bind(search, () => {
      databaseTargetItem = "";
      databaseRender();
    });
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

function findEquipmentItem(itemId) {
  const normalizedId = window.WIKI_SEARCH.normalize(itemId);
  for (const [file] of databaseKinds) {
    const records = equipmentDatabase[file] || {};
    const name = Object.keys(records).find(candidate =>
      window.WIKI_SEARCH.normalize(candidate) === normalizedId
    );
    if (name) return name;
  }
  return "";
}

window.WIKI_OPEN_EQUIPMENT = async itemId => {
  await window.WIKI_LOAD_EQUIPMENT_DATABASE();
  const name = findEquipmentItem(itemId);
  if (!name) return false;
  databaseTargetItem = name;
  history.pushState({ view: "database", item: name }, "", "#database");
  selectView("database", false, false);
  const root = document.querySelector("#equipment-database");
  const search = root.querySelector("#equipmentDatabaseSearch");
  search.value = name;
  databaseRender();
  requestAnimationFrame(() => {
    root.querySelector(".database-target")?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  return true;
};

async function loadEquipmentDatabase() {
  await window.WIKI_I18N.ready;
  const values = await Promise.all([
    window.WIKI_DATA.loadJson("assets/data/item-catalog.json"),
    ...databaseKinds.map(([file]) => window.WIKI_DATA.loadJson(`assets/data/item/${file}.json`)),
    window.WIKI_DATA.loadJson("assets/data/drop-table/tables.json"),
    window.WIKI_DATA.loadJson("assets/data/drop-table/section-ids.json"),
    window.WIKI_DATA.loadJson("assets/data/bazaar/quest-catalog.json"),
    window.WIKI_DATA.loadJson("assets/data/drop-table/recipes.json"),
    window.WIKI_DATA.loadJson("assets/data/bazaar/exchanges.json")
  ]);
  equipmentDatabase = {
    catalog: values[0],
    dropSources: buildDatabaseDropSources(values[6], values[7], values[8], values[9], values[10]),
    state: { sort: {}, direction: "asc", open: new Set() }
  };
  databaseKinds.forEach(([file], index) => { equipmentDatabase[file] = values[index + 1]; });
  databaseKinds.forEach(([file]) => {
    Object.keys(equipmentDatabase[file]).forEach(name => equipmentItemIds.add(normalizedItemId(name)));
  });
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
  refreshEquipmentLinks();
  window.dispatchEvent(new Event("wiki-equipment-database-ready"));
}

window.WIKI_LOAD_EQUIPMENT_DATABASE = () => {
  if (!equipmentDatabaseReady) {
    equipmentDatabaseReady = loadEquipmentDatabase().catch(error => {
      equipmentDatabaseReady = null;
      throw error;
    });
  }
  return equipmentDatabaseReady;
};
if (window.WIKI_ACTIVE_VIEW === "database") {
  window.WIKI_LOAD_EQUIPMENT_DATABASE().catch(error => {
    const root = document.querySelector("#equipment-database");
    if (root) root.textContent = "Could not load the equipment database.";
    console.error("Could not load the equipment database.", error);
  });
}

document.addEventListener("click", event => {
  if (event.button !== 0) return;
  const clicked = event.target instanceof Element ? event.target : event.target.parentElement;
  const target = clicked?.closest(".wiki-item-link[data-equipment-available='true']");
  if (!target || !target.dataset.item || !window.WIKI_OPEN_EQUIPMENT) return;
  event.preventDefault();
  window.WIKI_OPEN_EQUIPMENT(target.dataset.item).catch(error => {
    console.error("Could not open the equipment database item.", error);
  });
});

window.addEventListener("wiki-language-change", () => {
  if (equipmentDatabase) {
    equipmentDatabase.searchIndex = new WeakMap();
    databaseRender();
  }
});
