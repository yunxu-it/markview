"""将中英文隐私文档生成静态双语页面，不引入运行依赖。"""
from html import escape
from pathlib import Path

root = Path(__file__).resolve().parent.parent


def render(name):
    blocks = []
    for block in (root / name).read_text(encoding="utf-8-sig").split("\n\n"):
        block = block.strip()
        if not block:
            continue
        if block.startswith("## "):
            blocks.append("<h2>" + escape(block[3:]) + "</h2>")
        elif block.startswith("# "):
            blocks.append("<h1>" + escape(block[2:]) + "</h1>")
        else:
            blocks.append("<p>" + escape(block).replace("\n", "<br>") + "</p>")
    return "\n".join(blocks)


page = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>墨览 · MarkView 隐私政策 / Privacy Policy</title>
<style>body{max-width:800px;margin:40px auto;padding:0 24px;color:#1f2328;background:#fff;font:16px/1.8 system-ui,sans-serif}h1{font-size:28px;line-height:1.4}h2{font-size:20px;margin-top:32px}a{color:#0969da}section+section{margin-top:64px;padding-top:24px;border-top:1px solid #d1d9e0}nav{display:flex;gap:20px}p{overflow-wrap:anywhere}</style></head>
<body><nav aria-label="Language"><a href="#zh" lang="zh-CN">简体中文</a><a href="#en" lang="en">English</a></nav>
<main><section id="zh" lang="zh-CN">{zh}</section><section id="en" lang="en">{en}</section></main></body></html>"""
(root / "privacy.html").write_text(page.replace("{zh}", render("PRIVACY.md")).replace("{en}", render("PRIVACY.en.md")), encoding="utf-8", newline="\n")