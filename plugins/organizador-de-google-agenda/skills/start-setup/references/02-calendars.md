# Phase 2: check the calendars and choose which to integrate

Setup key: `calendars (decided here, saved in phase 3)`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

Make one read with no side effects: `list_calendars`. If it fails, go back to phase 1 (`references/01-connect.md`).

Keep only calendars that make sense to organize. If the result includes an access role or type, set aside calendars that are read-only or automatic (for example holidays and birthdays), but mention them to the user and let them include those if they want.

- **Exactly one calendar:** nothing to ask. Tell the user, in Portuguese, which calendar was found. Remember `mode: "single"` for phase 3.
- **More than one calendar:** ask which ones the user wants to integrate. At least one must be chosen. Remember `mode: "selected"` for phase 3.
  1. **Preferred: the plugin's question tool.** The plugin registers a tool named `select_calendars` (full name `mcp__organizador-de-google-agenda__select_calendars`). If you do not see it, use ToolSearch with `select_calendars`. Call it with every calendar found: `{ "calendars": [{ "id": "...", "name": "...", "note": "..." }] }` (`note` is optional, for things like "somente leitura"). It asks the user, one calendar at a time, in the engine's own question dialog ("Incluir a agenda X na integração?", Sim or Não), then it returns `{ "status": "confirmed" | "cancelled", "selected": [ids] }`.
     - `confirmed`: use `selected` as the chosen calendars.
     - `cancelled`: ask in Portuguese whether to try again or finish the setup later. Do not save anything if they stop.
     Before calling it, tell the user in one Portuguese sentence that you will ask about each calendar, and that at least one must stay in.
  2. **Fallback, when the tool is not available:** a yes/no question for each calendar (AskUserQuestion), or a numbered list where the user types the numbers.

## Done when

you know which calendars the user wants to integrate, and `mode` (`single` or `selected`). Nothing is saved yet in this phase.

**Next:** load `references/03-save-calendars.md` and follow it. Do not load it before this phase is done.
