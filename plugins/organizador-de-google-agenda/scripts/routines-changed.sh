#!/usr/bin/env bash
# PostToolUse hook: when a Claude Code routine is created, changed or deleted, tell Claude to
# update the routine events on Google Calendar through the use-google-calendar skill.
# It changes nothing itself. Silent unless the setup is completed and the user turned routines on.
set -u

INPUT=$(cat)

# Only writes to routines count: reading them (list, get, list_runs...) must never trigger a sync.
TOOL=$(printf '%s' "$INPUT" | grep -oE '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')
case "$TOOL" in
  RemoteTrigger)
    # Look only at the call's own input, never at the tool's response, which may repeat the word "action".
    CALL=$(printf '%s' "$INPUT" | sed -E 's/.*"tool_input"//; s/"tool_response".*//')
    printf '%s' "$CALL" | grep -Eq '"action"[[:space:]]*:[[:space:]]*"(create|update)"' || exit 0
    ;;
  mcp__scheduled-tasks__create_scheduled_task|mcp__scheduled-tasks__update_scheduled_task|mcp__scheduled-tasks__delete_scheduled_task)
    ;;
  *)
    exit 0
    ;;
esac

# The user's choices live in the workspace: <root>/ferramentas/google-calendar/
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
TOOLS_DIR=$(find -H "$ROOT" -maxdepth 1 -type d -iname ferramentas 2>/dev/null | head -n 1)
[ -n "$TOOLS_DIR" ] || exit 0
BASE="$TOOLS_DIR/google-calendar"

[ -f "$BASE/config.json" ] && grep -Eq '"completed"[[:space:]]*:[[:space:]]*true' "$BASE/config.json" || exit 0
[ -f "$BASE/routines.json" ] && grep -Eq '"enabled"[[:space:]]*:[[:space:]]*true' "$BASE/routines.json" || exit 0

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"A Claude Code routine was just created, changed or deleted, and this user keeps their routines shown on Google Calendar as free (never busy) events. When you finish the routine changes of this turn, run the routines procedure of the use-google-calendar skill (references/routines.md) once, to bring the calendar up to date. This is automatic: the user already agreed to it in the setup, so do not ask before creating or updating events. Deleting events still needs the single confirmation that the procedure describes. If you already synced in this turn, do not do it again. Tell the user in one sentence, in Brazilian Portuguese, that you updated the routines on their calendar. Routine events must never be busy."}}
JSON
