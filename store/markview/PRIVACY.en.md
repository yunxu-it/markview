# MarkView Privacy Policy

Effective date: 2026-10-20
Applies to version: 1.3.0

## Local document processing

MarkView previews Markdown files you open, choose, or drop into Chrome, and Markdown files in folders you explicitly select and authorize. File contents, names, and paths are used locally to render documents, show titles, navigate headings and files, identify the current document, and resolve images and links. This information is not uploaded to a developer server.

The extension does not scan your drive or automatically access other folders. Folder access is read-only and limited to the selected folder and its subfolders. It reads files you click and may compare a uniquely named candidate file to associate the current document. On reopening a page, a remembered folder is enumerated only if read permission is still valid. If permission expires, you must click Resume folder access before another permission request. Direct file preview requires Allow access to file URLs in the extension details.

## Data use and storage

This version has no accounts, advertising, analytics, or telemetry. Documents are processed on your device, and reading records are saved to restore your position. The developer does not receive, sell, or upload these documents or records, or use them for advertising or model training. Requests for remote images are described below.

MarkView has no cloud storage and does not persist document contents or file lists. Selected or dropped documents and enumerated file lists remain in the current page's memory. After refresh, individually selected files must be reopened; folder lists can be restored through a remembered handle when permission remains valid. Chrome's own history, cache, and other browser behavior are governed by browser settings and policies.

chrome.storage.local saves sidebar width and visibility, theme, maximum content width, interface language, and reading positions on your device. Theme is stored as an identifier, width as a number (0 means full width), and language as auto / zh-CN / en. These preferences restore your choices and remain until changed, reset where applicable, or cleared with the corresponding local data. Document URLs, or selected file names and contents, or relative folder paths and contents, are used locally to compute a SHA-256 identifier. Reading records contain that identifier, scroll position, and last-use time, not the original path, file name, or contents. At most 200 recent documents are retained, with the least recently used records removed when this limit is exceeded. These records are not uploaded or synchronized across devices.

Read-only folder mode saves the last successfully opened directory handle in the page origin's local IndexedDB database, markview-folders. The handle can provide the folder name and restore access when read permission is valid. This record does not store a full disk path, document contents, or file list. It remains until replaced by another folder, removed with Open → Forget folder, or cleared with the corresponding browser local data. Compatibility folder mode keeps file objects only in the current page and does not save a directory handle.

## Interface language and PDF

MarkView reads the browser interface language to choose Simplified Chinese or English by default. You can override this in reading settings. Translations are bundled with the extension; no online translation service is used, and document text, code, file names, and paths are not translated or sent to a translation service. Browser-managed screens and extension management labels follow the browser's language.

Export PDF opens the current document's browser print preview. You choose Save as PDF, paper settings, and a destination. MarkView does not automatically upload documents or PDFs, use a server conversion service, or keep a PDF copy. Saved files are managed by you and the browser.

## Images and external links

Remote images in Markdown can cause the browser to contact the image website. That website may receive your IP address and information automatically sent by the browser. These requests do not pass through a developer server and are subject to that website's privacy policy. External links open the corresponding website.

When Markdown is opened directly in Chrome, relative images and links resolve from the original file location. File selection, folder selection, and drag-and-drop do not expose a full disk path, so relative images and cross-document relative links are not supported in those modes.

## Permissions and choices

File URL access is used only for Markdown files you open with a matching suffix. Folder reading is limited to folders you select and authorize. Reading records serve local reading recovery; MarkView does not read or aggregate your browsing history on ordinary websites.

Open → Forget folder removes the remembered handle and file tree without deleting disk files or revoking browser permission. You can revoke folder access in browser permission settings, clear the relevant page origin's local data, disable file URL access, disable the extension, or uninstall it. Closing a preview page ends that page's document processing; saved reading records and handles remain subject to the retention rules above.

Reset restores the default theme, full content width, and automatic language. It does not clear reading records, sidebar preferences, or the remembered folder. Those records follow the deletion and retention rules described above.

## Changes and contact

If later versions introduce accounts, advertising, or new data practices, this policy will be updated and any required notice or consent provided. This policy does not cover features that have not been released.

For privacy questions, contact moreve.lee@gmail.com.