# Phase 3: save the calendars

Setup key: `calendars`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

Everything about this plugin's tools lives under the workspace's `ferramentas` folder.

1. **Folder.** If `ferramentas` does not exist at the workspace root, create it (lowercase). Then create `ferramentas/google-calendar/` if missing.
2. **Registry.** `ferramentas/AGENTS.md` lists the tools that exist in that folder.
   - If the file does not exist, create it with a short title, one sentence saying the folder holds the workspace's tools (one subfolder per tool), and the list below.
   - If it exists, keep everything in it and add the entry only if `google-calendar/` is not listed yet. Never duplicate it.
   - The entry: `- google-calendar/: Integração com o Google Agenda (plugin organizador-de-google-agenda). Para qualquer trabalho na agenda, use a skill use-google-calendar. Os arquivos desta pasta: config.json (setup e agendas integradas), classification.json (o que é pessoal e o que é trabalho), conventions.json (padrões e tipos de evento) e diario/ (um arquivo por aprendizado das sessões).`
   - Write the file's text in Portuguese, since it is the user's own workspace.
3. **Config.** Write `ferramentas/google-calendar/config.json`, preserving any other keys already in the file. Use exactly this shape (`completed` stays `false` until phase 8). If the file already exists (a redo), update only these keys and keep the rest:

```json
{
  "version": 1,
  "setup": {
    "completed": false,
    "steps": { "connection": true, "calendars": true, "conventions": false, "classification": false, "routines": false, "appearance": false }
  },
  "calendars": {
    "mode": "single",
    "totalFound": 1,
    "selected": [{ "id": "<calendar id>", "name": "<calendar name>" }]
  }
}
```

`mode` is `"single"` or `"selected"`. `totalFound` is how many calendars the connector returned. `selected` holds only what the user chose (or the single calendar).

## Done when

`ferramentas/google-calendar/config.json` exists with `steps.connection` and `steps.calendars` set to `true`, and the tool is registered in `ferramentas/AGENTS.md`.

**Next:** load `references/04-conventions-and-diary.md` and follow it. Do not load it before this phase is done.
