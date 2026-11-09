# Detailed criteria

Each criterion is worth one point. Before scoring, check whether it applies. A criterion that does not apply is removed from the count (N/A) and is not a failure.

## Score

- Applicable: the criteria that are not N/A.
- Met: how many of them the file meets.
- Score from 0 to 5: `round(5 × met ÷ applicable)`, with 0.5 rounded up.
- Critical: if criterion 1 or 8 fails, the colour is red, even with a high score.
- Recommended sections from the open format (overview, commands, style, testing, security) are suggestions, not failure criteria. See `agents-md-format.md`.

## 1. Size (critical)

- Signals: `lines`, `characters`, `critical_over_200_lines`, `critical_over_20000_chars`, `imports`.
- Met: up to 200 lines and up to 20,000 characters in the file itself. Both measures count, because a few very long lines also weigh.
- Summed cost: what loads together with the file counts. Add:
  - the `@import` files (signal: `imports[].characters`), because they always load together;
  - the files the text tells the agent to read without a condition, such as "read `GLOSSARY.md`" in a sentence that applies to every task, because Claude will load all of them.
- Not added: a reference with a task condition, such as "for deploys, read `deploy.md`". It loads only when the task comes up. If the file has no split by task, all references count as unconditional.
- Critical failure: going over any limit, adding up the cost above. Propose the split (step 5 of SKILL.md).

## 2. Exact commands (development projects only, root file only)

- N/A: `is_dev_project` is false, or the file is in a subfolder (it is loaded on demand and is not the overview).
- Met: includes at least one test command and one build or lint command, written as they are typed, and every command cited exists. Signal: `commands_cited`, with `exists` true, false or null.
- `exists: null` is a tool the script does not check (pytest, go, cargo, npx). Check it by reading the project.
- Failure: there is no test or build command, or some command has `exists: false`. "Run the tests" alone does not count.

## 3. Examples when they are needed

Depends on reading, not on counting. Having a code block is not enough.

An example is needed when the agent has to produce something with a format that cannot be inferred from the sentence:

- output format, such as JSON, a table or a report;
- schema or file structure;
- template for a commit, a pull request or a document;
- naming convention with a specific pattern.

It is not needed when the instruction is a simple behaviour rule, such as "do not change files without asking".

- No example needed: met.
- Needed and has one: met. Signal: `blocks_with_example_hint`, which only points to candidates.
- Needed and missing: failure. Propose a short example in the right place.
- Long example (`long_blocks_over_30_lines`): met, but propose moving the example to a separate referenced `.md`.

## 4. No noise

Fails if any of these is present:

- Generic phrases that do not change behaviour, such as "write clean code", "follow best practices" or "clean code". Signal: `generic_phrases`. The script detects both English and Portuguese phrases, because the target project may be written in either.
- A directory tree drawn with `├──`, `└──`, `|--` or similar. Signal: `tree_lines`. Trees go out of date. If the `/doctor` report already covered this, this point is removed from the count.

Folders are allowed, under these rules (signal: `folder_lines`):

- Each folder on one line, with up to 80 characters for the whole line. Example: "`api/`: server handlers".
- At most 10 folder lines in the file. If there are more, the mention goes into the AGENTS.md of that folder itself.
- A folder line over 80 characters: propose shortening it.

## 5. Done-criterion (only if the project has one, only in the root file)

- N/A: the file is in a subfolder, or `done_files` and `ci_workflows` are empty. A Makefile without a verification target does not count.
- Met: the project has a done-criterion (CI workflow, verification target in the Makefile, CONTRIBUTING.md, pull request template, pre-commit) and the file cites it by name or by command.
- Failure: the project has such a criterion, but the file does not mention it. Propose a line citing the command or the file.

## 6. File that loads (precedence)

Applies only to AGENTS.md and to the CLAUDE.md of each folder, and depends on the `loads_when` signal.

- AGENTS.md that loads (at start or on demand, with no CLAUDE.md blocking it): met.
- AGENTS.md ignored: failure. A CLAUDE.md in the working directory or above exists that is not just `@AGENTS.md`. Propose the step 5 path for the CLAUDE.md that blocks it.
- CLAUDE.md that only imports `@AGENTS.md`, or is a link to it: met.
- CLAUDE.md with its own content: failure, because the AGENTS.md in that folder is ignored. The proposal depends on the case-by-case analysis (step 5). There is no fixed rule to delete.
- CLAUDE.local.md: N/A. It is personal and not versioned. It blocks the AGENTS.md, and this shows in the signal, but the proposal does not merge it into the versioned file.

## 7. Live references

- N/A: the file does not cite paths or commands, or the `/doctor` report already covered the references.
- Met: every path in backticks (`path_references`) exists, and every command (`commands_cited`) exists or is null.
- Failure: some path with `exists: false`, or a command with `exists: false`. Commands already scored in criterion 2 do not count again here. Propose fixing or removing the line.

## 8. No secrets (critical)

- Signal: `suspected_secrets`. The script never prints the value.
- Met: no secret, key or password in plain text.
- Critical failure: any secret. Warn the user without repeating the value, and propose removing it and rotating it.

## 9. Imports with `@`

- N/A: the file has no `@` pointing to a file (`imports` is empty). Mentions such as `@alfredo` or `@types/node` are not imports.
- Met: each import points to a file that exists, up to 20,000 characters, and the imported content is needed in every session.
- Failure: broken import, import over 20,000 characters, or content needed only sometimes loaded by `@`. Propose replacing it with a text reference and the condition to read it. The import does not reduce the cost: it loads together with the file that imports it.

## Colours

- 0 and 1: 🟥 red
- 2: 🟧 orange
- 3: 🟨 yellow
- 4 and 5: 🟩 green
- Critical (criterion 1 or 8): 🟥 red, marked as `critical`.
