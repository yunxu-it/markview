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
    <button id="restore" aria-label="展开目录" aria-controls="sidebar" aria-expanded="false" title="展开目录">›</button>
    <aside id="sidebar" aria-label="标题目录">
      <div class="sidebar-heading"><strong>目录</strong><div class="sidebar-actions">
        <button id="open-file" type="button" aria-label="选择文件" title="选择文件"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v3M3 8h6l2 3h11l-3 9H3z"/></svg></button>
        <button id="toggle" aria-controls="sidebar" aria-expanded="true">收起目录</button>
      </div></div>
      <input id="file-input" type="file" accept=".md,.markdown,.mdown" hidden>
      <input id="toc-search" type="search" placeholder="搜索目录" aria-label="搜索目录标题" aria-controls="toc" autocomplete="off">
      <p id="toc-search-status" role="status"></p>
      <nav id="toc" aria-label="文档章节"></nav>
    </aside>
    <div id="sidebar-resizer" role="separator" tabindex="0" aria-label="调整目录宽度" aria-orientation="vertical" aria-controls="sidebar" title="拖动调整目录宽度，双击恢复默认；方向键微调，Enter 恢复默认"></div>
    <main id="main"><div id="status" role="status"></div><article class="markdown-body" id="article"></article></main>`;
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
  $('open-file').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    readFile(file);
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
  async function readFile(file) {
    if (!file) return;
    const request = ++generation;
    if (!/\.(md|markdown|mdown)$/i.test(file.name)) { $('status').textContent = '请选择 Markdown 文件（.md / .markdown / .mdown）。'; return; }
    try {
      const text = await file.text();
      if (request !== generation) return;
      let result;
      try { result = renderMarkdown(text, chrome.runtime.getURL('')); }
      catch { $('status').textContent = 'Markdown 渲染失败，已保留当前文档。'; return; }
      history.replaceState(null, '', location.href.split('#')[0]);
      show(text, file.name, chrome.runtime.getURL(''), result, 'file-content:' + file.name + '\u0000' + text);
      $('status').textContent = '已打开本地文件。相对路径图片请通过 Chrome 直接打开原始 .md 文件查看。';
    } catch { if (request === generation) $('status').textContent = '文件读取失败，请重新选择文件。'; }
  }
  document.addEventListener('dragover', event => { event.preventDefault(); });
  document.addEventListener('drop', event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); });
  if (local) {
    let name = location.pathname.split('/').pop();
    try { name = decodeURIComponent(name); } catch {}
    show(original, name, location.href, initialResult, 'file-url:' + location.href.split('#')[0]);
  } else {
    show('# 墨览 · MarkView\n\n将 Markdown 文件拖到此页面，或在 Chrome 中直接打开本地 `.md` 文件。\n\n## 本地文件自动预览\n\n在 Chrome 扩展详情中开启 **允许访问文件网址**，然后在 Chrome 中打开 `.md` 文件。\n\n## 阅读操作\n\n- 点击目录标题跳转到对应章节\n- 点击标题前的箭头展开或收起子目录\n- 点击目录区的按钮收起整个侧栏\n\n## 支持内容\n\n表格、代码块、任务列表、引用、图片和链接。原始 HTML 按文本显示。', '欢迎使用', location.href);
  }
})();
