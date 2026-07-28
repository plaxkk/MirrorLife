# Pre-Borderless Website Backup

## Approved dual-baseline record

This record intentionally keeps two immutable baselines. The original visual/site snapshot remains `fceef14e2c1357078f30fc9279e009204d0bb157`, because it is the website state that preceded Borderless City work. Its `package-lock.json` cannot satisfy `npm ci`, so the separately reviewed lockfile-only commit `94f8c05b91b4b975720c290c3667c9702c786c2b` is the reproducible baseline. No original reference or archive was moved or overwritten.

## Original visual/site snapshot

- Commit: `fceef14e2c1357078f30fc9279e009204d0bb157`
- Backup branch: `codex/backup-pre-borderless-20260728`
- Backup tag: `pre-borderless-site-2026-07-28`
- Source archive: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/source-fceef14.tar.gz`
- Build archive: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/dist-fceef14.tar.gz`
- SHA-256 manifest: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/SHA256SUMS`
- Source SHA-256: `5a2025c27e3e03c91bfae777df0a91d6e6c2e4010820917f3138b94e1e5bb207`
- Build SHA-256: `7671fa698b6941a0af59a63f886066eea1b8837c4562deb4c9d4587cc71d0eeb`
- Verification: `npm run check` and `npm run build` passed before archiving; both archive checksums verify.

## Reproducible baseline

- Commit: `94f8c05b91b4b975720c290c3667c9702c786c2b` (`fix: synchronize dependency lockfile`)
- Backup branch: `codex/backup-pre-borderless-restorable-20260728`
- Backup tag: `pre-borderless-site-restorable-2026-07-28`
- Source archive: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/source-94f8c05.tar.gz`
- Build archive: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/dist-94f8c05.tar.gz`
- SHA-256 manifest: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/SHA256SUMS-94f8c05`
- Source SHA-256: `8f60b3ce5cba77a386ecc04cb0c93783a4440a58272840ac360ddac1348d8470`
- Build SHA-256: `4ed7e6ff5e82c6f0a2d1fbd076277a295a93e74a94e8187e6a709857ee8d8530`
- Verification: `npm run check`, `npm run build`, and both archive checksum checks passed.
- Restored-source verification: passed. After extracting `source-94f8c05.tar.gz` into a disposable directory, `npm ci`, `npm run check`, and `npm run build` all passed. A disposable Git index was initialized before `npm run check` solely because that command invokes `git ls-files`; `git archive` does not carry `.git` metadata. No source archive content was changed.

## Production deployment record (read-only)

- Project ID: `prj_yQfnS65n8IulPVv2eoDEM5Sb1sd1`
- Immutable production deployment ID: `dpl_7UoaNSsAtsMawzgw8pKw9Z6cwpBR`
- Production URL: `https://mirror-life-19owtfv7v-wk1134314305-8776s-projects.vercel.app`
- Production alias: `https://mirror-life.vercel.app`
- Created at: `2026-07-27T10:08:08.359Z`
- Deployment status: `READY`
- Source commit: `579a075a92c75471d127971ef31bb31c8f167625`

The deployment connector was used only to list and read this deployment. No redeploy, promotion, rollback, environment-variable change, or domain change occurred.

## Browser save-state export (read-only)

- Export path: `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/mirrorlife-production-autosave-2026-07-28.json`
- Export SHA-256: `cc31746de357c44f7939471fa5a1e9fb54890545797a55460b1bbb21848d4c07`
- Export verification: JSON `mirrorlifeSave=1`, `id=autosave`, `name=自动存档`, `version=1`, 42,345 bytes.
- `localStorageKeys`: `["mirror-life-mvp"]`
- IndexedDB: name `mirrorlife`, version `1`, object stores `["saves", "memories"]`; observed counts: `saves=1`, `memories=0`.

The Production first-run guide made the normal save controls non-interactive. To avoid selecting a new life or changing the existing user state, the existing UI export handler exported the existing `autosave` slot only; no save, load, reset, or import action was performed.

## Rollback route

Redeploy immutable Production deployment `dpl_7UoaNSsAtsMawzgw8pKw9Z6cwpBR` to restore the recorded live deployment, or build the original visual snapshot `pre-borderless-site-2026-07-28`. Use `pre-borderless-site-restorable-2026-07-28` when a clean dependency restore is required.
