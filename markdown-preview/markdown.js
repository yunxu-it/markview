/* 轻量 Markdown 渲染：原始 HTML 按文本显示，不执行文档中的脚本。 */
globalThis.renderMarkdown = function (source, baseURL) {
  const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeURL = value => {
    try {
      const url = new URL(value, baseURL);
      return ['http:', 'https:', 'file:', 'mailto:'].includes(url.protocol) ? escape(url.href) : '';
    } catch { return ''; }
  };
  const inline = text => {
    const tokens = [];
    const token = html => `\u0000${tokens.push(html) - 1}\u0000`;
    text = text.replace(/\u0000/g, '').replace(/`([^`]+)`/g, (_, code) => token(`<code>${escape(code)}</code>`));
    // 按括号深度读取目标地址，避免路径中的括号提前结束链接。
    let linked = '', consumed = 0;
    for (const match of text.matchAll(/(!?)\[([^\]]*)\]\(/g)) {
      const [prefix, image, label] = match, offset = match.index;
      if (offset < consumed) continue;
      let end = offset + prefix.length, depth = 1;
      for (; end < text.length && depth; end++) {
        if (text[end] === '\\') { end++; continue; }
        if (text[end] === '"' && /\s/.test(text[end - 1])) {
          const titleEnd = text.indexOf('"', end + 1);
          if (titleEnd !== -1) { end = titleEnd; continue; }
        }
        if (text[end] === '(') depth++;
        if (text[end] === ')') depth--;
      }
      if (depth) continue;
      const destination = text.slice(offset + prefix.length, end - 1).match(/^([^\s]+?)(?:\s+"[^"]*")?$/);
      if (!destination) continue;
      const target = destination[1].replace(/\\([()\\])/g, '$1');
      const href = target.startsWith('#') ? escape(target) : safeURL(target);
      const html = !href ? escape(label) : image ? `<img src="${href}" alt="${escape(label)}" loading="lazy">` : `<a href="${href}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)}</a>`;
      linked += text.slice(consumed, offset) + token(html);
      consumed = end;
    }
    text = linked + text.slice(consumed);
    text = escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  };
  // 基础词法着色，先转义再输出，避免代码内容成为可执行 HTML。
  const highlight = code => code.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\b(?:const|let|var|function|return|if|else|class|new|import|from|export|async|await|true|false|null|def|val|fun|public|private|void)\b|\b\d+(?:\.\d+)?\b)/g).map((part, index) => {
    if (index % 2 === 0) return escape(part);
    const kind = /^['"]/.test(part) ? 'string' : /^\/\//.test(part) ? 'comment' : /^\d/.test(part) ? 'number' : 'keyword';
    return '<span class="syntax-' + kind + '">' + escape(part) + '</span>';
  }).join('');
  const headings = [];
  const used = new Map(['toggle', 'restore', 'sidebar', 'toc', 'main', 'status', 'article', 'open-file', 'file-input', 'sidebar-resizer', 'toc-search', 'toc-search-status'].map(id => [id, true]));
  const heading = (level, text) => {
    const plain = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`~]/g, '');
    const slug = plain.toLowerCase().trim().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-') || 'section';
    let id = slug, suffix = 0;
    while (used.has(id)) id = `${slug}-${++suffix}`;
    used.set(id, true);
    headings.push({ level, text: plain, id });
    return `<h${level} id="${escape(id)}">${inline(text)}</h${level}>`;
  };
  // 只在代码片段之外分列，同时保留转义竖线作为单元格内容。
  const cells = line => {
    const values = [], text = line.trim();
    let cell = '';
    for (let index = 0; index < text.length; index++) {
      if (text[index] === '\\' && index + 1 < text.length) {
        cell += text[index + 1] === '|' ? '|' : text[index] + text[index + 1];
        index++; continue;
      }
      if (text[index] === '`') {
        const run = text.slice(index).match(/^`+/)[0];
        let end = index + run.length;
        while ((end = text.indexOf(run, end)) !== -1) {
          if (text[end - 1] !== '`' && text[end + run.length] !== '`') break;
          end += run.length;
        }
        if (end !== -1) {
          cell += text.slice(index, end + run.length);
          index = end + run.length - 1; continue;
        }
      }
      if (text[index] === '|') { values.push(cell.trim()); cell = ''; }
      else cell += text[index];
    }
    values.push(cell.trim());
    if (text.startsWith('|')) values.shift();
    if (text.endsWith('|') && values.at(-1) === '') values.pop();
    return values.length ? values : [''];
  };
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  function blocks(lines) {
    let html = '', i = 0;
    const special = line => /^\s*$|^ {0,3}(#{1,6}\s|`{3,}|~{3,}|>|[-+*]\s|\d+[.)]\s)|^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line);
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        const code = [];
        i++;
        while (i < lines.length && !new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[i])) code.push(lines[i++]);
        i++;
        html += `<pre><code data-language="${escape(fence[2].trim())}">${fence[2].trim() ? highlight(code.join('\n')) : escape(code.join('\n'))}</code></pre>`;
        continue;
      }
      const title = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (title) { html += heading(title[1].length, title[2]); i++; continue; }
      if (i + 1 < lines.length && /^ {0,3}(=+|-+)\s*$/.test(lines[i + 1])) {
        html += heading(lines[i + 1].trim()[0] === '=' ? 1 : 2, line); i += 2; continue;
      }
      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      if (/^ {0,3}>/.test(line)) {
        const quote = [];
        while (i < lines.length && /^ {0,3}>/.test(lines[i])) quote.push(lines[i++].replace(/^ {0,3}> ?/, ''));
        html += `<blockquote>${blocks(quote)}</blockquote>`; continue;
      }
      if (i + 1 < lines.length && line.includes('|') && cells(lines[i + 1]).every(cell => /^:?-{3,}:?$/.test(cell))) {
        const headers = cells(line), alignment = cells(lines[i + 1]);
        const row = (values, tag) => '<tr>' + headers.map((_, n) => `<${tag} class="align-${alignment[n]?.endsWith(':') ? (alignment[n].startsWith(':') ? 'center' : 'right') : 'left'}">${inline(values[n] || '')}</${tag}>`).join('') + '</tr>';
        html += '<div class="table-scroll"><table><thead>' + row(headers, 'th') + '</thead><tbody>'; i += 2;
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) html += row(cells(lines[i++]), 'td');
        html += '</tbody></table></div>'; continue;
      }
      const list = line.match(/^( *)([-+*]|\d+[.)])\s+(.*)$/);
      if (list) {
        const ordered = /^\d/.test(list[2]), tag = ordered ? 'ol' : 'ul', indent = list[1].length;
        html += `<${tag}${ordered ? ` start="${parseInt(list[2], 10)}"` : ''}>`;
        while (i < lines.length) {
          const item = lines[i].match(/^( *)([-+*]|\d+[.)])\s+(.*)$/);
          if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
          let body = item[3]; i++;
          const nested = [];
          while (i < lines.length && lines[i].trim() && /^\s/.test(lines[i]) && (lines[i].match(/^ */)[0].length > indent)) nested.push(lines[i++].slice(Math.min(indent + 2, lines[i - 1].match(/^ */)[0].length)));
          const task = body.match(/^\[([ xX])\]\s+(.*)$/);
          html += `<li${task ? ' class="task"' : ''}>${task ? `<input type="checkbox" disabled ${task[1] !== ' ' ? 'checked' : ''}> ${inline(task[2])}` : inline(body)}${nested.length ? blocks(nested) : ''}</li>`;
        }
        html += `</${tag}>`; continue;
      }
      const paragraph = [line]; i++;
      while (i < lines.length && !special(lines[i]) && !(i + 1 < lines.length && (/^\s*(=+|-+)\s*$/.test(lines[i + 1]) || (lines[i].includes('|') && cells(lines[i + 1]).every(cell => /^:?-{3,}:?$/.test(cell)))))) paragraph.push(lines[i++]);
      html += `<p>${paragraph.map(inline).join('\n')}</p>`;
    }
    return html;
  }
  return { html: blocks(lines), headings };
};