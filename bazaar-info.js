const CURRENCY_NOTES = [
  {
    title: "Weapon Crystal Badge 获取",
    lines: [
      "Harmony of Despair I",
      "Walking through Flames",
      "VR Test Destiny: Underground：击败隐藏 BOSS 后获得",
      "VR Test FINAL: Catastrophe：通关奖励",
      "VR Test Destiny: Sandstorm：通关奖励",
      "也可能从各种箱子中获得"
    ]
  },
  {
    title: "需要消耗 Weapon Crystal Badge 才能进入的任务",
    lines: [
      "Harmony of Despair II [EP1]",
      "Tragedy in Chaos [EP1]",
      "VR Test Destiny: Meteor Impact"
    ]
  },
  {
    title: "稀有兑换货币",
    lines: [
      "Darkness Photon Sphere",
      "Millennium Photon Core",
      "Primal Photon Sphere",
      "Cladding of Manipulator III",
      "Core of Administrator",
      "Hallowed Jack-O-Lantern",
      "Infernal Stone"
    ]
  },
  {
    title: "其他特殊货币来源",
    lines: [
      "Red Crystal：VR Test Destiny: Sandstorm 的 Meri Noir，1/204，全 ID",
      "Blue Crystal：VR Test EXTRA: Singularity 的 Bar Dalus，1/24，Oran",
      "Yellow Crystal：The Eternal Age [EP2] 的 Epsilon，1/102，Yellowboze / Whitill",
      "Green Crystal：Christmas Fiasco EP4 的 Girtablulu，1/393，Viridia / Greenill",
      "Fragments of Orb [Red]：Christmas Fiasco EP2 的 Delbiter，1/393，Redria / Pinkal",
      "Fragments of Orb [Blue]：Christmas Fiasco EP1 的 Dark Bringer，1/393，Skyly / Bluefull"
    ]
  }
];

const SPECIAL_DROPS = [
  ["State/Maintenance", "VR Test Destiny: Underground", "BOSS1：1/85", "全 ID"],
  ["PB/FLOW", "VR Test Destiny: Underground", "隐藏 BOSS2：1/73", "全 ID"],
  ["Weapon Crystal Badge", "VR Test Destiny: Underground", "隐藏层通关奖励", "需要击败 Gol Dragon / 隐藏 BOSS"],
  ["Darkness Photon Sphere", "VR Test FINAL: Catastrophe", "Eclipse Dragon：1/45；Deos Behemoth：1/45", "Ultimate only"],
  ["Photon Drop", "VR Test FINAL: Catastrophe", "Requid Monkey：1/500；Vol Gibbon：1/500", ""],
  ["Photon Token", "VR Test FINAL: Catastrophe", "Lavaross：1/500", ""],
  ["SPREAD NEEDLE", "VR Test FINAL: Catastrophe", "Astark：1/787", ""],
  ["TWIN CYCLONE", "VR Test FINAL: Catastrophe", "Pazuzu：1/1137", ""],
  ["Red Crystal", "VR Test Destiny: Sandstorm", "Meri Noir：1/204", "全 ID"],
  ["Photon Drop", "VR Test Destiny: Sandstorm", "Ba Boota：1/500", ""],
  ["Excalibur", "VR Test Destiny: Sandstorm", "Goran Detonator：1/1800", ""],
  ["Elenor Mag", "VR Test Destiny: Sandstorm", "Pazuzu：1/1800", "Lv5，无 PB"],
  ["Asteroid Engine", "VR Test Destiny: Meteor Impact", "Epsilon：1/2100", "全 ID"],
  ["Eternal Night", "VR Test Destiny: Meteor Impact", "Astark：1/2100", "全 ID"],
  ["Planet Eater", "VR Test Destiny: Meteor Impact", "Dorphon Eclair：1/1030", "全 ID"],
  ["Primal Photon Sphere", "Beyond the Nightmare", "Nightmare Dominator VI：1/45", "BOSS only"],
  ["Cladding of Manipulator III", "The Discontrolled Tower [Raid]", "Manipulator III：1/10", "全 ID"],
  ["Syncesta", "The Discontrolled Tower [Raid]", "Mericus：1/787", "除 Whitill 外"],
  ["State/Maintenance", "The Discontrolled Tower [Raid]", "Mericus：1/1865", "Whitill"],
  ["Trap/Search", "The Discontrolled Tower [Raid]", "Astark：1/787", "除 Purplenum 外"],
  ["Yasminkov 9000M", "The Discontrolled Tower [Raid]", "Astark：1/787", "Purplenum"],
  ["Photon Token", "The Discontrolled Tower [Raid]", "Dorphon Eclair：1/400", "除 Oran 外"],
  ["Storm Render", "The Discontrolled Tower [Raid]", "Dorphon Eclair：1/787", "Oran"],
  ["Photon Token", "The Discontrolled Tower [Raid]", "Pazuzu：1/400", "除 Viridia 外"],
  ["Dark Matter", "The Discontrolled Tower [Raid]", "Pazuzu：1/900", "Viridia"],
  ["Administrator's Core", "The Starlight Tower [Raid]", "Administrator：1/12", "最高难度 Raid"],
  ["DIVINE BLADE", "The Starlight Tower [Raid]", "Administrator：1/28", ""],
  ["Millennium Photon Core", "The Starlight Tower [Raid]", "Forbidden Scythe IV：1/64", ""],
  ["Hallowed Jack-O-Lantern", "Hallowed World [Master]", "Hallowed Reaper：1/1170", ""],
  ["Millennium Photon Core", "Hallowed World [Master]", "Forbidden Saber：1/350；Queen of Gal Da Val：1/450", ""],
  ["Raster Scope", "Hallowed World [Master]", "Epsilon：1/1559", ""],
  ["State/Maintenance", "Hallowed World [Master]", "Del Lily：1/2559", "除 Viridia 外"],
  ["TWIN RIKA'S CLAW", "Hallowed World [Master]", "Delbiter：1/3150", ""],
  ["Star Eulogy", "VR Test OMEGA: Oblivion", "Tormentark：1/1559", "Viridia / Greenill / Skyly / Bluefull / Purplenum"],
  ["Infernal Stone", "VR Test OMEGA: Oblivion", "Tormentark：1/930", "Pinkal / Redria / Oran / Yellowboze / Whitill"],
  ["Millennium Photon Core", "VR Test OMEGA: Oblivion", "Dorphon Divine：1/500", ""],
  ["Photon Drop", "VR Test OMEGA: Oblivion", "Yowie：1/600", ""],
  ["D-Virus Launcher", "VR Test OMEGA: Oblivion", "Giga Gue ver.D：1/2100", ""]
];

