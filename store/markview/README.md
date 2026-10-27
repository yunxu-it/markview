# 打包与素材生成

扩展本身无需构建，可直接加载仓库内的 `markdown-preview` 目录。本目录保存打包脚本、公开示例、截图素材与隐私政策。

当前源码打包版本为 1.4.0（待发布），发布材料见 [CHROMEWEBSTORE.md](../../CHROMEWEBSTORE.md)。截至 2026-10-21，已确认 [Chrome 商店](https://chromewebstore.google.com/detail/ehpgkiagfgnbbmcfeemceglgfbojmcbk)公开发布 1.3.0；现有截图仍为该历史版本，本次未重新生成截图。

## 打包

在仓库根目录使用 PowerShell 7 运行：

```powershell
./store/markview/package.ps1
```

脚本按 manifest 版本生成 `store/markview/markview-版本号.zip` 和 `SHA256.txt`，白名单包含运行文件、项目 MIT 许可及 Bear 第三方许可。ZIP 的 manifest 位于根目录，可解压后加载扩展。

脚本回读每个 ZIP 条目并与源码 SHA-256 比较。同版本 ZIP 已存在时默认拒绝覆盖，需要替换时显式传入 `-Force`。ZIP、校验文件和临时文件不纳入源码版本控制，生成包可作为 GitHub Release 附件发布。

本次目标包为 `markview-1.4.0.zip`，包含新增运行文件 `format-diagnostics.js`；本地试验页和素材目录不进入扩展 ZIP。打包成功仅证明包内容与源码一致，不代表已通过 Chrome 安装、交互或商店审核。

## 格式检查试验页

直接用浏览器打开 [format-playground.html](source/format-playground.html)，无需启动服务或安装扩展。内置正常格式、综合错误、表格缺少分隔行、表头与分隔行列数不一致、数据行多列／少列、链接／图片未闭合、代码块未闭合、代码与转义文本样例。

左侧可编辑 Markdown 并对照行号，右侧实时显示预览和格式建议；可切换五套阅读主题、恢复当前样例，或下载 Markdown 后交给源码扩展检查。选择样例或刷新会重置输入，页面不保存编辑内容。

试验页共用当前源码的解析器、提示展示和阅读样式，不进入扩展 ZIP。它不代替实际扩展安装、文件授权、跨标签设置同步及 PDF 输出的验收。

## 界面截图

历史 1.3.0 中文截图位于 [assets/1.3.0/zh-CN](assets/1.3.0/zh-CN/)，英文截图位于 [assets/1.3.0/en](assets/1.3.0/en/)，尺寸为 1280×800。

安装 Chrome 后，可在 PowerShell 7 中重新生成截图：

```powershell
./store/markview/capture.ps1
```

Chrome 安装位置不同可通过 `-ChromePath` 指定可执行文件。脚本使用独立临时浏览器配置，素材入口只读取本地源码、公开示例和演示扩展 API；素材入口不进入扩展 ZIP。

截图展示界面，不代表实际扩展安装、原生文件授权、跨标签消息或 PDF 输出已通过验收。手动检查步骤见 [regression.md](source/regression.md)。

## 隐私政策与示例

- [中文隐私政策](PRIVACY.md)
- [英文隐私政策](PRIVACY.en.md)
- [双语静态页面](privacy.html)
- [中文示例](sample.md)
- [英文示例](sample-en.md)

隐私政策按产品适用，不绑定扩展版本号。本次将原“适用版本”一次性改为“适用产品”，保留原生效日期与数据处理条款。后续发布只核对政策与实际行为是否一致；没有数据处理或相关要求变化、也没有需要纠正的表述时，不修改政策、不追加版本号、不更新日期，也不重复部署隐私页。

数据收集、使用、存储、共享、保留期限或删除方式变化，或相关要求变化时，再按实际情况更新对应条款、中英文文档和静态页面，并同步线上隐私政策地址。

本次一次性上线时，将本目录的 `privacy.html` 同步到独立站点源码 `source/protocol/markview_protocol.html`，按站点流程发布该页面。隐私页不在扩展 ZIP 中，这项调整不需要重新打包或替换已上传的 1.4.0 安装包。

修改中英文隐私文档后，可用 Python 标准库重新生成静态页面：

```powershell
python ./store/markview/source/render-privacy.py
```

上述脚本不会自动部署页面、推送 Git 仓库或上传商店。