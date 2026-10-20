(() => {
  // 界面词条成对维护，内容脚本与扩展页共用；不读取或翻译用户的 Markdown。
  const messages = {
    brand: ['墨览 · MarkView', 'MarkView'],
    popupTitle: ['墨览 · 阅读设置', 'MarkView · Reading settings'],
    readingSettings: ['阅读设置', 'Reading settings'],
    settingsDescription: ['自动保存，并同步到已打开的 Markdown 预览页。', 'Saved automatically and applied to open Markdown previews.'],
    languageLabel: ['界面语言', 'Interface language'],
    languageAuto: ['跟随浏览器', 'Follow browser'],
    themeLabel: ['主题', 'Theme'],
    themeGithub: ['经典明亮', 'Classic Light'],
    themeWarm: ['暖纸阅读', 'Warm Paper'],
    themeDark: ['柔和深色', 'Soft Dark'],
    themeReport: ['书卷报告', 'Serif Report'],
    themeBear: ['绯红简约', 'Crimson Minimal'],
    maxWidth: ['正文最大宽度', 'Maximum content width'],
    fullWidth: ['铺满', 'Full width'],
    widthPixels: ['{width}px', '{width} px'],
    widthHint: ['480–1600px，最右侧为铺满。小窗口自动适应；PDF 按纸张宽度排版。', '480–1600 px; the rightmost setting fills the width. Fits smaller windows; PDF layout follows the paper width.'],
    reset: ['恢复默认', 'Reset'],
    openViewer: ['打开预览页', 'Open viewer'],
    exportPdf: ['导出 PDF', 'Export PDF'],
    exportPdfTitle: ['打开当前文档的打印预览，选择另存为 PDF', 'Open print preview for this document, then choose Save as PDF'],
    pdfChecking: ['正在检查当前文档…', 'Checking the current document…'],
    pdfReady: ['导出当前标签页正在查看的 Markdown 文档。', 'Export the Markdown document in the current tab.'],
    pdfOpenDocument: ['请先在当前标签页打开 Markdown 文档。', 'Open a Markdown document in the current tab first.'],
    pdfReconnect: ['当前文档已变化或无法连接，请刷新文档页并重新打开弹窗后重试。', 'The document changed or cannot be reached. Refresh it and reopen this popup.'],
    settingsSaveFailed: ['设置保存失败，请重新调整后重试。', 'Could not save settings. Change the setting again to retry.'],
    settingsReadFailed: ['设置读取失败，暂时使用默认值，可重新调整保存。', 'Could not load settings. Defaults are shown; you can change and save them.'],
    openViewerFailed: ['无法打开预览页，请重新点击后再试。', 'Could not open the viewer. Click again to retry.'],
    skipContent: ['跳到正文', 'Skip to content'],
    expandOutline: ['展开目录', 'Expand sidebar'],
    collapseOutline: ['收起目录', 'Collapse'],
    sidebarLabel: ['文件与标题目录', 'Files and document outline'],
    openTooltip: ['打开文件或文件夹', 'Open a file or folder'],
    open: ['打开', 'Open'],
    openFile: ['打开文件', 'Open file'],
    openFolder: ['打开文件夹', 'Open folder'],
    forgetFolder: ['忘记文件夹', 'Forget folder'],
    navViews: ['目录视图', 'Sidebar views'],
    chapters: ['章节', 'Outline'],
    files: ['文件', 'Files'],
    resumeFolder: ['继续读取文件夹', 'Resume folder access'],
    folderFallback: ['兼容方式选择文件夹', 'Choose folder (compatibility)'],
    folderHint: ['通过“打开”选择文件夹，即可浏览 Markdown 文件树。', 'Choose a folder from Open to browse its Markdown files.'],
    filesLabel: ['Markdown 文件', 'Markdown files'],
    searchPlaceholder: ['搜索目录', 'Search outline'],
    searchLabel: ['搜索目录标题', 'Search outline headings'],
    tocLabel: ['文档章节', 'Document outline'],
    resizerLabel: ['调整目录宽度', 'Resize sidebar'],
    resizerTitle: ['拖动调整目录宽度，双击恢复默认；方向键微调，Enter 恢复默认', 'Drag to resize; double-click to reset. Use arrow keys to adjust or Enter to reset.'],
    renderOriginalFailed: ['Markdown 渲染失败，已保留原文。', 'Could not render Markdown. The original text has been kept.'],
    filePickerFailed: ['文件选择不可用，请拖入 Markdown 文件阅读。', 'The file picker is unavailable. Drag a Markdown file here to read it.'],
    folderEmptyTypes: ['所选文件夹中没有 Markdown 文件（.md / .markdown / .mdown）。', 'No Markdown files (.md / .markdown / .mdown) were found in this folder.'],
    folderCountOne: ['{name} · {count} 个文档', '{name} · {count} document'],
    folderCountMany: ['{name} · {count} 个文档', '{name} · {count} documents'],
    folderSwitch: ['点击文件切换文档。', 'Click a file to switch documents.'],
    folderLoading: ['正在读取文件目录…', 'Reading the folder…'],
    folderRemembered: ['已记住文件夹，点击“继续读取”恢复访问。', 'Folder remembered. Click Resume folder access to reconnect.'],
    folderUnavailable: ['文件夹暂时不可读，可继续读取或通过“打开”重新选择。', 'The folder is unavailable. Resume access or choose it again from Open.'],
    folderPermission: ['尚未获得读取权限，可再次继续读取。', 'Read access was not granted. You can try resuming access again.'],
    folderReadFailed: ['文件夹读取失败，请通过“打开”重新选择。', 'Could not read the folder. Choose it again from Open.'],
    folderForgetFailed: ['文件夹记忆清除失败，请重试“忘记文件夹”。', 'Could not clear the remembered folder. Try Forget folder again.'],
    folderUnsupported: ['当前浏览器不支持只读目录选择。可使用兼容方式，Chrome 会显示“上传”确认，但文件仅在本地处理。', 'Read-only folder selection is unavailable. Compatibility mode shows a Chrome upload confirmation, but files are processed locally.'],
    folderSaveFailed: ['本次可正常阅读，但浏览器未能保存文件夹记忆。', 'You can read this folder, but the browser could not remember it.'],
    folderSecurity: ['当前页面不允许只读目录访问，请点击扩展图标，选择“打开预览页”后再试。也可使用下方兼容方式。', 'Read-only folder access is blocked on this page. Click the extension icon and choose Open viewer, or use compatibility mode below.'],
    folderLoadFailed: ['目录读取失败，请重新选择文件夹。原文档和文件树已保留。', 'Could not read the folder. Choose it again. The current document and file tree have been kept.'],
    folderFallbackUnsupported: ['当前浏览器不支持文件夹选择。', 'Folder selection is unavailable in this browser.'],
    folderFallbackNotice: ['兼容方式会显示 Chrome 的“上传”确认；文件只交给当前页面处理，不发送到服务器。', 'Compatibility mode shows a Chrome upload confirmation. Files stay on this page and are not sent to a server.'],
    folderEmpty: ['所选文件夹中没有 Markdown 文件。', 'No Markdown files were found in this folder.'],
    copy: ['复制', 'Copy'],
    copyLabel: ['复制代码', 'Copy code'],
    copyPending: ['复制中…', 'Copying…'],
    copyDone: ['已复制', 'Copied'],
    copyDoneLabel: ['代码已复制', 'Code copied'],
    copyFailed: ['复制失败', 'Copy failed'],
    copyFailedLabel: ['复制失败，请重试或手动选择代码复制', 'Copy failed. Retry or select and copy the code manually.'],
    noHeadings: ['暂无标题', 'No headings'],
    tocMatchOne: ['找到 {count} 个标题', '{count} heading found'],
    tocMatchMany: ['找到 {count} 个标题', '{count} headings found'],
    tocNoMatch: ['没有匹配的标题', 'No matching headings'],
    invalidMarkdown: ['请选择 Markdown 文件（.md / .markdown / .mdown）。', 'Choose a Markdown file (.md / .markdown / .mdown).'],
    renderCurrentFailed: ['Markdown 渲染失败，已保留当前文档。', 'Could not render Markdown. The current document has been kept.'],
    fileOpened: ['已打开：{path}。相对路径图片请通过 Chrome 直接打开原始 .md 文件查看。', 'Opened: {path}. To view relative images, open the original .md file directly in Chrome.'],
    fileReadFailed: ['文件读取失败，请重新选择文件。', 'Could not read the file. Choose it again.'],
    documentChangedPrint: ['当前文档已变化，请重新点击扩展图标导出 PDF。', 'The document changed. Click the extension icon again to export PDF.'],
    printFailed: ['无法打开打印预览，请使用 Ctrl+P 后选择另存为 PDF。', 'Could not open print preview. Press Ctrl+P and choose Save as PDF.'],
    welcomeName: ['欢迎使用', 'Welcome'],
    welcomeContent: [
      '# 墨览 · MarkView\n\n点击侧栏的 **打开**，选择 **打开文件** 或 **打开文件夹**。也可拖入 Markdown，或在 Chrome 中直接打开本地 `.md` 文件。\n\n## 本地文件自动预览\n\n在 Chrome 扩展详情中开启 **允许访问文件网址**，然后在 Chrome 中打开 `.md` 文件。\n\n## 阅读操作\n\n- 点击 **章节** 查看当前文档标题并跳转章节\n- 打开文件夹后，点击 **文件** 浏览 Markdown 文件树并切换文档\n- 文件夹自动记住，刷新后尝试恢复；权限失效时点击 **继续读取文件夹**\n- 通过 **打开 → 忘记文件夹** 清除目录记忆\n- 只读模式每次点击文档会读取最新内容\n- 点击扩展图标，在 **界面语言** 中选择跟随浏览器、简体中文或 English\n\n## 支持内容\n\n表格、代码块、任务列表、引用、图片和链接。原始 HTML 按文本显示。',
      '# MarkView\n\nChoose **Open → Open file** or **Open folder** in the sidebar. You can also drop a Markdown file here or open a local `.md` file directly in Chrome.\n\n## Automatic local file preview\n\nEnable **Allow access to file URLs** on the extension details page, then open a `.md` file in Chrome.\n\n## Reading\n\n- Use **Outline** to browse headings and jump to a section\n- After opening a folder, use **Files** to browse Markdown files and switch documents\n- Folders are remembered and restored when possible; choose **Resume folder access** if permission expires\n- Use **Open → Forget folder** to clear the remembered folder\n- Read-only mode reads the latest content each time you click a file\n- Click the extension icon and use **Interface language** to follow the browser or choose 简体中文 or English\n\n## Supported content\n\nTables, code blocks, task lists, blockquotes, images, and links. Raw HTML is displayed as text.'
    ]
  };
  const attributes = { textContent: 'data-i18n', title: 'data-i18n-title', 'aria-label': 'data-i18n-aria-label', placeholder: 'data-i18n-placeholder', 'aria-valuetext': 'data-i18n-aria-valuetext' };
  const parameters = new WeakMap();
  let language = '';
  const browserLanguage = () => {
    try { return globalThis.chrome?.i18n?.getUILanguage() || navigator.language || 'en'; }
    catch { return navigator.language || 'en'; }
  };
  const t = (key, values = {}) => {
    const pair = messages[key];
    const text = pair?.[language === 'zh-CN' ? 0 : 1] ?? pair?.[1] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => Object.hasOwn(values, name) ? String(values[name]) : '');
  };
  const write = (element, attribute, text) => {
    if (attribute === 'textContent') element.textContent = text;
    else element.setAttribute(attribute, text);
  };
  /**
   * 绑定界面词条及参数，切换语言时重放当前状态；空 key 会清除绑定和文案。
   * @param {Element} element 扩展创建的界面元素，不包含用户正文
   * @param {string|null} key 词条标识，null 表示清空
   * @param {object} values 动态参数，始终以纯文本写入
   * @param {string} attribute 文本或可翻译属性，默认 textContent
   */
  const set = (element, key, values = {}, attribute = 'textContent') => {
    const bindings = parameters.get(element) ?? {};
    if (key) {
      element.setAttribute(attributes[attribute], key);
      bindings[attribute] = values;
    } else {
      element.removeAttribute(attributes[attribute]);
      delete bindings[attribute];
    }
    parameters.set(element, bindings);
    write(element, attribute, key ? t(key, values) : '');
  };
  const translate = (root = document) => {
    const selector = Object.values(attributes).map(attribute => '[' + attribute + ']').join(',');
    for (const element of root.querySelectorAll(selector)) {
      for (const [attribute, marker] of Object.entries(attributes)) {
        const key = element.getAttribute(marker);
        if (key) write(element, attribute, t(key, parameters.get(element)?.[attribute]));
      }
    }
  };
  const setLanguage = preference => {
    const requested = ['zh-CN', 'en'].includes(preference) ? preference : browserLanguage();
    const next = /^zh(?:[-_]|$)/i.test(requested) ? 'zh-CN' : 'en';
    document.documentElement.lang = next;
    if (next === language) return;
    const initialized = language !== '';
    language = next;
    // 首次加载时预览 UI 尚未挂载，不触碰 file:// 原始页面中的任何正文节点。
    if (initialized) translate();
    window.dispatchEvent(new CustomEvent('markview:languagechange'));
  };
  globalThis.MarkViewI18n = Object.freeze({ t, set, translate, setLanguage, get language() { return language; } });
  setLanguage('auto');
})();