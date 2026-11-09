# AGENTS.md format (open format)

Summary of the AGENTS.md open format, for the thermometer to use as a reference. Sources: the [agents.md](https://agents.md/) site and the [agentsmd/agents.md](https://github.com/agentsmd/agents.md) repository, under the MIT license. The format is maintained by the Agentic AI Foundation, under the Linux Foundation. This summary does not copy the content of the sources: point the user to them when they need the full text.

## What the format says

- **It is plain Markdown.** There are no required fields and no special syntax. Any heading works.
- **It lives at the root of the repository.** In monorepos, each subproject can have its own.
- **The nearest one wins.** The agent reads the AGENTS.md closest to the file it is editing. The user's instruction in the chat overrides everything.
- **Recommended sections, not required:** project overview, build and test commands, code style, testing instructions, security considerations. Also useful: commit or pull request conventions, security pitfalls, notes on large datasets and deploy steps.
- **There is no size limit** in the format. The 200-line limit in this thermometer is a recommendation about context cost, not part of the format.
- **Compatibility:** the format is read by several tools (Codex, Jules, Aider, Cursor, Gemini CLI, VS Code, Devin, among others).
- **Migration:** whoever already uses another file name can rename it and create a symbolic link with the old name.

## What this means for the thermometer

- **Recommended sections become suggestions, not failure criteria.** An AGENTS.md without a security section does not fail for that. It can be suggested when the project has something to say about the topic.
- **The open format's precedence is not Claude Code's.** The format says the nearest one wins. Claude Code, according to its documentation, ignores AGENTS.md when a CLAUDE.md exists in the working directory or above. That is why criterion 6 is specific to Claude Code, and the rule should be read that way.
- **A symbolic link from CLAUDE.md to AGENTS.md is a recognised migration path.** Do not fail a file for that.
- **The format says nothing about `@` imports.** They belong to Claude Code. Use criterion 9 only for that.

## Site FAQ (examples section)

- **Are the commands listed executed by the agent?** The site says yes: the agent tries to run the listed checks and fixes failures before finishing. This gives weight to criterion 2: a wrong or missing command really gets in the way. Automatic execution is the format's intent. It is not confirmed for Claude Code, so the skill must not promise this to the user.
- **Can it be updated later?** Yes. The site treats AGENTS.md as a living document.

## Migration with a symbolic link

When the project uses another file name (for example CLAUDE.md), the site's recipe is to rename it and create a link with the old name:

```bash
mv CLAUDE.md AGENTS.md && ln -s AGENTS.md CLAUDE.md
```

Step 5 of SKILL.md uses this recipe when the user approves the merge. If the user prefers to delete CLAUDE.md, the link is not required.

## Configuring other tools

The site shows how to point other tools to AGENTS.md:

- Aider: in `.aider.conf.yml`, `read: AGENTS.md`.
- Gemini CLI: in `.gemini/settings.json`, `{ "context": { "fileName": "AGENTS.md" } }`.

The skill only checks whether these files exist and whether they point to AGENTS.md. This is an informative signal. It does not score and does not fail a file.
