(() => {
  const local = location.protocol === 'file:';
  const original = local ? (document.querySelector('body > pre')?.textContent ?? document.body.textContent) : '';
  document.documentElement.lang = 'zh-CN';
  document.body.replaceChildren();
  document.body.innerHTML = `
    <button id="restore" aria-label="展开目录" aria-controls="sidebar" aria-expanded="false" title="展开目录">›</button>
    <aside id="sidebar" aria-label="标题目录">
      <div class="sidebar-heading"><strong>目录</strong><button id="toggle" aria-controls="sidebar" aria-expanded="true">收起目录</button></div>
      <nav id="toc" aria-label="文档章节"></nav>
    </aside>
    <main id="main"><div id="status" role="status"></div><article class="markdown-body" id="article"></article></main>`;
  const $ = id => document.getElementById(id);
  let observer;
  let generation = 0;
  const setSidebar = hidden => {
    document.body.classList.toggle('sidebar-hidden', hidden);
    $('toggle').setAttribute('aria-expanded', String(!hidden));
    if (hidden) $('restore').focus();
    else $('toggle').focus();
  };
  $('toggle').addEventListener('click', () => setSidebar(!document.body.classList.contains('sidebar-hidden')));
  $('restore').addEventListener('click', () => setSidebar(false));
  function show(source, name, baseURL) {
    observer?.disconnect();
    const result = renderMarkdown(source, baseURL);
    $('article').innerHTML = result.html;
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
    observer = new IntersectionObserver(entries => {
      const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!active) return;
      links.forEach(link => link.removeAttribute('aria-current'));
      links.get(active.target.id)?.setAttribute('aria-current', 'location');
    }, { rootMargin: '0px 0px -65% 0px' });
    result.headings.forEach(heading => observer.observe(document.getElementById(heading.id)));
    window.scrollTo(0, 0);
    try { if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch {}
  }
  async function readFile(file) {
    if (!file) return;
    const request = ++generation;
    if (!/\.(md|markdown|mdown)$/i.test(file.name)) { $('status').textContent = '请选择 Markdown 文件（.md / .markdown / .mdown）。'; return; }
    try {
      const text = await file.text();
      if (request !== generation) return;
      show(text, file.name, chrome.runtime.getURL(''));
      $('status').textContent = '已打开本地文件。相对路径图片请通过 Chrome 直接打开原始 .md 文件查看。';
    } catch { if (request === generation) $('status').textContent = '文件读取失败，请重新选择文件。'; }
  }
  document.addEventListener('dragover', event => { event.preventDefault(); });
  document.addEventListener('drop', event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); });
  if (local) {
    let name = location.pathname.split('/').pop();
    try { name = decodeURIComponent(name); } catch {}
    show(original, name, location.href);
  } else {
    show('# 墨览 · MarkView\n\n将 Markdown 文件拖到此页面，或在 Chrome 中直接打开本地 `.md` 文件。\n\n## 本地文件自动预览\n\n在 Chrome 扩展详情中开启 **允许访问文件网址**，然后在 Chrome 中打开 `.md` 文件。\n\n## 阅读操作\n\n- 点击目录标题跳转到对应章节\n- 点击标题前的箭头展开或收起子目录\n- 点击目录区的按钮收起整个侧栏\n\n## 支持内容\n\n表格、代码块、任务列表、引用、图片和链接。原始 HTML 按文本显示。', '欢迎使用', location.href);
  }
})();
