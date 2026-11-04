let language = localStorage.getItem("wiki-language") || "en";
let messages = {};
let itemData = {};
let itemDataByLowercase = {};
let monsterTranslations = {};
let monsterCatalog = {};
let monsterCatalogByLowercase = {};
let monsterCatalogPromise;
let typeTranslations = {};
let activityTranslations = {};
let questAreaTranslations = {};
let boostTranslations = {};
let boostTranslationByLowercase = {};
let boostToneEntries = [];
let boostTechniques = new Set();
let databaseTranslations = {};
let classTranslations = {};
let exchangeItemTranslations = {};
let exchangeItemTranslationEntries = [];
let localizedItemEntries = [];
let exchangeItemNameCache = new Map();
let itemSearchTermCache = new Map();
let translationDataPromise;
const jsonDataCache = new Map();

function loadJson(path) {
    if (!jsonDataCache.has(path)) {
        const request = fetch(path)
            .then(response => {
                if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
                return response.json();
            })
            .catch(error => {
                jsonDataCache.delete(path);
                throw error;
            });
        jsonDataCache.set(path, request);
    }
    return jsonDataCache.get(path);
}

function localizedItemSuffix(source, baseName) {
    return source.slice(baseName.length).trim()
        .replace(/\bLv\s*(\d+)/gi, "等级$1")
        .replace(/(\d+)H\b/gi, "$1命中");
}

function localizedExchangeItemName(source) {
    if (language === "cn" && exchangeItemTranslations[source]) return exchangeItemTranslations[source];
    const exactItem = itemData[source] || itemDataByLowercase[source.toLocaleLowerCase()];
    if (exactItem?.name?.[language]) return exactItem.name[language];
    if (language === "cn") {
        const lowerSource = source.toLocaleLowerCase();
        const alias = exchangeItemTranslationEntries.find(([lowerName]) =>
            lowerSource.startsWith(`${lowerName} `));
        if (alias) {
            const suffix = localizedItemSuffix(source, alias[1]);
            return `${alias[2]}${suffix ? ` ${suffix}` : ""}`;
        }
        const baseItem = localizedItemEntries.find(([lowerName]) =>
            lowerSource.startsWith(`${lowerName} `));
        if (baseItem) {
            const suffix = localizedItemSuffix(source, baseItem[1]);
            return `${baseItem[2]}${suffix ? ` ${suffix}` : ""}`;
        }
    }
    return itemData[source]?.name?.[language] || itemData[source]?.name?.en || source;
}

window.WIKI_DATA = { loadJson };

const LANGUAGE_LABELS = { cn: "中文", en: "English" };
const DEFAULT_UI = {
    "nav.drops": "Drop Table",
    "drops.menuHeading": "DROP LOOKUP",
    "drops.normal": "Drop Table",
    "nav.commands": "New Player Guide",
    "guide.eyebrow": "Destiny New Player Guide",
    "guide.serverRules": "Server Rules",
    "guide.commonCommands": "Common Commands",
    "guide.level200": "Level-200 Builds",
    "guide.localization": "Chinese Localization",
    "guide.recommended": "Recommended shortcut",
    "guide.mag": "Mag build",
    "guide.materials": "Material allocation",
    "guide.remaining": "Slots remaining",
    "guide.loadError": "Could not load guide content.",
    "guide.menuHeading": "NEW PLAYER GUIDE",
    "nav.dictionary": "Bilingual Dictionary",
    "nav.localeTools": "Localization",
    "localeTools.menuHeading": "LOCALIZATION & DICTIONARY",
    "nav.currency": "Currency",
    "nav.special": "Special Drops",
    "nav.crafting": "Equipment Related",
    "crafting.recipes": "Crafting",
    "crafting.sets": "Sets",
    "crafting.menuHeading": "EQUIPMENT RELATED",
    "nav.quests": "Quest Related",
    "quests.quickLookup": "Quest Quick Reference",
    "quests.exchange": "Quest Exchange",
    "nav.database": "Equipment Database",
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
    "effect.notes": "Notes",
    "label.item": "Item",
    "label.source": "Quest / Source",
    "label.rate": "Rate / Condition",
    "label.notes": "Notes",
    "label.class": "Class",
    "label.boosts": "Boosts",
    "label.allClasses": "All classes",
    "label.monsters": "Monster Counts / BOSS Info",
    "term.except": "except",
    "term.allIds": "all IDs"
};

