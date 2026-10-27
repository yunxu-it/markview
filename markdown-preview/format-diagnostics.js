/* 阅读页与本地试验页共用格式提示；文案和示例均按纯文本写入。 */
(() => {
  /**
   * 刷新折叠面板中的格式提示，切换文档时清除旧内容并恢复收起状态。
   * @param {HTMLDetailsElement} panel 包含 summary 和 ol 的提示面板
   * @param {object[]} diagnostics Markdown 解析器返回的疑似问题列表
   */
  const render = (panel, diagnostics = []) => {
    panel.open = false;
    panel.hidden = diagnostics.length === 0;
    panel.querySelector('summary').textContent = diagnostics.length ? `格式检查：发现 ${diagnostics.length} 处疑似问题，展开查看` : '';
    const fragment = document.createDocumentFragment();
    for (const issue of diagnostics) {
      const item = document.createElement('li'), description = document.createElement('p'), suggestion = document.createElement('p');
      const separator = () => '| ' + Array(issue.columns).fill('---').join(' | ') + ' |';
      let example;
      if (issue.type === 'table-separator') {
        description.textContent = `第 ${issue.line} 行附近：疑似表格缺少表头分隔行，可能显示为普通文本。`;
        suggestion.textContent = '建议在表头下方添加：';
        example = separator();
      } else if (issue.type === 'table-columns') {
        description.textContent = `第 ${issue.line} 行：表头有 ${issue.columns} 列，分隔行有 ${issue.actual} 列，列数不一致。`;
        suggestion.textContent = '建议使两行列数一致，分隔行可参考（原有对齐方式请保留）：';
        example = separator();
      } else if (issue.type === 'table-row') {
        const extra = issue.actual > issue.columns;
        description.textContent = `第 ${issue.line} 行${extra ? '' : '（提醒）'}：表头有 ${issue.columns} 列，本行有 ${issue.actual} 列，${extra ? '多出的内容可能被忽略' : '缺少的单元格会显示为空白'}。`;
        suggestion.textContent = extra ? '建议核对单元格边界；内容中的竖线请写成 \\|，或放入行内代码。' : '若有意留空可忽略此提醒；否则请补齐单元格，并核对各列位置。';
      } else if (issue.type === 'unclosed-link') {
        description.textContent = `第 ${issue.line} 行：${issue.image ? '图片' : '链接'}标记疑似不完整，可能无法正常显示。`;
        suggestion.textContent = '建议检查目标地址的右括号及可选标题是否闭合，完整写法参考：';
        example = issue.image ? '![图片说明](图片地址)' : '[链接文字](目标地址)';
      } else {
        description.textContent = `第 ${issue.line} 行：代码块围栏疑似未闭合，后续正文可能被显示为代码。`;
        suggestion.textContent = '建议在代码结束处另起一行，添加相同类型且不少于起始长度的围栏：';
        example = issue.fence;
      }
      if (example !== undefined) {
        const code = document.createElement('code');
        code.textContent = example;
        suggestion.append(code);
      }
      item.append(description, suggestion);
      fragment.append(item);
    }
    panel.querySelector('ol').replaceChildren(fragment);
  };
  globalThis.MarkViewFormatDiagnostics = Object.freeze({ render });
})();