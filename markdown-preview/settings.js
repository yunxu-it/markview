(() => {
  const defaults = Object.freeze({ theme: 'github', articleMaxWidth: 0 });
  const keys = Object.freeze(Object.keys(defaults));
  const themes = new Set(['github', 'warm', 'dark', 'report', 'bear']);
  const widthRange = Object.freeze({ min: 480, max: 1600, step: 20, full: 1620 });
  // 阅读页和图标弹出页共用偏好校验；0 表示铺满，最后一档不作为像素值保存。
  const normalize = settings => {
    const width = settings?.articleMaxWidth;
    const validWidth = Number.isInteger(width) && (width === 0 || (width >= widthRange.min && width <= widthRange.max && width % widthRange.step === 0));
    return { theme: themes.has(settings?.theme) ? settings.theme : defaults.theme, articleMaxWidth: validWidth ? width : defaults.articleMaxWidth };
  };
  /**
   * 将阅读设置应用到当前页面。
   * @param {object} settings 待读取的主题与正文宽度偏好
   * @return {object} 校验后的设置
   */
  const apply = settings => {
    const normalized = normalize(settings);
    document.documentElement.dataset.theme = normalized.theme;
    document.documentElement.style.setProperty('--article-width', normalized.articleMaxWidth === 0 ? 'none' : normalized.articleMaxWidth + 'px');
    return normalized;
  };
  globalThis.MarkViewSettings = Object.freeze({ defaults, keys, widthRange, normalize, apply });
})();