window.WIKI_SEARCH = {
    normalize(value) {
        return String(value ?? "").trim().toLocaleLowerCase();
    },
    matches(query, searchableText) {
        const normalizedQuery = this.normalize(query);
        return !normalizedQuery || this.normalize(searchableText).includes(normalizedQuery);
    },
    filter(root, selector, query) {
        let visibleCount = 0;
        root.querySelectorAll(selector).forEach(node => {
            node.hidden = !this.matches(query, node.dataset.search);
            if (!node.hidden) visibleCount += 1;
        });
        return visibleCount;
    },
    bind(input, onSearch) {
        let composing = false;
        let lastValue = null;
        const commit = () => {
            const query = this.normalize(input.value);
            if (query === lastValue) return;
            lastValue = query;
            onSearch(query);
        };
        input.addEventListener("compositionstart", () => { composing = true; });
        input.addEventListener("compositionend", () => {
            composing = false;
            window.setTimeout(commit, 0);
        });
        input.addEventListener("input", event => {
            if (!composing && !event.isComposing) commit();
        });
        input.addEventListener("search", commit);
        input.addEventListener("change", commit);
        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && !composing) commit();
        });
    }
};

function translatedBoostPart(value) {
    const text = String(value ?? "").trim();
    if (boostTranslations[text]) return boostTranslations[text];
    const match = text.match(/^(.+?)(\s*[+-]\s*[\d.]+%?)$/);
    if (!match) return boostTranslationByLowercase[text.toLocaleLowerCase()] || text;
    const translated = boostTranslations[match[1]] ||
        boostTranslationByLowercase[match[1].toLocaleLowerCase()] ||
        match[1];
    return `${translated}${match[2]}`;
}

function translatedBoostParts(value) {
    const parts = String(value ?? "").split(/\s*,\s*/).filter(Boolean);
    const translated = [];
    for (let index = 0; index < parts.length;) {
        let end = index;
        const nextTechnique = part => {
            const match = part.match(/^(.+?)(\s*[+-]\s*[\d.]+%?)?$/);
            return match && boostTechniques.has(match[1].toLocaleLowerCase());
        };
        while (end + 1 < parts.length &&
            nextTechnique(parts[end]) &&
            nextTechnique(parts[end + 1]) &&
            !/[+-]\s*[\d.]+%?$/.test(parts[end])) {
            end += 1;
        }
        const finalPart = parts[end].match(/^(.+?)(\s*[+-]\s*[\d.]+%?)$/);
        if (end > index && finalPart && boostTechniques.has(finalPart[1].toLocaleLowerCase())) {
            const names = parts.slice(index, end).concat(finalPart[1]);
            translated.push({
                source: parts.slice(index, end).concat(parts[end]).join(", "),
                label: `${names.map(name => translatedBoostPart(name)).join("、")}${finalPart[2]}`
            });
            index = end + 1;
        } else {
            translated.push({ source: parts[index], label: translatedBoostPart(parts[index]) });
            index += 1;
        }
    }
    return translated;
}

function loadTranslationData() {
    if (!translationDataPromise) {
        translationDataPromise = loadJson("assets/data/translation/cn.json?v=20261104-1");
    }
    return translationDataPromise;
}

function loadMonsterCatalog() {
    if (!monsterCatalogPromise) {
        monsterCatalogPromise = loadJson("assets/data/monster-catalog.json").then(catalog => {
            monsterCatalog = catalog;
            monsterCatalogByLowercase = Object.fromEntries(
                Object.entries(catalog).map(([name, value]) => [name.toLocaleLowerCase(), value])
            );
        });
    }
    return monsterCatalogPromise;
}

async function loadLanguage(nextLanguage) {
    const selected = nextLanguage === "en" ? "en" : "cn";
    const [translation] = await Promise.all([loadTranslationData(), loadMonsterCatalog()]);
    const localized = selected === "cn";
    language = selected;
    const effectMessages = Object.fromEntries(
        Object.entries(localized ? translation.effect || {} : {}).map(([key, value]) => [`effect.${key}`, value])
    );
    messages = { ...DEFAULT_UI, ...(localized ? translation.ui || {} : {}), ...effectMessages };
    monsterTranslations = localized ? translation.monsters || {} : {};
    typeTranslations = localized ? translation.types || {} : {};
    activityTranslations = localized ? translation.activity || {} : {};
    questAreaTranslations = localized ? translation.questAreas || {} : {};
    boostTranslations = localized ? translation.boosts || {} : {};
    boostTranslationByLowercase = Object.fromEntries(
        Object.entries(boostTranslations).map(([key, value]) => [key.toLocaleLowerCase(), value])
    );
    boostToneEntries = Object.entries(translation.boostTones || {})
        .flatMap(([tone, terms]) => terms.map(term => [term.toLocaleLowerCase(), tone]))
        .sort((left, right) => right[0].length - left[0].length);
    boostTechniques = new Set((translation.techniques || []).map(value => value.toLocaleLowerCase()));
    databaseTranslations = localized ? translation.database || {} : {};
    classTranslations = localized ? translation.classes || {} : {};
    exchangeItemTranslations = localized ? translation.exchangeItems || {} : {};
    exchangeItemTranslationEntries = Object.entries(exchangeItemTranslations)
        .map(([name, value]) => [name.toLocaleLowerCase(), name, value])
        .sort((left, right) => right[1].length - left[1].length);
    exchangeItemNameCache.clear();
    itemSearchTermCache.clear();
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
    document.querySelectorAll("[data-non-en]").forEach(node => {
        node.hidden = language === "en";
    });
    window.dispatchEvent(new CustomEvent("wiki-language-change", { detail: { language } }));
}

