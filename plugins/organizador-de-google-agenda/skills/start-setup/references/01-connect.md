# Phase 1: connect Google Calendar

Setup key: `connection`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

The plugin runs on the official **Google Calendar** connector. The plugin never stores passwords or tokens: the user authorizes access in their own Google account.

Look for Google Calendar tools among the available tools (for example `list_calendars`, `list_events`, `create_event`). If needed, use ToolSearch with the word "calendar".

- **Tools exist and work:** go to the next phase.
- **No tools exist (case A):** search the connector registry (`search_mcp_registry` with `google`, `calendar`) and show the "Connect" card (`suggest_connectors`, passing the Google Calendar id as a list: `uuids: ["<directoryUuid>"]`; a bare `directoryUuid` is refused with "expected array, received undefined at uuids"). Tell the user in one sentence: click Connect and authorize with your Google account; you only read or write to the calendar when they ask.
- **Tools exist but ask for authentication, `needs_auth` (case B):** ask the user to type `/mcp` in this session, open Google Calendar and sign in. Use `suggest_connectors` if the card can be shown.
- **The app shows no card (case C):** give the manual path: Configurações > Conectores > Google Agenda > Conectar.

Then ask the user to tell you when they are done. Never try to authorize on their behalf and never ask for a password, token or API key. If the user says they do not want to use Google Calendar right now, stop and respect that.

## Done when

Google Calendar tools exist, work and answer a read (for example, `list_calendars` returns the user's calendars). Nothing is saved yet in this phase.

**Next:** load `references/02-calendars.md` and follow it. Do not load it before this phase is done.
