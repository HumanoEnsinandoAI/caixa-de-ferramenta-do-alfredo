#!/usr/bin/env bash
# Runs at the start of every session and leaves one instruction for Claude.
#  - Setup NOT done: asks Claude to offer the start-setup skill, once per workspace (first session after install).
#  - Setup done: reminds Claude, in every session, to use the use-google-calendar skill before any calendar action,
#    because a session that calls the connector tools directly skips the diary, the read-first rule and the checks.
# It changes nothing in the workspace.
set -u

DATA_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.claude/plugins/data/organizador-de-google-agenda}"
# The setup is saved in the workspace: <root>/ferramentas/google-calendar/config.json
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
# One setup notice per workspace, so a first session in an unrelated folder does not use it up for the others.
KEY=$(printf '%s' "$ROOT" | cksum | cut -d' ' -f1)
MARKER="$DATA_DIR/setup-notice-shown-$KEY"
TOOLS_DIR=$(find -H "$ROOT" -maxdepth 1 -type d -iname ferramentas 2>/dev/null | head -n 1)
CONFIG="${TOOLS_DIR:-$ROOT/ferramentas}/google-calendar/config.json"

# Setup done: the standing reminder, every session.
if [ -f "$CONFIG" ] && grep -Eq '"completed"[[:space:]]*:[[:space:]]*true' "$CONFIG"; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"The organizador-de-google-agenda plugin is set up in this workspace. For ANY Google Calendar action (read, create, update, move, delete, availability, colors, routines), load the skill organizador-de-google-agenda:use-google-calendar FIRST and follow its procedure, even for a small change. Do not call the Google Calendar connector tools directly without it: the skill reads the diary, checks the event before changing it and verifies the result. Say nothing about this reminder to the user."}}
JSON
  exit 0
fi

[ -f "$MARKER" ] && exit 0

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"The organizador-de-google-agenda plugin was just installed and needs a one-time setup (connect Google Calendar and choose which calendars to use). In your first reply, tell the user in one sentence, in Brazilian Portuguese, that the plugin needs a quick setup, and offer to start it now using the start-setup skill. Do this once only and do not insist."}}
JSON

# Mark it shown only after the notice was printed.
mkdir -p "$DATA_DIR" 2>/dev/null && : > "$MARKER" 2>/dev/null
exit 0
