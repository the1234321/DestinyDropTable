let data;
let itemDetails = {};
let currentDifficulty = "Ultimate";
let currentEpisode = "EP1";
let sectionIds = [];

// 掉落表专用：用于展示各颜色 ID 的编号，不影响其他页面。
const SECTION_INDEX = {
    Viridia: 0, Greenill: 1, Skyly: 2, Bluefull: 3,
    Purplenum: 4, Pinkal: 5, Redria: 6, Oran: 7,
    Yellowboze: 8, Whitill: 9
};

const bonusIndex = {};
const recipeIndex = {};
const monsterQuestIndex = new Map();
const itemNameSearchCache = new Map();
const itemDetailSearchCache = new Map();
const bonusSearchCache = new WeakMap();
const itemTooltipRoots = new WeakSet();
const monsterTooltipRoots = new WeakSet();
let episodeObserver;

function difficultyLabel(difficulty) {
    return window.WIKI_I18N.text(`difficulty.${difficulty}`, difficulty);
}

function itemLabel(itemId) {
    return window.WIKI_I18N.getItem(itemId).name || itemId;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function searchText(...values) {
    return window.WIKI_SEARCH.normalize(values
        .flat(Infinity)
        .filter(value => typeof value === "string" && value.trim())
        .join(" "));
}

// 名称搜索始终同时使用原始英文名和中文名，不受当前界面语言影响。
function itemNameSearchText(itemId) {
    if (itemNameSearchCache.has(itemId)) return itemNameSearchCache.get(itemId);
    const item = data?.items?.[itemId];
    const text = item
        ? searchText(itemId, item.name?.en, item.name?.cn)
        : searchText(itemId);
    itemNameSearchCache.set(itemId, text);
    return text;
}

function itemDetailSearchText(itemId) {
    if (itemDetailSearchCache.has(itemId)) return itemDetailSearchCache.get(itemId);
    const item = data?.items?.[itemId];
    const text = item ? searchText(
        item.description?.en,
        item.description?.cn,
        item.quest?.en,
        item.quest?.cn
    ) : "";
    itemDetailSearchCache.set(itemId, text);
    return text;
}

function buildMonsterQuestIndex(questCatalog, questEpisodes) {
    monsterQuestIndex.clear();
    const normalizeMonsterName = name => name.trim().toLowerCase();
    ["EP1", "EP2", "EP4"].forEach((episode, episodeIndex) => {
        const questsByName = new Map((questEpisodes[episodeIndex] || []).map(quest => [
            quest.name.replace(/ \[EP\d+\]$/, "").trim(),
            quest
        ]));
        Object.entries(questCatalog?.[episode] || {}).forEach(([category, quests]) => {
            Object.entries(quests || {}).forEach(([rawTitle, quest]) => {
                const title = Array.from(rawTitle)
                    .filter(character => character.codePointAt(0) !== 0x2b50)
                    .join("")
                    .trim();
                const countData = questsByName.get(title);
                if (!countData?.monsters) return;

                const countsByMonster = new Map();
                Object.entries(countData.monsters).forEach(([monsterGroup, rawCount]) => {
                    const count = Number(rawCount);
                    if (!Number.isFinite(count) || count <= 0) return;
                    monsterGroup.split(/\s*\/\s*/).filter(Boolean).forEach(name => {
                        const key = normalizeMonsterName(name);
                        countsByMonster.set(key, (countsByMonster.get(key) || 0) + count);
                    });
                });

                countsByMonster.forEach((count, monster) => {
                    if (!monsterQuestIndex.has(monster)) monsterQuestIndex.set(monster, new Map());
                    const questsByEpisode = monsterQuestIndex.get(monster);
                    if (!questsByEpisode.has(episode)) questsByEpisode.set(episode, []);
                    questsByEpisode.get(episode).push({ episode, category, title, count });
                });
            });
        });
    });

    monsterQuestIndex.forEach(questsByEpisode => {
        questsByEpisode.forEach(quests => {
            quests.sort((left, right) =>
                right.count - left.count
                || left.category.localeCompare(right.category)
                || left.title.localeCompare(right.title)
            );
            quests.splice(3);
        });
    });
}

function monsterQuestsForEpisode(monsterName, episode) {
    return monsterQuestIndex.get(monsterName.trim().toLowerCase())?.get(episode) || [];
}

function renderMonsterQuestTooltip(tooltip, monsterName, episode) {
    const quests = monsterQuestsForEpisode(monsterName, episode);
    tooltip.innerHTML = monsterQuestTooltipMarkup(monsterName, quests);
    bindMonsterTooltipImageErrors(tooltip);
}

function monsterQuestTooltipMarkup(monsterName, quests = []) {
    const monsterMeta = window.WIKI_I18N.getMonsterMeta(monsterName);
    const image = monsterMeta.image
        ? `<img class="monster-quest-tooltip__image" src="${escapeHtml(monsterMeta.image)}" alt="">`
        : "";
    const heading = window.WIKI_I18N.language === "cn" ? "任务出现数量 TOP 3" : "Top 3 quests by monster count";
    const rows = quests.map((quest, index) => `
        <li class="monster-quest-tooltip__row">
            <span class="monster-quest-tooltip__rank">${index + 1}</span>
            <span class="monster-quest-tooltip__details">
                <span class="monster-quest-tooltip__context">${escapeHtml(`${quest.episode} · ${quest.category}`)}</span>
                <span class="monster-quest-tooltip__title">${escapeHtml(quest.title)}</span>
            </span>
            <span class="monster-quest-tooltip__count">${quest.count}</span>
        </li>`).join("");
    const empty = window.WIKI_I18N.language === "cn" ? "暂无任务数量记录" : "No quest count data";
    return `<div class="monster-quest-tooltip__header">${image}<span>${heading}</span></div>${rows
        ? `<ol class="monster-quest-tooltip__list">${rows}</ol>`
        : `<div class="monster-quest-tooltip__empty">${empty}</div>`}`;
}

function bindMonsterTooltipImageErrors(root) {
    root.querySelectorAll(".monster-quest-tooltip__image").forEach(image => {
        image.addEventListener("error", () => image.remove(), { once: true });
    });
}

function positionMonsterQuestTooltip(tooltip, event) {
    tooltip.style.display = "block";
    const rect = tooltip.getBoundingClientRect();
    const margin = 10;
    const offset = 16;
    let left = event.clientX + offset;
    let top = event.clientY + offset;
    if (left + rect.width > window.innerWidth - margin) left = event.clientX - rect.width - offset;
    if (top + rect.height > window.innerHeight - margin) top = event.clientY - rect.height - offset;
    tooltip.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin))}px`;
    tooltip.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin))}px`;
}