const MILLENNIUM_DROPS = [
  ["Photon Token", "Astark", "1/500"],
  ["Dark Matter", "Dorphon Eclair", "1/1024"],
  ["Photon Token", "Liquid Monkey / Vol Gibbon", "1/1000"],
  ["Grave Digger", "Sinow Zoa", "1/1760，除 Viridia 外"],
  ["Last Emperor", "Sinow Zele", "1/1760"],
  ["Millennium Photon Core", "Ill Gill", "1/900"],
  ["Millennium Photon Core", "Pazuzu", "1/666"],
  ["Millennium Photon Core", "Epsilon", "1/666，除 Oran 外"],
  ["RASTER SCOPE", "Epsilon", "1/1559，Oran"],
  ["Millennium Photon Core", "Millennium Saber / Millennium Sorcerer / Lavaross", "1/500"],
  ["Millennium Photon Core", "Queen of Gal Da Val / D-Virus Morphos / Dark Nebulas", "1/450"],
  ["Millennium Photon Core", "Varazopt ver.D", "1/204"],
  ["Millennium Photon Core", "Spirit Flow", "1/170"],
  ["CHAOS HALO", "Deos Behemoth", "1/51"],
  ["PHOENIX WINGS", "Bar Dalus", "1/51"],
  ["CRYSTALLIZED WINGS", "Eclipse Dragon", "1/51"]
];

const SERVICES = [
  {
    title: "The Phantastic Bazaar 位置",
    detail: "EP2 > Shop > The Phantastic Bazaar。这里集中提供商店、强化、特殊追加、稀有兑换和活动兑换。"
  },
  {
    title: "1 PD 商店",
    detail: "Charge Vulcan 0/0/0/0/50、Charge Gungnir 0/0/0/0/50、Charge Raygun 0/0/0/0/50。"
  },
  {
    title: "新手 3 PD 商店",
    detail: "出售各种 Heavenly 系单位。"
  },
  {
    title: "20 PD Mag 商店",
    detail: "出售带 3PB（包含 M&Y）的 Mag：200/0/0/0、0/200/0/0、0/0/200/0、0/0/0/200。"
  },
  {
    title: "Photon Token 商店",
    detail: "1 Photon Token = 6 PD。Common Calibur / Arms 的属性为 50/50/Hit50，可选多种组合，适合 Dark Flow 或 Dark Meteor。"
  },
  {
    title: "加 Hit 服务",
    detail: "使用 Photon Token 给武器加 Hit。1 Photon Token = 1 Hit%，此方法最高加到 80 Hit。"
  },
  {
    title: "追加 Special 服务",
    detail: "可给没有 Special 的武器追加特殊，例如 Type M Weapon、Yasminkov 系列等。也能给已有独特 Special 的武器追加名字标记，但这类武器追加的 Special 不实际生效。S-rank 不能使用此服务。价格：1 个 Special = 50 PD。"
  }
];

const EXCHANGES = [
  {
    title: "ASTRAL WINGS / ASTRAL HALO",
    location: "Trade NPC",
    materials: [
      "ASTRAL WINGS：Astral Essence x1、Bat Wings x3、Magic Rock 'Heart Key' x1、Magic Stone 'Iritista' x2、Gratia x1",
      "ASTRAL WINGS + Orb of Illusion = ASTRAL HALO，属性相同，外观不同"
    ]
  },
  {
    title: "Jointparts",
    location: "Trade NPC / Bazaar FOmar",
    materials: [
      "Cladding of Manipulator III x7",
      "Syncesta x5",
      "Photon Booster x3",
      "State/Maintenance x1",
      "Proof of Sonic Team x1",
      "Trap/Search x1",
      "Dark Matter x1"
    ]
  },
  {
    title: "V803",
    location: "Millennium Shop",
    materials: [
      "Darkness Photon Sphere x1",
      "Millennium Photon Core x20",
      "V802 x2",
      "V503 x1",
      "Magic Stone 'Iritista' x2",
      "D-Photon Core x1",
      "Book of Hitogata x1"
    ]
  },
  {
    title: "PHANTASMAL FIELD",
    location: "Millennium Shop",
    materials: [
      "Darkness Photon Sphere x1",
      "Millennium Photon Core x25",
      "Cladding of Manipulator III x1",
      "DF Field x1",
      "Genesis Armor x2",
      "Luminous Field x1",
      "Virus Armor: Lafuteria x1"
    ]
  },
  {
    title: "ASTRAL CLOAK",
    location: "Millennium Shop / Delta NPC",
    materials: [
      "Primal Photon Sphere x1",
      "Millennium Photon Core x8",
      "KROE'S SWEATER x1",
      "X-Parts ver3.10 x1",
      "Archfiend Armor x1",
      "Dynasty Armor x1",
      "Ring of Fire x1",
      "Ninja Suit x1",
      "Mother Garb+ x2"
    ]
  },
  {
    title: "ASTRAL CLAW",
    location: "Millennium Shop",
    materials: [
      "Millennium Photon Core x10",
      "Primal Photon Sphere x1",
      "Darkness Photon Sphere x1",
      "HP/FLOW x1",
      "TP/FLOW x1",
      "PB/FLOW x1",
      "Proof of Sonic Team x1",
      "ANTI-DARK RING x1",
      "ANTI-LIGHT RING x1"
    ]
  },
  {
    title: "Millennium/HP",
    location: "Millennium Shop",
    materials: [
      "Millennium Photon Core x5",
      "Immortal/HP x2",
      "Cataclysm Shield x1",
      "MOLTEN RING x1",
      "Weapon Crystal Badge x10"
    ]
  },
  {
    title: "Ignis Engine",
    location: "Millennium Shop",
    materials: [
      "Millennium Photon Core x25",
      "Darkness Photon Sphere x1",
      "Blast Garment x1",
      "Behemoth Armor x1",
      "Proof of Sonic Team x1",
      "MOLTEN RING x2",
      "Weapon Crystal Badge x30"
    ]
  },
  {
    title: "DIVINE FIELD",
    location: "Administrator / Millennium 相关兑换",
    materials: [
      "Cladding of Administrator x2",
      "Millennium Photon Core x15",
      "Proof of Sonic Team x2",
      "Primal Nexus x1",
      "Ethereal Armor x1",
      "D-Virus Armor x1"
    ]
  },
  {
    title: "ASTRAL SABER",
    location: "Millennium Shop",
    materials: [
      "BLAST GARMENT x1",
      "Cladding of Manipulator III x2",
      "Millennium Photon Core x15",
      "Red Crystal x1",
      "Blue Crystal x2",
      "Yellow Crystal x2",
      "Green Crystal x2",
      "IZMAELA x1",
      "Dark Matter x1"
    ]
  },
  {
    title: "MATRIX SCOPE",
    location: "Millennium Shop / 新增兑换",
    materials: [
      "Infernal Stone x1",
      "Fragments [Red] x2",
      "Fragments [Blue] x2",
      "Reflex Gear x2",
      "Ethereal Armor x1",
      "Shadow Cloak x1",
      "Proof of Sonic Team x1",
      "Photon Booster x3",
      "ADEPT x2",
      "Syncesta x3"
    ]
  },
  {
    title: "Forbidden Grimoire",
    location: "Hallowed World [Master] / Paganini",
    materials: [
      "Hallowed Jack-O-Lantern x1",
      "Millennium Photon Core x10",
      "Cladding of Epsilon x1",
      "Proof of Sonic Team x1",
      "Sorcerer's Right Arm x1",
      "Magic Stone 'Iritista' x2",
      "Book of Hitogata x1"
    ]
  },
  {
    title: "Section ID Halo",
    location: "Love Research [Valentine]",
    materials: [
      "Wings of Life x3",
      "Flower Bouquet x50"
    ]
  },
  {
    title: "Flower Bouquet 商店",
    location: "活动商店",
    materials: [
      "Wings of Life：150 Flower Bouquet",
      "Weapon Crystal Badge x5：25 Flower Bouquet"
    ]
  },
  {
    title: "Easter Egg 商店",
    location: "活动商店",
    materials: [
      "D-VIRUS ARMOR：30 Eggs",
      "D-VIRUS LAUNCHER（全 0%）：30 Eggs",
      "BERSERK NEEDLE（全 0%）：60 Eggs"
    ]
  }
];

