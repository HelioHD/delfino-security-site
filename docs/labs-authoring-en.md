# How to publish a post in `/labs`

Português: [labs-authoring-pt-BR.md](labs-authoring-pt-BR.md)

## 1. Before writing: what can be published

Hack The Box rules (from plan 09):

- **Allowed:** **retired** machines, challenges and Sherlocks, Starting Point, Academy Tier 0 modules and some
  Mini Pro Labs.
- **Not allowed:** active (not yet retired) content and **Pro Labs** in general.
- **Never publish a flag**, not even for retired content.
- No real engagements: no client data, not even anonymized.

The build helps, but it does not replace you:

| The build blocks | The build does **not** catch |
|---|---|
| `platform: htb` without `htbKind` or `retiredOn` | a wrong retirement date (check it on HTB) |
| `retiredOn` in the future | a Mini Pro Lab that is not on the allowed list |
| `htbKind` outside the list (there is no Pro Lab option) | a flag in a format other than `HTB{...}` or a `user.txt`/`root.txt` hash |
| `HTB{...}` text, or `user.txt`/`root.txt` followed by a 32-character hash | sensitive data inside an image |
| level 2 with a rule missing from `rules-index.json` | |
| level 3 without screenshot, alt text, lab or date | |

## 2. Create the file

```
src/content/labs/<slug>/pt-BR.md
src/content/labs/<slug>/en.md      (optional, translation)
```

- `<slug>` lowercase with hyphens (e.g. `htb-machine-name`). It becomes `/labs/pt/<slug>/` and `/labs/en/<slug>/`.
- Same `<slug>` in both languages = translations; the post gets the language link and the index shows the version
  in the chosen language. A single language is fine too.
- The `lang` field must match the file name.

## 3. Frontmatter

Example for a retired machine:

```yaml
---
title: 'MachineName'
summary: 'Two or three sentences: entry vector, how it escalated, what the blue team would see.'
lang: en
type: writeup            # writeup | sherlock | note
platform: htb            # htb | ctf | other
htbKind: machine         # machine | challenge | sherlock | starting-point | academy-tier0 | mini-pro-lab
difficulty: medium       # very-easy | easy | medium | hard | insane
os: linux                # linux | windows | freebsd | other
retiredOn: 2025-06-14    # required for htb, must be in the past
publishedOn: 2026-12-01
attack: [T1190, T1552.001, T1068]
timeline:
  - title: Recon
    detail: 'What was found.'
  - title: Initial access
    detail: 'How you got in.'
    attack: [T1190]
detection:
  level: 1               # 1 | 2 | 3
  telemetry:
    - 'Log source and expected event'
  logic: |
    (detection logic, required for level 1)
  logicLanguage: yaml
  notes: 'Detection limitations.'
---
```

For a CTF or another platform: `platform: ctf` (or `other`) with `platformLabel: 'CTF Name 2026'` and, optionally,
`eventDate`. `htbKind` and `retiredOn` only apply to `htb`.

Optional fields: `updatedOn`, `draft: true` (left out of the build), `example: true` (templates only).
Notes (`type: note`) have no `timeline`; the detection box is optional for every type.

## 4. Evidence level: pick what is true

| Level | Use when | Fields |
|---|---|---|
| 1 Theoretical | you know which telemetry would show up and wrote the logic, but did not run it | `telemetry`, `logic` |
| 2 Rule tested | the rule exists in the detections repo, its positive and negative tests pass in CI, and it is in the release pinned in `src/data/rules-index.json` | `telemetry`, `rule` (index id), optional `logic` |
| 3 Validated in lab | you saw the alert fire in the lab and have the screenshot | `telemetry`, `screenshot` (e.g. `./alert.png` in the post folder), `screenshotAlt`, `lab`, `validatedOn`, optional `rule` |

When in doubt, use the lower level. A post without a detection box can ship too.

Today `rules-index.json` is a **sample** (`"sample": true`); the box shows a notice while that is the case. To use
level 2 for real, pin a real release (README, "Pinning the rules index").

## 5. Post body

Plain Markdown. Code blocks with a language (` ```bash `, ` ```http `, ` ```powershell `, ` ```text `) get
highlighting and a copy button. Images live in the post folder and go in with `![description](./file.png)`.

## 6. Screenshot checklist (before adding any image)

- [ ] **HTB VPN IP** (`10.10.14.x`, `10.10.16.x` or your `tun0` address) cropped or blurred.
- [ ] **Usernames**: your HTB user, Windows/Kali user, local hostname and paths with `C:\Users\<you>` or
      `/home/<you>` out of the frame.
- [ ] **Tokens and secrets**: cookies, JWTs, API keys, password hashes that are not part of the write-up,
      `Authorization` headers.
- [ ] **Flags**: no flag in a terminal, browser tab or open file.
- [ ] Tabs, notifications and bookmarks bar show nothing personal.
- [ ] Properly redacted (strong pixelation or a solid box); light blur can be reversed.
- [ ] Metadata: re-export as PNG (the build converts to WebP, but check the source).
- [ ] Level 3: the screenshot is of the real alert, not a mock-up.

## 7. Check and publish

```bash
npm run build && npm run verify && npm run check
npm run preview          # open http://localhost:4321/labs/
```

Check the page at phone width. Commit (`feat(labs): add <name> write-up`) and open the PR.

## 8. The example posts

`example-writeup`, `example-sherlock` and `example-note` are fictional templates with `example: true`. Copy one of
their folders to start, and decide whether they stay published once the first real post ships.
