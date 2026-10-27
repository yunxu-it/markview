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
  const languageGroups = {
    clike: 'js javascript jsx ts typescript tsx kotlin kt kts java c h cpp c++ cc cxx csharp c# cs go golang rust rs swift',
    powershell: 'powershell ps ps1 pwsh', shell: 'bash sh shell zsh', python: 'python py',
    json: 'json jsonc', yaml: 'yaml yml', sql: 'sql', css: 'css scss less', markup: 'html htm xml svg'
  };
  const languages = new Map(Object.entries(languageGroups).flatMap(([group, names]) => names.split(' ').map(name => [name, group])));
  const keywordGroups = {
    clike: 'as async await break case catch class const continue debugger default delete do else enum export extends false final finally for from fun function if implements import in instanceof interface internal is let namespace native new null object of open operator out override package private protected public record return sealed self static struct super suspend switch synchronized this throw throws trait true try type typeof undefined use using val var virtual void volatile when while with yield fn impl mut pub match defer guard func init nil protocol some',
    powershell: 'begin break catch class clean continue data define do dynamicparam else elseif end enum exit filter finally for foreach from function if in param process return switch throw trap try until using var while',
    shell: 'case do done elif else esac export false fi for function if in local readonly return select then true until while',
    python: 'and as assert async await break case class continue def del elif else except false finally for from global if import in is lambda match none nonlocal not or pass raise return true try while with yield',
    json: 'true false null', yaml: 'true false null yes no on off',
    sql: 'add all alter and as asc begin between by case check column commit constraint create cross database default delete desc distinct drop else end exists false foreign from full group having in index inner insert into is join key left like limit not null offset on or order outer primary references right rollback select set table then true union unique update values view when where with',
    css: 'important inherit initial unset revert'
  };
  const keywords = Object.fromEntries(Object.entries(keywordGroups).map(([group, words]) => [group, new Set(words.split(' '))]));
  const span = (kind, text) => kind ? '<span class="syntax-' + kind + '">' + escape(text) + '</span>' : escape(text);
  /**
   * 按语言分组进行轻量词法着色，字符串和注释作为整体读取，所有原文均转义输出。
   * @param {string} code 原始代码，保留空白与换行供显示和复制
   * @param {string} info 围栏中的语言说明，未知语言按纯文本显示
   * @return {string} 仅含安全 span 与转义文本的 HTML
   */
  const highlight = (code, info) => {
    const language = info.trim().toLowerCase().split(/\s+/)[0], group = languages.get(language);
    if (!group) return escape(code);
    const rules = [['space', /\s+/]];
    const comments = [];
    if (group === 'clike' || language === 'jsonc' || ['scss', 'less'].includes(language)) comments.push(/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|(?![\s\S]))/);
    if (language === 'css') comments.push(/\/\*[\s\S]*?(?:\*\/|(?![\s\S]))/);
    if (['powershell', 'shell', 'python', 'yaml'].includes(group)) comments.push(/#[^\n]*/);
    if (group === 'powershell') comments.unshift(/<#[\s\S]*?(?:#>|(?![\s\S]))/);
    if (group === 'sql') comments.push(/--[^\n]*|\/\*[\s\S]*?(?:\*\/|(?![\s\S]))/);
    if (group === 'markup') comments.push(/<!--[\s\S]*?(?:-->|(?![\s\S]))/);
    if (comments.length) rules.push(['comment', new RegExp(comments.map(pattern => pattern.source).join('|'))]);
    const strings = [];
    if (group === 'python') strings.push(/(?:[fFrRuUbB]{0,2})(?:"""[\s\S]*?(?:"""|(?![\s\S]))|'''[\s\S]*?(?:'''|(?![\s\S])))/);
    if (['kotlin', 'kt', 'kts', 'java', 'swift'].includes(language)) strings.push(/"""[\s\S]*?(?:"""|(?![\s\S]))/);
    if (group === 'powershell') {
      strings.push(/@'[\s\S]*?(?:^'@|(?![\s\S]))|@"[\s\S]*?(?:^"@|(?![\s\S]))/);
      strings.push(/'(?:''|[^'])*(?:'|(?![\s\S]))|"(?:`[\s\S]|""|[^"`])*(?:"|(?![\s\S]))/);
    } else {
      strings.push(/"(?:\\[\s\S]|[^"\\\n])*(?:"|(?=\n|$))|'(?:\\[\s\S]|[^'\\\n])*(?:'|(?=\n|$))/);
      if (group === 'clike' && ['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(language)) strings.unshift(/`(?:\\[\s\S]|[^`\\])*(?:`|(?![\s\S]))/);
    }
    rules.push(['string', new RegExp(strings.map(pattern => pattern.source).join('|'))]);
    if (group === 'markup') rules.push(['tag', /<\/?[A-Za-z][\w:.-]*/]);
    if (['powershell', 'shell'].includes(group)) rules.push(['variable', /\$(?:\{[^}\n]*\}|[A-Za-z_][\w]*(?::[A-Za-z_][\w]*)?|[0-9?@#$*!_-])/]);
    if (group === 'css') rules.push(['variable', /(?:--|\$)[A-Za-z_][\w-]*/], ['selector', /[.#][A-Za-z_][\w-]*|@[A-Za-z_][\w-]*/]);
    if (['powershell', 'shell'].includes(group)) rules.push(['attribute', /--?[A-Za-z][\w-]*/]);
    if (group === 'clike') rules.push(['attribute', /@[A-Za-z_][\w.]*/]);
    rules.push(['number', /(?:0[xX][\da-fA-F]+|0[bB][01]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[a-zA-Z%]+)?/]);
    rules.push(['identifier', group === 'markup' ? /[A-Za-z_][\w:.-]*/ : ['powershell', 'shell', 'css', 'yaml'].includes(group) ? /[A-Za-z_][\w-]*/ : /[$A-Za-z_][\w$]*/]);
    rules.push(['operator', /===|!==|=>|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\+\+|--|\*\*|[=+*\/%<>!&|^~?:-]/]);
    rules.push(['punctuation', /[{}\[\]();,.]/], ['other', /[\s\S]/]);
    // sticky 匹配保证从当前位置向前读取；兜底字符保证每轮都推进，不扫描已输出的 HTML。
    const scanner = new RegExp(rules.map(([kind, pattern]) => '(?<' + kind + '>' + pattern.source + ')').join('|'), 'gmy');
    const output = [];
    let match, previous = '', lineStart = true, insideTag = false, insideType = false;
    while ((match = scanner.exec(code))) {
      const text = match[0], offset = match.index;
      let kind = rules.find(([name]) => match.groups[name] !== undefined)[0];
      if (kind === 'space') {
        output.push(escape(text));
        if (text.includes('\n')) lineStart = true;
        continue;
      }
      if (kind === 'identifier') {
        const next = code.slice(offset + text.length), word = text.toLowerCase();
        kind = null;
        if (['json', 'yaml', 'css'].includes(group) && /^\s*:/.test(next)) kind = 'property';
        else if (keywords[group]?.has(word)) kind = 'keyword';
        else if (group === 'markup') kind = insideTag ? 'attribute' : null;
        else if (['function', 'def', 'fun', 'fn', 'func'].includes(previous) || /^\s*\(/.test(next)) kind = 'function';
        else if (['let', 'const', 'var', 'val'].includes(previous)) kind = 'variable';
        else if (group === 'powershell' && (text.includes('-') || lineStart || previous === '|' || previous === '&')) kind = 'function';
        else if (insideType) kind = 'type';
        else if (previous === '.' || (['json', 'yaml', 'css'].includes(group) || previous === '{' || previous === ',') && /^\s*:/.test(next)) kind = 'property';
        else if (/^[A-Z][\w$]*$/.test(text)) kind = 'type';
      } else if (kind === 'string' && ['json', 'yaml'].includes(group) && /^\s*:/.test(code.slice(offset + text.length))) kind = 'property';
      else if (kind === 'attribute' && group === 'powershell' && /^-(?:[ic]?(?:eq|ne|gt|ge|lt|le|match|notmatch|like|notlike|contains|notcontains|in|notin|replace|split)|and|or|not|xor|is|isnot|join|band|bor|bxor|bnot|shl|shr)$/i.test(text)) kind = 'operator';
      else if (kind === 'variable' && group === 'powershell' && /^\$(?:true|false|null)$/i.test(text)) kind = 'keyword';
      if (group === 'markup') {
        if (kind === 'tag') insideTag = true;
        else if (!insideTag && kind !== 'comment') kind = null;
        if (text === '>') insideTag = false;
      }
      if (group === 'powershell' && text === '[') insideType = true;
      if (group === 'powershell' && text === ']') insideType = false;
      if (kind === 'other') kind = null;
      if (kind === 'string' && ['powershell', 'shell'].includes(group) && (text.startsWith('"') || text.startsWith('@"'))) {
        let stringHTML = '', consumed = 0;
        for (const variable of text.matchAll(/(?<![`\\])\$(?:\{[^}\n]*\}|[A-Za-z_][\w]*(?::[A-Za-z_][\w]*)?|[0-9?@#$*!_-])/g)) {
          stringHTML += escape(text.slice(consumed, variable.index)) + span('variable', variable[0]);
          consumed = variable.index + variable[0].length;
        }
        output.push('<span class="syntax-string">' + stringHTML + escape(text.slice(consumed)) + '</span>');
      } else output.push(span(kind, text));
      if (kind !== 'comment') previous = text.toLowerCase();
      lineStart = false;
    }
    return output.join('');
  };
  const headings = [];
  const used = new Map(['toggle', 'restore', 'sidebar', 'toc', 'main', 'status', 'article', 'open-menu', 'open-file', 'file-input', 'open-folder', 'folder-input', 'folder-fallback', 'resume-folder', 'forget-folder', 'view-chapters', 'view-files', 'chapters-section', 'files-section', 'files-hint', 'folder-name', 'files', 'sidebar-resizer', 'toc-search', 'toc-search-status', 'format-check', 'format-summary', 'format-issues'].map(id => [id, true]));
  const heading = (level, text) => {
    const plain = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`~]/g, '');
    const slug = plain.toLowerCase().trim().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-') || 'section';
    let id = slug, suffix = 0;
    while (used.has(id)) id = `${slug}-${++suffix}`;
    used.set(id, true);
    headings.push({ level, text: plain, id });
    return `<h${level} id="${escape(id)}">${inline(text)}</h${level}>`;
  };
  // 读取等长反引号包围的代码片段，供表格分列和链接检查共用。
  const codeSpanEnd = (text, index) => {
    const run = text.slice(index).match(/^`+/)[0];
    let end = index + run.length;
    while ((end = text.indexOf(run, end)) !== -1) {
      if (text[end - 1] !== '`' && text[end + run.length] !== '`') return end + run.length;
      end += run.length;
    }
    return -1;
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
        const end = codeSpanEnd(text, index);
        if (end !== -1) {
          cell += text.slice(index, end);
          index = end - 1; continue;
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
  const diagnostics = [];
  const delimiter = line => cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
  /**
   * 检查已出现 ]( 的链接或图片是否完整，跳过转义、行内代码和引用式链接。
   * @param {string} text 当前正文片段，可包含同一段落中的换行
   * @param {number} startLine 片段在原文中的起始行号，从 1 开始
   * @param {string} continuation 列表项后续的普通文本，仅供当前片段的链接跨行闭合
   */
  const checkLinks = (text, startLine, continuation = '') => {
    const limit = text.length, labels = [];
    text += continuation ? '\n' + continuation : '';
    let lineNumber = startLine;
    for (let index = 0; index < limit; index++) {
      const char = text[index];
      if (char === '\n') { lineNumber++; continue; }
      if (char === '\\') { if (text[index + 1] === '\n') lineNumber++; index++; continue; }
      if (char === '`') {
        const end = codeSpanEnd(text, index);
        if (end !== -1) {
          lineNumber += text.slice(index, end).split('\n').length - 1;
          index = end - 1; continue;
        }
        index += text.slice(index).match(/^`+/)[0].length - 1;
        continue;
      }
      if (char === '[') { labels.push({ line: lineNumber, image: text[index - 1] === '!' }); continue; }
      if (char !== ']') continue;
      const label = labels.pop();
      if (!label || text[index + 1] !== '(') continue;
      let end = index + 2, depth = 1, quote = '', angle = false;
      for (; end < text.length && depth; end++) {
        const next = text[end];
        if (next === '\\') { end++; continue; }
        if (quote) { if (next === quote) quote = ''; continue; }
        if (angle) { if (next === '>') angle = false; continue; }
        // 尖括号地址与可选标题中的括号不参与目标地址的深度计算。
        if (next === '<' && /^\s*$/.test(text.slice(index + 2, end))) { angle = true; continue; }
        if ((next === '"' || next === "'") && /\s/.test(text[end - 1])) { quote = next; continue; }
        if (next === '(') depth++;
        if (next === ')') depth--;
      }
      if (depth) diagnostics.push({ type: 'unclosed-link', ...label });
      else {
        lineNumber += text.slice(index, end).split('\n').length - 1;
        index = end - 1;
      }
    }
  };
  /**
   * 仅对正文中连续、列数相同且带边界竖线的行提示疑似表格，减少普通文本误报。
   * @param {string[]} paragraph 已排除围栏代码和标准表格的段落行
   * @param {number} startLine 段落在原文中的起始行号，从 1 开始
   */
  const checkParagraph = (paragraph, startLine) => {
    const columns = line => /^ {4}|^\t/.test(line) || !/^\s*\||\|\s*$/.test(line) ? 0 : cells(line).length;
    for (let index = 0; index + 1 < paragraph.length; index++) {
      const count = columns(paragraph[index]);
      if (count < 2 || columns(paragraph[index + 1]) !== count || delimiter(paragraph[index]) || delimiter(paragraph[index + 1])) continue;
      diagnostics.push({ type: 'table-separator', line: startLine + index, columns: count });
      // 一组疑似表格只提示一次，不把每行数据都当成新表头。
      while (index + 1 < paragraph.length && columns(paragraph[index + 1]) >= 2) index++;
    }
  };
  function blocks(lines, startLine = 1) {
    let html = '', i = 0;
    const special = line => /^\s*$|^ {0,3}(#{1,6}\s|`{3,}|~{3,}|>|[-+*]\s|\d+[.)]\s)|^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line);
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        const code = [], openingLine = startLine + i;
        i++;
        while (i < lines.length && !new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[i])) code.push(lines[i++]);
        if (i === lines.length) diagnostics.push({ type: 'unclosed-fence', line: openingLine, fence: fence[1] });
        i++;
        html += `<pre><code data-language="${escape(fence[2].trim())}">${highlight(code.join('\n'), fence[2])}</code></pre>`;
        continue;
      }
      const title = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (title) { checkLinks(title[2], startLine + i); html += heading(title[1].length, title[2]); i++; continue; }
      if (i + 1 < lines.length && /^ {0,3}(=+|-+)\s*$/.test(lines[i + 1])) {
        checkLinks(line, startLine + i);
        html += heading(lines[i + 1].trim()[0] === '=' ? 1 : 2, line); i += 2; continue;
      }
      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      if (/^ {0,3}>/.test(line)) {
        const quote = [], quoteLine = startLine + i;
        while (i < lines.length && /^ {0,3}>/.test(lines[i])) quote.push(lines[i++].replace(/^ {0,3}> ?/, ''));
        html += `<blockquote>${blocks(quote, quoteLine)}</blockquote>`; continue;
      }
      if (i + 1 < lines.length && line.includes('|') && delimiter(lines[i + 1])) {
        const headers = cells(line), alignment = cells(lines[i + 1]);
        checkLinks(line, startLine + i);
        if (headers.length !== alignment.length) diagnostics.push({ type: 'table-columns', line: startLine + i + 1, columns: headers.length, actual: alignment.length });
        const row = (values, tag) => '<tr>' + headers.map((_, n) => `<${tag} class="align-${alignment[n]?.endsWith(':') ? (alignment[n].startsWith(':') ? 'center' : 'right') : 'left'}">${inline(values[n] || '')}</${tag}>`).join('') + '</tr>';
        html += '<div class="table-scroll"><table><thead>' + row(headers, 'th') + '</thead><tbody>'; i += 2;
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
          const values = cells(lines[i]);
          if (values.length !== headers.length) diagnostics.push({ type: 'table-row', line: startLine + i, columns: headers.length, actual: values.length });
          checkLinks(lines[i], startLine + i);
          html += row(values, 'td'); i++;
        }
        html += '</tbody></table></div>'; continue;
      }
      const list = line.match(/^( *)([-+*]|\d+[.)])\s+(.*)$/);
      if (list) {
        const ordered = /^\d/.test(list[2]), tag = ordered ? 'ol' : 'ul', indent = list[1].length;
        html += `<${tag}${ordered ? ` start="${parseInt(list[2], 10)}"` : ''}>`;
        while (i < lines.length) {
          const item = lines[i].match(/^( *)([-+*]|\d+[.)])\s+(.*)$/);
          if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
          const itemLine = startLine + i;
          let body = item[3]; i++;
          const nested = [], nestedLine = startLine + i;
          while (i < lines.length && lines[i].trim() && /^\s/.test(lines[i]) && (lines[i].match(/^ */)[0].length > indent)) nested.push(lines[i++].slice(Math.min(indent + 2, lines[i - 1].match(/^ */)[0].length)));
          const nextBlock = nested.findIndex(special);
          checkLinks(body, itemLine, nested.slice(0, nextBlock < 0 ? nested.length : nextBlock).join('\n'));
          const task = body.match(/^\[([ xX])\]\s+(.*)$/);
          html += `<li${task ? ' class="task"' : ''}>${task ? `<input type="checkbox" disabled ${task[1] !== ' ' ? 'checked' : ''}> ${inline(task[2])}` : inline(body)}${nested.length ? blocks(nested, nestedLine) : ''}</li>`;
        }
        html += `</${tag}>`; continue;
      }
      const paragraph = [line], paragraphLine = startLine + i; i++;
      while (i < lines.length && !special(lines[i]) && !(i + 1 < lines.length && (/^\s*(=+|-+)\s*$/.test(lines[i + 1]) || (lines[i].includes('|') && delimiter(lines[i + 1]))))) paragraph.push(lines[i++]);
      checkParagraph(paragraph, paragraphLine);
      if (!/^ {4}|^\t/.test(paragraph[0])) checkLinks(paragraph.join('\n'), paragraphLine);
      html += `<p>${paragraph.map(inline).join('\n')}</p>`;
    }
    return html;
  }
  return { html: blocks(lines), headings, diagnostics };
};