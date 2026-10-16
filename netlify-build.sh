#!/usr/bin/env bash
set -euo pipefail

export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

echo "Checking Deno..."
if ! command -v deno >/dev/null 2>&1; then
    echo "Deno not found. Installing Deno..."
    curl -fsSL https://deno.land/install.sh | sh
else
    echo "Deno found: $(deno --version | head -n 1)"
fi

echo "Generating pre-indexed JSON files..."
deno run --allow-read --allow-write src/cli.ts \
    input.csv \
    public/testSessionsByStudent.json \
    public/studentNamesList.txt \
    public/testSessionsByProctor.json \
    public/proctorNamesList.txt

echo "Build complete. Files in public/:"
ls -la public/testSessionsByStudent.json public/testSessionsByProctor.json public/*.txt
