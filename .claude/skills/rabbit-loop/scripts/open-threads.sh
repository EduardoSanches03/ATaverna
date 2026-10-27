#!/usr/bin/env bash
# Lista as threads de review do CodeRabbit ainda não resolvidas no PR, uma por bloco.
# Uso: open-threads.sh <pr>
set -euo pipefail

pr=$1
owner=$(gh repo view --json owner -q .owner.login)
name=$(gh repo view --json name -q .name)

# --paginate percorre todas as páginas de reviewThreads via $endCursor/pageInfo.
gh api graphql --paginate -f owner="$owner" -f name="$name" -F pr="$pr" -f query='
  query($owner: String!, $name: String!, $pr: Int!, $endCursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100, after: $endCursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id isResolved isOutdated path line originalLine
            comments(first: 100) {
              pageInfo { hasNextPage }
              nodes { author { login } body }
            }
          }
        }
      }
    }
  }' \
  | jq -rs '
      [.[].data.repository.pullRequest.reviewThreads.nodes[]]
      | .[]
      | select(.isResolved | not)
      | select(.comments.nodes[0].author.login == "coderabbitai")
      | "=== thread \(.id)\narquivo: \(.path):\(.line // .originalLine)\(if .isOutdated then " (desatualizada: o código mudou depois do comentário)" else "" end)\n"
        + (if .comments.pageInfo.hasNextPage then "AVISO: thread com mais de 100 comentários; só os 100 primeiros aparecem abaixo\n" else "" end)
        + ([.comments.nodes[] | "[\(.author.login)]\n\(.body)"] | join("\n---\n"))
        + "\n"' \
  | perl -0pe '
      1 while s/<details>(?:(?!<details>).)*?<\/details>//gs;   # blocos recolhidos, de dentro para fora
      s/<!--.*?-->//gs;
      s/<picture>.*?<\/picture>//gs;
      s/<\/?(?:details|summary|dd|dl|dt|blockquote)[^>]*>//g;
      s/\n{3,}/\n\n/g;'