function bindMonsterQuestTooltips(root = document) {
    const tooltip = document.getElementById("monster-quest-tooltip");
    if (!tooltip || monsterTooltipRoots.has(root)) return;
    monsterTooltipRoots.add(root);
    let activeCell = null;
    let pointer = null;
    let positionFrame = 0;
    const hideTooltip = () => {
        activeCell = null;
        pointer = null;
        tooltip.style.display = "none";
    };
    const schedulePosition = event => {
        pointer = { clientX: event.clientX, clientY: event.clientY };
        tooltip.style.display = "block";
        if (positionFrame) return;
        positionFrame = requestAnimationFrame(() => {
            positionFrame = 0;
            if (activeCell && pointer) positionMonsterQuestTooltip(tooltip, pointer);
        });
    };

    root.addEventListener("mouseover", event => {
        const target = event.target instanceof Element ? event.target : null;
        const monster = target?.closest(".monster-cell.has-quest-data[data-monster]");
        if (!monster || monster === activeCell || monster.contains(event.relatedTarget)) return;
        activeCell = monster;
        renderMonsterQuestTooltip(tooltip, monster.dataset.monster, monster.closest(".table-section")?.id);
        schedulePosition(event);
    });
    root.addEventListener("mousemove", event => {
        if (activeCell?.contains(event.target)) schedulePosition(event);
    });
    root.addEventListener("mouseout", event => {
        if (activeCell?.contains(event.target) && !activeCell.contains(event.relatedTarget)) hideTooltip();
    });
}

