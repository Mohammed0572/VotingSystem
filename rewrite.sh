#!/bin/bash
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_NAME" = "Mohammed0572" ]; then
    export GIT_AUTHOR_NAME="supr1795"
    export GIT_AUTHOR_EMAIL="supr1795@users.noreply.github.com"
fi
if [ "$GIT_COMMITTER_NAME" = "Mohammed0572" ]; then
    export GIT_COMMITTER_NAME="supr1795"
    export GIT_COMMITTER_EMAIL="supr1795@users.noreply.github.com"
fi
if [ "$GIT_AUTHOR_NAME" = "github-advanced-security[bot]" ]; then
    export GIT_AUTHOR_NAME="Rohithgaloth"
    export GIT_AUTHOR_EMAIL="Rohithgaloth@users.noreply.github.com"
fi
if [ "$GIT_COMMITTER_NAME" = "github-advanced-security[bot]" ]; then
    export GIT_COMMITTER_NAME="Rohithgaloth"
    export GIT_COMMITTER_EMAIL="Rohithgaloth@users.noreply.github.com"
fi
' --tag-name-filter cat -- --all
#