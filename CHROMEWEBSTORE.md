# 墨览 · MarkView 商店发布材料

最后更新：2026-10-27

## 1.4.0 发布状态

当前源码版本为 1.4.0，状态为待发布。用户已说明上传 ZIP 并更新产品详情；是否提交审核及上线尚未确认，本次未读取后台核验。未创建远端标签或 GitHub Release。商店条目继续使用现有 ID：`ehpgkiagfgnbbmcfeemceglgfbojmcbk`。

截至 2026-10-21，项目记录已确认 1.3.0 公开发布。2026-10-27 尝试读取当前商店页与线上隐私页未成功，终端回退读取商店页也遇到 SSL 连接错误；未核实当前线上版本或后台状态。

## 本次需要调整的文案

| 项目 | 中文 | 英文 | 状态 |
| --- | --- | --- | --- |
| 商店详细说明 | 在完整功能介绍前增加「1.4.0 新增」 | 在完整功能介绍前增加「New in 1.4.0」，明确格式提示目前仅提供中文 | 下文中英文完整版均已内置更新内容，直接复制整个代码块 |
| 发布公告摘要（可选） | 简要说明 1.4.0 更新内容 | 同步说明相同功能与语言限制 | 仅供 GitHub Release 或其他公告使用，商店不另填 |
| 隐私页适用产品（本次一次性调整） | `适用产品：墨览 · MarkView 浏览器扩展` | `Applies to: the MarkView browser extension` | 本地中英文文档、静态页及 Hexo 源文件已同步；不再随扩展版本逐次追加，线上待用户部署 |
| 名称与简短说明 | 沿用现有文案 | 沿用现有文案 | 本次无需调整 |

## 商店填写方式

在开发者后台的 Store listing 中选择对应语言，将下方「简体中文详细说明」或「英文详细说明」的整个代码块粘贴到该语言的详细说明字段。两个完整版已包含本次更新内容，无需额外拼接更新摘要。

详细说明按以下顺序展示：简介 → 1.4.0 新增 → 阅读设置、主题与 PDF → 阅读与导航 → 开始使用 → 使用说明 → 本地处理与隐私。

此前的「New in 1.3.0」改为常规功能标题「Reading settings, themes, and PDF」，保留原有功能、使用方式和限制。今后发布新版时更新前面的新增内容，完整版本历史维护在 [CHANGELOG.md](CHANGELOG.md)。