window.WIKI_I18N = {
    ready: loadLanguage(language),
    get language() { return language; },
    get labels() { return LANGUAGE_LABELS; },
    setItems(items) {
        itemData = items || {};
        itemDataByLowercase = Object.create(null);
        localizedItemEntries = Object.entries(itemData)
            .filter(([, item]) => item.name?.cn)
            .map(([name, item]) => [name.toLocaleLowerCase(), name, item.name.cn])
            .sort((left, right) => right[1].length - left[1].length);
        Object.entries(itemData).forEach(([name, item]) => {
            itemDataByLowercase[name.toLocaleLowerCase()] = item;
        });
        exchangeItemNameCache.clear();
        itemSearchTermCache.clear();
    },
    getItem(itemId) {
        const item = itemData[itemId] || {};
        return {
            name: item.name?.[language] || item.name?.en || itemId,
            description: item.description?.[language] || "",
            quest: item.quest?.[language] || ""
        };
    },
    getItemSearchTerms(itemId) {
        const source = String(itemId ?? "");
        if (itemSearchTermCache.has(source)) return itemSearchTermCache.get(source);
        const item = itemData[source] || itemDataByLowercase[source.toLocaleLowerCase()];
        const terms = [...new Set([
            source,
            item?.name?.en,
            item?.name?.cn,
            this.getExchangeItemName(source)
        ].filter(Boolean))];
        itemSearchTermCache.set(source, terms);
        return terms;
    },
    getExchangeItemName(itemId) {
        const source = String(itemId ?? "");
        if (!exchangeItemNameCache.has(source)) {
            exchangeItemNameCache.set(source, localizedExchangeItemName(source));
        }
        return exchangeItemNameCache.get(source);
    },
    getType(type) { return typeTranslations[type] || type; },
    getMonster(monsterId) {
        return monsterTranslations[monsterId]?.name || monsterId;
    },
    getMonsterEntries() {
        return Object.entries(monsterTranslations);
    },
    getMonsterCatalogEntries() {
        return Object.keys(monsterCatalog).map(name => [name, this.getMonsterMeta(name)]);
    },
    getMonsterMeta(monsterId) {
        const info = monsterCatalog[monsterId] || monsterCatalogByLowercase[String(monsterId).toLocaleLowerCase()];
        return {
            image: typeof info?.image === "string" ? info.image : "",
            difficulty: info?.difficulty === 1 ? 1 : 0
        };
    },
    getActivity(value) { return activityTranslations[value] || value; },
    getQuestArea(value) { return questAreaTranslations[value] || value; },
    getBoost(value) {
        if (language !== "cn") return value;
        if (boostTranslations[value]) return boostTranslations[value];
        return translatedBoostParts(value).map(part => part.label).join("，");
    },
    getBoostParts(value) {
        return translatedBoostParts(value).map(part => ({
            source: part.source,
            label: language === "cn" ? part.label : part.source
        }));
    },
    getBoostTone(value) {
        const source = String(value ?? "").trim().toLocaleLowerCase();
        return boostToneEntries.find(([term]) =>
            source === term || source.startsWith(`${term} `) ||
            source.startsWith(`${term}+`) || source.startsWith(`${term},`) ||
            source.startsWith(`${term}/`)
        )?.[1] || "other";
    },
    getDatabase(value) {
        return language === "cn"
            ? (databaseTranslations[value] || boostTranslations[value] || value)
            : value;
    },
    getEffectValue(key, value) {
        if (key === "attack_action") return this.getType(value);
        const text = String(value ?? "");
        if (language !== "cn") return text;
        return text
            .replace(/increased/gi, "增大")
            .replace(/in one attack/gi, "单次攻击")
            .replace(/angle/gi, "角度")
            .replace(/NON_HEAVEN_PUNISHER_EX/gi, "非天罚EX")
            .replace(/HEAVEN_PUNISHER_EX/gi, "天罚EX")
            .replace(/Dual Casting:\s*Jellen and Zalure if tech lv is 30/gi, "可同时释放降攻术、降防术 Lv30")
            .replace(/Low HP/gi, "濒死")
            .replace(/\bHits\b\s*:?/gi, "攻击次数：")
            .replace(/\bLv(?=\s*\d)/gi, "等级");
    },
    getClass(value) { return language === "cn" ? (classTranslations[value] || value) : value; },
    getTerm(value) { return messages[`term.${value}`] || value; },
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
