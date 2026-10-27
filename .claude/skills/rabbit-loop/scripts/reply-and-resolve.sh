#!/usr/bin/env bash
# Responde numa thread de review e a marca como resolvida.
# Uso: reply-and-resolve.sh <thread_id> <arquivo_com_a_resposta>
# Pode ser repetido depois de uma falha: se a última mensagem da thread já é esta resposta, só resolve.
set -euo pipefail

thread=$1
body=$(cat "$2")

last=$(gh api graphql -f thread="$thread" -f query='
  query($thread: ID!) {
    node(id: $thread) { ... on PullRequestReviewThread { comments(last: 1) { nodes { body } } } }
  }' --jq '.data.node.comments.nodes[0].body')

# -f envia o texto literal: com -F, uma resposta começando com "@" seria lida como nome de arquivo.
if [[ $last != "$body" ]]; then
  gh api graphql -f thread="$thread" -f body="$body" -f query='
    mutation($thread: ID!, $body: String!) {
      addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $thread, body: $body }) { comment { id } }
    }' >/dev/null
fi

gh api graphql -f thread="$thread" -f query='
  mutation($thread: ID!) {
    resolveReviewThread(input: { threadId: $thread }) { thread { isResolved } }
  }' --jq '.data.resolveReviewThread.thread.isResolved'
