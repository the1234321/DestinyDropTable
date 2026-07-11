const panels = {
  drops: document.querySelector("#drop-table-panel"),
  bazaar: document.querySelector("#bazaar-panel"),
  commands: document.querySelector("#commands-panel"),
  localization: document.querySelector("#localization-panel")
};

function selectView(view, updateHash = true) {
  const isDrops = view === "drops";
  const isCommands = view === "commands";
  const isLocalization = view === "localization";
  window.WIKI_ACTIVE_VIEW = view;
  panels.drops.hidden = !isDrops;
  panels.bazaar.hidden = isDrops || isCommands || isLocalization;
  panels.commands.hidden = !isCommands;
  panels.localization.hidden = !isLocalization;
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (!isDrops && !isCommands && !isLocalization && window.setBazaarSection) window.setBazaarSection(view);
  if (updateHash) history.replaceState(null, "", "#" + view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".wiki-nav-button").forEach(button => {
  button.addEventListener("click", () => selectView(button.dataset.view));
});

const views = ["drops", "commands", "localization", "currency", "special", "tpd", "services", "exchange", "effects", "quests"];
const initialView = location.hash.slice(1);
selectView(views.includes(initialView) ? initialView : "drops", false);

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