function magTooltipHtml(detail) {
    if (detail?.type !== "mag") return "";
    const fields = ["100PB Trigger", "1/10HP Trigger", "Boss Trigger", "Activation Chance"];
    const rows = fields.map(field => {
        const label = window.WIKI_I18N.getDatabase(field) || field;
        const value = window.WIKI_I18N.getDatabase(detail.raw[field] || "none");
        return `<div class="tooltip-mag__row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
    }).join("");
    return `<div class="tooltip-mag"><div class="tooltip-mag__heading">${escapeHtml(window.WIKI_I18N.language === "cn" ? "玛古触发信息" : "MAG triggers")}</div>${rows}</div>`;
}

function bonusSearchText(effect) {
    if (!effect || typeof effect !== "object") return searchText(effect);
    const cached = bonusSearchCache.get(effect);
    if (cached?.language === window.WIKI_I18N.language) return cached.text;
    const text = searchText(
        Object.entries(effect).flatMap(([key, value]) => [key, effectLabel(key), value])
    );
    bonusSearchCache.set(effect, { language: window.WIKI_I18N.language, text });
    return text;
}

function effectLabel(key) {
    return window.WIKI_I18N.text(`effect.${key}`, key);
}

function effectValue(key, value) {
    return window.WIKI_I18N.getEffectValue(key, value).trim();
}

function effectText(effect) {
    if (!effect) return "";
    if (typeof effect === "string") return effect;
    return Object.entries(effect).map(([key, value]) => {
        if (key === "notes" && window.WIKI_I18N.language === "en") return "";
        if (value === true) return effectLabel(key);
        if (value === false || value == null || value === "") return "";
        const formattedValue = effectValue(key, value);
        return key === "notes" ? formattedValue : `${effectLabel(key)} ${formattedValue}`;
    }).filter(Boolean).join(", ");
}

function classBadges(value) {
    const classes = String(value || "").split(/,\s*/).filter(Boolean);
    const allClasses = new Set(["humar", "hunewearl", "hucast", "hucaseal", "ramar", "ramarl", "racast", "racaseal", "fomar", "fomarl", "fonewm", "fonewearl"]);
    if (classes.length === allClasses.size && classes.every(value => allClasses.has(value))) {
        return `<span class="class-badge class-all">${window.WIKI_I18N.text("label.allClasses", "全职业可装备")}</span>`;
    }
    const badges = classes.map(value => {
        const faction = /^(humar|hunewearl|hucast|hucaseal)$/.test(value) ? "hunter" :
            /^(ramar|ramarl|racast|racaseal)$/.test(value) ? "ranger" :
                /^(fomar|fomarl|fonewm|fonewearl)$/.test(value) ? "force" : "";
        return `<span class="class-badge ${faction}">${escapeHtml(window.WIKI_I18N.language === "cn" ? window.WIKI_I18N.getClass(value) : value)}</span>`;
    });
    const rows = [];
    for (let index = 0; index < badges.length; index += 4) rows.push(`<span class="class-badge-row">${badges.slice(index, index + 4).join(" ")}</span>`);
    return rows.join("");
}

function specialBadge(value, prefix = "") {
    if (!value || value === "None") return "";
    const translated = window.WIKI_I18N.getBoost(value);
    const tone = window.WIKI_I18N.getBoostTone(value);
    return `<span class="boost-badge ${tone}">${escapeHtml(prefix + translated)}</span>`;
}

function detailFor(itemName) {
    return itemDetails[itemName] || null;
}

function detailType(itemName, item) {
    const detail = detailFor(itemName);
    if (detail) return detail.type === "weapon" ? detail.raw.Type : detail.type === "armor" ? "Armor" : detail.type === "shield" ? "Shield" : detail.type === "unit" ? "Unit" : "Mag";
    return item?.type || "-";
}

function detailDescription(itemName, item) {
    const detail = detailFor(itemName);
    if (!detail) return window.WIKI_I18N.getItem(itemName).description;
    if (["weapon", "armor", "shield"].includes(detail.type)) return classBadges(detail.raw.Class);
    return "";
}

function detailBoosts(itemName) {
    const detail = detailFor(itemName);
    if (!detail || !detail.raw.Boosts || detail.raw.Boosts === "None") return "";
    return window.WIKI_I18N.getBoostParts(detail.raw.Boosts).map(part =>
        `<span class="boost-badge ${window.WIKI_I18N.getBoostTone(part.source)}">${escapeHtml(part.label)}</span>`
    ).join("");
}

async function loadData() {
    await window.WIKI_I18N.ready;
    const names = ['section-ids', 'bonuses', 'recipes', 'tables'];
    const paths = names.map(name => 'assets/data/drop-table/' + name + '.json');
    const [sectionIdsData, bonus, recipe, tables, items, ...additionalData] = await Promise.all([
        ...paths.map(path => window.WIKI_DATA.loadJson(path)),
        window.WIKI_DATA.loadJson('assets/data/item-catalog.json'),
        ...Object.values({ weapons: 'weapons', armors: 'armors', shields: 'shields', units: 'units', mags: 'mags' })
            .map(file => window.WIKI_DATA.loadJson(`assets/data/item/${file}.json`)),
        window.WIKI_DATA.loadJson('assets/data/bazaar/quest-catalog.json'),
        ...['EP1', 'EP2', 'EP4'].map(episode => window.WIKI_DATA.loadJson(`assets/data/quest/quest_${episode}.json`))
    ]);
    const detailFiles = additionalData.slice(0, 5);
    const questCatalog = additionalData[5];
    const questEpisodes = additionalData.slice(6);
    buildMonsterQuestIndex(questCatalog, questEpisodes);
    const detailKinds = ['weapon', 'armor', 'shield', 'unit', 'mag'];
    detailKinds.forEach((kind, index) => Object.entries(detailFiles[index] || {}).forEach(([name, raw]) => {
        itemDetails[name] = { type: kind, raw };
    }));
    window.dispatchEvent(new CustomEvent("wiki-drop-data-ready", {
        detail: { equipmentNames: Object.keys(itemDetails) }
    }));
    data = { sectionIds: sectionIdsData, bonus, recipe, tables, items };
    window.WIKI_I18N.setItems(items);
    sectionIds = sectionIdsData || [];
    window.WIKI_ITEMS = items;

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("focus", e => {
        e.target.select();
    });
    window.WIKI_SEARCH.bind(searchInput, performSearch);

    //初始化索引
    (data.bonus || []).forEach(b => {
        // 正常 items
        b.items.forEach(item => {
            if (!bonusIndex[item]) bonusIndex[item] = [];
            bonusIndex[item].push({ items: b.items, effect: b.effect });
        });

        // extra 指向的物品也显示同一个 bonus
        (b.extra || []).forEach(extraItem => {
            if (!bonusIndex[extraItem]) bonusIndex[extraItem] = [];
            bonusIndex[extraItem].push({ items: b.items, effect: b.effect });
        });
    });

    (data.recipe || []).forEach(r => {
        const formulaText = `${itemLabel(r.result)} = ${r.components.map(itemLabel).join(" + ")}`;

        // result + components
        const relatedItems = [r.result, ...r.components];

        // extra 指定的物品也显示这个配方
        if (r.extra && Array.isArray(r.extra)) {
            relatedItems.push(...r.extra);
        }

        relatedItems.forEach(item => {
            if (!recipeIndex[item]) recipeIndex[item] = [];
            recipeIndex[item].push({
                result: r.result,
                components: r.components,
                formula: formulaText
            });
        });
    });

    // hash同步
    const hash = location.hash;
    if (hash) {
        window.addEventListener("load", () => {
            // hash 解析
            const hash = location.hash.replace("#", "");
            if (hash) {
                const parts = hash.split("_");
                if (parts.length === 2) {
                    currentDifficulty = parts[0];
                    currentEpisode = parts[1];
                }
            }

            // 默认按钮高亮
            document.querySelectorAll(".tab-btn").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.difficulty === currentDifficulty);
            });
            document.querySelectorAll(".ep-btn").forEach(btn => {
                btn.classList.toggle("active", btn.innerText.trim() === currentEpisode);
            });

            // 滚动到当前章节
            const el = document.getElementById(currentEpisode);
            if (el) scrollToRow(el);

        });
    }

    render();
}
function render() {
    const container = document.getElementById("content");
    container.innerHTML = "";

    // 更新顶部按钮active
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.difficulty === currentDifficulty);
    });
    document.querySelectorAll(".ep-btn").forEach(btn => {
        btn.classList.toggle("active", btn.innerText === currentEpisode);
    });

    ["EP1", "EP2", "EP4"].forEach(ep => {
        const epData = data.tables?.[currentDifficulty]?.[ep];
        if (!epData) return;

        const section = document.createElement("div");
        section.className = "table-section";
        section.id = ep;

        let html = `
            <div class="table-title">${difficultyLabel(currentDifficulty)} ${ep}</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>  </th>
        `;

        sectionIds.forEach(id => {
            html += `<th class="header-${id.id}" data-section="${escapeHtml(id.id)}"><span>${id.id}</span><small class="section-id">ID ${SECTION_INDEX[id.id] ?? id.index ?? sectionIds.indexOf(id)}</small></th>`;
        });

        html += `</tr></thead><tbody>`;

        epData.monsters.forEach(monster => {
            const monsterInfo = window.WIKI_I18N.getMonsterMeta(monster.name);
            html += `<tr>
                        <td class="monster-cell${monsterQuestsForEpisode(monster.name, ep).length ? " has-quest-data" : ""}" data-monster="${escapeHtml(monster.name)}">
                            <div class="monster-name" data-difficulty="${monsterInfo.difficulty}"><span>${escapeHtml(window.WIKI_I18N.getMonster(monster.name))}</span></div>
                            <div class="dar">DAR ${monster.dar}</div>
                        </td>
            `;
            sectionIds.forEach(sectionId => {
                const drop = monster.drops[sectionId.id];
                if (drop) {
                    const itemInfo = data.items[drop.item] || {};
                    const itemText = window.WIKI_I18N.getItem(drop.item);
                    // console.log('Debug monster:', monster);
                    // console.log('Debug drop:', drop);
                    const rarity = itemInfo.superitem || 0;
                    const rarityClass = rarity === 2 ? "ultimate-item" : rarity === 1 ? "legend-item" : "";

                    html += `
                <td class="item-cell col-${sectionId.id}"
                    data-item="${escapeHtml(drop.item)}"
                    data-section="${escapeHtml(sectionId.id)}"
                    data-monster="${escapeHtml(monster.name)}"
                    data-farm="${escapeHtml(monster.farm || '')}">

                    <span class="item-name ${rarityClass}" data-item="${escapeHtml(drop.item)}">
                        ${itemText.name || drop.item}
                    </span>

                    <small class="drop-rate">
                        ${drop.rate}
                    </small>

                </td>`;
                } else {
                    html += `<td>-</td>`;
                }
            });
            html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        section.innerHTML = html;
        container.appendChild(section);
    });

    bindTooltips(container);
    bindMonsterQuestTooltips(container);
    performSearch();
    observeEpisodes();
    if (window.WIKI_ACTIVE_VIEW === "drops") location.hash = currentDifficulty + "_" + currentEpisode;
}

function setActiveEpisode(episode) {
    currentEpisode = episode;
    document.querySelectorAll(".ep-btn").forEach(btn => {
        btn.classList.toggle("active", btn.innerText.trim() === episode);
    });
    history.replaceState(null, "", `#${currentDifficulty}_${episode}`);
}

function observeEpisodes() {
    if (episodeObserver) episodeObserver.disconnect();
    const header = document.querySelector(".control-bar");
    const topOffset = header ? header.offsetHeight + 12 : 120;
    episodeObserver = new IntersectionObserver(entries => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveEpisode(visible[0].target.id);
    }, { rootMargin: `-${topOffset}px 0px -55% 0px`, threshold: 0 });
    document.querySelectorAll(".table-section").forEach(section => episodeObserver.observe(section));
}

function jumpTo(ep) {
    currentEpisode = ep;

    const el = document.getElementById(ep);
    if (el) {
        // 获取固定导航高度
        const nav = document.querySelector(".control-bar");
        const navHeight = nav ? nav.offsetHeight : 0;

        // 页面滚动到元素顶部减去导航高度
        const topPos = el.getBoundingClientRect().top + window.scrollY - navHeight - 5; // 5px 可微调

        window.scrollTo({
            top: topPos,
            behavior: "smooth"
        });

        // 更新 URL hash
        location.hash = currentDifficulty + "_" + ep;

        // 更新按钮高亮
        document.querySelectorAll(".ep-btn").forEach(btn => {
            btn.classList.toggle("active", btn.innerText.trim() === ep);
        });
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.difficulty === currentDifficulty);
        });
    }
}

