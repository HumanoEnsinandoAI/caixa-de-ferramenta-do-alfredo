#!/usr/bin/env python3
"""Deterministic signals for the AGENTS.md thermometer.

Standard library only. Prints JSON with hints; the judgement belongs to Claude,
following reference/criteria.md. A hint is not a verdict: when the reading of the
file disagrees with a signal, the reading wins.

Usage, from the current working directory (no cd):
  python3 signals.py list          instruction files and when each one loads
  python3 signals.py project       whether it is a development project, commands, done-files
  python3 signals.py file PATH     signals for one file
"""
import json
import os
import re
import sys

NAMES = {"AGENTS.md", "CLAUDE.md", "CLAUDE.local.md"}
IGNORED_DIRS = {"node_modules", ".git", ".venv", "venv", "vendor", "dist", "build", "target",
                ".next", "coverage", "__pycache__"}

LIMIT_LINES = 200
LIMIT_CHARS = 20_000
LIMIT_BLOCK = 30
LIMIT_FOLDER_LINE = 80
LIMIT_FOLDER_LINES = 10
COMMAND_LANGUAGES = {"", "bash", "sh", "shell", "zsh", "console"}
FILE_EXTENSIONS = (
    "md|mdx|txt|json|ya?ml|toml|ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|sh|css|html|svg|"
    "png|lock|env|sql|cfg|ini"
)

# Files that mark a development project (lockfiles included).
DEV_MARKERS = [
    "package.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "package-lock.json",
    "pyproject.toml", "setup.py", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml",
    "build.gradle", "Gemfile", "Makefile", "Dockerfile", "pubspec.yaml", "composer.json",
    "CMakeLists.txt", ".github/workflows",
]

# Targets that count as verification. A Makefile without them does not make criterion 5 applicable.
VERIFY_TARGETS = {"test", "tests", "check", "lint", "ci", "verify"}

# Done-criteria of the project. A Makefile counts only if it has a verification target.
DONE_FILES = [
    ".github/workflows", ".github/pull_request_template.md", "CONTRIBUTING.md",
    ".pre-commit-config.yaml", ".husky",
]

# Install commands and default npm scripts that do not appear in the package.json "scripts".
BUILTIN_PM = {
    "npm install", "npm i", "npm ci", "npm test", "npm t", "npm start", "npm stop", "npm restart",
    "pnpm install", "pnpm i", "yarn install", "bun install",
}

# Filler phrases, in English and Portuguese, because the project being checked may use either.
GENERIC_PHRASES = [
    "write clean code", "clean code", "follow best practices", "best practices",
    "use descriptive names", "descriptive names", "be clear", "keep the code simple",
    "escreva código limpo", "código limpo", "siga as boas práticas", "boas práticas",
    "use nomes descritivos", "nomes descritivos", "seja claro", "mantenha o código simples",
]

