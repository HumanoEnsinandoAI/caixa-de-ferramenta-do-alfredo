# Palette and colors

How the user's calendar looks: which palette they chose, which color each category has, and how colors are applied. Used by the setup (`start-setup`, phase 7), when a new category appears, and whenever the user asks to change the palette or recolor events. Everything is saved in `ferramentas/google-calendar/appearance.json`.

The palettes live in the plugin's `utils/palettes/` folder (`light-palettes.ts`, `dark-palettes.ts`, joined by `index.ts`): `id`, `name`, `mode` (`light` or `dark`), `description`, and 3 colors in this order: work, personal, routines. Each palette carries `colors` (hex), `colorIds` (Google's event `colorId`, "1" to "11") and `colorNames` (Google's names, such as Tomato). The palettes use only Google's 11 fixed event colors, because that is all the connector accepts. You normally get them from the `list_palettes` tool, not from the files. The visual preview is `palette-widget.html`, in this same folder.

## `appearance.json`

```json
{
  "version": 1,
  "enabled": true,
  "mode": "light",
  "palette": { "id": "argila", "name": "Argila", "colors": ["#D50000", "#F4511E", "#616161"], "colorIds": ["11", "6", "8"], "colorNames": ["Tomato", "Tangerine", "Graphite"] },
  "assignments": { "work": "#D50000", "personal": "#F4511E", "routines": "#616161" },
  "googleColors": { "work": "11", "personal": "6", "routines": "8" },
  "applied": { "method": "exact", "scope": "none", "at": "<ISO 8601 timestamp>" }
}
```

`assignments` maps a category id (from `classification.json`) to one hex color of the palette, plus the special key `routines` for the Claude Code routine events. `googleColors` holds the same choice as the Google `colorId` of each category (a string from `"1"` to `"11"`, taken from `palette.colorIds` at the same position as the hex): **this is the value you send to the connector**. Keep `assignments` and `googleColors` in step, with exactly the same keys. Write the file with every field shown above, nothing invented, and read it back. `applied.method` is `exact` (the colors were sent as Google `colorId`s, so there is no approximation), `manual` (the connector has no color option and the user was shown the codes) or `none`.

## 1. Show the palettes and let the user choose

1. **Get the palettes.** Call the tool `list_palettes` (full name `mcp__organizador-de-google-agenda__list_palettes`; use ToolSearch with `list_palettes` if you do not see it). It returns `{ "palettes": [...] }`. If the tool is not available, read the files in the plugin's `utils/palettes/` folder (`${CLAUDE_PLUGIN_ROOT}/utils/palettes/`): they are plain data lists.
2. **Show the widget.** Read `palette-widget.html`. If a widget tool exists (`show_widget` from the visualize server; load its guidance with `read_me` first), replace `__PALETTES__` in the template with the `palettes` array as JSON, and show the result as the widget. It has a simulated week of the calendar, the palette's name on top, arrows to go from one palette to the next, a light/dark switch and the color codes. Tell the user, in one Portuguese sentence, to browse with the arrows and then choose by name below. If no widget tool exists, say that the preview is not available here and go on.
3. **Ask by name.** Right after the widget, call the tool `pick_palette` (full name `mcp__organizador-de-google-agenda__pick_palette`; use ToolSearch with `pick_palette` if you do not see it). It takes no arguments, asks in the engine's question dialog first for light or dark, then for the name, three at a time with a "Ver mais" option (the user can also type a name), never showing colors, and returns `{ "status": "confirmed", "palette": { "id", "name", "mode", "description", "colors" } }` or `{ "status": "cancelled" }`. If the tool is not available, print the numbered names and ask for the number.
4. `cancelled`: ask in Portuguese whether to try again or leave it for later. Save nothing if they stop.
5. Use the `mode` and `colors` of the palette you got (or found in the files for the chosen name).

## 2. Hand out the colors

- Categories come from `classification.json` (`personal`, `work` and any other), plus `routines`.
- Propose, in Portuguese, a short table "categoria → cor" and ask for a yes or the changes they want. Default: the first color of the palette for `work`, the second for `personal`, the third for `routines`. The palette's order was chosen for this.
- **Other categories (4th and beyond):** a palette has only 3 colors. Tell the user and ask, in Portuguese, with a simple choice question (AskUserQuestion): reuse the color of one existing category, or choose one more of Google's 11 colors that the palette does not use (name the options by Google's color name). Save their choice in `assignments`. Never pick for them.
- Save `appearance.json` now, with `applied.method: "none"`, and read it back.

