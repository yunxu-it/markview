(() => {
  const i18n = globalThis.MarkViewI18n, t = i18n.t;
  const local = location.protocol === 'file:';
  const original = local ? (document.querySelector('body > pre')?.textContent ?? document.body.textContent) : '';
  let initialResult;
  if (local) {
    try { initialResult = renderMarkdown(original, location.href); }
    catch {
      const status = document.createElement('p');
      status.setAttribute('role', 'alert');
      i18n.set(status, 'renderOriginalFailed');
      document.body.prepend(status);
      return;
    }
  }
  document.body.replaceChildren();
  document.body.innerHTML = `
    <a class="skip-link" href="#main" data-i18n="skipContent">跳到正文</a>
    <button id="restore" data-i18n-aria-label="expandOutline" data-i18n-title="expandOutline" aria-label="展开目录" aria-controls="sidebar" aria-expanded="false" title="展开目录">›</button>
    <aside id="sidebar" data-i18n-aria-label="sidebarLabel" aria-label="文件与标题目录">
      <div class="sidebar-heading"><div class="sidebar-actions">
        <details id="open-menu"><summary data-i18n-title="openTooltip" title="打开文件或文件夹"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8V5.5A1.5 1.5 0 0 1 4.5 4H9l2 3h8.5A1.5 1.5 0 0 1 21 8.5V10M3 8h6l2 3h11l-3 9H3z"/></svg><span class="control-label" data-i18n="open">打开</span><svg class="open-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="open-options">
          <button id="open-file" type="button" data-i18n="openFile">打开文件</button>
          <button id="open-folder" type="button" data-i18n="openFolder">打开文件夹</button>
          <button id="forget-folder" type="button" data-i18n="forgetFolder" hidden>忘记文件夹</button>
        </div></details>
        <button id="toggle" data-i18n="collapseOutline" aria-controls="sidebar" aria-expanded="true">收起目录</button>
      </div></div>
      <input id="file-input" type="file" accept=".md,.markdown,.mdown" hidden>
      <div class="sidebar-views" role="group" data-i18n-aria-label="navViews" aria-label="目录视图">
        <button id="view-chapters" type="button" aria-pressed="true" aria-controls="chapters-section"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg><span class="control-label" data-i18n="chapters">章节</span></button>
        <button id="view-files" type="button" aria-pressed="false" aria-controls="files-section"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v14M4 7h5M4 17h5"/><rect x="9" y="4" width="11" height="6" rx="1.5"/><rect x="9" y="14" width="11" height="6" rx="1.5"/></svg><span class="control-label" data-i18n="files">文件</span></button>
      </div>
      <div id="files-section" hidden>
        <button id="resume-folder" type="button" data-i18n="resumeFolder" hidden>继续读取文件夹</button>
        <button id="folder-fallback" type="button" data-i18n="folderFallback" hidden>兼容方式选择文件夹</button>
        <input id="folder-input" type="file" webkitdirectory hidden>
        <p id="files-hint" data-i18n="folderHint">通过“打开”选择文件夹，即可浏览 Markdown 文件树。</p>
        <p id="folder-name"></p>
        <nav id="files" data-i18n-aria-label="filesLabel" aria-label="Markdown 文件"></nav>
      </div>
      <div id="chapters-section">
        <input id="toc-search" type="search" data-i18n-placeholder="searchPlaceholder" data-i18n-aria-label="searchLabel" placeholder="搜索目录" aria-label="搜索目录标题" aria-controls="toc" autocomplete="off">
        <p id="toc-search-status" role="status"></p>
        <nav id="toc" data-i18n-aria-label="tocLabel" aria-label="文档章节"></nav>
      </div>
    </aside>
    <div id="sidebar-resizer" role="separator" tabindex="0" data-i18n-aria-label="resizerLabel" data-i18n-title="resizerTitle" aria-label="调整目录宽度" aria-orientation="vertical" aria-controls="sidebar" title="拖动调整目录宽度，双击恢复默认；方向键微调，Enter 恢复默认"></div>
    <main id="main" tabindex="-1"><div id="status" role="status"></div>
      <details id="format-check" lang="zh-CN" hidden>
        <summary id="format-summary"></summary>
        <p>以下为疑似格式问题，仅供参考，不会修改原文。行号对应 Markdown 源文件。</p>
        <ol id="format-issues"></ol>
      </details>
      <article class="markdown-body" id="article"></article></main>`;
  const $ = id => document.getElementById(id);
  const message = (id, key, values) => i18n.set($(id), key, values);
  i18n.translate();
  let updateActiveHeading = () => {}, revealActiveHeading = () => {}, headingFrame = 0;
  const copyTimers = new Set();
  const scheduleHeadingUpdate = () => {
    if (headingFrame) return;
    headingFrame = requestAnimationFrame(() => {
      headingFrame = 0;
      updateActiveHeading();
    });
  };
  window.addEventListener('scroll', scheduleHeadingUpdate, { passive: true });
  window.addEventListener('resize', scheduleHeadingUpdate);
  // 图片加载、侧栏调宽和状态提示都可能改变标题位置。
  const contentObserver = new ResizeObserver(scheduleHeadingUpdate);
  contentObserver.observe($('main'));
  let generation = 0;
  const resizer = $('sidebar-resizer');
  const widthKey = 'sidebarWidth';
  const storage = globalThis.chrome?.storage?.local;
  let documentVersion = 0, navigationVersion = 0;
  const preferences = globalThis.MarkViewSettings;
  let readingSettings = { ...preferences.defaults };
  const changedReadingKeys = new Set();
  const applyReadingSettings = settings => {
    readingSettings = preferences.apply(settings);
    scheduleHeadingUpdate();
  };
  applyReadingSettings(readingSettings);
  if (storage) chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const updated = {};
    for (const key of preferences.keys) {
      if (!Object.hasOwn(changes, key)) continue;
      changedReadingKeys.add(key);
      updated[key] = changes[key].newValue;
    }
    if (!Object.keys(updated).length) return;
    const next = preferences.normalize({ ...readingSettings, ...updated });
    if (preferences.keys.every(key => next[key] === readingSettings[key])) return;
    // 图标弹出页的调整也属于用户操作，不能再被待完成的阅读位置恢复覆盖。
    navigationVersion++;
    applyReadingSettings(next);
  });
  // 先订阅再读取，逐项保留读取期间收到的新设置，避免旧快照覆盖实时调整。
  const readingSettingsReady = (async () => {
    if (!storage) return;
    try {
      const saved = await storage.get(preferences.keys), initial = { ...readingSettings };
      for (const key of preferences.keys) if (!changedReadingKeys.has(key)) initial[key] = saved[key];
      applyReadingSettings(initial);
    } catch { /* 读取失败时保留默认值或已收到的实时设置。 */ }
  })();
  let positionKey = null, positionReady = false, positionDirty = false, positionTimer = 0;
  history.scrollRestoration = 'manual';
  const savePosition = () => {
    clearTimeout(positionTimer);
    if (!storage || !positionKey || !positionReady || !positionDirty) return;
    positionDirty = false;
    const key = positionKey, top = Math.max(0, Math.round(window.scrollY));
    chrome.runtime.sendMessage({ type: 'reading-position:set', key, top }).then(result => {
      if (!result?.ok && key === positionKey) positionDirty = true;
    }).catch(() => { if (key === positionKey) positionDirty = true; });
  };
  const queuePositionSave = () => {
    if (!positionReady) return;
    positionDirty = true;
    clearTimeout(positionTimer);
    positionTimer = setTimeout(savePosition, 250);
  };
  const markNavigation = () => { navigationVersion++; };
  window.addEventListener('scroll', queuePositionSave, { passive: true });
  window.addEventListener('wheel', markNavigation, { passive: true });
  window.addEventListener('touchstart', markNavigation, { passive: true });
  document.addEventListener('pointerdown', markNavigation, { passive: true });
  document.addEventListener('keydown', markNavigation);
  window.addEventListener('hashchange', markNavigation);
  window.addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', () => { if (document.hidden) savePosition(); });
  // 后台保存哈希标识、滚动数值和访问时间；异步读取期间若用户已操作，则不再跳动页面。
  const restorePosition = async (identity, version, navigation) => {
    if (!storage || !identity) return;
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
      const key = 'readingPosition:' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const [saved] = await Promise.all([chrome.runtime.sendMessage({ type: 'reading-position:get', key }), widthReady, sidebarReady, readingSettingsReady]);
      if (!saved?.ok) return;
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (version !== documentVersion) return;
      positionKey = key;
      positionReady = true;
      const top = saved.top;
      if (navigation === navigationVersion) {
        if (location.hash) {
          try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch {}
        } else if (Number.isFinite(top) && top >= 0) window.scrollTo(0, top);
      }
      if (navigation !== navigationVersion) queuePositionSave();
      scheduleHeadingUpdate();
    } catch { /* 存储或哈希不可用时仍可正常阅读。 */ }
  };
  let preferredWidth = null, widthChanged = false, drag = null;
  // 窗口缩小时临时限制显示宽度，不覆盖用户原来的设置。
  const widthBounds = () => {
    const max = Math.max(1, Math.min(600, innerWidth - (innerWidth <= 760 ? 48 : 320)));
    return { min: Math.min(200, max), max };
  };
  const applyWidth = () => {
    const { min, max } = widthBounds();
    const width = Math.round(Math.max(min, Math.min(max, preferredWidth ?? (innerWidth <= 760 ? 240 : 280))));
    document.documentElement.style.setProperty('--sidebar', width + 'px');
    resizer.setAttribute('aria-valuemin', String(min));
    resizer.setAttribute('aria-valuemax', String(max));
    resizer.setAttribute('aria-valuenow', String(width));
    return width;
  };
  const saveWidth = () => {
    if (!storage) return;
    const update = preferredWidth === null ? storage.remove(widthKey) : storage.set({ [widthKey]: preferredWidth });
    update.catch(() => {});
  };
  const resetWidth = () => {
    widthChanged = true;
    preferredWidth = null;
    applyWidth();
    saveWidth();
  };
  applyWidth();
  const widthReady = storage ? storage.get(widthKey).then(settings => {
    if (widthChanged || !Number.isFinite(settings[widthKey]) || settings[widthKey] < 200 || settings[widthKey] > 600) return;
    preferredWidth = settings[widthKey];
    applyWidth();
  }).catch(() => {}) : Promise.resolve();
  resizer.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || drag) return;
    event.preventDefault();
    widthChanged = true;
    drag = { id: event.pointerId, x: event.clientX, width: applyWidth(), preferred: preferredWidth };
    resizer.setPointerCapture(event.pointerId);
    resizer.focus();
    document.body.classList.add('sidebar-resizing');
  });
  resizer.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    preferredWidth = drag.width + event.clientX - drag.x;
    preferredWidth = applyWidth();
  });
  const finishResize = event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (event.type === 'pointercancel') preferredWidth = drag.preferred;
    drag = null;
    document.body.classList.remove('sidebar-resizing');
    if (resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    applyWidth();
    saveWidth();
  };
  resizer.addEventListener('pointerup', finishResize);
  resizer.addEventListener('pointercancel', finishResize);
  resizer.addEventListener('lostpointercapture', finishResize);
  resizer.addEventListener('dblclick', resetWidth);
  resizer.addEventListener('keydown', event => {
    if (drag) return;
    if (event.key === 'Enter') { event.preventDefault(); resetWidth(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    widthChanged = true;
    const { min, max } = widthBounds(), step = event.shiftKey ? 40 : 10;
    preferredWidth = event.key === 'Home' ? min : event.key === 'End' ? max : applyWidth() + (event.key === 'ArrowLeft' ? -step : step);
    preferredWidth = applyWidth();
    saveWidth();
  });
  window.addEventListener('resize', applyWidth);
  const sidebarKey = 'sidebarHidden';
  let sidebarChanged = false;
  const saveSidebar = async hidden => {
    if (!storage) return;
    try { await storage.set({ [sidebarKey]: hidden }); }
    catch { /* 存储不可用时仍可正常展开和收起侧栏。 */ }
  };
  const setSidebar = (hidden, remember = true) => {
    document.body.classList.toggle('sidebar-hidden', hidden);
    $('toggle').setAttribute('aria-expanded', String(!hidden));
    $('restore').setAttribute('aria-expanded', String(!hidden));
    if (remember) {
      sidebarChanged = true;
      saveSidebar(hidden);
      (hidden ? $('restore') : $('toggle')).focus();
    }
    if (!hidden) revealActiveHeading();
  };
  // 恢复偏好不抢焦点；读取期间若已切换侧栏，则保留用户刚选择的状态。
  const sidebarReady = (async () => {
    if (!storage) return;
    try {
      const settings = await storage.get(sidebarKey);
      if (!sidebarChanged && typeof settings[sidebarKey] === 'boolean') setSidebar(settings[sidebarKey], false);
    } catch { /* 未保存偏好或读取失败时保持默认展开。 */ }
  })();
  $('toggle').addEventListener('click', () => setSidebar(!document.body.classList.contains('sidebar-hidden')));
  $('restore').addEventListener('click', () => setSidebar(false));
  const closeOpenMenu = () => { $('open-menu').open = false; };
  document.addEventListener('pointerdown', event => { if (!$('open-menu').contains(event.target)) closeOpenMenu(); });
  $('open-menu').addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeOpenMenu(); $('open-menu').querySelector('summary').focus(); }
  });
  $('open-file').addEventListener('click', async () => {
    closeOpenMenu();
    if (local || typeof window.showOpenFilePicker !== 'function') { $('file-input').click(); return; }
    try {
      const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.mdown'] } }] });
      readFile({ name: handle.name, handle });
    } catch (error) {
      if (error.name !== 'AbortError') message('status', 'filePickerFailed');
    }
  });
  $('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    readFile(file);
  });
  let activeFile = null, currentDocument = null, directoryHandle = null, rememberedFolder = null, folderGeneration = 0;
  let documentName = '';
  let fileEntries = [], fileButtons = new Map(), sidebarView = 'chapters';
  let folderWriteQueue = Promise.resolve();
  // 仅保存目录句柄，不保存正文或文件列表；事务完成后关闭连接，写入按用户操作顺序执行。
  const folderStore = (mode, handle) => new Promise((resolve, reject) => {
    const open = indexedDB.open('markview-folders', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('handles');
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('目录存储被占用'));
    open.onsuccess = () => {
      const database = open.result;
      try {
        const transaction = database.transaction('handles', mode), store = transaction.objectStore('handles');
        const request = mode === 'readonly' ? store.get('last-folder') : handle ? store.put(handle, 'last-folder') : store.delete('last-folder');
        transaction.oncomplete = () => { database.close(); resolve(request.result); };
        transaction.onabort = () => { database.close(); reject(transaction.error); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      } catch (error) { database.close(); reject(error); }
    };
  });
  const saveFolder = handle => {
    const update = folderWriteQueue.then(() => folderStore('readwrite', handle));
    folderWriteQueue = update.catch(() => {});
    return update;
  };
  const viewScroll = { chapters: 0, files: 0 };
  const isMarkdown = file => /\.(md|markdown|mdown)$/i.test(file.name);
  const markActiveFile = button => {
    activeFile?.removeAttribute('aria-current');
    activeFile = button?.isConnected ? button : null;
    activeFile?.setAttribute('aria-current', 'page');
    let parent = activeFile?.closest('details');
    while (parent) { parent.open = true; parent = parent.parentElement.closest('details'); }
  };
  const setView = view => {
    viewScroll[sidebarView] = $('sidebar').scrollTop;
    sidebarView = view;
    $('chapters-section').hidden = view !== 'chapters';
    $('files-section').hidden = view !== 'files';
    $('view-chapters').setAttribute('aria-pressed', String(view === 'chapters'));
    $('view-files').setAttribute('aria-pressed', String(view === 'files'));
    $('sidebar').scrollTop = viewScroll[view];
    if (view === 'chapters') revealActiveHeading();
  };
  $('view-chapters').addEventListener('click', () => setView('chapters'));
  $('view-files').addEventListener('click', () => setView('files'));
  const folderNode = name => ({ name, folders: new Map(), files: [] });
  const compare = (left, right) => left.name.localeCompare(right.name, 'zh-CN', { numeric: true });
  // 文件句柄用于精确定位；普通选择或拖入的文件只有在名称、内容唯一匹配时才关联。
  const findCurrentEntry = async (entries, handle, current) => {
    if (!current) return null;
    if (handle && current.handle) {
      const relative = await handle.resolve(current.handle);
      return relative ? entries.find(entry => entry.path === handle.name + '/' + relative.join('/')) : null;
    }
    let candidates = entries.filter(entry => entry.name === current.name);
    if (current.url) {
      try {
        const path = decodeURIComponent(new URL(current.url).pathname);
        candidates = candidates.filter(entry => path.endsWith('/' + entry.path));
      } catch { return null; }
    }
    if (candidates.length !== 1) return null;
    const entry = candidates[0], file = entry.handle ? await entry.handle.getFile() : entry.file;
    return await file.text() === current.source ? entry : null;
  };
  const renderFolder = async (root, handle, request) => {
    const entries = [], buttons = new Map();
    const appendFiles = (folder, parent) => {
      const list = document.createElement('ul');
      for (const child of [...folder.folders.values()].sort(compare)) {
        const item = document.createElement('li'), details = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = child.name;
        details.append(summary);
        appendFiles(child, details);
        item.append(details);
        list.append(item);
      }
      for (const entry of folder.files.sort(compare)) {
        const item = document.createElement('li'), button = document.createElement('button');
        button.type = 'button';
        button.textContent = entry.name;
        button.title = entry.path;
        button.setAttribute('aria-label', entry.path);
        button.addEventListener('click', () => readFile(entry, button));
        item.append(button);
        list.append(item);
        entries.push(entry);
        buttons.set(entry.path, button);
      }
      parent.append(list);
    };
    const fragment = document.createDocumentFragment();
    appendFiles(root, fragment);
    if (request !== folderGeneration) return;
    if (!entries.length) {
      message('files-hint', 'folderEmptyTypes');
      return false;
    }
    directoryHandle = handle;
    fileEntries = entries;
    fileButtons = buttons;
    markActiveFile(null);
    $('files').replaceChildren(fragment);
    message('folder-name', entries.length === 1 ? 'folderCountOne' : 'folderCountMany', { name: root.name, count: entries.length });
    message('files-hint', 'folderSwitch');
    const current = currentDocument;
    try {
      const entry = await findCurrentEntry(entries, handle, current);
      if (request === folderGeneration && current === currentDocument && entry) markActiveFile(buttons.get(entry.path));
    } catch { /* 当前文档未能关联时仍可从文件树选择，不影响正文。 */ }
    return true;
  };
  const loadDirectory = async (handle, request) => {
    message('files-hint', 'folderLoading');
    const scan = async (directory, path) => {
      const node = folderNode(directory.name);
      for await (const entry of directory.values()) {
        if (request !== folderGeneration) return node;
        if (entry.kind === 'directory') {
          const child = await scan(entry, path + '/' + entry.name);
          if (child.files.length || child.folders.size) node.folders.set(child.name, child);
        } else if (isMarkdown(entry)) node.files.push({ name: entry.name, path: path + '/' + entry.name, handle: entry });
      }
      return node;
    };
    return renderFolder(await scan(handle, handle.name), handle, request);
  };
  const restoreFolder = async () => {
    const request = folderGeneration;
    try {
      const handle = await folderStore('readonly');
      if (request !== folderGeneration || handle?.kind !== 'directory') return;
      rememberedFolder = handle;
      $('forget-folder').hidden = false;
      const permission = await handle.queryPermission({ mode: 'read' });
      if (request !== folderGeneration) return;
      if (permission === 'granted') await loadDirectory(handle, request);
      else {
        message('folder-name', null);
        $('folder-name').textContent = handle.name;
        message('files-hint', 'folderRemembered');
        $('resume-folder').hidden = false;
      }
    } catch {
      if (request === folderGeneration && rememberedFolder) {
        message('files-hint', 'folderUnavailable');
        $('resume-folder').hidden = false;
      }
    }
  };
  $('resume-folder').addEventListener('click', async () => {
    if (!rememberedFolder) return;
    const request = ++folderGeneration;
    try {
      // 权限申请直接来自点击；自动恢复只查询权限，不弹授权框。
      const permission = await rememberedFolder.requestPermission({ mode: 'read' });
      if (request !== folderGeneration) return;
      if (permission !== 'granted') { message('files-hint', 'folderPermission'); return; }
      generation++;
      if (await loadDirectory(rememberedFolder, request) && request === folderGeneration) $('resume-folder').hidden = true;
    } catch { if (request === folderGeneration) message('files-hint', 'folderReadFailed'); }
  });
  $('forget-folder').addEventListener('click', async () => {
    closeOpenMenu();
    const request = ++folderGeneration;
    generation++;
    rememberedFolder = directoryHandle = null;
    fileEntries = [];
    fileButtons.clear();
    markActiveFile(null);
    $('files').replaceChildren();
    message('folder-name', null);
    $('resume-folder').hidden = $('forget-folder').hidden = true;
    message('files-hint', 'folderHint');
    try { await saveFolder(null); }
    catch { if (request === folderGeneration) { message('files-hint', 'folderForgetFailed'); $('forget-folder').hidden = false; } }
  });
  // 仅枚举已授权目录，正文按需读取；不请求写权限，不自动使用“上传”方式回退。
  $('open-folder').addEventListener('click', async () => {
    closeOpenMenu();
    setView('files');
    if (typeof window.showDirectoryPicker !== 'function') {
      message('files-hint', 'folderUnsupported');
      $('folder-fallback').hidden = false;
      return;
    }
    const request = ++folderGeneration;
    try {
      const options = { mode: 'read', id: 'markview-folder' };
      if (directoryHandle || currentDocument?.handle || rememberedFolder) options.startIn = currentDocument?.handle ?? directoryHandle ?? rememberedFolder;
      const handle = await window.showDirectoryPicker(options);
      if (request !== folderGeneration) return;
      generation++;
      const loaded = await loadDirectory(handle, request);
      if (!loaded || request !== folderGeneration) return;
      rememberedFolder = handle;
      $('resume-folder').hidden = true;
      $('forget-folder').hidden = false;
      try { await saveFolder(handle); }
      catch { if (request === folderGeneration) message('files-hint', 'folderSaveFailed'); }
    } catch (error) {
      if (request !== folderGeneration) return;
      if (error.name === 'AbortError') return;
      message('files-hint', error.name === 'SecurityError' ? 'folderSecurity' : 'folderLoadFailed');
      $('folder-fallback').hidden = false;
    }
  });
  $('folder-fallback').addEventListener('click', () => {
    if (!('webkitdirectory' in $('folder-input'))) { message('files-hint', 'folderFallbackUnsupported'); return; }
    message('files-hint', 'folderFallbackNotice');
    $('folder-input').click();
  });
  $('folder-input').addEventListener('change', event => {
    const markdown = Array.from(event.target.files).filter(isMarkdown);
    event.target.value = '';
    if (!markdown.length) { message('files-hint', 'folderEmpty'); return; }
    const request = ++folderGeneration, root = folderNode(markdown[0].webkitRelativePath.split('/')[0]);
    generation++;
    for (const file of markdown) {
      const parts = file.webkitRelativePath.split('/').slice(1);
      let folder = root;
      for (const name of parts.slice(0, -1)) {
        if (!folder.folders.has(name)) folder.folders.set(name, folderNode(name));
        folder = folder.folders.get(name);
      }
      folder.files.push({ name: file.name, path: file.webkitRelativePath, file });
    }
    renderFolder(root, null, request);
  });
  let filterToc = () => {};
  $('toc-search').addEventListener('input', () => filterToc());
  $('toc-search').addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      $('toc-search').value = '';
      filterToc();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      $('toc').querySelector('a.toc-match')?.click();
    }
  });
  function show(source, name, baseURL, prepared, identity = null) {
    const result = prepared ?? renderMarkdown(source, baseURL);
    savePosition();
    const version = ++documentVersion, navigation = navigationVersion;
    positionKey = null;
    positionReady = false;
    positionDirty = false;
    copyTimers.forEach(timer => clearTimeout(timer));
    copyTimers.clear();
    $('article').innerHTML = result.html;
    globalThis.MarkViewFormatDiagnostics.render($('format-check'), result.diagnostics);
    $('article').querySelectorAll('pre > code').forEach(code => {
      const pre = code.parentElement, block = document.createElement('div'), button = document.createElement('button');
      block.className = 'code-block';
      button.className = 'copy-code';
      button.type = 'button';
      i18n.set(button, 'copy');
      i18n.set(button, 'copyLabel', {}, 'aria-label');
      button.setAttribute('aria-live', 'polite');
      pre.before(block);
      block.append(pre, button);
      let resetTimer;
      button.addEventListener('click', async () => {
        clearTimeout(resetTimer);
        copyTimers.delete(resetTimer);
        button.disabled = true;
        i18n.set(button, 'copyPending');
        i18n.set(button, 'copyPending', {}, 'aria-label');
        button.dataset.feedback = 'pending';
        try {
          // 只复制代码文本，避免把高亮标签和按钮文案带入剪贴板。
          await navigator.clipboard.writeText(code.textContent);
          i18n.set(button, 'copyDone');
          i18n.set(button, 'copyDoneLabel', {}, 'aria-label');
        } catch {
          i18n.set(button, 'copyFailed');
          i18n.set(button, 'copyFailedLabel', {}, 'aria-label');
        } finally {
          button.disabled = false;
          if (!button.isConnected) return;
          button.dataset.feedback = 'done';
          resetTimer = setTimeout(() => {
            i18n.set(button, 'copy');
            i18n.set(button, 'copyLabel', {}, 'aria-label');
            delete button.dataset.feedback;
            copyTimers.delete(resetTimer);
          }, 2000);
          copyTimers.add(resetTimer);
        }
      });
    });
    documentName = name;
    document.title = name + ' · ' + t('brand');
    message('toc', null);
    $('toc-search').value = '';
    $('toc-search').disabled = !result.headings.length;
    message('toc-search-status', null);
    const tree = { children: [], level: 0 }, stack = [tree];
    for (const heading of result.headings) {
      while (stack.length > 1 && stack.at(-1).level >= heading.level) stack.pop();
      const node = { ...heading, children: [] };
      stack.at(-1).children.push(node); stack.push(node);
    }
    const append = (nodes, parent) => {
      const list = document.createElement('ul'); parent.append(list);
      for (const node of nodes) {
        const item = document.createElement('li'), link = document.createElement('a');
        link.textContent = node.text; link.href = '#' + encodeURIComponent(node.id); link.dataset.heading = node.id;
        link.addEventListener('click', event => {
          event.preventDefault();
          document.getElementById(node.id)?.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', '#' + encodeURIComponent(node.id));
          if (innerWidth < 760) setSidebar(true);
        });
        if (node.children.length) {
          const details = document.createElement('details'), summary = document.createElement('summary');
          details.open = true; summary.append(link); details.append(summary); append(node.children, details); item.append(details);
        } else item.append(link);
        list.append(item);
      }
    };
    append(tree.children, $('toc'));
    if (!result.headings.length) message('toc', 'noHeadings');
    const records = [...$('toc').querySelectorAll('li')].map(item => ({
      item, link: item.querySelector('a'), details: item.firstElementChild.tagName === 'DETAILS' ? item.firstElementChild : null
    }));
    let foldedBeforeSearch = null;
    filterToc = () => {
      const query = $('toc-search').value.normalize('NFKC').trim().toLowerCase();
      if (query && !foldedBeforeSearch) foldedBeforeSearch = new Map(records.filter(record => record.details).map(record => [record.details, record.details.open]));
      let matches = 0;
      // 从子节点向父节点过滤，保留匹配标题的完整父级路径。
      for (let index = records.length - 1; index >= 0; index--) {
        const { item, link, details } = records[index];
        const matched = !!query && link.textContent.normalize('NFKC').toLowerCase().includes(query);
        const childVisible = details && [...details.querySelector('ul').children].some(child => !child.hidden);
        item.hidden = !!query && !matched && !childVisible;
        link.classList.toggle('toc-match', matched);
        if (matched) matches++;
        if (query && details) details.open = !!childVisible;
      }
      if (!query && foldedBeforeSearch) {
        foldedBeforeSearch.forEach((open, details) => { details.open = open; });
        foldedBeforeSearch = null;
      }
      message('toc-search-status', query ? (matches ? (matches === 1 ? 'tocMatchOne' : 'tocMatchMany') : 'tocNoMatch') : null, { count: matches });
    };
    const links = new Map([...$('toc').querySelectorAll('a')].map(link => [link.dataset.heading, link]));
    const headings = result.headings.map(heading => document.getElementById(heading.id)).filter(Boolean);
    let activeLink = null;
    revealActiveHeading = () => {
      if (!activeLink || document.body.classList.contains('sidebar-hidden') || $('toc-search').value.trim()) return;
      if (!activeLink.getClientRects().length) return;
      const sidebar = $('sidebar'), bounds = sidebar.getBoundingClientRect(), linkBounds = activeLink.getBoundingClientRect();
      const top = bounds.top + 16, bottom = bounds.top + sidebar.clientHeight - 16;
      // 只滚动侧栏，让当前章节进入可见范围，避免 scrollIntoView 连带滚动正文。
      if (linkBounds.top < top || linkBounds.height > bottom - top) sidebar.scrollTop += linkBounds.top - top;
      else if (linkBounds.bottom > bottom) sidebar.scrollTop += linkBounds.bottom - bottom;
    };
    updateActiveHeading = () => {
      if (!headings.length) return;
      // 二分查找最后一个经过阅读线的标题，长章节内和反向滚动时也保持稳定。
      let low = 0, high = headings.length - 1, index = 0;
      while (low <= high) {
        const middle = (low + high) >> 1;
        if (headings[middle].getBoundingClientRect().top <= 32) { index = middle; low = middle + 1; }
        else high = middle - 1;
      }
      const scrolling = document.scrollingElement;
      if (scrolling && scrolling.scrollHeight > scrolling.clientHeight && scrolling.scrollTop + scrolling.clientHeight >= scrolling.scrollHeight - 2) index = headings.length - 1;
      const link = links.get(headings[index].id);
      if (!link || link === activeLink) return;
      activeLink?.removeAttribute('aria-current');
      link.setAttribute('aria-current', 'location');
      activeLink = link;
      // 仅在章节切换时展开父目录，用户在当前章节内仍可手动折叠。
      let parent = $('toc-search').value.trim() ? null : link.parentElement.closest('details');
      while (parent) {
        parent.open = true;
        parent = parent.parentElement.closest('details');
      }
      revealActiveHeading();
    };
    window.scrollTo(0, 0);
    try { if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch {}
    scheduleHeadingUpdate();
    restorePosition(identity, version, navigation);
  }
  async function readFile(input, button = null) {
    if (!input) return;
    const request = ++generation;
    if (!isMarkdown(input)) { message('status', 'invalidMarkdown'); return; }
    try {
      const file = input.handle ? await input.handle.getFile() : input.file ?? input;
      const text = await file.text();
      if (request !== generation) return;
      let result;
      try { result = renderMarkdown(text, chrome.runtime.getURL('')); }
      catch { message('status', 'renderCurrentFailed'); return; }
      history.replaceState(null, '', location.href.split('#')[0]);
      const path = input.path ?? file.name;
      show(text, path, chrome.runtime.getURL(''), result, (button ? 'folder-content:' : 'file-content:') + path + '\u0000' + text);
      currentDocument = { name: file.name, source: text, handle: input.handle ?? null };
      markActiveFile(button);
      message('status', 'fileOpened', { path });
      if (button && innerWidth < 760) setSidebar(true);
      if (!button && fileEntries.length) {
        const current = currentDocument, folderRequest = folderGeneration;
        try {
          const entry = await findCurrentEntry(fileEntries, directoryHandle, current);
          if (request === generation && folderRequest === folderGeneration && current === currentDocument && entry) markActiveFile(fileButtons.get(entry.path));
        } catch { /* 关联失败时保留已打开的文档。 */ }
      }
    } catch { if (request === generation) message('status', 'fileReadFailed'); }
  }
  document.addEventListener('dragover', event => { event.preventDefault(); });
  document.addEventListener('drop', event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); });
  const showWelcome = () => show(t('welcomeContent'), t('welcomeName'), location.href);
  if (local) {
    let name = location.pathname.split('/').pop();
    try { name = decodeURIComponent(name); } catch {}
    show(original, name, location.href, initialResult, 'file-url:' + location.href.split('#')[0]);
    currentDocument = { name, source: original, handle: null, url: location.href };
  } else {
    showWelcome();
  }
  window.addEventListener('markview:languagechange', () => {
    // 用户正文与目录节点保持原样，只刷新界面；欢迎页属于扩展内置内容。
    if (!local && !currentDocument) showWelcome();
    else document.title = documentName + ' · ' + t('brand');
    scheduleHeadingUpdate();
  });
  restoreFolder();
  const registerPdfMessages = async () => {
    let ownerTabId = null, printPending = false;
    if (!local) {
      try { ownerTabId = (await chrome.tabs.getCurrent())?.id; }
      catch { return; }
      if (!Number.isInteger(ownerTabId)) return;
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (sender.id !== chrome.runtime.id || !['markview:pdf:status', 'markview:pdf:export'].includes(message?.type)) return false;
      if (!local && message.tabId !== ownerTabId) return false;
      if (message.type === 'markview:pdf:status') {
        sendResponse({ canExport: !!currentDocument && !printPending, documentVersion });
        return false;
      }
      if (!currentDocument || printPending || message.documentVersion !== documentVersion) {
        sendResponse({ ok: false });
        return false;
      }
      printPending = true;
      const version = documentVersion;
      closeOpenMenu();
      // 先让弹出页收到确认并关闭，再打开正文页的打印预览，避免打印弹出页本身。
      sendResponse({ ok: true });
      setTimeout(() => {
        try {
          if (version !== documentVersion || !currentDocument) {
            message('status', 'documentChangedPrint');
            return;
          }
          window.print();
        } catch { message('status', 'printFailed'); }
        finally { printPending = false; }
      }, 100);
      return false;
    });
  };
  registerPdfMessages();
})();