const EQUIPMENT_EFFECTS = [
  {
    title: "V803",
    lines: [
      "装备后大幅缩短技术释放时间。",
      "额外提高 Rabarta / Gibarta 冰冻成功率。",
      "MST +165。",
      "FO：Rabarta 冰冻约 50%，Gibarta 冰冻约 90%。",
      "HU / RA：Rabarta 冰冻约 33%，Gibarta 冰冻约 66%。"
    ]
  },
  {
    title: "PHANTASMAL FIELD",
    lines: [
      "防具，Lv 200，全职业。",
      "DFP 340 / EVP 340。",
      "抗性：32 / 32 / 32 / 41 / 41。",
      "全属性 +30。"
    ]
  },
  {
    title: "ASTRAL CLOAK",
    lines: [
      "防具，Lv 200，全职业。",
      "DFP 250 / EVP 250。",
      "抗性：35 / 35 / 35 / 35 / 35。",
      "Si 系技术 +100%，Gi 系技术 +80%，Rabarta +90%。"
    ]
  },
  {
    title: "Asteroid Engine",
    lines: [
      "全抗性 +5。",
      "强化 Yunchang：角度更宽、范围更远、速度 +15%、ATP +150，动作变为 Double Saber。",
      "强化 Cannon Rouge：一次发射 5 发，ATP +150。",
      "强化 Slicer of Fanatic：速度 +15%、目标 3→5、角度更宽、ATA +20。"
    ]
  },
  {
    title: "Jointparts 强化列表",
    lines: [
      "Mille Marteaux：N/H 4-4-4 自动锁定，S 为 3-3-3 Divine Punishment，ATP +100、MST +100，解除 beat time 限制。",
      "Guld Milla：N/H 范围 190，S 自动锁定，S 为 5-5-5，ATP +400。",
      "Dual Bird：范围 150，4-4-4，ATA +20。",
      "Celestial Fusion：范围 150，ATA +20、MST +100，FO 可 Jellen + Zalure 双重释放。",
      "Twin Rika's Claw：动作 Claw → Dagger，2-2-2，目标 5，Tempest 特殊范围/角度增强。",
      "Ultimate Double Cannon：速度 +15%，特殊攻击范围/角度增强，EP4 蜥蜴正面可命中，ATA +20。"
    ]
  },
  {
    title: "DIVINE FIELD",
    lines: [
      "防具，Lv 200，全职业。",
      "DFP 508 / EVP 284。",
      "抗性：46 / 46 / 46 / 55 / 55。",
      "全属性 +20。",
      "Heaven Striker 组合：HP 低于 12.5% 时攻击变为 3-3-3。",
      "DIVINE BLADE 组合：目标 1→5，速度 +50%。"
    ]
  },
  {
    title: "DIVINE BLADE",
    lines: [
      "武器类型：Twin Sword，全职业。",
      "ATP 1200 / ATA 55。",
      "全属性 +30。",
      "特殊：Arrest。",
      "Reverser +100%。",
      "Shifta +200%。",
      "Deband +200%。",
      "附带 Shifta + Deband 双重释放。"
    ]
  }
];