function switchDifficulty(diff) {
    currentDifficulty = diff;

    // 更新按钮高亮
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.difficulty === diff);
    });

    // URL hash 保持同步
    location.hash = currentDifficulty + "_" + currentEpisode;

    // 如果你想切换难度时自动滚到当前EP
    const el = document.getElementById(currentEpisode);
    if (el) {
        scrollToRow(el);
    }
    render()
}

function bindTooltips(root = document.getElementById("content")) {
    if (!root || itemTooltipRoots.has(root)) return;
    itemTooltipRoots.add(root);
    const tooltip = document.getElementById("tooltip");
    let activeCell = null;
    let pointer = null;
    let positionFrame = 0;
    const sectionHeaders = (cell, active) => {
        const section = cell.dataset.section;
        const table = cell.closest(".table-section");
        if (!section || !table) return;
        table.querySelectorAll(`thead th[data-section="${CSS.escape(section)}"]`)
            .forEach(header => header.classList.toggle("section-id-highlight", active));
    };
    const hideTooltip = () => {
        if (activeCell) sectionHeaders(activeCell, false);
        activeCell = null;
        pointer = null;
        tooltip.style.display = "none";
    };
    const schedulePosition = event => {
        pointer = { clientX: event.clientX, clientY: event.clientY };
        tooltip.style.display = "block";
        if (positionFrame) return;
        positionFrame = requestAnimationFrame(() => {
            positionFrame = 0;
            if (!activeCell || !pointer) return;
            tooltip.style.display = "block";
            const rect = tooltip.getBoundingClientRect();
            const offset = 18;
            const margin = 10;
            let left = pointer.clientX > window.innerWidth / 2
                ? pointer.clientX - rect.width - offset
                : pointer.clientX + offset;
            let top = pointer.clientY > window.innerHeight / 2
                ? pointer.clientY - rect.height - offset
                : pointer.clientY + offset;
            left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
            top = Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin));
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });
    };
    const renderItemTooltip = cell => {
        const itemName = cell.dataset.item;
        const item = data?.items?.[itemName] || window.WIKI_ITEMS?.[itemName];
        if (!item) return false;
        const itemText = window.WIKI_I18N.getItem(itemName);
        const rarity = item.superitem || 0;
        const rarityClass = rarity === 2 ? "ultimate-item" : rarity === 1 ? "legend-item" : "";
        const tooltipBonus = bonusIndex[itemName] || [];
        const tooltipRecipe = recipeIndex[itemName] || [];
        const monsterName = cell.dataset.monster || "";
        const episode = cell.closest(".table-section")?.id;
        const monsterQuests = monsterQuestsForEpisode(monsterName, episode);
        const monsterQuestHtml = monsterQuests.length
            ? `<div class="tooltip-monster-quests">${monsterQuestTooltipMarkup(monsterName, monsterQuests)}</div>`
            : "";
        const detail = detailFor(itemName);
        const special = detail?.raw.Special && detail.raw.Special !== "None" ? specialBadge(detail.raw.Special, "EX：") : "";
        const boosts = detailBoosts(itemName);
        const itemTypeContent = window.WIKI_I18N.getType(detailType(itemName, item));

        tooltip.innerHTML = `
            ${item.image && item.image.trim() !== "" ? `<img src="images/${item.image}" class="tooltip-item-image">` : ""}
            <div class="tooltip-name ${rarityClass}">${itemText.name || itemName}</div>
            ${window.WIKI_I18N.language === "cn" && itemName !== itemText.name ? `<div class="tooltip-en">${itemName}</div>` : ""}
            ${itemTypeContent && itemTypeContent !== "-" ? `<div class="tooltip-type">${window.WIKI_I18N.text("itemType", "类型")}: ${itemTypeContent}</div>` : ""}
            ${detailDescription(itemName, item) ? `<div class="tooltip-class">${detailDescription(itemName, item)}</div>` : ""}
            ${magTooltipHtml(detail)}
            ${special || boosts ? `<div class="tooltip-effects-row">${special}${boosts ? `<span class="boost-badge-list">${boosts}</span>` : ""}</div>` : ""}
            ${cell.dataset.farm ? `<span class="tooltip-farm">${cell.dataset.farm}</span>` : ""}
            ${tooltipBonus.length ? `
            <div class="tooltip-inline tooltip-bonus-inline">
                ${tooltipBonus.map(b => `
                    <div class="tooltip-item bonus-item">
                        <span class="bonus-header">${b.items.map(itemLabel).join(" ✦ ")} ➜</span>
                        <span class="bonus-body">${effectText(b.effect)}</span>
                    </div>`).join("")}
            </div>` : ""}
            ${tooltipRecipe.length ? `
            <div class="tooltip-inline tooltip-recipe-inline">
                ${tooltipRecipe.map(recipe => `
                    <div class="tooltip-item recipe-item">
                        <span class="recipe-header">${itemLabel(recipe.result)} ⬅</span>
                        <span class="recipe-body">${recipe.components.map(itemLabel).join('<span class="plus">+</span><wbr>')}</span>
                    </div>`).join("")}
            </div>` : ""}
            ${monsterQuestHtml}
        `;
        bindMonsterTooltipImageErrors(tooltip);
        return true;
    };

    root.addEventListener("mousemove", event => {
        const target = event.target instanceof Element ? event.target : null;
        const cell = target?.closest(".item-cell") || target?.closest("[data-item]");
        if (!cell || !cell.dataset.item) {
            if (activeCell) hideTooltip();
            return;
        }
        if (cell !== activeCell) {
            if (!renderItemTooltip(cell)) {
                hideTooltip();
                return;
            }
            if (activeCell) sectionHeaders(activeCell, false);
            activeCell = cell;
            sectionHeaders(cell, true);
        }
        schedulePosition(event);
    });
    root.addEventListener("mouseout", event => {
        if (activeCell?.contains(event.target) && !activeCell.contains(event.relatedTarget)) hideTooltip();
    });
}

