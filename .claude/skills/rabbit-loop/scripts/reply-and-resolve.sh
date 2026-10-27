#!/usr/bin/env bash
# Responde numa thread de review e a marca como resolvida.
# Uso: reply-and-resolve.sh <thread_id> <arquivo_com_a_resposta>
set -euo pipefail

thread=$1
body=$(cat "$2")

gh api graphql -F thread="$thread" -F body="$body" -f query='
  mutation($thread: ID!, $body: String!) {
    addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $thread, body: $body }) { comment { id } }
  }' >/dev/null

gh api graphql -F thread="$thread" -f query='
  mutation($thread: ID!) {
    resolveReviewThread(input: { threadId: $thread }) { thread { isResolved } }
  }' --jq '.data.resolveReviewThread.thread.isResolved'
