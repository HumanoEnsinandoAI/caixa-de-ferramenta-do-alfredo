# Read events

Read only what the answer needs, never the whole calendar. `classification.json` may not exist yet (during the setup): then skip categories. Never ask for more days than `maxPerCall` in one call; read longer ranges in slices of that size.

1. Read `config.json` for the calendar ids, `classification.json` for categories, `conventions.json` for `readWindowDays`, and use the diary already read in this session (`SKILL.md`). Use diary entries to recognize people and event types in the results.
2. Turn the request into a **time window** (default: `readWindowDays.default` days from today) and, if it names a topic, person or category, a filter.
3. Pick the tool by what the request needs:
   - A specific thing ("a reunião com a Ana", "o dentista"): `search_events` with that text and the window.
   - A period ("minha semana", "amanhã"): `list_events` with the window, once per integrated calendar.
   - One event already identified: `get_event`.
4. Never read more than `readWindowDays.maxPerCall` days in one call. For longer reports, go in slices and summarize each slice before the next.
5. Events that belong to Claude Code routines (listed in `routines.json`) are free and are not personal or work: leave them out of answers and reports unless the user asks for them.
6. Filter by category using `classification.json` when the request is about personal or work. An event with no rule is **unclassified**: say so, do not guess silently, and ask when it matters.
7. For reports: count and group (by day, by category, by calendar) and show totals and highlights. Do not paste every event.
8. Answer in Portuguese, dates as dd/mm, times in 24h.

On first use in a session, read each tool's parameter list and map the window and filters exactly.