window.bindItemTooltips = bindTooltips;

function scrollToRow(row) {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const header =
                document.querySelector(".control-bar");
            const offset =
                header ? header.offsetHeight + 10 : 120;

            window.scrollTo({
                top:
                    row.getBoundingClientRect().top +
                    window.scrollY -
                    offset,
                behavior: "smooth"
            });
        });
    });
}

function performSearch() {
    const keyword = window.WIKI_SEARCH.normalize(document.getElementById("searchInput").value);
    if (!data) return;
    const container = document.getElementById("content");
    let firstMatch = null;
    const matchedSections = new Set();

    container.querySelectorAll("tbody tr").forEach(row => {
        row.style.display = "";
        row.querySelectorAll("td").forEach(td => td.classList.remove(
            "highlight-item", "highlight-related", "highlight-bonus", "highlight-recipe"
        ));
        if (!keyword) return;

        let rowMatched = false;
        row.querySelectorAll("td").forEach(td => {
            let matchedType = null;

            const itemName = td.dataset.item;
            if (itemName && data.items[itemName]) {
                const item = data.items[itemName];
                // 1.名字匹配（最高优先级）

                if (itemNameSearchText(itemName).includes(keyword)) {
                    matchedType = "item";
                }

                // 2. 物品描述、类型和任务说明

                else if (itemDetailSearchText(itemName).includes(keyword)) {
                    matchedType = "related";
                }

                // 3.套装效果

                else if (
                    (bonusIndex[itemName] || []).some(b =>
                        b.items.some(item => itemNameSearchText(item).includes(keyword)) ||
                        bonusSearchText(b.effect).includes(keyword)
                    )
                ) {
                    matchedType = "related";
                }

                // 4.合成公式

                else if (
                    (recipeIndex[itemName] || []).some(r =>
                        itemNameSearchText(r.result).includes(keyword) ||
                        r.components.some(item => itemNameSearchText(item).includes(keyword))
                    )
                ) {
                    matchedType = "related";
                }
            }
            if (matchedType === "item") {
                rowMatched = true;
                td.classList.add("highlight-item");
                matchedSections.add(td.dataset.section);

                if (!firstMatch) {
                    firstMatch = row;
                }
            }

            if (matchedType === "related") {
                rowMatched = true;
                td.classList.add("highlight-related");
                matchedSections.add(td.dataset.section);
            }
        });
        if (!rowMatched && keyword !== "") row.style.display = "none";
    });

    // 搜索时只保留含有命中掉落的 Section ID 表头；清空搜索后恢复原样。
    container.querySelectorAll("thead th[data-section]").forEach(header => {
        const hidden = Boolean(keyword) && !matchedSections.has(header.dataset.section);
        header.classList.toggle("section-id-no-match", hidden);
        header.setAttribute("aria-hidden", String(hidden));
    });

    container.querySelectorAll(".table-section").forEach(section => {
        if (!keyword) { section.style.display = ""; return; }
        const visibleRows = section.querySelectorAll('tbody tr:not([style*="display: none"])').length;
        section.style.display = visibleRows > 0 ? "" : "none";
    });

    if (firstMatch) scrollToRow(firstMatch);

}

function bindControlButtons() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.onclick = () => switchDifficulty(btn.dataset.difficulty);
    });
    document.querySelectorAll(".ep-btn").forEach(btn => {
        btn.onclick = () => jumpTo(btn.innerText.trim());
    });
}

bindControlButtons();

loadData();

window.addEventListener("wiki-language-change", () => {
    document.getElementById("tooltip").style.display = "none";
    if (data) {
        render();
    }
});