const QUESTS = [
  {
    title: "VR Test Destiny: Underground",
    location: "EP2 > VR",
    difficulty: "5",
    requirement: "常驻任务；Ultimate 才有 Trade NPC / Secret。",
    reward: "隐藏层通关奖励 Weapon Crystal Badge x1；Hopkins 可用 Photon Token 兑换 Legendary Item Crate。",
    drops: [
      "BOSS1：State/Maintenance 1/85，全 ID",
      "隐藏 BOSS2：PB/FLOW 1/73，全 ID"
    ],
    counts: `28 Sinow Berill
24 Sinow Spigell
15 Mericus
22 Merikle
21 Mericarol
25 Zol Gibbon
22 Ul Gibbon
22 Gibbles
17 Gi Gue
17 Epsilon
7 Morfos
2 Sinow Zele
2 Sinow Zoa
2 Deldepth
14 Meriltas
27 Merillia
35 Gee
1 BOSS1
1 BOSS2
19 Del Lily
13 Delbiter
11 Recobox
16 Ill Gill`
  },
  {
    title: "VR Test FINAL: Catastrophe",
    location: "EP2 > Special",
    difficulty: "8",
    requirement: "Ultimate only。",
    reward: "通关奖励 Weapon Crystal Badge。",
    drops: [
      "Eclipse Dragon：Darkness Photon Sphere 1/45",
      "Deos Behemoth：Darkness Photon Sphere 1/45",
      "Requid Monkey：Photon Drop 1/500",
      "Vol Gibbon：Photon Drop 1/500",
      "Lavaross：Photon Token 1/500",
      "Astark：SPREAD NEEDLE 1/787",
      "Pazuzu：TWIN CYCLONE 1/1137"
    ],
    counts: `15 Liquid Monkey
5 Sinow Berill
6 Gee
2 Delsaber
13 Vol Gibbon
9 Astark
9 Meriltas
13 Merikle
19 Lavaross
12 Mericarol
6 Sinow Spigell
5 Pazuzu
5 Mericus
3 Merillia
10 Girtablulu
1 Deos Behemoth
1 Eclipse Dragon
24 Del Lily
17 Ill Gill
10 Recobox
17 Epsilon
15 Delbiter
14 Morfos
1 Deldepth`
  },
  {
    title: "VR Test Destiny: Sandstorm",
    location: "EP1 > VR",
    difficulty: "6",
    requirement: "常驻任务。",
    reward: "通关奖励 Weapon Crystal Badge x1。",
    drops: [
      "Meri Noir：Red Crystal 1/204，全 ID",
      "Ba Boota：Photon Drop 1/500",
      "Goran Detonator：Excalibur 1/1800",
      "Pazuzu：Elenor Mag 1/1800，Lv5，无 PB"
    ],
    counts: `27 Evil Shark
27 Pal Shark
39 Guil Shark
36 Chaos Bringer
37 Hildebear
1 Hildeblue
25 Delsaber
32 Goran Detonator
23 Grass Assassin
41 Sinow Beat
37 Ba Boota
10 Merikle
16 Mericarol
13 Pazuzu
6 Mericus
17 Dark Belra
11 So Dimenian
9 Meri Noir`,
    notes: ["此任务里的 Mericarol / Merikle / Mericus 不掉普通稀有。"]
  },
  {
    title: "Tragedy in Chaos [EP1]",
    location: "EP1 > Destiny",
    difficulty: "Ultimate only",
    requirement: "进入需要 Weapon Crystal Badge x1。",
    reward: "资料重点是怪物数量，用于刷怪/规划。",
    drops: [],
    counts: `Dragon 区：
37 Hildebear
1 Hildeblue
17 Barbarous Wolf
29 Booma
10 Savage Wolf
17 Gobooma
36 Gigobooma
7 Monest
7 Rag Rappy

De Rol 区：
16 Guil Shark
12 Evil Shark
9 Pal Shark
34 Grass Assassin
26 Pofuilly Slime
34 Poison Lily
16 Pan Arms

Vol Opt 区：
37 Gilchic
5 Canane
18 Sinow Gold
26 Sinow Beat
25 Garanz
25 Dubchic
3 Dubswitch
6 Canadine

Falz 区：
23 Chaos Sorcerer
43 Chaos Bringer
12 So Dimenian
9 La Dimenian
3 Dimenian
28 Dark Belra
4 Bulclaw
22 Delsaber
1 Dark Falz`
  },
  {
    title: "VR Test Destiny: Meteor Impact",
    location: "EP2 > VR",
    difficulty: "6",
    requirement: "进入需要 Weapon Crystal Badge x1。",
    reward: "新增 Asteroid Engine，通关用于刷特殊掉落。",
    drops: [
      "Epsilon：Asteroid Engine 1/2100，全 ID",
      "Astark：Eternal Night 1/2100，全 ID",
      "Dorphon Eclair：Planet Eater 1/1030，全 ID"
    ],
    counts: `86 Del Lily
33 Recobox
44 Delbiter
48 Epsilon
32 Merikle
20 Mericus
23 Mericarol
22 Gibbles
41 Ill Gill
23 Gi Gue
16 Garanz
25 Morfos
4 Deldepth
14 Astark
8 Dark Belra
12 Goran Detonator
10 Delsaber
11 Dorphon Eclair
5 Dolmdarl`
  },
  {
    title: "The Phantasmal Dimension",
    location: "EP2 > Special",
    difficulty: "10",
    requirement: "极高难度；建议准备完整队伍和高端装备。",
    reward: "大量 Millennium Photon Core 相关掉落；击败隐藏 BOSS / Floor 4 后可用 Photon Sphere 换 Legendary Crate。",
    drops: MILLENNIUM_DROPS.map(([item, enemy, rate]) => `${enemy}：${item} ${rate}`),
    counts: `普通路线，不含隐藏层：
14 Gilchic
9 Dolmolm
9 Dolmdarl
23 Sinow Zoa
14 Ba Boota
77 Millennium Saber
20 Sinow Zele
15 Meriltas
16 Mericus
20 Astark
17 Merikle
12 Mericarol
40 Queen of Gal Da Val
20 Deldepth
37 Lavaross
11 Dorphon Eclair
14 Millennium Sorcerer
9 Pazuzu
26 Dubchic
5 Dubswitch
15 Vol Gibbon
20 Liquid Monkey
50 Dark Nebulas
69 D-Virus Morfos
19 Goran Detonator
12 Soul Stealer
26 Ill Gill
21 Epsilon`,
    notes: [
      "路线：FLOOR1 → FLOOR2 → FLOOR3 → FLOOR4；Secret1 / Secret2 / 多个 BOSS 分支。",
      "50 分钟内通关可获得特殊挑战称号。",
      "Secret BOSS 包含强化版 Deos Behemoth、Bar Dalus、Eclipse Dragon。"
    ]
  },
  {
    title: "Beyond the Nightmare",
    location: "BOSS only",
    difficulty: "8",
    requirement: "BOSS 战任务。",
    reward: "Primal Photon Sphere 来源。",
    drops: [
      "Nightmare Dominator VI：Primal Photon Sphere 1/45"
    ],
    counts: `BOSS：Nightmare Dominator VI
Darvant HP：10,000
Phase 1 HP：327,000
Phase 2 HP：163,500
Phase 3 HP：163,500`,
    notes: ["无 wipe 且 11 分钟内通关可获得特殊挑战称号。"]
  },
  {
    title: "The Discontrolled Tower [Raid]",
    location: "EP2 > Special",
    difficulty: "8",
    requirement: "需要 Red player；必须使用宽屏客户端；建议先通 Silent Nightmare [Raid]。",
    reward: "Cladding of Manipulator III / Jointparts 相关核心任务。",
    drops: [
      "Manipulator III：Cladding of Manipulator III 1/10",
      "Mericus：Syncesta 1/787 或 State/Maintenance 1/1865",
      "Astark：Trap/Search 1/787 或 Yasminkov 9000M 1/787",
      "Dorphon Eclair：Photon Token 1/400 或 Storm Render 1/787",
      "Pazuzu：Photon Token 1/400 或 Dark Matter 1/900"
    ],
    counts: `不含隐藏区：
23 Gilchic
27 Dubchic
19 Garanz
3 Dubswitch
15 Delsaber
13 Sinow Berill
8 Sinow Spigell
4 Sinow Zoa
6 Sinow Zele
17 Morfos
14 Dark Belra
5 Dimenian
3 So Dimenian
1 La Dimenian
16 Mericus
6 Deldepth
16 Delbiter
27 Ill Gill
9 Merillia
5 Meriltas
14 Merikle
13 Mericarol
7 Zol Gibbon
9 Ul Gibbon
13 Gibbles
12 Gi Gue
13 Dolmolm
6 Grass Assassin
22 Del Lily
5 Dolmdarl
13 Recobox
20 Astark
8 Girtablulu
4 Pazuzu
19 Ba Boota
11 Dorphon Eclair
6 Goran Detonator
4 Pyro Goran
1 Manipulator III`,
    notes: [
      "BOSS：Manipulator III / Divine Guard，HP 2,180,000，DEF 2,500，无弱点。",
      "Raid BOSS 有额外 AoE 机制；建议聊天速度设置为最快。",
      "BOSS 图标机制：分散、集合、直线、范围、不可避、抗性降低、Death Sentence 等。"
    ]
  },
  {
    title: "The Starlight Tower [Raid]",
    location: "Administrator BOSS floor",
    difficulty: "目前最高难度 Raid",
    requirement: "必须使用宽屏客户端；建议 4 人队伍；建议聊天速度最快。",
    reward: "Administrator's Core、DIVINE BLADE、DIVINE FIELD 相关材料。",
    drops: [
      "Administrator：Administrator's Core 1/12",
      "Administrator：DIVINE BLADE 1/28",
      "Forbidden Scythe IV：Millennium Photon Core 1/64"
    ],
    counts: "BOSS：Administrator / Admin Guard / Forbidden Scythe IV。详细 HP / ATP / DEF 原资料隐藏。",
    notes: [
      "已知机制：Cyclonic Explosion、Creation + Rollback / Rollforward、Thunder Labyrinth Σ、Divine Cross + Divine Punishment、Divine Reckoning、Fatal Sequence、Lightning Storm、Catastrophe Blaze、The Quaternity、Light and Darkness、Absolute Guard Protocol。",
      "无 wipe 击败 Administrator 可获得特殊挑战称号。"
    ]
  },
  {
    title: "Hallowed World [Master]",
    location: "EP2 > Special",
    difficulty: "9",
    requirement: "极难，强烈建议 4 人。",
    reward: "Hallowed Jack-O-Lantern / Forbidden Grimoire 相关材料。",
    drops: [
      "Hallowed Reaper：Hallowed Jack-O-Lantern 1/1170",
      "Forbidden Saber：Millennium Photon Core 1/350",
      "Queen of Gal Da Val：Millennium Photon Core 1/450",
      "Epsilon：Raster Scope 1/1559",
      "Del Lily：State/Maintenance 1/2559，除 Viridia 外",
      "Delbiter：TWIN RIKA'S CLAW 1/3150"
    ],
    counts: `73 Del Lily
29 Merikle
30 Mericarol
24 Mericus
36 Forbidden Saber
36 Queen of Gal Da Val
43 Delbiter
41 Recobox
30 Epsilon
73 Hallowed Reaper`
  },
  {
    title: "VR Test OMEGA: Oblivion",
    location: "EP2 > Special",
    difficulty: "8",
    requirement: "Very Hard Quest。",
    reward: "Infernal Stone / Star Eulogy / MATRIX SCOPE 相关材料。",
    drops: [
      "Tormentark：Star Eulogy 1/1559，Viridia / Greenill / Skyly / Bluefull / Purplenum",
      "Tormentark：Infernal Stone 1/930，Pinkal / Redria / Oran / Yellowboze / Whitill",
      "Dorphon Divine：Millennium Photon Core 1/500",
      "Yowie：Photon Drop 1/600",
      "Giga Gue ver.D：D-Virus Launcher 1/2100"
    ],
    counts: `36 Ill Gill
10 Goran Detonator
36 Del Lily
10 Gibbles
31 Epsilon
32 Tormentark
21 Merikle
20 Yowie
12 Gi Gue
16 Recobox
22 Delbiter
9 Mericus
15 Mericarol
27 Dorphon Divine
12 Giga Gue ver.B
24 Dolmolm
19 Girtablulu
4 Gilchic
5 Morfos
11 Dolmdarl
10 Dubchic
3 Dubswitch`,
    notes: [
      "后续调整：增加 1 个治疗环，调整部分敌人属性。",
      "Yowie、Tormentark、Dorphon Divine、Recobox、Recon 被削弱过部分能力。"
    ]
  }
];

