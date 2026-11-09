# Phase 7: choose the palette and colors

Setup key: `appearance`. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

Goal: the user picks how their calendar looks (a color palette, light or dark), each category gets a color, and the colors are applied to their Google Calendar. The detailed procedure is in the `use-google-calendar` skill, `references/appearance.md`. Read that file now; this phase only decides whether and ties it to the setup.

1. **Ask.** Ask in Portuguese, with a simple choice question (AskUserQuestion, two options): do they want to choose a color palette for their calendar? Explain in one sentence: they will see previews of palettes and then pick one, and the categories learned before (personal, work and others) get a color each.
   - **No:** write `ferramentas/google-calendar/appearance.json` with `"enabled": false`, set `setup.steps.appearance` to `true`, and go to the next phase.
2. Follow `references/appearance.md` from step 1 (show the widget and ask by name) to step 3 (apply it to Google Calendar). In step 3, applying colors to **existing** events needs the user's yes, as that procedure says.
3. Read `appearance.json` back to confirm. Tell the user, in Portuguese: the palette chosen, the color of each category, and how it was applied (exact Google colors, or a manual guide if the connector has no color option). Say that Google Calendar gives an event only 11 fixed colors, so each palette has 3, and that more categories reuse a color or take one more of Google's colors. Say that they can change the palette later by asking.
4. Set `setup.steps.appearance` to `true` in `config.json`.

## Done when

`appearance.json` exists with `enabled: true` and the saved palette and assignments, or with `enabled: false` if the user declined, and `setup.steps.appearance` is `true`.

**Next:** load `references/08-finish.md` and follow it. Do not load it before this phase is done.
