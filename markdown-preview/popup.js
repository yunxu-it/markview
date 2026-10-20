(() => {
  const $ = id => document.getElementById(id);
  const preferences = globalThis.MarkViewSettings;
  const i18n = globalThis.MarkViewI18n;
  const message = (id, key, values) => i18n.set($(id), key, values);
  const changedKeys = new Set();
  let settings = { ...preferences.defaults }, saveRevision = 0;
  let pdfTarget = null;
  const render = () => {
    settings = preferences.apply(settings);
    $('language-select').value = settings.language;
    $('theme-select').value = settings.theme;
    $('article-width').value = String(settings.articleMaxWidth || preferences.widthRange.full);
    const key = settings.articleMaxWidth === 0 ? 'fullWidth' : 'widthPixels', values = { width: settings.articleMaxWidth };
    message('article-width-value', key, values);
    i18n.set($('article-width'), key, values, 'aria-valuetext');
  };
  const save = async changes => {
    const revision = ++saveRevision;
    settings = preferences.normalize({ ...settings, ...changes });
    render();
    const values = Object.fromEntries(preferences.keys.filter(key => Object.hasOwn(changes, key)).map(key => [key, settings[key]]));
    try {
      // 每次拖动都立即发起保存，关闭弹出页也无需等待延迟定时器。
      await chrome.storage.local.set(values);
      if (revision === saveRevision) message('settings-status', null);
    } catch {
      if (revision === saveRevision) message('settings-status', 'settingsSaveFailed');
    }
  };
  $('theme-select').addEventListener('change', () => save({ theme: $('theme-select').value }));
  $('language-select').addEventListener('change', () => save({ language: $('language-select').value }));
  $('article-width').addEventListener('input', () => {
    const value = Number($('article-width').value);
    save({ articleMaxWidth: value === preferences.widthRange.full ? 0 : value });
  });
  $('reset-reading-settings').addEventListener('click', () => save(preferences.defaults));
  $('open-viewer').addEventListener('click', async () => {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
      window.close();
    } catch { message('settings-status', 'openViewerFailed'); }
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
        message('pdf-hint', 'pdfReady');
        return;
      }
    } catch { /* 普通网页或未就绪的预览页保持禁用。 */ }
    message('pdf-hint', 'pdfOpenDocument');
  };
  $('export-pdf').addEventListener('click', async () => {
    if (!pdfTarget) return;
    $('export-pdf').disabled = true;
    try {
      const response = await sendPdfMessage(pdfTarget, { type: 'markview:pdf:export', documentVersion: pdfTarget.documentVersion });
      if (!response?.ok) throw new Error('当前文档不可导出');
      window.close();
    } catch { message('pdf-hint', 'pdfReconnect'); }
  });
  // 与预览页一样先订阅再读取，保留读取期间其他页面同步的新设置。
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const updated = {};
    for (const key of preferences.keys) {
      if (!Object.hasOwn(changes, key)) continue;
      changedKeys.add(key);
      updated[key] = changes[key].newValue;
    }
    if (!Object.keys(updated).length) return;
    settings = preferences.normalize({ ...settings, ...updated });
    render();
  });
  const restore = async () => {
    try {
      const saved = await chrome.storage.local.get(preferences.keys), initial = { ...settings };
      for (const key of preferences.keys) if (!changedKeys.has(key)) initial[key] = saved[key];
      settings = preferences.normalize(initial);
    } catch { message('settings-status', 'settingsReadFailed'); }
    render();
    ['language-select', 'theme-select', 'article-width', 'reset-reading-settings'].forEach(id => { $(id).disabled = false; });
  };
  i18n.translate();
  render();
  restore();
  findPdfTarget();
})();