---
name: agents-md-thermometer
description: Run this right after you create or rewrite any AGENTS.md or CLAUDE.md (any folder, including a parent folder of projects), and whenever someone asks whether these files are good, too big, well organized, or to review, trim, split or merge them. Scores each file from 0 to 5 for quality and context-window weight and proposes changes, without applying anything. Not for other .md files or small edits.
user-invocable: false
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/signals.py *) Bash(py -3 ${CLAUDE_SKILL_DIR}/scripts/signals.py *)
---

# AGENTS.md thermometer

Checks the agent instruction files of the project. Their content goes into the context window, which is why this check exists. The skill reads and reports, and proposes changes. It does not edit any file without explicit approval from the user.

- Scripts: `${CLAUDE_SKILL_DIR}/scripts/signals.py`, standard library only. Prints JSON with signals.
- Criteria: `${CLAUDE_SKILL_DIR}/reference/criteria.md`. Read it before scoring.
- Open AGENTS.md format: `${CLAUDE_SKILL_DIR}/reference/agents-md-format.md`. Read it when the question is what the format requires or recommends.

Run the scripts in the current working directory, without `cd`. On Windows, use `py -3` instead of `python3`.

## Language

This file is in English. Everything the user reads is in Brazilian Portuguese (pt-BR): the table, the proposals, the warnings and the questions. Those texts are given below, in the exact language to use. Reasoning and internal steps stay in English.

## Step 0: /doctor report

First, ask the user, in pt-BR, to run `/doctor prompt-audit` if they have not run it yet. Suggested text:

> Antes de analisar, rode `/doctor prompt-audit` no Claude Code e me traga o relatório, se puder. Ele verifica CLAUDE.md, CLAUDE.local.md, AGENTS.md e skills em busca de instruções desatualizadas, conflitantes e referências quebradas. Pode gerar CLAUDE.md novos, e tudo bem: esta análise vem depois e ajusta esses pontos.

If the user brings the report, use it. What it already covers is removed from the count of criteria 7 and, for the tree lines, from criterion 4. If there is no report, continue the analysis without it and say, in pt-BR, that `/doctor` was not run.

## Step 1: list

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/signals.py list
```

The output has, for each file, `lines`, `characters` and `loads_when` (`at start`, `on demand` or `ignored`), plus `blocking_claude_md`, the CLAUDE.md files that block the AGENTS.md. If `files` is empty, tell the user in pt-BR: "Não encontrei AGENTS.md nem CLAUDE.md neste projeto." Then stop.

## Step 2: understand the project

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/signals.py project
```

The output says whether the project is a development project (`is_dev_project`), which commands exist (`candidate_commands`), which targets are verification targets (`verify_targets`), and which done-criteria files exist (`done_files`, `ci_workflows`). These data decide criteria 2 and 5. If the project is not code, confirm by reading it and mark those criteria as N/A.

## Step 3: check each file

For each file:

1. Run `python3 ${CLAUDE_SKILL_DIR}/scripts/signals.py file PATH`.
2. Read the whole file.
3. If `loads_when` is `ignored`, score only criterion 6. The others do not apply to a file that is not loaded.
4. Otherwise, assess the nine criteria in `reference/criteria.md`. Two are critical: size (1) and secrets (8).
5. A criterion that does not apply is removed from the count. The score is `round(5 × met ÷ applicable)`, with 0.5 rounded up.

The script signals are hints. When a signal and the reading disagree, follow the reading and say why, in pt-BR. An example is required only if the agent needs a format. It is not required for simple rules.

## Step 4: present (pt-BR)

Show the user a table from worst to best, with these column headers, in pt-BR: **arquivo | linhas | nota | problemas**. In the problems column, one line per failed criterion, in pt-BR.

Colours:

- 0 and 1: 🟥 red
- 2: 🟧 orange
- 3: 🟨 yellow
- 4 and 5: 🟩 green

Write the score as `🟩 4/5`. If the file has a critical failure, the cell reads `🟥 crítico 4/5`, and the colour is red even with a high score. After the table, say in one pt-BR sentence which files are critical.

## Step 5: propose, do not apply (pt-BR)

For each failure, show the original text and the expected result, in pt-BR. Do not change anything until the user approves. Use the proposal format below, with the labels in pt-BR.

- **Approved merge (CLAUDE.md into AGENTS.md):** if the user wants to keep the old name as a link, propose `mv CLAUDE.md AGENTS.md && ln -s AGENTS.md CLAUDE.md`. If the user prefers to delete it, propose only removing the file after checking the merged content. See `agents-md-format.md`.
- **Aider or Gemini CLI configured for another file:** if the `agent_tools` signal shows the configuration points to another name, propose switching to AGENTS.md. This is informative, not a failure.
- **CLAUDE.md that blocks AGENTS.md:** the decision is an analysis, case by case. There is no fixed rule to delete. Read the content:
  - A CLAUDE.md that only imports `@AGENTS.md` or links to it does not block; nothing to propose.
  - A CLAUDE.md with its own versioned content: propose merging it into AGENTS.md and deleting the CLAUDE.md.
  - CLAUDE.local.md, for personal use: do not merge it into the versioned AGENTS.md, because it would leak private notes. Propose adjusting the precedence, for example moving what is for everyone into AGENTS.md and leaving only the personal part in the local file.
- **Missing example:** propose a short example, at the point of the file where the format is used. If the example goes over 30 lines, propose a separate `.md`, referenced from the text.
- **File over 200 lines or 20,000 characters, or with mixed areas:** propose a split. Each piece goes to a destination:
  - **AGENTS.md inside the area's subfolder.** It loads when Claude reads a file in that folder. If the subfolder has a CLAUDE.md, that one blocks it: warn the user and propose dealing with it first. According to the documentation, a subfolder AGENTS.md only loads through the Read tool when a CLAUDE.md exists above it. Tell the user that.
  - **Separate `.md` file, referenced from AGENTS.md.** For long or single-task procedures. In place of the piece, one line with the condition to read it, for example: "Para deploy, leia `deploy.md`".
- **Noise from a folder tree:** replace the tree with one line per folder, of up to 80 characters.
- **Existing done-criterion not cited:** propose one line citing the command or the file.
- **Path or command that does not exist:** propose fixing or removing the line.
- **Secret:** warn the user without repeating the value, and propose removing it and rotating it.
- **Import that loads content only sometimes:** propose replacing the `@` with a text reference with the condition to read it.

The root AGENTS.md keeps the short overview, the main commands, the conventions for the whole project and the definition of done.

Proposal format (labels in pt-BR, shown to the user):

```text
Arquivo: AGENTS.md (412 linhas)
- Linhas 1 a 40 → ficam (visão geral e comandos)
- Linhas 41 a 120 (deploy) → deploy.md; no lugar: "Para deploy, leia deploy.md"
- Linhas 121 a 200 (frontend) → frontend/AGENTS.md
Resultado esperado: raiz com 60 linhas, cada arquivo novo com menos de 200.
```

Do not use `@import` for content that should load only when needed. The import loads together with the file that imports it, so it does not reduce the cost.
