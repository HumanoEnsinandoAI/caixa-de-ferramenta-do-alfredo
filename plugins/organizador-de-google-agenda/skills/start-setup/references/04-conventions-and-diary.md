# Phase 4: create the conventions file and the diary folder

Setup key: `conventions`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

This file and this folder keep every session consistent. The procedures for each calendar action live in the `use-google-calendar` skill; these files hold what is the user's.

1. Create `ferramentas/google-calendar/conventions.json` **only if it does not exist** (never overwrite one the user edited):

```json
{
  "version": 1,
  "defaults": {
    "durationMinutes": 60,
    "reminders": "calendar-default",
    "guestsOnlyIfNamed": true
  },
  "readWindowDays": { "default": 7, "maxPerCall": 31 },
  "eventTypes": []
}
```

`eventTypes` starts empty. An entry looks like this (shown to the user as an example if they want to add one):

```json
{ "id": "mentoria", "name": "Mentoria", "when": { "titleContains": "mentoria" }, "titlePattern": "Mentoria com {pessoa}", "durationMinutes": 45, "notes": "" }
```

2. Create the folder `ferramentas/google-calendar/diario/` if it does not exist, and inside it `AGENTS.md` **only if it does not exist**, written in Portuguese, saying in a few lines: this folder is the journal of what the sessions learned about the calendar; each file is one learning (`AAAA-MM-DD-nome.json`); read them all before working on the calendar; the format and rules are in the `use-google-calendar` skill. Leave the folder otherwise empty: entries appear with use.

3. Read the file and folder back to confirm. Tell the user, in Portuguese, in two sentences: `conventions.json` and the `diario/` folder now exist in `ferramentas/google-calendar/`, they can edit `conventions.json` (for example to add event types), and the diary fills up as the plugin learns who and what their events are.
4. Set `setup.steps.conventions` to `true` in `config.json`.

## Done when

`conventions.json` and `diario/` exist and `setup.steps.conventions` is `true`.

**Next:** load `references/05-classification.md` and follow it. Do not load it before this phase is done.
