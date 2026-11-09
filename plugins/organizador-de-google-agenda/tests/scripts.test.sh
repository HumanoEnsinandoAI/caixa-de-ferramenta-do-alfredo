#!/usr/bin/env bash
# Tests for the two hook scripts. `claude plugin test` cannot run shell, so run this one by hand:
#   bash tests/scripts.test.sh
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILS=0

ws() { # ws <config|none> <routines|none>: a workspace with the given files
  local root; root=$(mktemp -d); mkdir -p "$root/ferramentas/google-calendar"
  [ "$1" != none ] && printf '%s' "$1" > "$root/ferramentas/google-calendar/config.json"
  [ "$2" != none ] && printf '%s' "$2" > "$root/ferramentas/google-calendar/routines.json"
  echo "$root"
}
run() { # run <script> <root> [input] [data dir]
  printf '%s' "${3:-}" | CLAUDE_PROJECT_DIR="$2" CLAUDE_PLUGIN_DATA="${4:-$(mktemp -d)}" bash "$DIR/scripts/$1"
}
call() { printf '{"tool_name":"%s","tool_input":%s,"tool_response":%s}' "$1" "$2" "${3:-{\}}"; }
expect() { # expect <name> <loud|silent> <output>
  local ok=0
  if [ "$2" = loud ]; then [ -n "$3" ] && ok=1; else [ -z "$3" ] && ok=1; fi
  if [ "$ok" -eq 1 ]; then echo "ok   $1"; else echo "FAIL $1"; FAILS=$((FAILS+1)); fi
}

DONE=$'{\n  "setup": {\n  "completed": true\n  }\n}\n'
ON=$'{\n  "enabled": true,\n  "items": []\n}\n'
OFF=$'{\n  "enabled": false\n}\n'
R=$(ws "$DONE" "$ON")

expect "create routine reminds"            loud   "$(run routines-changed.sh "$R" "$(call RemoteTrigger '{"action":"create"}')")"
expect "list routines is silent"           silent "$(run routines-changed.sh "$R" "$(call RemoteTrigger '{"action":"list"}')")"
expect "delete scheduled task reminds"     loud   "$(run routines-changed.sh "$R" "$(call mcp__scheduled-tasks__delete_scheduled_task '{}')")"
expect "other tools are silent"            silent "$(run routines-changed.sh "$R" "$(call Bash '{"command":"ls"}')")"
expect "create only in the response is silent" silent "$(run routines-changed.sh "$R" "$(call RemoteTrigger '{"action":"list"}' '{"action":"create"}')")"
expect "setup unfinished is silent"        silent "$(run routines-changed.sh "$(ws '{"setup":{"completed":false}}' "$ON")" "$(call RemoteTrigger '{"action":"create"}')")"
expect "routines off is silent"            silent "$(run routines-changed.sh "$(ws "$DONE" "$OFF")" "$(call RemoteTrigger '{"action":"create"}')")"
expect "no routines file is silent"        silent "$(run routines-changed.sh "$(ws "$DONE" none)" "$(call RemoteTrigger '{"action":"create"}')")"
expect "no workspace folder is silent"     silent "$(run routines-changed.sh "$(mktemp -d)" "$(call RemoteTrigger '{"action":"create"}')")"

D=$(mktemp -d); ONE=$(ws none none); TWO=$(ws none none)
expect "notice shown in a new workspace"   loud   "$(run session-notice.sh "$ONE" '' "$D")"
expect "notice not repeated there"         silent "$(run session-notice.sh "$ONE" '' "$D")"
expect "notice shown in another workspace" loud   "$(run session-notice.sh "$TWO" '' "$D")"
expect "setup done: reminder in every session" loud "$(run session-notice.sh "$(ws "$DONE" none)" '')"
expect "setup done: reminder repeats"      loud   "$(run session-notice.sh "$(ws "$DONE" none)" '' "$D")"
expect "setup done: reminder names the skill" loud "$(run session-notice.sh "$(ws "$DONE" none)" '' | grep -o 'use-google-calendar' | head -n 1)"
expect "setup done: no setup offer"        silent "$(run session-notice.sh "$(ws "$DONE" none)" '' | grep -o 'start-setup')"
expect "setup done: output is valid JSON"  loud   "$(run session-notice.sh "$(ws "$DONE" none)" '' | python3 -c 'import json,sys;print(json.load(sys.stdin)["hookSpecificOutput"]["hookEventName"])')"

[ "$FAILS" -eq 0 ] && echo "all passed" || { echo "$FAILS failed"; exit 1; }
