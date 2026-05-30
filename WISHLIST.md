# Strategic Honesty Content OS — Wishlist v1
*Last updated: May 29, 2026*

## Tasks

| # | Task | Effort | Status | Notes |
|---|------|--------|--------|-------|
| 1 | Replace "Wells Fargo" with generic bank wording in all prompts, research, and scene parser | Small | ⏳ Todo | "A leading national retail bank" or "one of the big four banks" — use what fits context |
| 2 | Queue tab exports: show content on screen first with edit option, then download | Medium | ⏳ Todo | Buffer CSV, Pictory Scripts, Image Prompts, Creative Brief |
| 3 | All exports download as .txt not .cjs | Small | ⏳ Todo | Part of #2 — done together |
| 4 | Full layout redesign per mockup — Core Idea above calendar, sidebar cleanup, right pane accordions, Help & Guide top right | Large | ⏳ Todo | Mockup approved v4c. #7 folded in. |
| 5 | Dashboard stats clickable — each opens detail view | Small | ⏳ Todo | Posts Scheduled, Frequency, Channels Active, Approved Queue |
| 6 | Mobile responsive from URL — both apps work cleanly in iPhone browser | Medium | ⏳ Todo | PWA home screen install deferred to later |
| 7 | Help & Guide button top right next to New Post | Small | ✅ Folded into #4 | |
| 8 | LinkedIn OAuth — Strategic Honesty company page direct posting | Medium | ⏳ Todo | Needs LinkedIn app credentials |
| 9 | Bluesky direct posting — separate Strategic Honesty account | Small | ⏳ Todo | App password, ready when account is created |
| 10 | Media Studio custom domain — media.strategichonesty.com | Small | ⏳ Todo | Cloudflare Pages + DNS, ~30 min |
| 11 | Save generated content to Postgres immediately, 90-day auto-archive to CSV download, remove localStorage dependency | Medium | ⏳ Todo | Uses existing Railway Postgres, no extra cost |

## Recommended sequence (least effort → highest impact)

1. **#10** — Media Studio custom domain (~30 min)
2. **#1** — Replace Wells Fargo in all prompts (~30 min)
3. **#3 + #2** — Exports panel with screen preview + .txt download (~2 hours)
4. **#5** — Clickable stats (~1 hour)
5. **#9** — Bluesky when account ready (~1 hour)
6. **#11** — Postgres content save, remove localStorage (~3 hours)
7. **#6** — Mobile responsive both apps (~3 hours)
8. **#8** — LinkedIn OAuth (~4 hours)
9. **#4** — Full layout redesign (~6 hours, largest task)

## Rules for this wishlist
- Less effort first, finish sooner
- Every task moves toward a commercial SaaS product for busy professionals with a personal brand
- No task starts without a confirmed understanding between Gopu and Claude
- Mockup approval required before any layout code changes
- Keep Claude API for content generation quality

## Completed this session (May 29, 2026)
- ✅ /api/video/generate 404 fixed
- ✅ Video generation end-to-end working (Creatomate)
- ✅ Postgres queue wired to video route
- ✅ Scheduler progress button useState fix
- ✅ Send button disabled while generating scenes
- ✅ Help & Guide page live on both apps
- ✅ Help button in Scheduler sidebar
- ✅ Help button in Media Studio header
- ✅ Media Studio build fixed (unclosed div)
- ✅ &amp; entity JSX fix in Scheduler
