#!/usr/bin/env bash

# Load NVM into this script's environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Switch version and start dev server
nvm use
npm run dev