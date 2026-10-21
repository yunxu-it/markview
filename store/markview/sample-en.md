# MarkView project notes

This public sample contains no personal or business data. Changing the interface language keeps this document in English.

## Reading checklist

- [x] Open the extension settings popup
- [x] Choose a theme and content width
- [ ] Save a PDF and review its pages

## Available styles

| Theme | Purpose |
| --- | --- |
| Classic Light | Technical documentation |
| Warm Paper | Long articles |
| Soft Dark | Low-light reading |
| Serif Report | Formal documents |
| Crimson Minimal | Compact reading |

## JavaScript

```javascript
const options = { name: 'MarkView', version: '1.3.0' };
async function readDocument(file) {
  return await file.text();
}
```

## PowerShell

```powershell
$deviceSerial = 'demo-001'
if ([string]::IsNullOrWhiteSpace($deviceSerial)) {
    Write-Warning "Set a device serial: $deviceSerial"
}
```

## PDF and language

> Choose Export PDF in the extension popup, then select Save as PDF in browser print preview.

English text, 中文内容, file names, indentation, and code should remain unchanged when switching the interface language.