const NAME_ZH = {
  // 任务 / 地点
  "The Phantastic Bazaar": "梦幻集市",
  "Harmony of Despair II": "绝望协奏 II",
  "Harmony of Despair I": "绝望协奏 I",
  "Walking through Flames": "穿越烈焰",
  "VR Test Destiny: Underground": "虚拟试炼：命运·地下区",
  "VR Test FINAL: Catastrophe": "虚拟终战：天灾",
  "VR Test Destiny: Sandstorm": "虚拟试炼：命运·沙暴",
  "VR Test EXTRA: Singularity": "虚拟试炼EX：奇点",
  "VR Test Destiny: Meteor Impact": "虚拟试炼：命运·陨星冲击",
  "VR Test OMEGA: Oblivion": "虚拟试炼Ω：湮灭",
  "Tragedy in Chaos": "混沌悲剧",
  "The Phantasmal Dimension": "幻界维度",
  "Beyond the Nightmare": "噩梦之外",
  "The Discontrolled Tower": "失控之塔",
  "The Starlight Tower": "星光之塔",
  "Hallowed World": "万圣圣域",
  "Love Research": "爱情研究",
  "Christmas Fiasco": "圣诞大混乱",
  "The Eternal Age": "永恒纪元",
  "Silent Nightmare": "静默梦魇",

  // 物品：优先使用本项目 data.json 已有中文名
  "Weapon Crystal Badge": "武器水晶徽章",
  "Darkness Photon Sphere": "黑暗光子水晶ＤＰＳ",
  "Millennium Photon Core": "千年光子核心ＭＰＣ",
  "Primal Photon Sphere": "原始光子水晶ＰＰＳ",
  "Cladding of Manipulator III": "操纵者 III 装甲",
  "Core of Administrator": "管理员核心",
  "Administrator's Core": "管理员核心",
  "Hallowed Jack-O-Lantern": "万圣节南瓜灯",
  "Infernal Stone": "地狱之石",
  "State/Maintenance": "状态/免疫",
  "PB/FLOW": "ＰＢ/涌流",
  "PB/Flow": "ＰＢ/涌流",
  "HP/FLOW": "ＨＰ/涌流",
  "HP/Flow": "ＨＰ/涌流",
  "TP/FLOW": "ＴＰ/涌流",
  "TP/Flow": "ＴＰ/涌流",
  "Photon Drop": "光子水滴",
  "Photon Token": "光子代币",
  "SPREAD NEEDLE": "魔弹弓",
  "TWIN CYCLONE": "冰雾双旋",
  "Red Crystal": "红色水晶",
  "Blue Crystal": "蓝色水晶",
  "Yellow Crystal": "黄色水晶",
  "Green Crystal": "绿色水晶",
  "Fragments of Orb [Red]": "宝珠碎片[红]",
  "Fragments of Orb [Blue]": "宝珠碎片[蓝]",
  "Fragments [Red]": "碎片[红]",
  "Fragments [Blue]": "碎片[蓝]",
  "Excalibur": "石中剑",
  "Elenor Mag": "艾蕾诺尔玛古",
  "Asteroid Engine": "行星引擎",
  "Eternal Night": "永夜",
  "Planet Eater": "噬星者",
  "Syncesta": "真空波石",
  "Trap/Search": "陷阱/探测",
  "Yasminkov 9000M": "雅斯米诺科夫９０００Ｍ",
  "Storm Render": "风暴撕裂者",
  "Dark Matter": "暗物质",
  "DIVINE BLADE": "神圣双刃",
  "DIVINE FIELD": "神圣力场",
  "PHANTASMAL FIELD": "幻界力场",
  "Forbidden Scythe IV": "禁断镰 IV",
  "Raster Scope": "光栅瞄准镜",
  "RASTER SCOPE": "光栅瞄准镜",
  "TWIN RIKA'S CLAW": "双里卡之爪",
  "Star Eulogy": "星之挽歌",
  "D-Virus Launcher": "Ｄ因子发射器",
  "D-VIRUS LAUNCHER": "Ｄ因子发射器",
  "D-VIRUS ARMOR": "Ｄ因子铠甲",
  "BERSERK NEEDLE": "削血弹弓",
  "Grave Digger": "埋骨弹弓",
  "Last Emperor": "最后的统治者",
  "CHAOS HALO": "混沌光环",
  "PHOENIX WINGS": "凤凰之翼",
  "CRYSTALLIZED WINGS": "晶化之翼",
  "Millennium/HP": "千年/ＨＰ",
  "Charge Vulcan": "蓄力火神机枪",
  "Charge Gungnir": "蓄力冈格尼尔",
  "Charge Raygun": "蓄力光线枪",
  "Common Calibur": "普通大剑",
  "Arms": "霰弹枪",
  "Dark Flow": "暗流",
  "Dark Meteor": "暗黑流星",
  "Type M Weapon": "Ｍ型武器",
  "S-rank": "Ｓ级武器",
  "Yasminkov": "雅斯米诺科夫",
  "Yunchang": "云长",
  "Cannon Rouge": "赤红加农",
  "Slicer of Fanatic": "狂信者的投刃",
  "Double Saber": "双头剑",
  "Twin Rika's Claw": "双里卡之爪",
  "Twin Sword": "双剑",
  "Claw": "爪",
  "Dagger": "匕首",
  "V803": "Ｖ８０３",
  "V802": "Ｖ８０２",
  "V503": "Ｖ５０３",
  "D-Photon Core": "Ｄ型因子核心",
  "Photon Booster": "光子加速器",
  "Photon Sphere": "光子水晶",
  "Magic Stone 'Iritista'": "魔石「伊利提斯塔」",
  "Book of Hitogata": "真瑚经书",
  "DF Field": "ＤＦ领域",
  "Genesis Armor": "创世铠甲",
  "Luminous Field": "冰光服",
  "Virus Armor: Lafuteria": "病毒铠甲「拉芙特莉亚」",
  "KROE'S SWEATER": "克罗艾女士的毛衣",
  "X-Parts ver3.10": "Ｘ组件Ｖｅｒ３．１０",
  "Archfiend Armor": "魔王铠甲",
  "Dynasty Armor": "皇朝装甲",
  "Ring of Fire": "烈焰领域",
  "Ninja Suit": "忍者服",
  "Mother Garb+": "母亲的外套＋",
  "ANTI-DARK RING": "御魔手镯",
  "ANTI-LIGHT RING": "御圣手镯",
  "Immortal/HP": "不朽级/ＨＰ",
  "Cataclysm Shield": "大灾变之盾",
  "MOLTEN RING": "熔岩手镯",
  "Ignis Engine": "伊格尼斯引擎",
  "Blast Garment": "爆裂铠",
  "BLAST GARMENT": "爆裂铠",
  "Behemoth Armor": "巨兽铠甲",
  "Proof of Sonic Team": "索尼克小队的证书",
  "Primal Nexus": "原初枢纽",
  "Ethereal Armor": "以太铠甲",
  "Cladding of Administrator": "管理员装甲",
  "ASTRAL WINGS": "星界之翼",
  "ASTRAL HALO": "星界光环",
  "Astral Essence": "星界精华",
  "Bat Wings": "蝠翼",
  "Magic Rock 'Heart Key'": "魔岩「心之钥」",
  "Gratia": "优雅盾",
  "Orb of Illusion": "幻象之球",
  "Jointparts": "联结部件",
  "ASTRAL CLOAK": "星界斗篷",
  "ASTRAL CLAW": "星界之爪",
  "ASTRAL SABER": "星界光剑",
  "MATRIX SCOPE": "矩阵瞄准镜",
  "Reflex Gear": "反射齿轮",
  "Shadow Cloak": "暗影斗篷",
  "ADEPT": "超能增幅器",
  "Forbidden Grimoire": "禁断魔导书",
  "Cladding of Epsilon": "厄普西隆的装甲",
  "Sorcerer's Right Arm": "混沌法师的右手",
  "Section ID Halo": "ID 光环",
  "Wings of Life": "生命之翼",
  "Flower Bouquet": "花束",
  "Eggs": "彩蛋",
  "IZMAELA": "依兹玛艾拉",
  "Mag": "玛古",
  "M&Y": "米拉尤拉",
  "PD": "ＰＤ",
  "Hit": "命中",
  "Special": "特殊属性",
  "Mille Marteaux": "千锤双枪",
  "Guld Milla": "伽尔德·米拉",
  "Dual Bird": "双鸟",
  "Celestial Fusion": "天界融合",
  "Ultimate Double Cannon": "终极双重加农",
  "Heaven Striker": "天堂冲击",
  "Divine Punishment": "神罚",
  "Jellen": "降攻",
  "Zalure": "降防",
  "Reverser": "复活术",
  "Shifta": "攻强术",
  "Deband": "防强术",
  "Arrest": "麻痹",
  "Tempest": "暴风",

  // 怪物：使用上方掉落表同系中文名；Destiny 自定义怪物用意译
  "Gol Dragon": "数码冰龙",
  "Eclipse Dragon": "蚀日龙",
  "Deos Behemoth": "迪欧斯巨兽",
  "Bar Dalus": "巴尔·达鲁斯",
  "Liquid Monkey": "液态魔猿",
  "Requid Monkey": "液态魔猿",
  "Vol Gibbon": "雷暴泽猿",
  "Lavaross": "熔岩巨兽",
  "Astark": "森隐雷藏",
  "Pazuzu": "变异羚角鸟",
  "Meri Noir": "暗黑蝎花",
  "Ba Boota": "变异猪",
  "Goran Detonator": "暗黑狂刀魔",
  "Pyro Goran": "烈焰狂刀魔",
  "Dorphon Eclair": "白垩战车象",
  "Nightmare Dominator VI": "噩梦支配者 VI",
  "Manipulator III": "操纵者 III",
  "Divine Guard": "神圣守卫",
  "Administrator": "管理员",
  "Admin Guard": "管理守卫",
  "Forbidden Saber": "禁断剑兵",
  "Hallowed Reaper": "万圣死神",
  "Tormentark": "折磨雷藏",
  "Dorphon Divine": "神圣战车象",
  "Giga Gue ver.D": "巨型蜂后 D 型",
  "Giga Gue ver.B": "巨型蜂后 B 型",
  "Yowie": "沙暴蜥蜴",
  "Sinow Berill": "幽猿",
  "Sinow Spigell": "泽猿",
  "Sinow Zoa": "湛蓝光武",
  "Sinow Zele": "绯红光武",
  "Mericus": "绿蝎花",
  "Merikle": "蓝蝎花",
  "Mericarol": "红蝎花",
  "Merillia": "毒梅兰",
  "Meriltas": "狂梅兰",
  "Zol Gibbon": "泽猿",
  "Ul Gibbon": "幽猿",
  "Gibbles": "蛮甲猿",
  "Gi Gue": "蜂后",
  "Gee": "姬蜂",
  "Epsilon": "厄普西隆",
  "Morfos": "暗腐蝶",
  "Deldepth": "暗黑魔精",
  "Del Lily": "暗铃兰",
  "Delbiter": "暗黑麒麟",
  "Recobox": "爆防机",
  "Ill Gill": "恶镰死神",
  "Dolmolm": "青鱿",
  "Dolmdarl": "赤鱿",
  "Girtablulu": "暗黑魔眼巨花",
  "Gilchic": "傀儡机兵",
  "Dubchic": "傀儡机将",
  "Dubswitch": "机甲控制器",
  "Garanz": "机甲堡垒",
  "Delsaber": "剑魔",
  "Dark Bringer": "暗黑骑士",
  "Dark Belra": "暗黑巨神像",
  "Dimenian": "刀魔兵",
  "La Dimenian": "刀魔将",
  "So Dimenian": "刀魔王",
  "Chaos Sorcerer": "混沌法师",
  "Chaos Bringer": "混沌骑士",
  "Hildebear": "狂暴巨猿",
  "Hildeblue": "狂暴白猿",
  "Barbarous Wolf": "狂狼王",
  "Savage Wolf": "狂狼",
  "Booma": "棕狂熊",
  "Gobooma": "黄狂熊",
  "Gigobooma": "红狂熊",
  "Monest": "吸血巨蚊巢",
  "Rag Rappy": "黄拉比鸟",
  "Evil Shark": "绿鲨魔",
  "Pal Shark": "紫鲨魔",
  "Guil Shark": "狂鲨魔",
  "Pofuilly Slime": "冰史莱姆",
  "Poison Lily": "毒铃兰",
  "Pan Arms": "合体怪",
  "Canane": "核心电爪",
  "Canadine": "电爪",
  "Sinow Gold": "金机忍",
  "Sinow Beat": "蓝机忍",
  "Grass Assassin": "巨螳螂",
  "Bulclaw": "合体爪虫",
  "Dragon": "赤焰巨龙",
  "De Rol": "迪·洛尔·雷",
  "Vol Opt": "波鲁欧普",
  "Dark Falz": "暗黑佛",
  "Millennium Saber": "千年剑兵",
  "Millennium Sorcerer": "千年法师",
  "Queen of Gal Da Val": "加尔·达·瓦尔女王",
  "Dark Nebulas": "暗黑星云",
  "D-Virus Morfos": "Ｄ病毒暗腐蝶",
  "D-Virus Morphos": "Ｄ病毒暗腐蝶",
  "Varazopt ver.D": "瓦拉佐特 D 型",
  "Spirit Flow": "灵流",
  "Soul Stealer": "噬魂者",
  "Darvant": "达凡特",
  "Recon": "侦察机",
  "Falz": "暗黑佛",

  // 常用说明词
  "Ultimate only": "仅极限难度",
  "BOSS only": "仅 BOSS",
  "Trade NPC": "兑换 NPC",
  "Secret": "隐藏区",
  "Red player": "红色玩家",
  "Legendary Item Crate": "传奇物品箱",
  "Legendary Crate": "传奇物品箱"
};

