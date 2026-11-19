(() => {
  const poolItems = [
    // Weapons
    "ARMAGEDDON", "YASMINKOV 9000M", "MASTER RAVEN", "LAST SWAN", "COMBUSTION CANNON", "CELESTIAL FUSION", "GRAVE DIGGER", "BOONDOCK SAINTS", "SPREAD NEEDLE", "FROZEN SHOOTER", "BRINGER'S RIFLE", "BARANZ LAUNCHER", "CANNON ROUGE", "PANZER FAUST", "EGG BLASTER", "ZANBA", "TWIN BLAZE", "EXCALIBUR", "LAVIS CANNON", "YAMIGARASU", "MONKEY KING BAR", "VIVIENNE", "SOUL BITER", "DAYLIGHT SCAR", "ASTERON BELT", "TWIN CYCLONE", "HELL STRIKER", "SKYFALL", "GLIDE DIVINE S", "CLAW OF ELEMENTS", "GLIDE DIVINE", "PSYCHO WAND", "RED SWORD", "TIGER'S FANG & DRAGON'S CLAW", "SWORD OF DESPAIR", "STORMRENDER", "M&A85 FURY", "SOUL DEVOURER", "PLANET EATER", "FROSTBITE", "PASSION HAZE", "TASTE OF AFFECTION", "HOLY RAY", "TYPE RI/RIFLE", "AENSLAND", "INFERNO BLADE", "TORMENTOR", "GUSH NEEDLE", "YASMINKOV 7000V", "TYPE SH/SHOT", "TYPE SW/J-SWORD", "SUPPRESSED GUN", "RAMBLING MAY", "LAVIS BLADE", "BLACK KING BAR", "MADAM'S PARASOL", "MADAM'S UMBRELLA", "TYRELL'S PARASOL", "SLICER OF FANATIC", "MERCURIUS ROD","RIANOV 303SNR-3",
    // Armor and shields
    "BLUE PHANTOM FIELD", "RED PHANTOM FIELD", "THREE SEALS", "HONEYCOMB REFLECTOR", "SHADOW CLOAK", "DRESS PLATE", "LOVE HEART", "SAFETY HEART", "ANGEL RING", "FROM THE DEPTHS",
    // Other items
    "ELENOR", "ENERGY STORM", "RING OF FIRE", "V101", "V502", "V503", "ADEPT", "SMARTLINK", "IMMORTAL/HP", "IMMORTAL/POWER", "IMMORTAL/MIND", "IMMORTAL/ARMS", "CENTURION/HP", "CENTURION/POWER", "CENTURION/MIND", "CENTURION/ARMS", "CENTURION/BATTLE", "PHOTON DROP", "PHOTON TOKENS", "PHOTON BOOSTER", "PHOTON SPHERE", "D-PHOTON CORE", "CRYO WARHEAD", "MAG (LV0)", "HEAVENLY/RESIST", "V801", "ADDSLOT", "TP MATERIAL", "SYNCESTA", "FRIEND RING", "PANDORA'S BOX", "DARK CHAO"
  ];
  const aliases = { "IMMORTAL/HP":"Immortal/HP", "IMMORTAL/POWER":"Immortal/Power", "IMMORTAL/MIND":"Immortal/Mind", "IMMORTAL/ARMS":"Immortal/Arms", "CENTURION/HP":"Centurion/HP", "CENTURION/POWER":"Centurion/Power", "CENTURION/MIND":"Centurion/Mind", "CENTURION/ARMS":"Centurion/Arms", "CENTURION/BATTLE":"Centurion/Battle", "TYPE RI/RIFLE":"TypeRI/RIFLE", "TYPE SH/SHOT":"TypeSH/SHOT", "TYPE SW/J-SWORD":"TypeSW/J-SWORD", "HEAVENLY/RESIST":"Heavenly/Resist", "ADDSLOT":"Addslot", "PHOTON TOKENS":"Photon Token", "MAG (LV0)":"Mag", "FROM THE DEPTH":"FROM THE DEPTHS" };
  const sourceItems = [...new Set(poolItems.map(name => aliases[name] || name))];
  window.WIKI_BOX_LOTTERY_ITEMS = sourceItems;
  let items = sourceItems, catalog = {}, weapons = new Set(), result = null;
  const root = document.querySelector("#box-lottery");
  if (!root) return;
  const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const label = name => {
    const translated = window.WIKI_I18N.getItem(name).name;
    return window.WIKI_I18N.language === "cn" && translated && translated !== name ? translated : name;
  };
  const rarityClass = name => {
    const rarity = (window.WIKI_ITEMS?.[name] || catalog[name])?.superitem || 0;
    return rarity === 2 ? "ultimate-item" : rarity === 1 ? "legend-item" : "";
  };
  function rollAttributes() {
    const slots = [0, 1, 2, 3, 4], values = [0, 0, 0, 0, 0];
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    const count = Math.floor(Math.random() * 4);
    slots.slice(0, count).forEach(i => { values[i] = (Math.floor(Math.random() * 11) + 1) * 10; });
    return `[${values.slice(0, 4).join("/")}|${values[4]}]`;
  }
  function render() {
    const cn = window.WIKI_I18N.language === "cn";
    const resultRows = result ? result.map(row => `<li class="box-lottery__result-row${row.selected ? " is-selected" : ""}"><span class="box-lottery__result-item"><span class="item-name ${rarityClass(row.name)}" data-item="${row.name}">${label(row.name)}${row.attributes ? ` <span class="box-lottery__attribute">${row.attributes}</span>` : ""}</span>${row.selected ? '<span class="box-lottery__selected" aria-label="Selected">&lt;--</span>' : ""}</span></li>`).join("") : `<li class="box-lottery__result-placeholder">${cn ? "点击按钮抽取" : "Press Draw"}</li>`;
    const itemRows = items.map(name => `<li><span class="item-name ${rarityClass(name)}" data-item="${name}">${label(name)}</span></li>`).join("");
    root.innerHTML = `<article class="command-panel box-lottery"><p class="command-panel__eyebrow">${cn ? "掉落查询" : "DROP LOOKUP"}</p><h2>${cn ? "箱子抽奖" : "Box Lottery"}</h2><div class="box-lottery__draw"><button type="button" class="box-lottery__button" data-lottery-draw><span class="box-lottery__button-icon" aria-hidden="true">✦</span>${cn ? "模拟抽奖" : "Draw"}<span class="box-lottery__button-glint" aria-hidden="true"></span></button><ol class="box-lottery__results" aria-live="polite">${resultRows}</ol></div><section class="box-lottery__group"><ul>${itemRows}</ul></section></article>`;
    window.bindItemTooltips?.(root);
  }
  root.addEventListener("click", event => {
    if (!event.target.closest("[data-lottery-draw]") || !items.length) return;
    const drawn = Array.from({ length: 5 }, () => items[Math.floor(Math.random() * items.length)]);
    const selected = Math.floor(Math.random() * 5);
    result = drawn.map((name, index) => ({ name, selected: index === selected, attributes: index === selected && weapons.has(name) ? rollAttributes() : "" }));
    render();
  });
  window.WIKI_I18N.ready.then(async () => {
    const [itemData, ...equipment] = await Promise.all([window.WIKI_DATA.loadJson("assets/data/item-catalog.json"), ...["weapons", "armors", "shields", "units", "mags"].map(file => window.WIKI_DATA.loadJson(`assets/data/item/${file}.json`))]);
    catalog = itemData;
    window.WIKI_I18N.setItems(catalog);
    window.WIKI_ITEM_CATALOG = catalog;
    weapons = new Set(Object.keys(equipment[0]));
  const valid = new Set([...equipment.flatMap(file => Object.keys(file)), ...Object.keys(catalog)]);
    const byNormalized = new Map([...valid].map(name => [normalize(name), name]));
    items = [...new Set(sourceItems.map(name => valid.has(name) ? name : byNormalized.get(normalize(name)) || name))];
    render();
  });
  window.addEventListener("wiki-language-change", () => window.WIKI_I18N.ready.then(render));
})();
