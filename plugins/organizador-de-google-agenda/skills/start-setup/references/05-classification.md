# Phase 5: learn what is personal and what is work

Setup key: `classification`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

Goal: create `ferramentas/google-calendar/classification.json` from a first look at the user's real calendar, confirmed by the user.

1. **First sync (read only).** Following the read procedure in the `use-google-calendar` skill (`references/read.md`), read each integrated calendar from 60 days back to 30 days ahead (`list_events`, in slices of at most `maxPerCall` days, 31 by default; `classification.json` does not exist yet). Read no more than about 200 events per calendar. If a calendar has no events, say so and skip it.
2. **Propose.** Work out two kinds of proposals:
   - **Per calendar:** is this calendar personal, work or mixed? Judge by its name and its events.
   - **Per pattern** (up to 8 in total, the most frequent or most telling): a recurring title or keyword (for example "1:1", "Daily", "Academia"), or a guest/organizer email domain, together with the category it suggests.
   Categories start as `personal` and `work`. Add another only if the user asks for it.
3. **Ask the yes/no questions.** Call the tool `confirm_classification` (full name `mcp__organizador-de-google-agenda__confirm_classification`; use ToolSearch with `confirm_classification` if you do not see it). Pass `{ "items": [{ "id": "...", "question": "...", "detail": "..." }] }`: one item per proposal, `question` already in Portuguese (for example `A agenda "Trabalho" é de trabalho?` or `Eventos com "Daily" no título são de trabalho?`), `detail` with two or three example event titles. Before calling it, tell the user in one Portuguese sentence that you will ask a few yes/no questions, one at a time. It returns `{ "status": "confirmed" | "cancelled", "answers": [{ "id", "isYes" }] }`.
   - If the tool is not available, ask the same questions with a normal yes/no question, a few at a time.
   - `cancelled`: ask in Portuguese whether to try again or finish later. Save nothing for classification if they stop.
4. **Handle the "no" answers.** For each proposal the user rejected, ask in Portuguese what it is instead (personal, work or another category) and use that answer.
5. **Save.** Write `ferramentas/google-calendar/classification.json`, preserving any other keys already in the file. If the file already exists (a redo), merge: keep the rules the user already confirmed and add or change only what they confirm now. Use exactly this shape:

```json
{
  "version": 1,
  "categories": [
    { "id": "personal", "label": "Pessoal" },
    { "id": "work", "label": "Trabalho" }
  ],
  "calendars": { "<calendar id>": "work" },
  "rules": [
    {
      "id": "r1",
      "match": { "titleContains": "Daily" },
      "category": "work",
      "source": "setup",
      "confirmedAt": "<ISO 8601 timestamp>"
    }
  ],
  "askWhenUnsure": true
}
```

   `calendars` maps a calendar id to a category id. For a mixed calendar, leave it out of `calendars` and rely on `rules`. A rule's `match` uses one of `titleContains`, `attendeeDomain` or `organizerDomain`. Only confirmed proposals become rules and calendar entries.
6. Read the file back to confirm it saved. Tell the user, in Portuguese, what was learned (how many calendars and rules) and that, from now on, when a session is unsure about an event, it will ask and remember the answer.
7. Set `setup.steps.classification` to `true` in `config.json`.

## Done when

`classification.json` is saved and read back, and `setup.steps.classification` is `true`.

**Next:** load `references/06-routines.md` and follow it. Do not load it before this phase is done.
