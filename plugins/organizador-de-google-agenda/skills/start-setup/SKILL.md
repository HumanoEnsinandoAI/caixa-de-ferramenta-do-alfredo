---
name: start-setup
description: One-time initial setup of the organizador-de-google-agenda plugin. Connects Google Calendar, checks how many calendars the user has, asks which ones to include, creates the user's conventions file and the diary folder, learns what is personal and what is work, and saves everything in the workspace's ferramentas/google-calendar folder. Loads one reference per phase, in order. Use right after the plugin is installed, when the user asks to set up or configure the plugin, or when no saved setup exists yet. Never use it once setup is completed.
---

# Start setup

Runs once. It walks the user through a fixed sequence of phases: connect Google Calendar, choose the calendars, save them, create the files every session will use, learn the user's personal/work classification, optionally show Claude Code routines on the calendar, and optionally choose a color palette. How to work with the calendar afterwards lives in the `use-google-calendar` skill.

**Language:** all conversation with the user is in Brazilian Portuguese (pt-BR). Everything in this file is instructions for you, not text to show.

## How the phases work

Each phase is one file in `references/` (next to this SKILL.md). **Load one at a time, in order, and only when you reach it.** Do not read a phase ahead of time. Finish a phase (its "Done when" is true) before loading the next one; each file ends by naming the next.

| # | File | What it does | `setup.steps` key |
|---|---|---|---|
| 1 | `references/01-connect.md` | Connects Google Calendar through the connector | `connection` |
| 2 | `references/02-calendars.md` | Checks the calendars and asks which to integrate | `calendars` |
| 3 | `references/03-save-calendars.md` | Creates `ferramentas/google-calendar/`, the `AGENTS.md` entry and `config.json` | `calendars` |
| 4 | `references/04-conventions-and-diary.md` | Creates `conventions.json` and the `diario/` folder | `conventions` |
| 5 | `references/05-classification.md` | Reads the calendar and learns personal versus work, with yes/no questions | `classification` |
| 6 | `references/06-routines.md` | Optionally shows Claude Code routines on the calendar as free events | `routines` |
| 7 | `references/07-appearance.md` | Optionally picks a color palette and colors the categories and events | `appearance` |
| 8 | `references/08-finish.md` | Marks the setup as completed | none |

## Step 0: check the saved configuration

The setup lives in the user's workspace, in `ferramentas/google-calendar/config.json` (the workspace is the project root of the current session). Look for a folder named `ferramentas` at the root, ignoring letter case, then for the config inside it:

```bash
TOOLS_DIR=$(find . -maxdepth 1 -type d -iname ferramentas | head -n 1)
cat "${TOOLS_DIR:-./ferramentas}/google-calendar/config.json" 2>/dev/null
```

- **`setup.completed` is `true`:** tell the user, in Portuguese, that the setup was already done and show a short summary (which calendars are integrated). **Stop here**, loading no phase. Only run it again if the user explicitly asks to redo the setup. In that case ask for confirmation first, then set `setup.completed` and the steps `calendars` to `appearance` to `false`, keep `connection`, and go through the phases again. **Files that already exist are merged, never replaced**: keep what the user edited and only change what they confirm again.
- **File missing:** start at phase 1.
- **File exists and `setup.completed` is not `true`:** resume. Skip every phase whose key in `setup.steps` is already `true`, start at the first phase whose key is not, and reuse the saved `calendars.selected` instead of asking again. Phase 8 always runs last. Before any phase that reads or writes the calendar (5, 6 and 7), check that the Google Calendar tools are available, as phase 1 does, without changing any key.

> **Adding phases later:** create a new numbered file in `references/`, add it to the table above and make the previous phase's "Next" point to it. Give it its own key under `setup.steps` (written in phase 3's `config.json` shape). `setup.completed` becomes `true` only when every key is `true`.

## What not to do

- Do not create, change or delete events, with one exception: the routine events of phase 6, which are always created as free, never busy. Everything else in this skill only reads the calendar.
- Do not mark a step `true` before its work is done and read back.
- Do not run again once `setup.completed` is `true`, unless the user explicitly asks.
- Store only calendar ids and names, category rules, and event title keywords or email domains the user confirmed. Never store event contents, guests' names or full event lists.
- Do not overwrite an existing `ferramentas/AGENTS.md`: only add the entry.
