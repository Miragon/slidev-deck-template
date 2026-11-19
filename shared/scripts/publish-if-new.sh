#!/usr/bin/env bash
set -euo pipefail

package_dir="$1"
shift

name="$(node -p "require('./$package_dir/package.json').name")"
version="$(node -p "require('./$package_dir/package.json').version")"

if npm view "$name@$version" version > /dev/null 2>&1; then
  echo "$name@$version already published, skipping"
  exit 0
fi

npm publish -w "$package_dir" --provenance --access public "$@"
