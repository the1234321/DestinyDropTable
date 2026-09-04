let language = localStorage.getItem("wiki-language") || "cn";
let messages = {};
let itemData = {};
let monsterTranslations = {};
let typeTranslations = {};
let activityTranslations = {};
let questAreaTranslations = {};

const LANGUAGE_LABELS = { cn: "中文", en: "English" };
const DEFAULT_UI = {
    "nav.drops": "Drop Table",
    "nav.commands": "Commands and Rules",
    "nav.localization": "Localization Guide",
    "nav.dictionary": "Bilingual Dictionary",
    "nav.currency": "Currency",
    "nav.special": "Special Drops",
    "nav.bazaar": "Bazaar",
    "nav.effects": "Endgame Gear",
    "nav.quests": "Quest Guide",
    "brand": "Destiny Server Wiki",
    "pageTitle": "Destiny Server Wiki",
    "difficulty": "",
    "difficulty.Normal": "Normal",
    "difficulty.Hard": "Hard",
    "difficulty.Very Hard": "Very Hard",
    "difficulty.Ultimate": "Ultimate",
    "episode": "",
    "search": "Search items / related items...",
    "itemType": "Type",
    "noEvent": "No event",
    "effect.ATA": "ATA",
    "effect.ATP": "ATP",
    "effect.MST": "MST",
    "effect.targets": "Targets",
    "effect.attack_range": "Attack range",
    "effect.attack_speed": "Attack speed",
    "effect.can_hit_lizards": "hits EP4 Lizards in the face",
    "effect.hits": "Hits",
    "effect.auto_target": "Auto-target",
    "effect.piercing": "Piercing shots",
    "effect.attack_action": "Attack action",
    "effect.notes": "Notes"
};

async function loadLanguage(nextLanguage) {
    const selected = nextLanguage === "en" ? "en" : "cn";
    const translation = selected === "cn"
        ? await fetch("assets/data/translation/cn.json?v=20260903-1").then(response => response.json())
        : {};
    language = selected;
    const effectMessages = Object.fromEntries(
        Object.entries(translation.effect || {}).map(([key, value]) => [`effect.${key}`, value])
    );
    messages = { ...DEFAULT_UI, ...(translation.ui || {}), ...effectMessages };
    monsterTranslations = translation.monsters || {};
    typeTranslations = translation.types || {};
    activityTranslations = translation.activity || {};
    questAreaTranslations = translation.questAreas || {};
    localStorage.setItem("wiki-language", language);
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title = messages.pageTitle || document.title;
    document.querySelectorAll("[data-i18n]").forEach(node => {
        const key = node.dataset.i18n;
        if (messages[key]) node.textContent = messages[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
        const key = node.dataset.i18nPlaceholder;
        if (messages[key]) node.placeholder = messages[key];
    });
    document.querySelectorAll("[data-language]").forEach(button => {
        button.classList.toggle("is-active", button.dataset.language === language);
        button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    const localizationButton = document.querySelector('[data-view="localization"]');
    if (localizationButton) localizationButton.hidden = language === "en";
    const dictionaryButton = document.querySelector('[data-view="dictionary"]');
    if (dictionaryButton) dictionaryButton.hidden = language === "en";
    window.dispatchEvent(new CustomEvent("wiki-language-change", { detail: { language } }));
}

window.WIKI_I18N = {
    ready: loadLanguage(language),
    get language() { return language; },
    get labels() { return LANGUAGE_LABELS; },
    setItems(items) { itemData = items || {}; },
    getItem(itemId) {
        const item = itemData[itemId] || {};
        return {
            name: item.name?.[language] || item.name?.en || itemId,
            description: item.description?.[language] || "",
            quest: item.quest?.[language] || ""
        };
    },
    getType(type) { return typeTranslations[type] || type; },
    getMonster(monsterId) {
        return monsterTranslations[monsterId]?.name || monsterId;
    },
    getActivity(value) { return activityTranslations[value] || value; },
    getQuestArea(value) { return questAreaTranslations[value] || value; },
    text(key, fallback = "") { return messages[key] || fallback; },
    async setLanguage(nextLanguage) {
        if (nextLanguage === language) {
            window.dispatchEvent(new CustomEvent("wiki-language-change", { detail: { language } }));
            return;
        }
        await loadLanguage(nextLanguage);
    }
};

document.addEventListener("click", event => {
    const button = event.target.closest("[data-language]");
    if (button) window.WIKI_I18N.setLanguage(button.dataset.language);
});
