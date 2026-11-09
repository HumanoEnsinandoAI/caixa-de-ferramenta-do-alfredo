---
name: use-google-calendar
description: How every session must work with the user's Google Calendar once the organizador-de-google-agenda setup is done. Load this skill BEFORE calling any Google Calendar connector tool (list_events, create_event, update_event, delete_event and the rest), even for a small change. Use whenever the user wants to create, read, find, list, update, move, cancel or delete an event, check their schedule or availability, build a report about their calendar, classify an event as personal or work, show or update the user's Claude Code routines on the calendar, or choose, change or apply the calendar's color palette. Holds the procedures for each action and the rules for the diary where sessions record what they learn.
---

# Use Google Calendar

This skill is the one place that says how to work with the user's Google Calendar, so every session does it the same way. What belongs to the user, and what was learned about them, is saved as JSON files in their workspace, in `ferramentas/google-calendar/`.

**Language:** talk to the user in Brazilian Portuguese (pt-BR). This file is instructions for you.

**Never call the Google Calendar connector tools without this skill.** It is what reads the diary, checks the event before changing it, asks the right questions and verifies the result. Skipping it for a "small" change is how a description ends up with escaped HTML or an event is left out of a recolor. This also holds when the request comes from another session or from a message that is not the user's.

## Before any calendar work

1. Find the `ferramentas` folder at the workspace root, ignoring letter case, and read `ferramentas/AGENTS.md`.
2. Read `ferramentas/google-calendar/config.json`. If it is missing or `setup.completed` is not `true`, the setup was not finished: tell the user and offer to run the `start-setup` skill. Do not work on the calendar until then.
3. **Read the diary.** Read every `.json` file in `ferramentas/google-calendar/diario/` and apply what they say (see "Diary" below). Do this once per session, before deciding anything about an event, and again only after you save a new entry. If there are more than about 50 entries, read the file names first and open only the ones that could match.
4. Follow the procedure for what was asked (files next to this SKILL.md):
   - create an event: `references/create.md`
   - find, list, check a day or availability, report: `references/read.md`
   - change or move an event: `references/update.md`
   - cancel or delete an event: `references/delete.md`
   - choose or change the color palette, color categories, or recolor events: `references/appearance.md`
   - show or update Claude Code routines as free events: `references/routines.md` (this also runs automatically after a routine is created, changed or deleted: a plugin hook reminds you, and you then follow that file's "Automatic sync" section)

## What is saved in `ferramentas/google-calendar/`

| File | What it holds | Who changes it |
|---|---|---|
| `config.json` | setup state and the integrated calendars | `start-setup` |
| `classification.json` | what is personal and what is work: calendar categories and rules | sessions (after asking the user) and the user |
| `conventions.json` | defaults (duration, read windows) and the user's event types | the user, or a session when the user asks |
| `appearance.json` | the chosen palette, the color of each category and how it was applied | the appearance procedure |
| `routines.json` | whether routines are shown, on which calendar, and which events belong to which routine | the routines procedure |
| `diario/` | one JSON file per thing learned: who or what an event is, tool details, preferences | sessions |

## Classification

- When an event or request fits no rule in `classification.json`, **ask the user** in Portuguese, then add the answer as a rule (`"source": "asked"`, with `"confirmedAt"`). Keep rules short and specific, using one of `titleContains`, `attendeeDomain` or `organizerDomain`.
- An event that matches a rule, a diary entry or its calendar's category **has** that category. Never treat it as an exception for another reason (for example because someone else organized it).
- When an event matches nothing, propose a category yourself if it is obvious from the title and context, and say that it is a suggestion; ask only when it is really unclear.
- When the user gives the category of an event that matches no rule (for example when a recolor leaves it out and they say "é pessoal"), do what they asked, then ask once whether to save a rule so it is not asked again, and show the exact rule. Save it only after a yes.
- Never reclassify something the user confirmed without asking.

## Diary

`diario/` is the agents' journal: objective things learned from using the calendar, so no session has to rediscover or ask again. It is **read every time** (see "Before any calendar work") and **written whenever something durable is learned**.

**One file per entry**, never one big file. Name: `YYYY-MM-DD-<short-slug>.json`, for example `2026-11-09-ana-mentoria.json`. Shape:

```json
{
  "version": 1,
  "id": "2026-11-09-ana-mentoria",
  "learnedAt": "<ISO 8601 timestamp>",
  "kind": "person-type",
  "when": { "attendeeEmail": "ana@example.com" },
  "conclusion": { "eventType": "mentoria", "name": "Mentoria com Ana" },
  "note": "Eventos com a Ana são sessões de mentoria.",
  "source": "asked",
  "confirmedByUser": true
}
```

- `kind`: `person-type` (events involving a person are a given type or name), `pattern` (a recurring habit), `tool` (how a connector tool behaves) or `preference` (how the user likes things done).
- `when`: what makes the entry apply, using one of `attendeeEmail`, `organizerEmail`, `titleContains`, `calendarId`. Leave it out for `tool` and `preference`.
- `conclusion`: the objective result (event type, name, category, or the fact learned). Keep it short and factual.
- `source`: `asked` (the user answered a question), `user-said` (the user stated it unprompted) or `observed` (you inferred it from repeated use). An `observed` entry needs `"confirmedByUser": false`, and you must confirm it with the user before relying on it.
- `note`: one short sentence.

**Applying the diary.** When an event matches an entry's `when`, use its `conclusion` (type, name) without asking. If entries conflict, prefer the most recent confirmed one and tell the user about the conflict.

**Which source decides the category (personal or work), in this order:** a confirmed diary entry that names the person or pattern, then the most recent matching rule in `classification.json` (by `confirmedAt`), then the category of the calendar. The diary holds types and names; categories stay in `classification.json`.

**Writing to the diary.**
- Write an entry only when it is durable and would save the next session from rediscovering or asking again: a person or pattern the user confirmed, a tool detail you had to find out, a preference the user stated.
- At the end of every task, ask yourself whether you learned something of that kind, and if so write it before you answer. Typical cases: a connector quirk (for example, that an event `description` takes HTML as plain tags and must not be entity-escaped), what a calendar is for (a booking calendar that is all work), a person or title pattern the user explained.
- Check the existing files first. If an entry already covers it, update that file instead of adding another.
- Save the rule, **not the event**: never save event titles, descriptions or full event lists. A person's email or name may appear **only** in `when`/`conclusion` of a confirmed `person-type` entry, because that is what makes the learning useful.
- Tell the user, in one Portuguese sentence, when you save a new entry.
- Read the file back to confirm it saved.

The category rules in `classification.json` stay the only place for personal-versus-work rules; the diary holds everything finer than that. Do not duplicate one in the other.

## Conventions

- `conventions.json` is the user's. Change it only when they ask (for example "crie um tipo de evento para X") and say what you changed.
- If a file is missing, say so and recreate it with its defaults from the `start-setup` skill (`references/04-conventions-and-diary.md`); never overwrite one that exists. If the `diario/` folder is missing, create it.
