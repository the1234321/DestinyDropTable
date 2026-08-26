const panels = {
  drops: document.querySelector("#drop-table-panel"),
  bazaar: document.querySelector("#bazaar-panel"),
  commands: document.querySelector("#commands-panel"),
  localization: document.querySelector("#localization-panel"),
  dictionary: document.querySelector("#dictionary-panel")
};

function selectView(view, updateHash = true) {
  const isDrops = view === "drops";
  const isCommands = view === "commands";
  const isLocalization = view === "localization";
  const isDictionary = view === "dictionary";
  window.WIKI_ACTIVE_VIEW = view;
  panels.drops.hidden = !isDrops;
  panels.bazaar.hidden = isDrops || isCommands || isLocalization || isDictionary;
  panels.commands.hidden = !isCommands;
  panels.localization.hidden = !isLocalization;
  panels.dictionary.hidden = !isDictionary;
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (!isDrops && !isCommands && !isLocalization && !isDictionary && window.setBazaarSection) window.setBazaarSection(view);
  if (updateHash) history.replaceState(null, "", "#" + view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".wiki-nav-button").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.view));
});

const views = ["drops", "commands", "localization", "dictionary", "currency", "special", "bazaar", "effects", "quests"];
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
      fetch("assets/data/items.json").then(res => res.json()),
      fetch("assets/data/translation/cn.json").then(res => res.json())
    ]);
    const rows = Object.entries(items).map(([en, value]) => [en, value.name?.cn || ""])
      .filter(([en, cn]) => en || cn).sort((a, b) => a[0].localeCompare(b[0]));
    const monsters = Object.entries(translation.monsters || {}).map(([en, value]) => [en, value.name || ""])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const table = (title, data, kind) => `<section class="dictionary-section" data-dictionary-kind="${kind}"><h2>${title}</h2><div class="dictionary-table-wrap"><table><thead><tr><th>English</th><th>中文</th></tr></thead><tbody>${data.map(([en, cn]) => `<tr data-search="${`${en} ${cn}`.toLowerCase()}"><td>${en}</td><td>${cn}</td></tr>`).join("")}</tbody></table></div></section>`;
    root.innerHTML = `<article class="dictionary-panel"><p class="dictionary-panel__intro">中英名称速查</p><input id="dictionarySearch" class="dictionary-search" type="search" placeholder="搜索英文或中文名称…">${table("道具名称", rows, "items")}${table("怪物名称", monsters, "monsters")}</article>`;
    const search = root.querySelector("#dictionarySearch");
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
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
  const root = document.querySelector("#localization-guide");
  root.innerHTML = `
    <article class="command-panel localization-guide">
      <p class="command-panel__eyebrow">${guide.eyebrow}</p>
      <h2>${guide.title}</h2>
      <div class="command-panel__content">
        <p>${guide.description}</p>
        <ol>${guide.steps.map(step => `<li>${step}</li>`).join("")}</ol>
        <a class="localization-guide__download" href="${guide.download.href}" download>${guide.download.label}</a>
      </div>
    </article>`;
}

loadLocalizationGuide();