const NAME_RE = new RegExp(
  Object.keys(NAME_ZH)
    .sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
);

function appendRichText(node, text) {
  const source = String(text);
  let lastIndex = 0;
  source.replace(NAME_RE, (match, offset) => {
    if (offset > lastIndex) {
      node.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
    }
    const term = document.createElement("span");
    term.className = "bazaar-term";
    term.appendChild(document.createTextNode(NAME_ZH[match]));
    const original = document.createElement("span");
    original.className = "bazaar-term-en";
    original.textContent = `（${match}）`;
    term.appendChild(original);
    term.title = match;
    node.appendChild(term);
    lastIndex = offset + match.length;
  });
  if (lastIndex < source.length) {
    node.appendChild(document.createTextNode(source.slice(lastIndex)));
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) appendRichText(node, text);
  return node;
}

function addListCard(parent, item) {
  const card = el("article", "bazaar-card" + (item.kind === "gear" ? " bazaar-card--gear" : ""));
  card.appendChild(el("h4", null, item.title));
  const ul = el("ul");
  item.lines.forEach(line => ul.appendChild(el("li", null, line)));
  card.appendChild(ul);
  parent.appendChild(card);
}

function addSection(parent, title, id) {
  const section = el("section", "bazaar-section");
  if (id) section.id = id;
  section.appendChild(el("h3", null, title));
  parent.appendChild(section);
  return section;
}

