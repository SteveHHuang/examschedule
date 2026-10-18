#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Netlify normally installs npm dependencies before this script. Also support
# running the script directly in a fresh checkout using the npm lockfile.
if [[ ! -x node_modules/.bin/deno ]]; then
    npm ci
fi

npm run build

for file in public/testSessionsByStudent.json public/testSessionsByProctor.json \
    public/studentNamesList.txt public/proctorNamesList.txt; do
    test -s "$file"
done

echo "Build complete: validated query files are ready in public/."
