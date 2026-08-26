let data;
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

function itemSearchText(itemId) {
    const item = data?.items?.[itemId];
    if (!item) return String(itemId || "").toLowerCase();
    const text = window.WIKI_I18N.getItem(itemId);
    return [itemId, text.name, text.description, text.quest]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function effectLabel(key) {
    return window.WIKI_I18N.text(`effect.${key}`, key);
}

function effectValue(value) {
    if (window.WIKI_I18N.language !== "en") {
        return String(value).replace(/increased/g, "增大");
    }
    return String(value)
        .replace(/扩大|增大/g, "increased")
        .replace(/数：?/g, "")
        .replace(/HEAVEN_PUNISHER_EX/g, "Heaven Punisher EX")
        .replace(/NON_HEAVEN_PUNISHER_EX/g, "non-Heaven Punisher EX")
        .replace(/LOW_HP_EX/g, "low HP EX")
        .trim();
}

function effectText(effect) {
    if (!effect) return "";
    return effect.notes;
    // if (typeof effect === "string") return effect;
    // return Object.entries(effect).map(([key, value]) => {
    //     if (key === "notes" && window.WIKI_I18N.language === "en") return "";
    //     if (value === true) return effectLabel(key);
    //     if (value === false || value == null || value === "") return "";
    //     return `${effectLabel(key)}: ${effectValue(value)}`;
    // }).filter(Boolean).join(", ");
}

async function loadData() {
    await window.WIKI_I18N.ready;
    const names = ['activities', 'section-ids', 'bonuses', 'recipes', 'tables'];
    const paths = names.map(name => 'assets/data/drop-table/' + name + '.json');
    const [activitiesData, sectionIdsData, bonus, recipe, tables, items] = await Promise.all([
        ...paths.map(path => fetch(path).then(res => res.json())),
        fetch('assets/data/items.json').then(res => res.json())
    ]);
    data = { activities: activitiesData, sectionIds: sectionIdsData, bonus, recipe, tables, items };
    window.WIKI_I18N.setItems(items);
    sectionIds = sectionIdsData || [];
    window.WIKI_ITEMS = items;

    //更新活动
    const activities = data.activities;
    document.getElementById("event-title").innerText = activities.event
        ? window.WIKI_I18N.getActivity(activities.event)
        : window.WIKI_I18N.text("noEvent", "无活动");
    document.getElementById("event-desc").innerHTML = (activities.eventDescription || [])
        .map(x => `• ${window.WIKI_I18N.getActivity(x)}`)
        .join("<br>");

    //搜索框
    const searchInput = document.getElementById("searchInput");

    // 鼠标点击时自动全选
    searchInput.addEventListener("focus", e => {
        e.target.select();
    });

    // 按下 Enter 触发搜索
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            performSearch();
        }
    });

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
            html += `<tr>
                        <td>
                            <div class="monster-name">${window.WIKI_I18N.getMonster(monster.name)}</div>
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
                    data-farm="${escapeHtml(monster.farm || '')}">

                    <span class="item-name ${rarityClass}">
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

    bindTooltips();
    performSearch();
    observeEpisodes();
    location.hash = currentDifficulty + "_" + currentEpisode;
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

function bindTooltips(root = document) {
    const tooltip = document.getElementById("tooltip");

    root.querySelectorAll(".item-cell, [data-item]").forEach(cell => {

        // 缓存当前显示的 item，避免重复生成
        let currentItem = null;

        cell.addEventListener("mousemove", e => {
            const itemName = cell.dataset.item;
            const section = cell.dataset.section;
            const sectionNumber = SECTION_INDEX[section];
            const item = data?.items?.[itemName] || window.WIKI_ITEMS?.[itemName];
            const itemText = window.WIKI_I18N.getItem(itemName);
            const farm = cell.dataset.farm || "";
            if (!item) return;

            // 如果当前 tooltip 已显示该 item，直接更新位置，不重建
            if (currentItem !== itemName) {
                currentItem = itemName;

                const rarity = item.superitem || 0;
                const rarityClass = rarity === 2 ? 'ultimate-item' : rarity === 1 ? 'legend-item' : '';

                const tooltipBonus = bonusIndex[itemName] || [];
                const tooltipRecipe = recipeIndex[itemName] || [];

                tooltip.innerHTML = `
                    ${item.image && item.image.trim() !== "" ? `<img src="images/${item.image}" class="tooltip-item-image">` : ""}
                    <div class="tooltip-name ${rarityClass}">${itemText.name || itemName}</div>
                    ${window.WIKI_I18N.language === "cn" && itemName !== itemText.name ? `<div class="tooltip-en">${itemName}</div>` : ""}
                    <div class="tooltip-type">${window.WIKI_I18N.text("itemType", "类型")}: ${window.WIKI_I18N.getType(item.type || "-")}</div>
                    ${itemText.description ? `<span class="tooltip-desc">${itemText.description}</span>` : ""}
                    ${itemText.quest ? `<span class="tooltip-quest">${itemText.quest}</span>` : ""}
                    ${farm ? `<span class="tooltip-farm">${farm}</span>` : ""}

                    ${tooltipBonus.length ? `
                    <div class="tooltip-inline tooltip-bonus-inline">
                        ${tooltipBonus.map(b => `
                            <div class="tooltip-item bonus-item">
                                <span class="bonus-header">${b.items.map(itemLabel).join(" ✦ ")} ➜</span>
                                <span class="bonus-body">${effectText(b.effect)}</span>
                            </div>
                        `).join("")}
                    </div>` : ""}

                    ${tooltipRecipe.length ? `
                    <div class="tooltip-inline tooltip-recipe-inline">
                        ${tooltipRecipe.map(r => `
                            <div class="tooltip-item recipe-item">
                                <span class="recipe-header">${itemLabel(r.result)} ⬅</span>
                                <span class="recipe-body">${r.components.map(itemLabel).join('<span class="plus">+</span><wbr>')}</span>
                            </div>
                        `).join("")}
                    </div>` : ""}
                `;
            }

            // =======================
            // Tooltip自动定位 V2
            // =======================
            tooltip.style.display = "block";

            // 强制浏览器完成布局
            tooltip.offsetHeight;

            const rect = tooltip.getBoundingClientRect();
            const tooltipWidth = rect.width;
            const tooltipHeight = rect.height;

            const offset = 18;
            const margin = 10;
            let left, top;

            // 横向判断
            if (e.clientX > window.innerWidth / 2) {
                left = e.clientX - tooltipWidth - offset;
            } else {
                left = e.clientX + offset;
            }
            left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

            // 纵向判断
            if (e.clientY > window.innerHeight / 2) {
                top = e.clientY - tooltipHeight - offset;
            } else {
                top = e.clientY + offset;
            }
            top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });

        cell.addEventListener("mouseenter", () => {
            const section = cell.dataset.section;
            document.querySelectorAll(`thead th[data-section="${CSS.escape(section)}"]`)
                .forEach(header => header.classList.add("section-id-highlight"));
        });

        cell.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
            currentItem = null; // 重置
            const section = cell.dataset.section;
            document.querySelectorAll(`thead th[data-section="${CSS.escape(section)}"]`)
                .forEach(header => header.classList.remove("section-id-highlight"));
        });

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
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!data) return;
    let firstMatch = null;

    document.querySelectorAll("tbody tr").forEach(row => {
        row.style.display = "";
        row.querySelectorAll("td").forEach(td => td.classList.remove("highlight-item", "highlight-bonus", "highlight-recipe"));
        if (!keyword) return;

        let rowMatched = false;
        row.querySelectorAll("td").forEach(td => {
            let matchedType = null;
            const cellText = td.innerText.toLowerCase();
            // if(cellText.includes(keyword)) matched = true;

            const itemName = td.dataset.item;
            if (itemName && data.items[itemName]) {
                const itemText = window.WIKI_I18N.getItem(itemName);

                const item = data.items[itemName];
                // 1.名字匹配（最高优先级）

                if (itemSearchText(itemName).includes(keyword)) {
                    matchedType = "item";
                }

                // 2.普通描述

                else if (window.WIKI_I18N.getType(item.type || "").toLowerCase().includes(keyword)) {
                    matchedType = "item";
                }

                // 3.套装效果

                else if (
                    (bonusIndex[itemName] || []).some(b =>
                        b.items.some(item => itemSearchText(item).includes(keyword)) ||
                        effectText(b.effect).toLowerCase().includes(keyword)
                    )
                ) {
                    matchedType = "bonus";
                }

                // 4.合成公式

                else if (
                    (recipeIndex[itemName] || []).some(r =>
                        itemSearchText(r.result).includes(keyword) ||
                        r.components.some(item => itemSearchText(item).includes(keyword))
                    )
                ) {
                    matchedType = "recipe";
                }
            }
            if (matchedType === "item") {
                rowMatched = true;
                td.classList.add("highlight-item");

                if (!firstMatch) {
                    firstMatch = row;
                }
            }

            if (matchedType === "bonus") {
                rowMatched = true;
                td.classList.add("highlight-bonus");
            }

            if (matchedType === "recipe") {
                rowMatched = true;
                td.classList.add("highlight-recipe");
            }
        });
        if (!rowMatched && keyword !== "") row.style.display = "none";
    });

    document.querySelectorAll(".table-section").forEach(section => {
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
        const activities = data.activities;
        document.getElementById("event-title").innerText = activities.event
            ? window.WIKI_I18N.getActivity(activities.event)
            : window.WIKI_I18N.text("noEvent", "");
        document.getElementById("event-desc").innerHTML = (activities.eventDescription || [])
            .map(x => `• ${window.WIKI_I18N.getActivity(x)}`).join("<br>");
        render();
    }
});
