# Release Checklist

## Before Public Release

- [x] English name confirmed: `MirrorLife`
- [x] Chinese name confirmed: `镜像人生`
- [ ] Demo subtitle/chapter label confirmed, including whether `回声之城` is used
- [x] One-line positioning confirmed: `你想活出怎样的人生`
- [ ] Public repository decision deferred until the demo proves an initial fun/play value
- [ ] README reflects current demo scope and setup
- [ ] `.env.example` contains no real secrets
- [ ] License file is present and correct
- [ ] Experimental frontend API key entry remains hidden until backend proxy is ready
- [ ] Existing non-module script Vite build warning is either fixed or documented as accepted
- [ ] Any company/private material stays outside this repository

## Engineering Gate

- [ ] `npm install`
- [ ] `npm run check`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] Browser smoke check has no console errors
- [ ] CI passes on pull request
- [ ] Vercel preview opens `game.html`

## Manual Demo Acceptance

- [ ] New user can create a persona and enter the city
- [ ] Mirror cabin input creates a visible `现实投影`
- [ ] Echo archive stores the generated projection
- [ ] `未完回声` appears after a mirror cabin interaction
- [ ] Home mode `明日小事` references the last projection
- [ ] A cooperation input and a conflict/anxiety input produce clearly different narrative feedback
- [ ] High-risk text triggers the local safety path

## Phase 2 Visual Redesign Gate

- [ ] task #13 provides the first-minute `core operation -> feedback -> consequence attribution` loop
- [ ] [STITCH_VISUAL_REDESIGN_PREP.md](STITCH_VISUAL_REDESIGN_PREP.md) is updated with the task #13 loop before generating final Stitch variants
- [ ] [STITCH_FINAL_VISUAL_DRAFT.md](STITCH_FINAL_VISUAL_DRAFT.md) is reviewed before engineering implementation
- [ ] Google Stitch outputs are judged by first-minute causal understanding, not visual richness
- [ ] Selected visual direction keeps one obvious primary operation entry
- [ ] Selected visual direction shows immediate feedback, time progression, consequence attribution, and next choice
- [ ] Project lead validates the selected direction before engineering implementation

## Known Phase 1 Boundaries

- No production LLM API from browser
- No Supabase persistence
- No payment or subscription wall
- No psychotherapy or mental-health treatment claim
- No real multi-user community features

## Recommended Release Note Template

```markdown
## MirrorLife v0.x

### What changed
- ...

### Demo scope
- ...

### Validation
- `npm run check`
- `npm run build`

### Known limitations
- ...

### Decisions still required
- ...
```
