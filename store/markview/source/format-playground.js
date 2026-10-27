(() => {
  const missingSeparator = ['## 表格缺少分隔行', '', '| 编号 | 状态 |', '| 1 | 未处理 |', '| 2 | 已处理 |'].join('\n');
  const mismatchedSeparator = ['## 表头与分隔行列数不一致', '', '| 编号 | 状态 |', '| --- | :---: | ---: |', '| 1 | 未处理 |'].join('\n');
  const mismatchedRows = ['## 数据行列数异常', '', '| 编号 | 状态 |', '| --- | --- |', '| 1 | 未处理 | 多余内容 |', '| 2 |', '| 3 | 包含 \\| 和 `a|b` |'].join('\n');
  const unclosedLinks = ['## 链接与图片未闭合', '', '[查看说明](./guide.md', '', '![图片说明](./image.png'].join('\n');
  const unclosedFence = ['## 代码块未闭合', '', '```javascript', 'const message = "请在代码结束处补上围栏";'].join('\n');
  const samples = [
    { id: 'combined', name: '综合错误样例', note: '包含五类常见格式问题。试着补齐分隔行、调整列数、闭合链接和代码块。', source: ['# 格式检查试验', missingSeparator, mismatchedSeparator, mismatchedRows, unclosedLinks, unclosedFence].join('\n\n') },
    { id: 'normal', name: '正常格式', note: '正常表格、链接和代码块，应不显示格式提示。', source: ['# 正常格式', '', '| 编号 | 状态 |', '| --- | --- |', '| 1 | 已处理 |', '| 2 | 包含 \\| 和 `a|b` |', '', '[返回页面顶部](#playground-top)', '', '```javascript', 'const message = "代码块已闭合";', '```'].join('\n') },
    { id: 'separator', name: '表格缺少分隔行', note: '表头下方缺少分隔行，连续数据行只提示一次。', source: missingSeparator },
    { id: 'columns', name: '表头与分隔行列数不一致', note: '表头两列，分隔行三列，应提示列数不一致。', source: mismatchedSeparator },
    { id: 'rows', name: '数据行多列／少列', note: '多列时提示内容可能被忽略；少列时仅作提醒，有意留空可忽略。', source: mismatchedRows },
    { id: 'links', name: '链接／图片未闭合', note: '检查已写出 ]( 的链接与图片，给出行号和完整写法。', source: unclosedLinks },
    { id: 'fence', name: '代码块未闭合', note: '在末尾另起一行补上 ```，观察提示是否消失。', source: unclosedFence },
    { id: 'escaped', name: '代码与转义文本（正常）', note: '代码示例、转义标记、跨行链接和地址中的括号，应不误报。', source: ['# 代码与转义文本', '', '`[示例](未闭合`', '', '``![图片](未闭合``', '', '\\[普通文字](这不是链接', '', '[跨行链接](#playground-top', '  "返回页面顶部")', '', '[括号地址](./notes(v2).md)', '', '```markdown', '[代码中的链接](未闭合', '| 编号 | 状态 |', '| 1 | 未处理 |', '```'].join('\n') }
  ];
  const $ = id => document.getElementById(id);
  const source = $('source'), preview = $('article'), panel = $('format-check'), selector = $('sample');
  const status = $('playground-status'), numbers = $('line-numbers');
  let timer = 0, composing = false;
  for (const sample of samples) {
    const option = document.createElement('option');
    option.value = sample.id;
    option.textContent = sample.name;
    selector.append(option);
  }
  const currentSample = () => samples.find(sample => sample.id === selector.value);
  const updateNumbers = () => {
    const count = source.value.split('\n').length;
    numbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join('\n');
    numbers.scrollTop = source.scrollTop;
    return count;
  };
  const render = () => {
    clearTimeout(timer);
    const count = updateNumbers();
    try {
      const result = globalThis.renderMarkdown(source.value, location.href);
      preview.innerHTML = result.html;
      globalThis.MarkViewFormatDiagnostics.render(panel, result.diagnostics);
      // 试验页直接展开结果，便于边修改边对照行号；不改变阅读页的默认收起行为。
      panel.open = result.diagnostics.length > 0;
      status.textContent = `${count} 行 · ${result.diagnostics.length ? `发现 ${result.diagnostics.length} 处疑似问题` : '未发现当前检查范围内的问题'}`;
    } catch {
      preview.replaceChildren();
      panel.hidden = true;
      panel.querySelector('ol').replaceChildren();
      status.textContent = '预览失败，输入内容已保留，请检查页面脚本是否完整。';
    }
  };
  const loadSample = () => {
    const sample = currentSample();
    source.value = sample.source;
    source.scrollTop = 0;
    source.scrollLeft = 0;
    $('sample-note').textContent = sample.note;
    render();
  };
  selector.addEventListener('change', loadSample);
  $('reset-sample').addEventListener('click', loadSample);
  $('theme').addEventListener('change', event => { document.documentElement.dataset.theme = event.target.value; });
  source.addEventListener('scroll', () => { numbers.scrollTop = source.scrollTop; }, { passive: true });
  const queueRender = () => { clearTimeout(timer); timer = setTimeout(render, 180); };
  source.addEventListener('input', event => { if (!composing && !event.isComposing) queueRender(); });
  source.addEventListener('compositionstart', () => { composing = true; clearTimeout(timer); });
  source.addEventListener('compositionend', () => { composing = false; queueRender(); });
  $('download-sample').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([source.value], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `markview-format-${currentSample().id}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  loadSample();
})();