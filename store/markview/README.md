# 打包与素材生成

扩展本身无需构建，可直接加载仓库内的 `markdown-preview` 目录。本目录保存打包脚本、公开示例、截图素材与隐私政策。

截至 2026-10-21，[Chrome 商店](https://chromewebstore.google.com/detail/ehpgkiagfgnbbmcfeemceglgfbojmcbk)已公开发布 1.3.0。本目录的当前源码打包和截图资料对应此版本。

## 打包

在仓库根目录使用 PowerShell 7 运行：

```powershell
./store/markview/package.ps1
```

脚本按 manifest 版本生成 `store/markview/markview-版本号.zip` 和 `SHA256.txt`，白名单包含运行文件、项目 MIT 许可及 Bear 第三方许可。ZIP 的 manifest 位于根目录，可解压后加载扩展。

脚本回读每个 ZIP 条目并与源码 SHA-256 比较。同版本 ZIP 已存在时默认拒绝覆盖，需要替换时显式传入 `-Force`。ZIP、校验文件和临时文件不纳入源码版本控制，生成包可作为 GitHub Release 附件发布。

## 界面截图

当前 1.3.0 中文截图位于 [assets/1.3.0/zh-CN](assets/1.3.0/zh-CN/)，英文截图位于 [assets/1.3.0/en](assets/1.3.0/en/)，尺寸为 1280×800。

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

修改中英文隐私文档后，可用 Python 标准库重新生成静态页面：

```powershell
python ./store/markview/source/render-privacy.py
```

上述脚本不会自动部署页面、推送 Git 仓库或上传商店。