# Create an event

Read `conventions.json` first: it holds the user's defaults and event types.

1. Read `config.json`, `classification.json` and `conventions.json` (in `ferramentas/google-calendar/`), and use the diary already read in this session (`SKILL.md`). If a diary entry matches the request (a person, a title pattern), apply its event type, name and category.
2. Work out the details from the request: title, date, start, end or duration, location, guests.
3. **Event type.** If the request matches an entry in `conventions.json` `eventTypes` (by `when`), apply that type's `titlePattern`, `durationMinutes` and `notes` on top of `defaults`.
4. **Defaults** (from `conventions.json` `defaults`, used when the request does not say otherwise): duration in `durationMinutes`; the calendar's own time zone, never a guessed one; reminders as the calendar's default; guests only when the user named them.
5. **Pick the calendar.**
   - Decide the category (personal or work) in the order `SKILL.md` gives: a confirmed diary entry, then `classification.json` `rules` (most recent first), then the calendar's own category in `calendars`.
   - Use the integrated calendar (`config.json` `calendars.selected`) that matches. If exactly one matches, use it.
   - If there is doubt (no rule fits, or two calendars fit), ask the user in Portuguese, then record the answer: a personal/work rule in `classification.json` (`"source": "asked"`), or a finer learning (a person's event type or name) as a new file in `diario/`.
6. If a required detail is missing (date or start time), ask. Do not invent it.
7. **Conflicts.** Read that day with the read procedure. Routine events (in `routines.json`) are free and do not count as busy. If the slot is busy, tell the user and ask before creating.
8. **Color.** If `appearance.json` exists and is enabled, use the color assigned to the event's category in `assignments`, as `references/appearance.md` (step 4) says.
9. Call the connector's `create_event`. On first use in a session, read the tool's parameter list and map the fields exactly. A `description` accepts HTML: send tags as plain tags, never entity-escaped (`&lt;`).
10. Read what the tool returned and check title, time, calendar and color. Then confirm to the user, in Portuguese: title, date and time, calendar.
11. If the user asked for a kind of event that is not in `eventTypes` and says it will repeat, offer to add it as a new event type in `conventions.json`.
