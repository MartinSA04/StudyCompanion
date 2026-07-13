#!/usr/bin/env bash
set -euo pipefail

# A freshly created volume is root-owned — hand node_modules to the remote user,
# then provision the mise toolchain and install dependencies. `mise` itself is on
# PATH here, but the tools it manages are NOT auto-activated in this non-
# interactive shell, so install steps must go through `mise exec --`.
sudo chown -R "$(whoami)" node_modules 2>/dev/null || true
mise trust && mise install
mise exec -- pnpm install

# Chromium + its apt system libs for `pnpm test:visual` (Playwright) — the SAME
# command CI runs (.github/workflows/visual.yml), so local snapshots match the
# committed Linux baselines. `--with-deps` shells out to `sudo apt-get`; the
# vscode user has passwordless sudo, so it runs unattended. Browsers land in
# ~/.cache/ms-playwright (outside the node_modules volume), so this reruns on each
# rebuild — which is correct, since the apt libs reset with the image too.
mise exec -- pnpm exec playwright install --with-deps chromium

# GitHub auth over SSH: use only ~/.ssh/id_git (bind-mounted read-only from the
# host). `IdentitiesOnly yes` makes ssh ignore every other key the forwarded
# agent offers (e.g. work deploy keys), so the correct key is always used for
# github.com — otherwise a read-only deploy key can win the handshake and block
# pushes.
sudo install -d -m 700 -o "$(whoami)" -g "$(whoami)" "$HOME/.ssh"
cat > "$HOME/.ssh/config" <<'EOF'
Host github.com
  User git
  IdentityFile ~/.ssh/id_git
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
chmod 600 "$HOME/.ssh/config"