## 3. Apply it to Google Calendar

What the Google Calendar connector accepts, tested live (do not search for it again, but confirm the tool names in this session):
- `create_event` and `update_event` take `colorId`, a string from `"1"` to `"11"`. Anything else is refused with "Invalid color_id": `"12"`, `"24"` and a hex string like `"#C05476"` were all refused. So an event can only have one of Google's 11 fixed colors, and the palettes use only those, which is why the application is exact.
- `availability` (`AVAILABILITY_FREE`) and `notificationLevel` (`NONE`) work on both tools. `update_event` has no recurrence field.
- The connector cannot create or edit a calendar's labels (the "marcadores" in Google Calendar, which allow any hex color) and an event has no label field there. Do not promise colors beyond the 11. If a future connector shows an `eventLabelId` field, tell the user that it exists and ask before changing the approach.

If `create_event` has no `colorId` (the connector changed): do not change any event, tell the user in Portuguese the color of each category by Google's name, and say that they can set it by hand in Google Calendar. Save `applied.method: "manual"`.

Otherwise `applied.method` is `exact`: write `appearance.json` with `applied.method: "exact"` and, in Portuguese, show the user the table "categoria → cor do Google (nome)". Continue after a yes.

**Existing events (only if `applied.method` is `exact` and the connector can update an event):**
1. Scope: from today to 30 days ahead, unless the user asks for another range. Do it for **every integrated calendar** (`config.json` `calendars.selected`), one by one.
2. **Build the list from the connector, not from memory.** List each calendar for the whole window (slices of at most `readWindowDays.maxPerCall` days, and inside a slice follow the `pageToken` until it is empty) and decide the category of every event with the rules in `SKILL.md`. Write a table to a temporary scratch file with: calendar, event id, category, current `colorId`, and work from that file. Never count events by eye: counting by eye is how an event was once left out.
3. **Use everything already known before asking.** An event has a category if a confirmed diary entry, a rule in `classification.json` or the calendar's own category says so. The organizer does not matter for this: an event organized by someone else is classified like any other (for example, a meeting whose organizer or guests are from a domain the user confirmed as work is work).
4. **Events with no category yet:** do not leave them out and do not just ask. Propose a category yourself when it is obvious from the title and context (repairs, home, health, family, errands, shopping, leisure: personal; clients, company domains, projects, meetings about work: work) and put them in the confirmation of step 5 under "sugeridos", each with the category you propose. Ask only for the ones that are really unclear. After the yes, offer to save a rule for each suggestion (`SKILL.md`, Classification).
   **Events organized by someone else** get their color like the rest: the color is per person, so it only changes how the event looks to the user, never for the organizer or the guests. Say that in one sentence.
5. Show the user, in Portuguese, the counts per category (and per calendar), up to five example titles, and the list of "sugeridos" with the proposed category. Only events that have no way to be classified are left out, and you say how many. Ask for **one** clear yes. If there are more than 100 events, say so and ask again before going on.
6. Change **only the color** of each event (`colorId`, nothing else), always with `notificationLevel: NONE`. For a recurring event, change each occurrence in the window (an occurrence id has a date suffix), not the whole series.
7. **Check the result.** List the same window again, on every calendar, and compare with the table from step 2: every event that was meant to change must now have the `colorId` of its category. Fix any that did not, once. Tell the user the real numbers (changed, failed, left out) and, if anything is still different, name it.
8. Save `applied.scope`, `applied.at` and read `appearance.json` back.

If there is no update tool, tell the user that existing events keep their colors, and that new events will get the new colors.

## 4. New events

When creating an event (`create.md`) or a routine event (`routines.md`), send as `colorId` the value of its category in `googleColors`. If `appearance.json` is missing or `enabled` is false, create the event without a color.

## Rules

- Colors are only a look. Never change anything else about an event, never reclassify, never delete.
- The user can change palette at any time: run this procedure again, from step 1.
- Do not save event contents. `appearance.json` holds only the palette, the assignments and how they were applied.
