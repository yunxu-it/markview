#requires -Version 7.0
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../markdown-preview'))
$manifest = Get-Content -LiteralPath (Join-Path $sourceRoot 'manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
if ($manifest.version -notmatch '^\d+(\.\d+){0,3}$') { throw 'manifest version is invalid.' }
$files = @(
    'manifest.json', 'background.js', 'markdown.js', 'i18n.js', 'settings.js',
    'viewer.js', 'viewer.html', 'viewer.css', 'themes.css', 'popup.html', 'popup.js', 'popup.css',
    '_locales/en/messages.json', '_locales/zh_CN/messages.json', 'LICENSE', 'licenses/bear-theme-MIT.txt',
    'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png'
)
foreach ($name in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot $name) -PathType Leaf)) { throw "Missing runtime file: $name" }
}
# 清单声明的入口及资源必须在白名单内，防止新增功能后漏打运行文件。
$references = @($manifest.background.service_worker, $manifest.action.default_popup) + @($manifest.icons.PSObject.Properties.Value) + @($manifest.action.default_icon.PSObject.Properties.Value)
foreach ($script in $manifest.content_scripts) { $references += @($script.js) + @($script.css) }
if ($manifest.default_locale) { $references += "_locales/$($manifest.default_locale)/messages.json" }
foreach ($name in $references) {
    if ($name -and $name -notin $files) { throw "Manifest resource not packaged: $name" }
}
$archivePath = Join-Path $PSScriptRoot "markview-$($manifest.version).zip"
if ((Test-Path -LiteralPath $archivePath) -and -not $Force) { throw 'Package already exists. Use -Force to replace it.' }
$temporaryPath = "$archivePath.tmp"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [IO.File]::Open($temporaryPath, [IO.FileMode]::CreateNew)
try {
    $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($name in $files) {
            $entry = $archive.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
            $entry.LastWriteTime = [DateTimeOffset]::new(1980, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
            $entryStream = $entry.Open()
            try {
                $sourceStream = [IO.File]::OpenRead((Join-Path $sourceRoot $name))
                try { $sourceStream.CopyTo($entryStream) }
                finally { $sourceStream.Dispose() }
            } finally { $entryStream.Dispose() }
        }
    } finally { $archive.Dispose() }
} finally { $stream.Dispose() }

# 回读成品内容，确保白名单内每个文件与源码逐一一致。
$archive = [IO.Compression.ZipFile]::OpenRead($temporaryPath)
try {
    if ($archive.Entries.Count -ne $files.Count) { throw 'Unexpected package entry count.' }
    foreach ($name in $files) {
        $entryStream = $archive.GetEntry($name).Open()
        $hasher = [Security.Cryptography.SHA256]::Create()
        try { $actual = [Convert]::ToHexString($hasher.ComputeHash($entryStream)) }
        finally { $entryStream.Dispose(); $hasher.Dispose() }
        $expected = (Get-FileHash -LiteralPath (Join-Path $sourceRoot $name) -Algorithm SHA256).Hash
        if ($actual -ne $expected) { throw "Package content differs: $name" }
    }
} finally { $archive.Dispose() }
Move-Item -LiteralPath $temporaryPath -Destination $archivePath -Force:$Force
$checksums = Get-ChildItem -LiteralPath $PSScriptRoot -Filter 'markview-*.zip' -File | Sort-Object Name | ForEach-Object {
    '{0}  {1}' -f (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash, $_.Name
}
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'SHA256.txt'), ($checksums -join "`n"), [Text.UTF8Encoding]::new($false))
Write-Output "Created and checked: $archivePath"
Write-Output $checksums