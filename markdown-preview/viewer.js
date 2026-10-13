(() => {
  const local = location.protocol === 'file:';
  const original = local ? (document.querySelector('body > pre')?.textContent ?? document.body.textContent) : '';
  let initialResult;
  if (local) {
    try { initialResult = renderMarkdown(original, location.href); }
    catch {
      const status = document.createElement('p');
      status.setAttribute('role', 'alert');
      status.textContent = 'Markdown 渲染失败，已保留原文。';
      document.body.prepend(status);
      return;
    }
  }
  document.documentElement.lang = 'zh-CN';
  document.body.replaceChildren();
  document.body.innerHTML = `
    <a class="skip-link" href="#main">跳到正文</a>
    <button id="restore" aria-label="展开目录" aria-controls="sidebar" aria-expanded="false" title="展开目录">›</button>
    <aside id="sidebar" aria-label="文件与标题目录">
      <div class="sidebar-heading"><div class="sidebar-actions">
        <details id="open-menu"><summary title="打开文件或文件夹"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8V5.5A1.5 1.5 0 0 1 4.5 4H9l2 3h8.5A1.5 1.5 0 0 1 21 8.5V10M3 8h6l2 3h11l-3 9H3z"/></svg><span class="control-label">打开</span><svg class="open-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="open-options">
          <button id="open-file" type="button">打开文件</button>
          <button id="open-folder" type="button">打开文件夹</button>
          <button id="forget-folder" type="button" hidden>忘记文件夹</button>
        </div></details>
        <button id="toggle" aria-controls="sidebar" aria-expanded="true">收起目录</button>
      </div></div>
      <input id="file-input" type="file" accept=".md,.markdown,.mdown" hidden>
      <div class="sidebar-views" role="group" aria-label="目录视图">
        <button id="view-chapters" type="button" aria-pressed="true" aria-controls="chapters-section"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg><span class="control-label">章节</span></button>
        <button id="view-files" type="button" aria-pressed="false" aria-controls="files-section"><svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v14M4 7h5M4 17h5"/><rect x="9" y="4" width="11" height="6" rx="1.5"/><rect x="9" y="14" width="11" height="6" rx="1.5"/></svg><span class="control-label">文件</span></button>
      </div>
      <div id="files-section" hidden>
        <button id="resume-folder" type="button" hidden>继续读取文件夹</button>
        <button id="folder-fallback" type="button" hidden>兼容方式选择文件夹</button>
        <input id="folder-input" type="file" webkitdirectory hidden>
        <p id="files-hint">通过“打开”选择文件夹，即可浏览 Markdown 文件树。</p>
        <p id="folder-name"></p>
        <nav id="files" aria-label="Markdown 文件"></nav>
      </div>
      <div id="chapters-section">
        <input id="toc-search" type="search" placeholder="搜索目录" aria-label="搜索目录标题" aria-controls="toc" autocomplete="off">
        <p id="toc-search-status" role="status"></p>
        <nav id="toc" aria-label="文档章节"></nav>
      </div>
    </aside>
    <div id="sidebar-resizer" role="separator" tabindex="0" aria-label="调整目录宽度" aria-orientation="vertical" aria-controls="sidebar" title="拖动调整目录宽度，双击恢复默认；方向键微调，Enter 恢复默认"></div>
    <main id="main" tabindex="-1"><div id="status" role="status"></div><article class="markdown-body" id="article"></article></main>`;
  const $ = id => document.getElementById(id);
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
  let positionKey = null, positionReady = false, positionDirty = false, positionTimer = 0;
  let documentVersion = 0, navigationVersion = 0;
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
      const [saved] = await Promise.all([chrome.runtime.sendMessage({ type: 'reading-position:get', key }), widthReady, sidebarReady]);
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
      if (error.name !== 'AbortError') $('status').textContent = '文件选择不可用，请拖入 Markdown 文件阅读。';
    }
  });
  $('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    readFile(file);
  });
  let activeFile = null, currentDocument = null, directoryHandle = null, rememberedFolder = null, folderGeneration = 0;
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
      $('files-hint').textContent = '所选文件夹中没有 Markdown 文件（.md / .markdown / .mdown）。';
      return false;
    }
    directoryHandle = handle;
    fileEntries = entries;
    fileButtons = buttons;
    markActiveFile(null);
    $('files').replaceChildren(fragment);
    $('folder-name').textContent = root.name + ' · ' + entries.length + ' 个文档';
    $('files-hint').textContent = '点击文件切换文档。';
    const current = currentDocument;
    try {
      const entry = await findCurrentEntry(entries, handle, current);
      if (request === folderGeneration && current === currentDocument && entry) markActiveFile(buttons.get(entry.path));
    } catch { /* 当前文档未能关联时仍可从文件树选择，不影响正文。 */ }
    return true;
  };
  const loadDirectory = async (handle, request) => {
    $('files-hint').textContent = '正在读取文件目录…';
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
        $('folder-name').textContent = handle.name;
        $('files-hint').textContent = '已记住文件夹，点击“继续读取”恢复访问。';
        $('resume-folder').hidden = false;
      }
    } catch {
      if (request === folderGeneration && rememberedFolder) {
        $('files-hint').textContent = '文件夹暂时不可读，可继续读取或通过“打开”重新选择。';
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
      if (permission !== 'granted') { $('files-hint').textContent = '尚未获得读取权限，可再次继续读取。'; return; }
      generation++;
      if (await loadDirectory(rememberedFolder, request) && request === folderGeneration) $('resume-folder').hidden = true;
    } catch { if (request === folderGeneration) $('files-hint').textContent = '文件夹读取失败，请通过“打开”重新选择。'; }
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
    $('folder-name').textContent = '';
    $('resume-folder').hidden = $('forget-folder').hidden = true;
    $('files-hint').textContent = '通过“打开”选择文件夹，即可浏览 Markdown 文件树。';
    try { await saveFolder(null); }
    catch { if (request === folderGeneration) { $('files-hint').textContent = '文件夹记忆清除失败，请重试“忘记文件夹”。'; $('forget-folder').hidden = false; } }
  });
  // 仅枚举已授权目录，正文按需读取；不请求写权限，不自动使用“上传”方式回退。
  $('open-folder').addEventListener('click', async () => {
    closeOpenMenu();
    setView('files');
    if (typeof window.showDirectoryPicker !== 'function') {
      $('files-hint').textContent = '当前浏览器不支持只读目录选择。可使用兼容方式，Chrome 会显示“上传”确认，但文件仅在本地处理。';
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
      catch { if (request === folderGeneration) $('files-hint').textContent = '本次可正常阅读，但浏览器未能保存文件夹记忆。'; }
    } catch (error) {
      if (request !== folderGeneration) return;
      if (error.name === 'AbortError') return;
      $('files-hint').textContent = error.name === 'SecurityError'
        ? '当前页面不允许只读目录访问，请点击扩展图标进入预览页后再试。也可使用下方兼容方式。'
        : '目录读取失败，请重新选择文件夹。原文档和文件树已保留。';
      $('folder-fallback').hidden = false;
    }
  });
  $('folder-fallback').addEventListener('click', () => {
    if (!('webkitdirectory' in $('folder-input'))) { $('files-hint').textContent = '当前浏览器不支持文件夹选择。'; return; }
    $('files-hint').textContent = '兼容方式会显示 Chrome 的“上传”确认；文件只交给当前页面处理，不发送到服务器。';
    $('folder-input').click();
  });
  $('folder-input').addEventListener('change', event => {
    const markdown = Array.from(event.target.files).filter(isMarkdown);
    event.target.value = '';
    if (!markdown.length) { $('files-hint').textContent = '所选文件夹中没有 Markdown 文件。'; return; }
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
    $('article').querySelectorAll('pre > code').forEach(code => {
      const pre = code.parentElement, block = document.createElement('div'), button = document.createElement('button');
      block.className = 'code-block';
      button.className = 'copy-code';
      button.type = 'button';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');
      button.setAttribute('aria-live', 'polite');
      pre.before(block);
      block.append(pre, button);
      let resetTimer;
      button.addEventListener('click', async () => {
        clearTimeout(resetTimer);
        copyTimers.delete(resetTimer);
        button.disabled = true;
        button.textContent = '复制中…';
        button.dataset.feedback = 'pending';
        try {
          // 只复制代码文本，避免把高亮标签和按钮文案带入剪贴板。
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = '已复制';
          button.setAttribute('aria-label', '代码已复制');
        } catch {
          button.textContent = '复制失败';
          button.setAttribute('aria-label', '复制失败，请重试或手动选择代码复制');
        } finally {
          button.disabled = false;
          if (!button.isConnected) return;
          button.dataset.feedback = 'done';
          resetTimer = setTimeout(() => {
            button.textContent = '复制';
            button.setAttribute('aria-label', '复制代码');
            delete button.dataset.feedback;
            copyTimers.delete(resetTimer);
          }, 2000);
          copyTimers.add(resetTimer);
        }
      });
    });
    document.title = name + ' · 墨览 · MarkView';
    $('toc').replaceChildren();
    $('toc-search').value = '';
    $('toc-search').disabled = !result.headings.length;
    $('toc-search-status').textContent = '';
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
    if (!result.headings.length) $('toc').textContent = '暂无标题';
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
      $('toc-search-status').textContent = query ? (matches ? `找到 ${matches} 个标题` : '没有匹配的标题') : '';
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
    if (!isMarkdown(input)) { $('status').textContent = '请选择 Markdown 文件（.md / .markdown / .mdown）。'; return; }
    try {
      const file = input.handle ? await input.handle.getFile() : input.file ?? input;
      const text = await file.text();
      if (request !== generation) return;
      let result;
      try { result = renderMarkdown(text, chrome.runtime.getURL('')); }
      catch { $('status').textContent = 'Markdown 渲染失败，已保留当前文档。'; return; }
      history.replaceState(null, '', location.href.split('#')[0]);
      const path = input.path ?? file.name;
      show(text, path, chrome.runtime.getURL(''), result, (button ? 'folder-content:' : 'file-content:') + path + '\u0000' + text);
      currentDocument = { name: file.name, source: text, handle: input.handle ?? null };
      markActiveFile(button);
      $('status').textContent = '已打开：' + path + '。相对路径图片请通过 Chrome 直接打开原始 .md 文件查看。';
      if (button && innerWidth < 760) setSidebar(true);
      if (!button && fileEntries.length) {
        const current = currentDocument, folderRequest = folderGeneration;
        try {
          const entry = await findCurrentEntry(fileEntries, directoryHandle, current);
          if (request === generation && folderRequest === folderGeneration && current === currentDocument && entry) markActiveFile(fileButtons.get(entry.path));
        } catch { /* 关联失败时保留已打开的文档。 */ }
      }
    } catch { if (request === generation) $('status').textContent = '文件读取失败，请重新选择文件。'; }
  }
  document.addEventListener('dragover', event => { event.preventDefault(); });
  document.addEventListener('drop', event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); });
  if (local) {
    let name = location.pathname.split('/').pop();
    try { name = decodeURIComponent(name); } catch {}
    show(original, name, location.href, initialResult, 'file-url:' + location.href.split('#')[0]);
    currentDocument = { name, source: original, handle: null, url: location.href };
  } else {
    show('# 墨览 · MarkView\n\n点击侧栏的 **打开**，选择 **打开文件** 或 **打开文件夹**。也可拖入 Markdown，或在 Chrome 中直接打开本地 `.md` 文件。\n\n## 本地文件自动预览\n\n在 Chrome 扩展详情中开启 **允许访问文件网址**，然后在 Chrome 中打开 `.md` 文件。\n\n## 阅读操作\n\n- 点击 **章节** 查看当前文档标题并跳转章节\n- 打开文件夹后，点击 **文件** 浏览 Markdown 文件树并切换文档\n- 文件夹自动记住，刷新后尝试恢复；权限失效时点击 **继续读取文件夹**\n- 通过 **打开 → 忘记文件夹** 清除目录记忆\n- 只读模式每次点击文档会读取最新内容\n\n## 支持内容\n\n表格、代码块、任务列表、引用、图片和链接。原始 HTML 按文本显示。', '欢迎使用', location.href);
  }
  restoreFolder();
})();
