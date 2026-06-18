#!/bin/bash
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch -f --msg-filter 'sed "s/Copilot Autofix powered by AI <62310815+github-advanced-security\[bot\]@users.noreply.github.com>/Rohithgaloth <Rohithgaloth@users.noreply.github.com>/g"' --tag-name-filter cat -- --all