function addBlock(parent, label, text, cols) {
  const wrap = el("div", "bazaar-blockwrap");
  wrap.appendChild(el("div", "bazaar-block-label", label));
  wrap.appendChild(el("pre", "bazaar-block" + (cols ? " bazaar-block--cols" : ""), text));
  parent.appendChild(wrap);
}

function addTable(parent, headers, rows) {
  const wrap = el("div", "bazaar-table-wrap");
  const table = el("table", "bazaar-table bazaar-table--" + headers.length);
  const widths = headers.length === 4 ? [24, 30, 28, 18] : headers.length === 3 ? [34, 40, 26] : [];
  if (widths.length) {
    const colgroup = el("colgroup");
    widths.forEach(width => {
      const col = el("col");
      col.style.width = width + "%";
      colgroup.appendChild(col);
    });
    table.appendChild(colgroup);
  }
  const thead = el("thead");
  const tr = el("tr");
  headers.forEach(header => tr.appendChild(el("th", null, header)));
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach(row => {
    const r = el("tr");
    row.forEach(cell => r.appendChild(el("td", null, cell)));
    tbody.appendChild(r);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  parent.appendChild(wrap);
}

function addServiceCards(parent) {
  const grid = el("div", "bazaar-grid");
  SERVICES.forEach(service => {
    const card = el("article", "bazaar-card");
    card.appendChild(el("h4", null, service.title));
    card.appendChild(el("p", null, service.detail));
    grid.appendChild(card);
  });
  parent.appendChild(grid);
}

function addExchangeCards(parent) {
  const grid = el("div", "bazaar-grid");
  EXCHANGES.forEach(exchange => {
    const card = el("article", "bazaar-card");
    card.appendChild(el("h4", null, exchange.title));
    card.appendChild(el("p", null, "位置 / NPC：" + exchange.location));
    const ul = el("ul");
    exchange.materials.forEach(line => ul.appendChild(el("li", null, line)));
    card.appendChild(ul);
    grid.appendChild(card);
  });
  parent.appendChild(grid);
}

function addQuest(parent, quest) {
  const details = el("details", "bazaar-details");
  details.appendChild(el("summary", null, quest.title));

  const meta = el("div", "bazaar-meta");
  [
    ["位置", quest.location],
    ["难度", quest.difficulty],
    ["进入条件", quest.requirement],
    ["奖励 / 用途", quest.reward]
  ].forEach(([key, value]) => {
    const box = el("div");
    const label = el("b", null, key + "：");
    box.appendChild(label);
    appendRichText(box, value || "-");
    meta.appendChild(box);
  });
  details.appendChild(meta);

  if (quest.drops?.length) {
    addBlock(details, "特殊掉落", quest.drops.join("\n"));
  }
  if (quest.counts) {
    addBlock(details, "怪物数量 / BOSS 信息", quest.counts, true);
  }
  if (quest.notes?.length) {
    addBlock(details, "备注", quest.notes.join("\n"));
  }
  parent.appendChild(details);
}

export function renderBazaarInfo(target = "#bazaar-info") {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) return;

  root.replaceChildren();
  const panel = el("section", "bazaar-panel");
  panel.appendChild(el("h2", "bazaar-title", "集市 / 货币 / 特殊掉落 / 任务资料"));
  panel.appendChild(el("p", "bazaar-subtitle", "中文整理版：按用途重排，不显示原始链接分组。"));

  const nav = el("nav", "bazaar-nav");
  [
    ["bz-quick", "货币说明"],
    ["bz-drops", "特殊掉落"],
    ["bz-mpc", "幻界维度"],
    ["bz-services", "集市服务"],
    ["bz-exchange", "兑换配方"],
    ["bz-effects", "装备效果"],
    ["bz-quests", "任务资料"]
  ].forEach(([id, label]) => {
    const a = el("a", null, label);
    a.href = "#" + id;
    nav.appendChild(a);
  });
  panel.appendChild(nav);

  const quick = addSection(panel, "货币说明", "bz-quick");
  const quickGrid = el("div", "bazaar-grid");
  CURRENCY_NOTES.forEach(note => addListCard(quickGrid, note));
  quick.appendChild(quickGrid);

  const drops = addSection(panel, "特殊掉落 / 货币来源", "bz-drops");
  addTable(drops, ["物品", "任务 / 来源", "掉率 / 条件", "备注"], SPECIAL_DROPS);

  const millennium = addSection(panel, "The Phantasmal Dimension 特殊掉落", "bz-mpc");
  addTable(millennium, ["物品", "怪物", "掉率 / 备注"], MILLENNIUM_DROPS);

  const services = addSection(panel, "集市服务", "bz-services");
  addServiceCards(services);

  const exchanges = addSection(panel, "兑换配方", "bz-exchange");
  addExchangeCards(exchanges);

  const effects = addSection(panel, "装备效果 / 组合强化", "bz-effects");
  const effectGrid = el("div", "bazaar-grid");
  EQUIPMENT_EFFECTS.forEach(item => addListCard(effectGrid, { ...item, kind: "gear" }));
  effects.appendChild(effectGrid);

  const quests = addSection(panel, "任务资料", "bz-quests");
  QUESTS.forEach(quest => addQuest(quests, quest));

  root.appendChild(panel);
}

renderBazaarInfo();
