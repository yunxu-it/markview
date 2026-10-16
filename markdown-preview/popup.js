(() => {
  const $ = id => document.getElementById(id);
  const preferences = globalThis.MarkViewSettings;
  let settings = { ...preferences.defaults }, saveRevision = 0;
  let pdfTarget = null;
  const render = () => {
    settings = preferences.apply(settings);
    $('theme-select').value = settings.theme;
    $('article-width').value = String(settings.articleMaxWidth || preferences.widthRange.full);
    const label = settings.articleMaxWidth === 0 ? '铺满' : settings.articleMaxWidth + 'px';
    $('article-width-value').value = label;
    $('article-width').setAttribute('aria-valuetext', label);
  };
  const save = async changes => {
    const revision = ++saveRevision;
    settings = preferences.normalize({ ...settings, ...changes });
    render();
    const values = Object.fromEntries(preferences.keys.filter(key => Object.hasOwn(changes, key)).map(key => [key, settings[key]]));
    try {
      // 每次拖动都立即发起保存，关闭弹出页也无需等待延迟定时器。
      await chrome.storage.local.set(values);
      if (revision === saveRevision) $('settings-status').textContent = '';
    } catch {
      if (revision === saveRevision) $('settings-status').textContent = '设置保存失败，请重新调整后重试。';
    }
  };
  $('theme-select').addEventListener('change', () => save({ theme: $('theme-select').value }));
  $('article-width').addEventListener('input', () => {
    const value = Number($('article-width').value);
    save({ articleMaxWidth: value === preferences.widthRange.full ? 0 : value });
  });
  $('reset-reading-settings').addEventListener('click', () => save(preferences.defaults));
  $('open-viewer').addEventListener('click', async () => {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
      window.close();
    } catch { $('settings-status').textContent = '无法打开预览页，请重新点击后再试。'; }
  });
  const sendPdfMessage = (target, message) => target.route === 'tab'
    ? chrome.tabs.sendMessage(target.tabId, message, { frameId: 0 })
    : chrome.runtime.sendMessage({ ...message, tabId: target.tabId });
  const findPdfTarget = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!Number.isInteger(tab?.id)) throw new Error('当前标签页不可用');
      // 本地文件由内容脚本响应，扩展预览页则通过 runtime 消息按标签 ID 响应。
      for (const route of ['tab', 'runtime']) {
        const target = { tabId: tab.id, route };
        let response;
        try { response = await sendPdfMessage(target, { type: 'markview:pdf:status' }); }
        catch { continue; }
        if (!response?.canExport || !Number.isInteger(response.documentVersion)) continue;
        pdfTarget = { ...target, documentVersion: response.documentVersion };
        $('export-pdf').disabled = false;
        $('pdf-hint').textContent = '导出当前标签页正在查看的 Markdown 文档。';
        return;
      }
    } catch { /* 普通网页或未就绪的预览页保持禁用。 */ }
    $('pdf-hint').textContent = '请先在当前标签页打开 Markdown 文档。';
  };
  $('export-pdf').addEventListener('click', async () => {
    if (!pdfTarget) return;
    $('export-pdf').disabled = true;
    try {
      const response = await sendPdfMessage(pdfTarget, { type: 'markview:pdf:export', documentVersion: pdfTarget.documentVersion });
      if (!response?.ok) throw new Error('当前文档不可导出');
      window.close();
    } catch { $('pdf-hint').textContent = '当前文档已变化或无法连接，请刷新文档页并重新打开弹窗后重试。'; }
  });
  const restore = async () => {
    try { settings = preferences.normalize(await chrome.storage.local.get(preferences.keys)); }
    catch { $('settings-status').textContent = '设置读取失败，暂时使用默认值，可重新调整保存。'; }
    render();
    ['theme-select', 'article-width', 'reset-reading-settings'].forEach(id => { $(id).disabled = false; });
  };
  render();
  restore();
  findPdfTarget();
})();