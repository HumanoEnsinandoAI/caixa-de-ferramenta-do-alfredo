# Update an event

1. Find the event with the read procedure. If more than one matches, show the candidates and ask which one.
2. **Read the event first** (`get_event`), even when the user gave you its id or link, so you know what is there now. Change **only** what the user asked to change, and keep every other field and the rest of the description. To change a link or a line inside a description, take the current text and replace only that part.
   - `description` accepts HTML. Send tags as plain tags (`<a href="...">text</a>`), **never** entity-escaped (`&lt;a href...&gt;`), or the event shows the markup as text. Moving an event keeps its duration unless a new one is given. Never change the guest list without the user naming who to add or remove.
3. Show the user, in Portuguese, what will change: before and after, per field.
4. If the change moves the event, check conflicts at the new time and tell the user.
5. For a recurring event, ask which part changes: only this one, this and the following, or all. Then wait for a clear yes to the change shown in step 3 and apply it.
   - If the connector has an update tool, use it; on first use in a session, read its parameter list.
   - If it has **no** update tool, tell the user and offer to recreate the event (delete then create). Do it only after a clear yes: the event's identity changes and guests may get new invitations. Then write a `tool` entry in `diario/` saying that no update tool exists, so the next session does not search again.
6. **Check the result.** The update returns the event: read it and confirm that the field you changed now has the value you meant (look for `&lt;` or `&amp;` in a description you wrote). If not, fix it at once and tell the user. A recurring event updated on the series id (the master) changes every occurrence; an id with a date suffix changes only that occurrence.
7. Confirm what changed, in Portuguese. If you learned something durable, write the diary entry (`SKILL.md`).
