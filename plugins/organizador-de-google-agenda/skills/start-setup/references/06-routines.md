# Phase 6: show Claude Code routines on the calendar

Setup key: `routines`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

Goal: let the user **see when their Claude Code routines run**, as events on Google Calendar that are **always free, never busy**: they must never block their time, and there is no exception. The detailed rules (title, description, free availability, recurrence) are in the `use-google-calendar` skill, `references/routines.md`. Read that file now; this phase only decides whether and where.

1. **Ask.** Ask in Portuguese, with a simple choice question (AskUserQuestion, two options): do they want their Claude Code routines to appear on Google Calendar? Explain in one sentence: each routine shows up as a short event with a small description, marked as free, only to show when it runs. Also say that, once this is on, the calendar updates by itself whenever a routine is created, changed or removed in Claude Code, and that they can turn it off by asking.
   - **No:** write `ferramentas/google-calendar/routines.json` with `"enabled": false` and `"items": []`, set `setup.steps.routines` to `true`, and go to the next phase.
2. **Choose the calendar.** Use `calendars.selected` from `config.json`.
   - One calendar: use it, and say which.
   - More than one: ask which one will hold the routine events (AskUserQuestion, one choice; with more than 4 calendars ask with a numbered list).
3. **Save the settings.** Write `ferramentas/google-calendar/routines.json` in the shape from `references/routines.md` with `enabled: true`, the chosen `calendarId`, `eventDurationMinutes: 15`, `horizonDays: 14` and `items: []`. Preserve any other keys.
4. **First sync.** If the connector cannot create free events, create nothing, tell the user why, and still finish this phase (set the step to `true` with `"enabled": false`, `"blockedReason": "connector cannot create free events"` and `items: []`, so the hook stays quiet; a later request to show the routines can check again and turn it on).
   Otherwise: Follow `references/routines.md` from step 1 (read the routines) to step 4 (tell the user). Create events only after showing the user, in Portuguese, the list of routines and the titles they will have, and getting a clear yes.
5. Read `routines.json` back to confirm. Tell the user, in Portuguese, that to update the calendar later they can ask for it and the `use-google-calendar` skill will sync again.
6. Set `setup.steps.routines` to `true` in `config.json`.

## Done when

`routines.json` exists and `setup.steps.routines` is `true` (with events created and checked as free, or with the feature declined, or with nothing created because there were no routines or the connector cannot create free events).

**Next:** load `references/07-appearance.md` and follow it. Do not load it before this phase is done.
