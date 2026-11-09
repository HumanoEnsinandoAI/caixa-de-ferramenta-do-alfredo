# Phase 8: finish

This phase has no key of its own: it closes the setup. Language: talk to the user in Brazilian Portuguese (pt-BR); this file is instructions for you.

When every key in `setup.steps` is `true`, set `setup.completed` to `true` and `setup.completedAt` to the current ISO 8601 timestamp in `config.json`. Read it back to confirm. Then tell the user, in Portuguese: the setup is done, which calendars are integrated, and where everything was saved (`ferramentas/google-calendar/`). From now on, the `use-google-calendar` skill handles any calendar work.

## Done when

`setup.completed` is `true` and the user was told the setup is done.