商店更新日志随详细说明一起展示；下方可选的发布公告摘要不对应独立的商店填写字段。[Chrome 官方填写说明](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#product-details) 也将更新日志列为详细说明可包含的内容。

## 商店填写内容

扩展名称：默认语言为 MarkView，简体中文为「墨览 · MarkView」，与现有扩展名称一致。

简体中文简短说明（沿用现有文案）：

```text
在 Chrome 中阅读本地 Markdown，支持文件树、章节导航、五套主题、中英双语、宽度设置与 PDF 打印保存。
```

英文简短说明（沿用现有文案）：

```text
Read local Markdown with a file tree, outline, themes, English/Chinese UI, adjustable width, and PDF print saving.
```

简体中文详细说明：

```text
使用墨览 · MarkView，在 Chrome 中阅读本地 Markdown。

直接打开本地 Markdown 文件、选择文件、拖入文档或浏览文件夹，在阅读正文时便捷切换章节与文件。点击扩展图标即可调整界面语言、主题、正文宽度，或使用 PDF 导出入口。

1.4.0 新增
• Markdown 格式检查：提示疑似缺少表格分隔行、表格列数不一致、链接或图片目标地址未闭合，以及代码块围栏未闭合。
• 在可折叠面板中显示原文行号和修改建议。提示默认收起，不修改源文件，也不进入 PDF。
• 表格数据行少列时仅作提醒，有意留空可以忽略。格式提示目前仅提供简体中文。

阅读设置、主题与 PDF
• 简体中文与 English 界面：跟随浏览器语言，或手动选择。
• 五套阅读主题：经典明亮、暖纸阅读、柔和深色、书卷报告和绯红简约。
• 正文最大宽度支持 480–1600 px，也可铺满。偏好保存在本机，并同步应用到已打开的预览页。
• 当前文档的 PDF 打印快捷入口：选择“导出 PDF”，再在浏览器打印预览中选择“另存为 PDF”。
• 常见开发语言的丰富代码配色，复制按钮不会遮挡代码。

阅读与导航
• H1–H6 章节目录，支持搜索、章节跳转、分支折叠和当前章节高亮。
• 以只读方式浏览您明确授权的文件夹及子目录，点击 Markdown 文件即可切换文档。
• 记住最近一次成功打开的文件夹；权限有效时恢复访问，权限失效时可点击继续读取。
• 调整侧栏宽度，并记住展开或收起状态。
• 在本机恢复最近最多 200 份文档的阅读位置。
• 支持常用表格、任务列表、引用、图片、链接和围栏代码块。

开始使用
1. 打开 chrome://extensions，找到墨览 · MarkView，在详情中开启“允许访问文件网址”。
2. 使用 Chrome 直接打开本地 .md 文件。
3. 也可点击扩展图标，选择“打开预览页”，再选择或拖入文档。
4. 通过图标弹窗修改语言、主题或宽度。阅读文档时，可使用“导出 PDF”打开打印预览。

使用说明
• 切换界面语言不会翻译文档正文、文件名或代码。
• 只有直接打开原始 Markdown 文件时才支持相对路径图片和跨文档相对链接。选择文件、选择文件夹及拖拽不会提供完整磁盘路径。
• 不会持续监控文件变更。直接打开的文档修改后需刷新；只读目录模式点击文件时会读取最新内容，目录增删后需重新打开或刷新文件夹。
• PDF 保存、纸张、缩放、背景和页眉页脚由浏览器打印设置控制，请在保存前检查预览。
• 轻量解析器和代码着色覆盖常用语法，不承诺完整 Markdown 或语言语法兼容；不支持数学公式、Mermaid、原始 HTML 渲染和引用式链接。
• 格式检查结果仅供参考，可能无法发现所有问题，也不检查链接或图片目标是否存在。

本地处理与隐私
没有账号、广告、分析统计或遥测。文档在本机处理，不上传到开发者服务器。扩展在本机保存主题、宽度、语言、侧栏偏好、阅读标识的哈希值及阅读位置，以及最近一次授权文件夹的句柄；不持久保存文档正文、文件列表或完整磁盘路径。通过“打开 → 忘记文件夹”可清除目录记忆。远程图片会请求图片网站，外部链接由浏览器打开。

支持与隐私问题：moreve.lee@gmail.com
隐私政策：https://winxo.cn/protocol/markview_protocol.html
```

英文详细说明：

```text
Read local Markdown in Chrome with MarkView.

Open a local Markdown file directly, choose a file, drop a document, or browse a folder. Navigate headings and files while keeping the reading view focused. Language, theme, width, and PDF controls are available from the extension icon.

New in 1.4.0
• Markdown format warnings for suspected missing table separators, mismatched table column counts, unclosed link or image destinations, and unclosed fenced code blocks.
• Source line numbers and suggestions in a collapsible panel. Warnings are collapsed by default, do not modify the source file, and are excluded from PDF output.
• Warnings about rows with missing cells can be ignored when the cells were intentionally left blank. Format warnings are currently displayed in Simplified Chinese.

Reading settings, themes, and PDF
• English and Simplified Chinese interfaces: follow the browser or choose a language manually.
• Five reading themes: Classic Light, Warm Paper, Soft Dark, Serif Report, and Crimson Minimal.
• Adjustable maximum content width from 480 to 1600 px, plus full width. Preferences are saved locally and applied to open previews.
• A PDF print shortcut for the current document: choose Export PDF, then Save as PDF in browser print preview.
• Richer syntax colors for common development languages, with copy controls that do not cover the code.

Reading and navigation
• H1–H6 document outline with search, section links, collapsible branches, and current-section highlighting.
• Read-only browsing of folders and subfolders you explicitly authorize; click a Markdown file to switch documents.
• Remember the last successfully opened folder. Restore it while permission is valid or resume access when permission expires.
• Resize the sidebar and remember whether it is expanded or collapsed.
• Restore reading positions for up to 200 recent documents on your device.
• Common tables, task lists, blockquotes, images, links, and fenced code blocks.

Getting started
1. Open chrome://extensions, find MarkView, and enable Allow access to file URLs in its details.
2. Open a local .md file directly in Chrome.
3. Alternatively, click the extension icon, choose Open viewer, and select or drop a document.
4. Use the icon popup to change language, theme, or width. While viewing a document, use Export PDF to open print preview.

Usage notes
• Changing interface language does not translate your documents, file names, or code.
• Relative images and cross-document relative links work only when the original Markdown file is opened directly. File selection, folder selection, and drag-and-drop do not expose the full disk path.
• Files are not monitored continuously. Refresh directly opened documents after edits. Read-only folder mode reads the latest content when you click a file; reopen or refresh the folder after adding or removing files.
• PDF saving, paper size, scaling, backgrounds, and headers or footers are controlled by browser print settings. Review the preview before saving.
• A lightweight parser and lexer cover common syntax without promising full Markdown or language grammar compatibility. Math, Mermaid, raw HTML rendering, and reference-style links are not supported.
• Format checks provide suggestions only and may not identify every problem. They do not check whether link and image targets exist.

Local processing and privacy
No account, advertising, analytics, or telemetry. Documents are processed locally and are not uploaded to a developer server. The extension stores theme, width, language, sidebar preferences, hashed reading identifiers and positions, and a handle for the last authorized folder. Document contents, file lists, and full disk paths are not persisted. Use Open → Forget folder to remove folder memory. Remote images contact their image websites, and external links open in the browser.

Support and privacy questions: moreve.lee@gmail.com
Privacy policy: https://winxo.cn/protocol/markview_protocol.html
```

单一用途：阅读用户主动打开或授权访问的本地 Markdown 文档，并提供与阅读相关的导航、排版、格式提示和打印保存。

商店分类、主语言、分发地区、可见性及发布者显示名称沿用当前条目；本次未读取后台，不调整这些设置。扩展默认语言仍为 `en`，已提供的简体中文与英文界面保留；本文提供中英文发布文案，新增格式检查界面提示仍暂为中文，后续另行处理界面翻译。

联系邮箱：moreve.lee@gmail.com（沿用现有隐私政策联系方式）。

支持地址：https://github.com/yunxu-it/markview/issues

项目主页：https://github.com/yunxu-it/markview

## 发布公告摘要（可选，非商店单独字段）

以下短文案用于 GitHub Release 或其他发布公告。商店详细说明直接使用上方对应语言的完整版，其中已经包含 1.4.0 新增内容，不需要额外粘贴本节。

中文：

```text
1.4.0 更新：
新增 Markdown 格式检查，支持表格格式异常、链接或图片标记不完整、代码块未闭合等提示，并提供原文行号和修改建议。
提示不修改原文，也不进入 PDF。
格式提示目前提供中文，本次未新增权限或改变数据处理方式。
```

英文：

```text
What's new in 1.4.0:
Markdown format warnings now show source line numbers and suggestions for suspected table formatting problems, unclosed link or image destinations, and unclosed fenced code blocks.
Warnings do not change your source file and are excluded from PDF output.
Format warnings are currently displayed in Simplified Chinese. This update adds no permissions and does not change how data is handled.
```

## 图标与截图

| 素材 | 规格 | 本地文件 | 状态 |
| --- | --- | --- | --- |
| 商店图标 | 128×128 PNG | `store/markview/assets/icon-128.png` | 沿用现有素材 |
| 中文基础功能截图 | 1280×800 PNG | `store/markview/assets/1.3.0/zh-CN/screenshot-01.png` 至 `screenshot-04.png` | 1.3.0 历史素材，未重新生成 |
| 英文基础功能截图 | 1280×800 PNG | `store/markview/assets/1.3.0/en/screenshot-01.png` 至 `screenshot-03.png` | 1.3.0 历史素材，未重新生成 |
| 小型宣传图 | 440×280 PNG | `store/markview/assets/promo-440x280.png` | 沿用现有素材 |
| 格式检查新功能截图 | 1280×800 PNG | 尚未生成 | 可在实际阅读页验收后补充；试验页不冒充商店界面 |

## 权限说明

| 声明 | 用途 | 1.4.0 变化 |
| --- | --- | --- |
| `storage` | 在本机保存主题、语言、正文宽度、侧栏偏好和阅读位置，恢复用户的阅读设置 | 无新增权限或存储项 |
| 内容脚本 `file:///*`，限定 Markdown 后缀 | 在用户主动打开的本地 Markdown 页面显示阅读界面；用户需自行启用文件网址访问 | 仅加入本地格式提示运行文件，匹配范围不变 |
| `host_permissions` | 未声明 | 无新增 |

格式检查使用当前已读取的正文，不扫描其他目录、不访问链接目标、不写回源文件。原生目录选择仍只请求读取权限。

## 隐私与数据使用

本次未新增数据收集、持久存储、上传、广告、账号或遥测。正文和格式提示保留在当前页面内存中；本机阅读记录、偏好及目录记忆延续现有处理方式。远程图片请求与外部链接行为见既有隐私政策。

- 不出售数据。
- 不将数据用于与本地文档阅读无关的目的。
- 不将数据用于信用或贷款评估。
- 不执行文档内脚本，不加载远程运行代码；原始 HTML 按文本显示。

隐私政策地址：https://winxo.cn/protocol/markview_protocol.html

本地 [中文政策](store/markview/PRIVACY.md)、[英文政策](store/markview/PRIVACY.en.md) 和 [静态页面](store/markview/privacy.html) 已改为按产品适用，去掉扩展版本号绑定；数据处理条款与原生效日期 2026-10-20 不变。已同步到 Hexo 源文件 `source/protocol/markview_protocol.html` 并确认内容一致，线上待用户部署。

线上隐私页本次需要一次性同步的适用范围说明：

中文：

```text
适用产品：墨览 · MarkView 浏览器扩展
```

英文：

```text
Applies to: the MarkView browser extension
```

后续发布只核对实际数据处理方式与政策是否一致，不因扩展版本号变化修改政策、追加版本号或更新生效日期。仅在数据收集、使用、存储、共享、保留期限、删除方式或相关要求发生变化，或现有表述需要纠正时，更新对应条款和中英文页面；需要更新政策时再同步线上页面。维护规则见 [隐私政策与示例](store/markview/README.md#隐私政策与示例)。

本次隐私页适用范围调整不涉及扩展运行文件，也不进入 ZIP；已上传的 1.4.0 安装包无需重新打包或替换。Hexo 源文件已更新，线上页面由用户按独立站点流程部署一次，目前未确认上线。

## 包与验收记录

目标安装包：`store/markview/markview-1.4.0.zip`；SHA-256 校验值由打包脚本写入 `store/markview/SHA256.txt`。安装包与校验文件不纳入 Git。

2026-10-27 已生成安装包并通过打包脚本的逐文件回读检查，ZIP SHA-256：`DC14E0AB5EF2EDC68931E6591DA18E2E117257DA3CB0FFA57E4BC68104800BF0`。

打包命令：

```powershell
./store/markview/package.ps1
```

- [x] 格式检查与本地试验页已完成源码整理。
- [x] 本地试验页与阅读页共用解析器和格式提示代码。
- [x] 更新 manifest、README、更新记录，本地隐私政策改为按产品适用。
- [x] 生成 1.4.0 ZIP 并通过包内容逐文件 SHA-256 回读检查。
- [ ] 从 ZIP 解压加载扩展，验收直开、选择、拖入、文件树切换及提示清空。
- [ ] 验收正常／错误样例、原文行号、主题、键盘操作和 PDF 中隐藏提示。
- [x] 隐私页已同步 Hexo 源文件，并确认与当前静态页内容一致。
- [ ] 用户部署线上隐私页并确认可访问；后续无必要不改政策。
- [x] 上传 ZIP 并更新产品详情（用户已说明，本次未读取后台核验）。
- [ ] 核对后台元数据并确认已提交审核。

当前已完成源码静态检查和包内容回读检查，未运行自动测试、lint 或 Chrome 实测。不将试验页、历史截图或包内容回读视为 Chrome 运行验收。具体步骤见 [手动验收清单](store/markview/source/regression.md)。

## 版本历史

| 版本 | 日期 | 变化 | 状态 |
| --- | --- | --- | --- |
| 1.4.0 | 2026-10-27 | Markdown 格式提示、本地试验页；无新增权限 | 用户已说明上传 ZIP 并更新产品详情，提审及上线状态未确认 |
| 1.3.0 | 截至 2026-10-21 已确认 | 阅读设置、五套主题、正文宽度、中英界面、PDF | 此前已确认公开发布；当前线上状态未重新核实 |

## 审核备注与边界

格式检查为启发式提示，不承诺完整 CommonMark / GFM 兼容。链接／图片仅对已出现 `](` 的标记检查目标地址及可选标题闭合，不检测资源可访问性。新增提示暂为中文，后续另行处理翻译。

本次未读取商店后台的审核或驳回记录，不推断此前审核状态。更新流程参考 [Chrome 官方更新说明](https://developer.chrome.com/docs/webstore/update)。