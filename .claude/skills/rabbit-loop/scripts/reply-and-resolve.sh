#!/usr/bin/env bash
# Responde numa thread de review e a marca como resolvida.
# Uso: reply-and-resolve.sh <thread_id> <arquivo_com_a_resposta>
set -euo pipefail

thread=$1
body=$(cat "$2")

# -f envia o texto literal: com -F, uma resposta começando com "@" seria lida como nome de arquivo.
gh api graphql -f thread="$thread" -f body="$body" -f query='
  mutation($thread: ID!, $body: String!) {
    addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $thread, body: $body }) { comment { id } }
  }' >/dev/null

gh api graphql -f thread="$thread" -f query='
  mutation($thread: ID!) {
    resolveReviewThread(input: { threadId: $thread }) { thread { isResolved } }
  }' --jq '.data.resolveReviewThread.thread.isResolved'
