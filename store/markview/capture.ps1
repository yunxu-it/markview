#requires -Version 7.0
param([string]$ChromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe')

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ChromePath -PathType Leaf)) { throw 'Chrome executable not found.' }
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../../markdown-preview/manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
$outputRoot = Join-Path $PSScriptRoot "assets/$($manifest.version)"
[IO.Directory]::CreateDirectory($outputRoot) | Out-Null
$captures = @(
    @{ Source = 'release-scene.html'; Query = 'language=zh-CN&theme=github'; Name = 'zh-CN/screenshot-01.png' },
    @{ Source = 'release-scene.html'; Query = 'language=zh-CN&theme=warm&scene=files'; Name = 'zh-CN/screenshot-02.png' },
    @{ Source = 'release-settings.html'; Query = 'language=zh-CN&theme=bear'; Name = 'zh-CN/screenshot-03.png' },
    @{ Source = 'release-scene.html'; Query = 'language=zh-CN&theme=report&scene=code'; Name = 'zh-CN/screenshot-04.png' },
    @{ Source = 'release-scene.html'; Query = 'language=en&theme=dark'; Name = 'en/screenshot-01.png' },
    @{ Source = 'release-settings.html'; Query = 'language=en&theme=github'; Name = 'en/screenshot-02.png' },
    @{ Source = 'release-scene.html'; Query = 'language=en&theme=bear&scene=code'; Name = 'en/screenshot-03.png' }
)
foreach ($capture in $captures) {
    $sourcePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "source/$($capture.Source)"))
    $targetPath = [IO.Path]::GetFullPath((Join-Path $outputRoot $capture.Name))
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($targetPath)) | Out-Null
    $sourceUrl = [Uri]::new($sourcePath).AbsoluteUri + '?' + $capture.Query
    $profilePath = Join-Path ([IO.Path]::GetTempPath()) ('markview-capture-' + [Guid]::NewGuid().ToString('N'))
    $start = [Diagnostics.ProcessStartInfo]::new($ChromePath)
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardError = $true
    $start.RedirectStandardOutput = $true
    foreach ($argument in @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1', '--window-size=1280,800', '--virtual-time-budget=5000', "--user-data-dir=$profilePath", "--screenshot=$targetPath", $sourceUrl)) {
        $start.ArgumentList.Add($argument)
    }
    # 独立临时浏览器配置用于生成素材，避免改变用户正在使用的 Chrome 配置。
    $process = [Diagnostics.Process]::Start($start)
    try {
        $errors = $process.StandardError.ReadToEndAsync()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        if (-not $process.WaitForExit(20000)) { $process.Kill($true); throw "Capture timed out: $($capture.Name)" }
        $log = $errors.GetAwaiter().GetResult()
        $null = $stdout.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $targetPath -PathType Leaf)) { throw "Capture failed: $($capture.Name) $log" }
    } finally { $process.Dispose() }
    $bytes = [IO.File]::ReadAllBytes($targetPath)
    if ($bytes.Length -lt 24) { throw 'Invalid PNG.' }
    $width = $bytes[16] * 16777216 + $bytes[17] * 65536 + $bytes[18] * 256 + $bytes[19]
    $height = $bytes[20] * 16777216 + $bytes[21] * 65536 + $bytes[22] * 256 + $bytes[23]
    if ($width -ne 1280 -or $height -ne 800) { throw "Unexpected dimensions: $width x $height" }
    Write-Output "Created: $targetPath (1280x800, $($bytes.Length) bytes)"
}