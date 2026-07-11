let data;
let currentDifficulty = "极限";
let currentEpisode = "EP1";
let sectionIds = [];

const SECTION_INDEX = {
    Viridia:0, Greenill:1, Skyly:2, Bluefull:3,
    Purplenum:4, Pinkal:5, Redria:6, Oran:7,
    Yellowboze:8, Whitill:9
};

const bonusIndex = {};
const recipeIndex = {};

async function loadData(){
    const res = await fetch('data.json?t=' + Date.now());
    data = await res.json();
    sectionIds = data.sectionIds || [];

    //更新活动
    const activities = data.activities;
    document.getElementById("event-title").innerText = activities.event || "无活动";
    document.getElementById("event-desc").innerHTML = (activities.eventDescription || [])
.map(x => `• ${x}`)
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
        const comboText = b.items.join(" ✦ ");

        // 正常 items
        b.items.forEach(item => {
            if(!bonusIndex[item]) bonusIndex[item] = [];
            bonusIndex[item].push({ combo: comboText, effect: b.effect });
        });

        // extra 指向的物品也显示同一个 bonus
        (b.extra || []).forEach(extraItem => {
            if(!bonusIndex[extraItem]) bonusIndex[extraItem] = [];
            bonusIndex[extraItem].push({ combo: comboText, effect: b.effect });
        });
    });

    (data.recipe || []).forEach(r => {
        const formulaText = `${r.result} = ${r.components.join(" + ")}`;

        // result + components
        const relatedItems = [r.result, ...r.components];

        // extra 指定的物品也显示这个配方
        if(r.extra && Array.isArray(r.extra)){
            relatedItems.push(...r.extra);
        }

        relatedItems.forEach(item => {
            if(!recipeIndex[item]) recipeIndex[item] = [];
            recipeIndex[item].push({
                result: r.result,
                components: r.components,
                formula: formulaText
            });
        });
    });

    // hash同步
    const hash = location.hash;
    if(hash){
window.addEventListener("load", ()=>{
    // hash 解析
    const hash = location.hash.replace("#","");
    if(hash){
        const parts = hash.split("_");
        if(parts.length === 2){
            currentDifficulty = parts[0];
            currentEpisode = parts[1];
        }
         }

            // 默认按钮高亮
            document.querySelectorAll(".tab-btn").forEach(btn=>{
                btn.classList.toggle("active", btn.innerText.trim()===currentDifficulty);
            });
            document.querySelectorAll(".ep-btn").forEach(btn=>{
                btn.classList.toggle("active", btn.innerText.trim()===currentEpisode);
            });

            // 滚动到当前章节
            const el = document.getElementById(currentEpisode);
            if(el) scrollToRow(el);
            
        });
    }

    render();
}
function render(){
    const container = document.getElementById("content");
    container.innerHTML = "";

    // 更新顶部按钮active
    document.querySelectorAll(".tab-btn").forEach(btn=>{
        btn.classList.toggle("active", btn.innerText === currentDifficulty);
    });
    document.querySelectorAll(".ep-btn").forEach(btn=>{
        btn.classList.toggle("active", btn.innerText === currentEpisode);
    });

    ["EP1","EP2","EP4"].forEach(ep=>{
        const epData = data.tables?.[currentDifficulty]?.[ep];
        if(!epData) return;

        const section = document.createElement("div");
        section.className = "table-section";
        section.id = ep;

        let html = `
            <div class="table-title">${currentDifficulty} ${ep}</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>  </th>
        `;

        sectionIds.forEach(id=>{
            html += `<th class="header-${id.id}">${id.id}</th>`;
        });

        html += `</tr></thead><tbody>`;

        epData.monsters.forEach(monster=>{
            html += `<tr>
                        <td>
                            <div class="monster-name">${monster.name}</div>
                            <div class="dar">DAR ${monster.dar}</div>
                        </td>
            `;
            sectionIds.forEach(sectionId=>{
                const drop = monster.drops[sectionId.id];
                if(drop){
                    const itemInfo = data.items[drop.item];
                    // console.log('Debug monster:', monster);
                    // console.log('Debug drop:', drop);
                    const rarity = itemInfo.superitem || 0;
                    const rarityClass=rarity===2? "ultimate-item": rarity===1? "legend-item": "";

                html += `
                <td class="item-cell col-${sectionId.id}"
                    data-item="${drop.item}"
                    data-section="${sectionId.id}"
                    data-farm="${monster.farm || ''}">

                    <span class="item-name ${rarityClass}">
                        ${drop.item}
                    </span>

                    <small class="drop-rate">
                        ${drop.rate}
                    </small>

                </td>`;
                }else{
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
    location.hash = currentDifficulty + "_" + currentEpisode;
}

function jumpTo(ep){
    currentEpisode = ep;

    const el = document.getElementById(ep);
    if(el){
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
        document.querySelectorAll(".ep-btn").forEach(btn=>{
            btn.classList.toggle("active", btn.innerText.trim() === ep);
        });
        document.querySelectorAll(".tab-btn").forEach(btn=>{
            btn.classList.toggle("active", btn.innerText.trim() === currentDifficulty);
        });
    }
}

function switchDifficulty(diff){
    currentDifficulty = diff;

    // 更新按钮高亮
    document.querySelectorAll(".tab-btn").forEach(btn=>{
        btn.classList.toggle("active", btn.innerText.trim() === diff);
    });

    // URL hash 保持同步
    location.hash = currentDifficulty + "_" + currentEpisode;

    // 如果你想切换难度时自动滚到当前EP
    const el = document.getElementById(currentEpisode);
    if(el){
        scrollToRow(el);
    }
    render()
}

function bindTooltips() {
    const tooltip = document.getElementById("tooltip");

    document.querySelectorAll(".item-cell").forEach(cell => {

        // 缓存当前显示的 item，避免重复生成
        let currentItem = null;

        cell.addEventListener("mousemove", e => {
            const itemName = cell.dataset.item;
            const section = cell.dataset.section;
            const sectionNumber = SECTION_INDEX[section];
            const item = data.items[itemName];
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
                    <div class="tooltip-name ${rarityClass}">${itemName}</div>
                    ${item.english ? `<div class="tooltip-en">${item.english}</div>` : ""}
                    <div class="tooltip-id">sectionid ${sectionNumber}</div>
                    <div class="tooltip-type">类型：${item.type || "-"}</div>
                    ${item.description ? `<span class="tooltip-desc">${item.description}</span>` : ""}
                    ${item.quest ? `<span class="tooltip-quest">${item.quest}</span>` : ""}
                    ${farm ? `<span class="tooltip-farm">${farm}</span>` : ""}

                    ${tooltipBonus.length ? `
                    <div class="tooltip-inline tooltip-bonus-inline">
                        ${tooltipBonus.map(b => `
                            <div class="tooltip-item bonus-item">
                                <span class="bonus-header">${b.combo} ➜</span>
                                <span class="bonus-body">${b.effect}</span>
                            </div>
                        `).join("")}
                    </div>` : ""}

                    ${tooltipRecipe.length ? `
                    <div class="tooltip-inline tooltip-recipe-inline">
                        ${tooltipRecipe.map(r => `
                            <div class="tooltip-item recipe-item">
                                <span class="recipe-header">${r.result} ⬅</span>
                                <span class="recipe-body">${r.components.join('<span class="plus">+</span><wbr>')}</span>
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

        cell.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
            currentItem = null; // 重置
        });

    });
}

function scrollToRow(row){
    requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
            const header =
                document.querySelector(".control-bar");
            const offset =
                header ? header.offsetHeight + 10 : 120;

            window.scrollTo({
                top:
                    row.getBoundingClientRect().top +
                    window.scrollY -
                    offset,
                behavior:"smooth"
            });
        });
    });
}

function performSearch(){
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
    if(!data) return;
    let firstMatch = null;

    document.querySelectorAll("tbody tr").forEach(row=>{
        row.style.display = "";
        row.querySelectorAll("td").forEach(td=>td.classList.remove("highlight-item", "highlight-bonus","highlight-recipe"));
        if(!keyword) return;

        let rowMatched = false;
        row.querySelectorAll("td").forEach(td=>{
             let matchedType = null;
            const cellText = td.innerText.toLowerCase();
            // if(cellText.includes(keyword)) matched = true;

            const itemName = td.dataset.item;
            if(itemName && data.items[itemName]){

                const item = data.items[itemName];
                // 1.名字匹配（最高优先级）

                if(
                    itemName.toLowerCase().includes(keyword) ||
                    (item.english||"").toLowerCase().includes(keyword)
                ){
                    matchedType = "item";
                }

                // 2.普通描述

                else if(
                    (item.type||"").toLowerCase().includes(keyword) ||
                    (item.description||"").toLowerCase().includes(keyword) ||
                    (item.quest||"").toLowerCase().includes(keyword)
                ){
                    matchedType = "item";
                }

                // 3.套装效果

                    else if(
                    (bonusIndex[itemName]||[])
                    .some(b =>
                        JSON.stringify(b)
                        .toLowerCase()
                        .includes(keyword)
                    )
                ){
                    matchedType = "bonus";
                }

                // 4.合成公式

                else if(
                    (recipeIndex[itemName]||[])
                    .some(r =>
                        JSON.stringify(r)
                        .toLowerCase()
                        .includes(keyword)
                    )
                ){
                    matchedType = "recipe";
                }
            }
            if(matchedType==="item"){
                rowMatched = true;
                td.classList.add("highlight-item");

                if(!firstMatch){
                    firstMatch=row;
                }
            }

            if(matchedType==="bonus"){
                rowMatched = true;
                td.classList.add("highlight-bonus");
            }

            if(matchedType==="recipe"){
                rowMatched = true;
                td.classList.add("highlight-recipe");
            }
        });
        if(!rowMatched && keyword!=="") row.style.display = "none";
    });

    document.querySelectorAll(".table-section").forEach(section=>{
        if(!keyword){ section.style.display=""; return; }
        const visibleRows = section.querySelectorAll('tbody tr:not([style*="display: none"])').length;
        section.style.display = visibleRows>0 ? "" : "none";
    });

    if(firstMatch) scrollToRow(firstMatch);
    
}

function bindControlButtons(){
document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.onclick = ()=>switchDifficulty(btn.innerText.trim());
});
document.querySelectorAll(".ep-btn").forEach(btn=>{
    btn.onclick = ()=>jumpTo(btn.innerText.trim());
});
}

bindControlButtons();

// Happy Hour
const HH_START = new Date("2026-05-30T06:30:00");
const HH_INTERVAL = 15.5 * 60 * 60 * 1000; // 15.5小时轮询
const HH_DURATION = 3 * 60 * 60 * 1000;    // 持续3小时

function updateHappyHour(){
    const now = new Date().getTime();
    let current = HH_START.getTime();

    // 找到最近一次开始时间
    while(current + HH_INTERVAL <= now){
        current += HH_INTERVAL;
    }

    let statusText = "";
    let diff = 0;

    if(now >= current && now < current + HH_DURATION){
        // 进行中
        statusText = "Happy Hour进行中";
        diff = (current + HH_DURATION) - now; // 剩余时间到结束
    } else {
        // 下次开始
        if(now < current){
            diff = current - now;
        } else {
            current += HH_INTERVAL;
            diff = current - now;
        }
        statusText = "下次开始：" + new Date(current).toLocaleString();
    }

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    document.getElementById("hh-next").innerHTML = statusText;
    document.getElementById("hh-countdown").innerHTML = `${hours}h ${mins}m ${secs}s`;
}

// 初始化
updateHappyHour();
setInterval(updateHappyHour, 1000);

loadData();
