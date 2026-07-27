# Stable design references

These files are committed copies of visual references used by `design-qa.md`.
Keep QA documentation pointed at this directory instead of macOS clipboard,
WeChat `RWTemp`, `/tmp`, or other session-scoped paths: those locations expire
and the Codex file preview service correctly rejects them with HTTP 400.

- `civic-interior-visual-target.png` — premium civic interior target.
- `civic-furniture-placement-defect.png` — tipped/overlapping furniture defect.

This directory is excluded from Vercel uploads by `.vercelignore`, so preserving
the source references does not increase the production runtime bundle.
