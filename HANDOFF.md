# 交接说明：集市 / 货币 / 任务资料中文整理

分支：`feature/bazaar-cn-info`

## 改动范围

- `index.html`
  - 在原掉落表下方新增 `#bazaar-info` 容器。
  - 引入独立模块 `bazaar-info.js` 和独立样式 `bazaar-info.css`。

- `bazaar-info.css`
  - 资料区专用样式，所有选择器以 `#bazaar-info` 为作用域，和上方掉落表样式互不影响。
  - 同时在作用域内中和了 index.html 全局 `table / th / td / sticky` 规则的渗透。

- `bazaar-info.js`
  - 新增底部中文资料区。
  - 按用途整理为：
    - 货币说明
    - 特殊掉落 / 货币来源
    - The Phantasmal Dimension 特殊掉落
    - 集市服务
    - 兑换配方
    - 装备效果 / 组合强化
    - 任务资料
  - 游戏内名称显示为“中文名（英文原名）”，并用高亮样式标出，方便和原掉落表、游戏内英文名对照。
  - 没有写入 Discord 链接、频道 ID、用户信息、头像、反应按钮等元数据。

## 本地运行

不要直接双击 `index.html`，因为页面会 `fetch('data.json')`，浏览器本地文件模式会拦截。

在项目目录运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:8765/
```

## 命名处理规则

为了和上方掉落表对得上，`bazaar-info.js` 里有一张 `NAME_ZH` 映射表：

1. 优先使用 `data.json` 里已有的中文物品名。
2. 怪物名尽量按上方掉落表已有中文译名对齐。
3. Destiny 自定义任务、怪物、货币，没有现成中文名的，采用意译，并保留英文原名。

后续如果有更官方的中文名，只需要改 `NAME_ZH` 里的对应项，不需要改正文数据。

## 建议原作者重点复核

- `Cladding of Manipulator III` 页面按后续更新与当前掉落表使用 `1/10`。
- 部分 Destiny 自定义怪物/任务名是意译，不一定是官方中文。
- `Weapon Crystal Badge`、`Photon Token`、`Star Eulogy`、`MATRIX SCOPE` 等若服务器已有固定中文名，建议替换 `NAME_ZH` 映射。
- 下方资料区目前是静态整理内容；如果以后需要跟 `data.json` 一样数据化，可以再把资料拆成 JSON。

## 验证

已做：

- `bazaar-info.js` 模块语法检查。
- 本地 HTTP 服务下打开页面。
- 原掉落表正常渲染。
- 底部中文资料区正常渲染。

未做：

- 没有提交远程分支。
- 没有把 Discord 附件/视频本地化。
