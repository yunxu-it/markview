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
      <nav id="toc" aria-label="文档章节"></nav>
    </aside>
    <div id="sidebar-resizer" role="separator" tabindex="0" aria-label="调整目录宽度" aria-orientation="vertical" aria-controls="sidebar" title="拖动调整目录宽度，双击恢复默认；方向键微调，Enter 恢复默认"></div>
    <main id="main"><div id="status" role="status"></div><article class="markdown-body" id="article"></article></main>`;
  const $ = id => document.getElementById(id);
  let updateActiveHeading = () => {}, headingFrame = 0;
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
  let preferredWidth = null, widthChanged = false, drag = null;
  // 仅保存宽度偏好；窗口缩小时临时限制显示宽度，不覆盖用户原来的设置。
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
  if (storage) storage.get(widthKey).then(settings => {
    if (widthChanged || !Number.isFinite(settings[widthKey]) || settings[widthKey] < 200 || settings[widthKey] > 600) return;
    preferredWidth = settings[widthKey];
    applyWidth();
  }).catch(() => {});
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
  const setSidebar = hidden => {
    document.body.classList.toggle('sidebar-hidden', hidden);
    $('toggle').setAttribute('aria-expanded', String(!hidden));
    if (hidden) $('restore').focus();
    else $('toggle').focus();
  };
  $('toggle').addEventListener('click', () => setSidebar(!document.body.classList.contains('sidebar-hidden')));
  $('restore').addEventListener('click', () => setSidebar(false));
  $('open-file').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    readFile(file);
  });
  function show(source, name, baseURL, prepared) {
    const result = prepared ?? renderMarkdown(source, baseURL);
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
    const links = new Map([...$('toc').querySelectorAll('a')].map(link => [link.dataset.heading, link]));
    const headings = result.headings.map(heading => document.getElementById(heading.id)).filter(Boolean);
    let activeLink = null;
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
      let parent = link.parentElement.closest('details');
      while (parent) {
        parent.open = true;
        parent = parent.parentElement.closest('details');
      }
    };
    window.scrollTo(0, 0);
    try { if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch {}
    scheduleHeadingUpdate();
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
      show(text, file.name, chrome.runtime.getURL(''), result);
      $('status').textContent = '已打开本地文件。相对路径图片请通过 Chrome 直接打开原始 .md 文件查看。';
    } catch { if (request === generation) $('status').textContent = '文件读取失败，请重新选择文件。'; }
  }
  document.addEventListener('dragover', event => { event.preventDefault(); });
  document.addEventListener('drop', event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); });
  if (local) {
    let name = location.pathname.split('/').pop();
    try { name = decodeURIComponent(name); } catch {}
    show(original, name, location.href, initialResult);
  } else {
    show('# 墨览 · MarkView\n\n将 Markdown 文件拖到此页面，或在 Chrome 中直接打开本地 `.md` 文件。\n\n## 本地文件自动预览\n\n在 Chrome 扩展详情中开启 **允许访问文件网址**，然后在 Chrome 中打开 `.md` 文件。\n\n## 阅读操作\n\n- 点击目录标题跳转到对应章节\n- 点击标题前的箭头展开或收起子目录\n- 点击目录区的按钮收起整个侧栏\n\n## 支持内容\n\n表格、代码块、任务列表、引用、图片和链接。原始 HTML 按文本显示。', '欢迎使用', location.href);
  }
})();
