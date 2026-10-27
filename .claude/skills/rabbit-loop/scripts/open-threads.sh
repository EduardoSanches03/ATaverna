#!/usr/bin/env bash
# Lista as threads de review do CodeRabbit ainda não resolvidas no PR, uma por bloco.
# Uso: open-threads.sh <pr>
set -euo pipefail

pr=$1
owner=$(gh repo view --json owner -q .owner.login)
name=$(gh repo view --json name -q .name)

gh api graphql -F owner="$owner" -F name="$name" -F pr="$pr" -f query='
  query($owner: String!, $name: String!, $pr: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id isResolved isOutdated path line originalLine
            comments(first: 20) { nodes { author { login } body } }
          }
        }
      }
    }
  }' \
  | jq -r '
      .data.repository.pullRequest.reviewThreads.nodes[]
      | select(.isResolved | not)
      | select(.comments.nodes[0].author.login == "coderabbitai")
      | "=== thread \(.id)\narquivo: \(.path):\(.line // .originalLine)\(if .isOutdated then " (desatualizada: o código mudou depois do comentário)" else "" end)\n"
        + ([.comments.nodes[] | "[\(.author.login)]\n\(.body)"] | join("\n---\n"))
        + "\n"' \
  | sed -E '/<details>/,/<\/details>/d; /<!--.*-->/d; s/<picture>.*<\/picture>//g'
