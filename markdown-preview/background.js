const positionKeyPattern = /^readingPosition:[a-f0-9]{64}$/;
const positionLimit = 200;
let positionQueue = Promise.resolve();

// 多标签页的读取、保存和淘汰统一串行执行，避免清理时误删刚更新的记录。
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !['reading-position:get', 'reading-position:set'].includes(message?.type)) return false;
  const { key, top } = message;
  const writing = message.type === 'reading-position:set';
  if (typeof key !== 'string' || !positionKeyPattern.test(key) || (writing && (!Number.isFinite(top) || top < 0))) {
    sendResponse({ ok: false });
    return false;
  }
  const operation = positionQueue.then(async () => {
    const settings = await chrome.storage.local.get(null);
    const entries = Object.entries(settings).filter(([name]) => positionKeyPattern.test(name));
    const previous = settings[key];
    const savedTop = Number.isFinite(previous?.top) && previous.top >= 0 ? previous.top : null;
    // 旧记录没有访问时间时按最早处理；同一毫秒内的访问仍保持明确顺序。
    const lastUsed = entries.reduce((latest, [, record]) => Number.isSafeInteger(record?.lastUsed) ? Math.max(latest, record.lastUsed + 1) : latest, Date.now());
    const record = { top: writing ? Math.round(top) : (savedTop ?? 0), lastUsed };
    const retained = entries.filter(([name]) => name !== key);
    retained.push([key, record]);
    retained.sort((a, b) => (b[1]?.lastUsed || 0) - (a[1]?.lastUsed || 0) || a[0].localeCompare(b[0]));
    const obsolete = retained.slice(positionLimit).map(([name]) => name);
    await chrome.storage.local.set({ [key]: record });
    if (obsolete.length) await chrome.storage.local.remove(obsolete);
    return { ok: true, top: writing ? record.top : savedTop };
  });
  // 单次存储失败不能阻塞后续请求，失败由调用页面降级处理。
  positionQueue = operation.catch(() => {});
  operation.then(sendResponse, () => sendResponse({ ok: false }));
  return true;
});