# Secret patterns. The value is never printed, only the type and the line.
SECRETS = [
    ("Anthropic key", re.compile(r"sk-ant-[A-Za-z0-9_-]{10,}")),
    ("OpenAI key", re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}")),
    ("Stripe key", re.compile(r"(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}")),
    ("AWS key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("GitHub token", re.compile(r"(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}")),
    ("Slack token", re.compile(r"xox[abprs]-[A-Za-z0-9-]{10,}")),
    ("Google key", re.compile(r"AIza[0-9A-Za-z_-]{35}")),
    ("JWT", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("private key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    # Requires a digit in the value: "Password: minimum 8 characters" does not match.
    ("password or token in plain text", re.compile(
        r"(?i)(?<![A-Za-z0-9])(password|passwd|senha|secret|api[_-]?key|token)\s*[:=]\s*(?=\S*\d)\S{8,}")),
]

# Trees: ├── └── with or without the │ indent, the ASCII version of tree, and the "+--" format.
# A markdown table such as |--|--| is left out because it has more than one "|".
TREE = re.compile(r"^\s*(?:[│ ]*[├└]─|\|\s?--(?!-)[^|]*$|`--|\+--)")
EXAMPLE_TITLE = re.compile(r"^#{1,6}\s*(exemplos?|examples?)\b", re.IGNORECASE)
EXAMPLE_WORD = re.compile(r"\b(exemplos?|examples?)\b", re.IGNORECASE)
FENCE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
COMMAND_PM = re.compile(r"^(npm|pnpm|yarn|bun|make)(\s|$)")
COMMAND_OTHER = re.compile(r"^(pytest|uv|ruff|go|cargo|mvn|gradle|tsc|eslint|vitest|jest|npx)(\s|$)")
COMMAND_PYTHON = re.compile(r"^python3?\s+-m\s+(pytest|unittest)(\s|$)")
FOLDER_CODE = re.compile(r"`[A-Za-z0-9_][\w.\-]*(?:/[\w.\-]+)*/`")
FOLDER_LOOSE = re.compile(r"(?<![\w/.\-])[A-Za-z0-9_][\w.\-]*/(?=[\s`,.;:)]|$)")
FOLDER_WORD = re.compile(r"\b(folders?|directories?|diret[óo]rios?|pastas?|directory|pasta)\b", re.IGNORECASE)
FILE_REF = re.compile(r"`((?:[\w.\-]+/)*[\w.\-]+\.(?:%s))`" % FILE_EXTENSIONS)
FOLDER_REF = re.compile(r"`((?:[\w.\-]+/)+)`")
IMPORT = re.compile(r"(?<![\w`@.])@((?:\.{1,2}/|~/)?[\w@.~/-]*[\w])")


def read_lines(path):
    """Lines of the file. Same method in every mode, so the counts match."""
    with open(path, encoding="utf-8-sig", errors="replace") as f:
        return f.read().splitlines()


def chain(root):
    """The working directory and all its parents, up to the filesystem root."""
    folders, current = [], os.path.realpath(root)
    while True:
        folders.append(current)
        parent = os.path.dirname(current)
        if parent == current:
            return folders
        current = parent


def only_imports_agents(path):
    """A CLAUDE.md that only imports @AGENTS.md, or that is a link to another file: does not block AGENTS.md."""
    if os.path.islink(path):
        return True
    non_empty = [l.strip() for l in read_lines(path) if l.strip()]
    return bool(non_empty) and all(re.fullmatch(r"@(\./)?AGENTS\.md", l) for l in non_empty)


def blocking_claude_md(root):
    """CLAUDE.md, CLAUDE.local.md or .claude/CLAUDE.md in the working directory or above.

    According to the documentation, AGENTS.md is ignored when one of them exists. The global
    ~/.claude/CLAUDE.md does not count; only the .claude/CLAUDE.md of the working directory
    itself or of a folder above it.
    """
    home = os.path.realpath(os.path.expanduser("~"))
    found = []
    for folder in chain(root):
        for candidate in ("CLAUDE.md", "CLAUDE.local.md", os.path.join(".claude", "CLAUDE.md")):
            if candidate.startswith(".claude") and folder == home:
                continue
            path = os.path.join(folder, candidate)
            if os.path.isfile(path) and not (
                    os.path.basename(path) == "CLAUDE.md" and only_imports_agents(path)):
                found.append(path)
    return found


def loads_when(path, root, blocking):
    """Hint of when Claude Code reads the file. Check the documentation if in doubt.

    Returns (value, reason). value is "at start", "on demand" or "ignored"; reason is set only when ignored.
    """
    real = os.path.realpath(path)
    folder = os.path.dirname(real)
    if os.path.basename(folder) == ".claude":
        folder = os.path.dirname(folder)
    at_start = folder in set(chain(root))
    blocked = any(os.path.realpath(b) != real for b in blocking)
    # A CLAUDE.md of the folder itself also blocks its AGENTS.md, unless it only imports AGENTS.md.
    own = [n for n in ("CLAUDE.md", "CLAUDE.local.md")
           if os.path.isfile(os.path.join(folder, n)) and os.path.realpath(
               os.path.join(folder, n)) != real
           and not (n == "CLAUDE.md" and only_imports_agents(os.path.join(folder, n)))]

    if os.path.basename(path) == "AGENTS.md":
        if blocked or own:
            return "ignored", "a CLAUDE.md in the working directory or above"
        if not at_start:
            return "on demand", None
        return "at start", None
    if at_start:
        return "at start", None
    return "on demand", None


def ancestors_up_to_repo(root):
    """Folders above the working directory, up to the git repository root (inclusive) or the home folder."""
    home = os.path.realpath(os.path.expanduser("~"))
    above = []
    for folder in chain(root)[1:]:
        if folder == home:
            break
        above.append(folder)
        if os.path.exists(os.path.join(folder, ".git")):
            break
    return above


def list_files(root):
    found = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
        if os.path.basename(dirpath) == ".claude" and "worktrees" in dirnames:
            dirnames.remove("worktrees")
        for name in filenames:
            if name in NAMES:
                found.append(os.path.join(dirpath, name))

    # Files in folders above the working directory also load at start (for example, running from apps/web).
    for folder in ancestors_up_to_repo(root):
        for name in NAMES:
            p = os.path.join(folder, name)
            if os.path.isfile(p):
                found.append(p)

    blocking = blocking_claude_md(root)
    items, seen = [], set()
    # Real files first; a symbolic link to the same content is skipped.
    for path in sorted(found, key=lambda c: (os.path.islink(c), c)):
        real = os.path.realpath(path)
        if real in seen:
            continue
        seen.add(real)
        lines = read_lines(path)
        when, reason = loads_when(path, root, blocking)
        item = {
            "path": os.path.relpath(path, root).replace(os.sep, "/"),
            "type": os.path.basename(path),
            "lines": len(lines),
            "characters": len("\n".join(lines)),
            "loads_when": when,
        }
        if reason:
            item["ignored_because"] = reason
        if os.path.islink(path):
            item["link_to"] = os.path.relpath(real, root).replace(os.sep, "/")
        items.append(item)

    return {
        "working_dir": os.path.realpath(root),
        "blocking_claude_md": blocking,
        "files": items,
        "agent_tools": agent_tools(root),
    }


def agent_tools(root):
    """Settings of other tools and the context file they point to. Informative only."""
    found = []
    aider = os.path.join(root, ".aider.conf.yml")
    if os.path.isfile(aider):
        reads = [l.strip() for l in read_lines(aider) if re.match(r"^\s*read\s*:", l)]
        found.append({"file": ".aider.conf.yml", "tool": "Aider",
                      "read_lines": reads,
                      "points_to_agents_md": any("AGENTS.md" in l for l in reads)})
    gemini = os.path.join(root, ".gemini", "settings.json")
    if os.path.isfile(gemini):
        try:
            with open(gemini, encoding="utf-8-sig") as f:
                data = json.load(f)
            name = (data.get("context") or {}).get("fileName") if isinstance(data, dict) else None
        except (ValueError, OSError):
            name = None
        found.append({"file": ".gemini/settings.json", "tool": "Gemini CLI",
                      "context_file_name": name,
                      "points_to_agents_md": name == "AGENTS.md"})
    return found


def package_scripts(folder):
    """Script names from the folder's package.json, if it exists and the JSON is readable."""
    manifest = os.path.join(folder, "package.json")
    if not os.path.isfile(manifest):
        return []
    try:
        with open(manifest, encoding="utf-8-sig") as f:
            data = json.load(f)
    except (ValueError, OSError):
        return []
    scripts = data.get("scripts") if isinstance(data, dict) else None
    return list(scripts.keys()) if isinstance(scripts, dict) else []


def candidates_from(scripts, targets):
    candidates = set(BUILTIN_PM)
    for name in scripts:
        candidates.update({f"npm run {name}", f"pnpm run {name}", f"bun run {name}",
                           f"yarn run {name}", f"pnpm {name}", f"yarn {name}"})
        # "npm test" is the same as "npm run test"; only the npm standard names work without "run".
        if name in {"test", "start", "stop", "restart"}:
            candidates.add(f"npm {name}")
    if targets:
        candidates.add("make")  # default target
    candidates.update(f"make {t}" for t in targets)
    return candidates


def project(root):
    present = [m for m in DEV_MARKERS if os.path.exists(os.path.join(root, m))]
    scripts = package_scripts(root)

    makefile_name, targets = None, []
    for name in ("Makefile", "makefile", "GNUmakefile"):
        if os.path.isfile(os.path.join(root, name)):
            makefile_name = name
            break
    if makefile_name:
        for line in read_lines(os.path.join(root, makefile_name)):
            # "target1 target2:" or "target::" followed by a space or end of line. Excluded: "CC := gcc",
            # "X:=1", "http://x:" and recipe lines starting with a tab.
            m = re.match(r"^([A-Za-z][\w.\- ]*?)\s*::?(?=\s|$)", line)
            if m:
                targets.extend(m.group(1).split())

    candidates = candidates_from(scripts, targets)

    verification = any(t in VERIFY_TARGETS for t in targets)
    done = [a for a in DONE_FILES if os.path.exists(os.path.join(root, a))]
    if makefile_name and verification:
        done.append(makefile_name)

    workflows = []
    workflows_dir = os.path.join(root, ".github", "workflows")
    if os.path.isdir(workflows_dir):
        workflows = sorted(os.listdir(workflows_dir))

    return {
        "is_dev_project": bool(present),
        "markers": present,
        "candidate_commands": sorted(candidates),
        "verify_targets": sorted(t for t in targets if t in VERIFY_TARGETS),
        "done_files": done,
        "ci_workflows": workflows,
    }


def evaluate_command(cmd, candidates):
    """A command, split at &&, ;, || and |. exists: True, False, or None when it cannot be checked."""
    parts = [p for p in re.split(r"\s*(?:&&|\|\||;|\|)\s*", cmd) if p]
    result = []
    for part in parts:
        if COMMAND_PM.match(part):
            # A bare "make" is the default target; "make sure" does not become a target just because it starts with "make ".
            exists = any(part == c or (c != "make" and part.startswith(c + " ")) for c in candidates)
            result.append((part, exists))
        elif COMMAND_OTHER.match(part) or COMMAND_PYTHON.match(part):
            result.append((part, None))  # a tool the script does not check
    return result


def file_signals(path, root, proj):
    lines = read_lines(path)
    text = "\n".join(lines)
    base = os.path.dirname(os.path.realpath(path))

    # Code blocks fenced with ``` or ~~~. The closing fence uses the same character and an equal or greater length.
    # A line with ``` followed by a backtick does not open a block (CommonMark).
    blocks, inside, open_block = [], [False] * len(lines), None
    for i, line in enumerate(lines):
        if open_block is None:
            m = FENCE.match(line)
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                info = m.group(2).strip().split()
                open_block = (i, m.group(1)[0], len(m.group(1)), info[0].lower() if info else "")
            continue
        start, char, size, language = open_block
        s = line.strip()
        if s and set(s) == {char} and len(s) >= size:
            blocks.append({"line": start + 1, "size": i - start - 1, "closed": True,
                           "language": language})
            for j in range(start, i + 1):
                inside[j] = True
            open_block = None
    if open_block is not None:
        start = open_block[0]
        blocks.append({"line": start + 1, "size": len(lines) - start - 1, "closed": False,
                       "language": open_block[3]})
        for j in range(start, len(lines)):
            inside[j] = True

    # Example hint: an "Example" title or the word in the 3 non-empty lines above the block.
    with_hint = []
    for b in blocks:
        previous = [l for l in lines[max(0, b["line"] - 5):b["line"] - 1] if l.strip()][-3:]
        if any(EXAMPLE_TITLE.match(l) or EXAMPLE_WORD.search(l) for l in previous):
            with_hint.append({"line": b["line"], "size": b["size"]})

    generic = []
    for i, line in enumerate(lines, start=1):
        hit = next((f for f in GENERIC_PHRASES if f in line.lower()), None)
        if hit:
            generic.append({"line": i, "phrase": hit})

    tree = [i for i, l in enumerate(lines, start=1) if TREE.search(l)]

    # Commands: backtick spans in running text, and lines inside shell blocks (without the leading "$ ").
    candidates = set(proj["candidate_commands"]) | candidates_from(package_scripts(base), [])
    commands = []
    for i, line in enumerate(lines):
        if inside[i]:
            # Counts only inside shell blocks; example text in another language is left out.
            block = next(b for b in blocks if b["line"] <= i + 1 <= b["line"] + b["size"] + 1)
            spans = ([re.sub(r"^\s*\$\s+", "", line).strip()]
                     if block["language"] in COMMAND_LANGUAGES else [])
        else:
            spans = re.findall(r"`([^`\n]+)`", line)
        for span in spans:
            cmd = " ".join(span.split())
            for part, exists in evaluate_command(cmd, candidates):
                commands.append({"line": i + 1, "command": part, "exists": exists})

    folders = []
    for i, line in enumerate(lines, start=1):
        if inside[i - 1]:
            continue
        if FOLDER_CODE.search(line) or FOLDER_LOOSE.search(line) or FOLDER_WORD.search(line):
            folders.append({"line": i, "size": len(line.strip())})

    references = []
    for i, line in enumerate(lines, start=1):
        if inside[i - 1]:
            continue
        for target in FILE_REF.findall(line) + [a.rstrip("/") for a in FOLDER_REF.findall(line)]:
            exists = os.path.exists(os.path.join(root, target)) or os.path.exists(os.path.join(base, target))
            references.append({"line": i, "path": target, "exists": exists})

    imports = []
    for i, line in enumerate(lines, start=1):
        if inside[i - 1]:
            continue
        no_backticks = re.sub(r"`[^`]*`", "", line)
        for target in IMPORT.findall(no_backticks):
            # @alfredo or @types/node are mentions, not imports: only paths with an extension or starting with ./, ../, ~/ count.
            if not (re.search(r"\.[A-Za-z0-9]{1,5}$", target) or target.startswith(("./", "../", "~/"))):
                continue
            p = os.path.normpath(os.path.join(base, os.path.expanduser(target)))
            exists = os.path.isfile(p)
            size = len("\n".join(read_lines(p))) if exists else None
            imports.append({"line": i, "target": target, "exists": exists, "characters": size})

    secrets = []
    for i, line in enumerate(lines, start=1):
        for kind, pattern in SECRETS:
            if pattern.search(line):
                secrets.append({"line": i, "type": kind})

    return {
        "lines": len(lines),
        "characters": len(text),
        "critical_over_200_lines": len(lines) > LIMIT_LINES,
        "critical_over_20000_chars": len(text) > LIMIT_CHARS,
        "code_blocks": blocks,
        "blocks_with_example_hint": with_hint,
        "long_blocks_over_30_lines": [b for b in blocks if b["size"] > LIMIT_BLOCK],
        "generic_phrases": generic,
        "tree_lines": tree,
        "folder_lines": folders,
        "folder_lines_total": len(folders),
        "folder_lines_over_limit_count": len(folders) > LIMIT_FOLDER_LINES,
        "folder_lines_over_limit_chars": [p for p in folders if p["size"] > LIMIT_FOLDER_LINE],
        "commands_cited": commands,
        "path_references": references,
        "imports": imports,
        "suspected_secrets": secrets,
        "loads_when": loads_when(path, root, blocking_claude_md(root))[0],
    }


def main(argv):
    usage = {"list", "project", "file"}
    if len(argv) < 2 or argv[1] not in usage:
        print(__doc__)
        return 2
    root = os.getcwd()
    if argv[1] == "list":
        result = list_files(root)
    elif argv[1] == "project":
        result = project(root)
    else:
        if len(argv) < 3:
            print(json.dumps({"error": "usage: signals.py file PATH"}))
            return 2
        if not os.path.isfile(argv[2]):
            print(json.dumps({"error": f"file not found: {argv[2]}"}, ensure_ascii=True))
            return 2
        result = file_signals(argv[2], root, project(root))
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
