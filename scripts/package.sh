#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
platform=${1:?Uso: scripts/package.sh linux|win32 [directorio de salida]}
output=${2:-dist}
mkdir -p "$output"
output=$(cd "$output" && pwd)
version=$(node -p 'require("electron/package.json").version')
asset="electron-v$version-$platform-x64.zip"
expected=$(node -p 'require("./node_modules/electron/checksums.json")[process.argv[1]] || ""' "$asset")
[[ -n "$expected" ]]
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
archive=${NEXO_ELECTRON_ARCHIVE:-$work/$asset}
if [[ ! -f "$archive" ]]; then
  curl --fail --location --retry 2 --output "$archive" "https://github.com/electron/electron/releases/download/v$version/$asset"
fi
printf '%s  %s\n' "$expected" "$archive" | sha256sum --check --status

root="$work/Nexo Salud"
mkdir -p "$root"
unzip -q "$archive" -d "$root"
mkdir -p "$root/resources/app"
cp package.json main.js preload.js index.html domain.js ui.js style.css icon.png "$root/resources/app/"
cp README.md CASOS-DE-USO.md "$root/"
rm -f "$root/resources/default_app.asar"
if [[ "$platform" == win32 ]]; then
  mv "$root/electron.exe" "$root/Nexo Salud.exe"
  target="$output/Nexo-Salud-Windows-x64.zip"
else
  mv "$root/electron" "$root/nexo-salud-bin"
  cat > "$root/nexo-salud" <<'LAUNCHER'
#!/usr/bin/env sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ -u "$root/chrome-sandbox" ] && [ "$(stat -c %u "$root/chrome-sandbox")" = 0 ]; then
  exec "$root/nexo-salud-bin" "$@"
fi
exec "$root/nexo-salud-bin" --disable-setuid-sandbox "$@"
LAUNCHER
  chmod +x "$root/nexo-salud"
  target="$output/Nexo-Salud-Linux-x64.tar.gz"
fi
if [[ "$platform" == win32 ]]; then
  (cd "$work" && zip -q -r "$work/result.zip" 'Nexo Salud')
  mv "$work/result.zip" "$target"
else
  tar -czf "$work/result.tar.gz" -C "$work" 'Nexo Salud'
  mv "$work/result.tar.gz" "$target"
fi
printf '%s\n' "$target"
