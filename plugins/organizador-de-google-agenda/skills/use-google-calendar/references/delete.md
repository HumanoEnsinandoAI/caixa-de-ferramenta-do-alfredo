# Delete an event

Deleting is hard to undo and can notify guests.

1. Find the event with the read procedure. If more than one matches, show the candidates and ask which one.
2. Show the user, in Portuguese: title, date, time, calendar, and whether it has guests. For a recurring event, ask which part goes (only this one, this and the following, or all) and say it back.
3. Confirm: ask and wait for a clear yes. This is always mandatory: there is no setting that turns it off.
4. Delete one event at a time. For several, list them all and confirm once, naming how many.
5. Call the connector's `delete_event` for that event on that calendar. On first use in a session, read its parameter list.
6. Confirm to the user which event was deleted.
