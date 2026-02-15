#!/usr/bin/env bash
set -euo pipefail

print_usage() {
  cat <<'EOF'
Usage:
  ./convert_avchd_to_mp4.sh -i <input> [options]

Description:
  Convert AVCHD files (.MTS/.M2TS/.M2T) to MP4 (H.264 + AAC) using ffmpeg.
  Input can be a single file or a directory.

Options:
  -i, --input <path>       Input file or directory (required)
  -o, --output <dir>       Output directory (default: same directory as source)
      --crf <num>          Video quality for H.264 (default: 22, lower is higher quality)
      --preset <name>      x264 preset (default: medium)
      --overwrite          Overwrite existing output files
      --keep-structure     Keep source directory structure under output directory
  -h, --help               Show this help message

Examples:
  ./convert_avchd_to_mp4.sh -i ./PRIVATE/AVCHD/BDMV/STREAM
  ./convert_avchd_to_mp4.sh -i ./clips -o ./mp4_out --crf 20 --preset slow
  ./convert_avchd_to_mp4.sh -i ./clips -o ./mp4_out --keep-structure --overwrite
EOF
}

is_avchd_file() {
  local file="$1"
  local lower
  lower="$(printf '%s' "$file" | tr '[:upper:]' '[:lower:]')"
  [[ "$lower" == *.mts || "$lower" == *.m2ts || "$lower" == *.m2t ]]
}

input_path=""
output_dir=""
crf="22"
preset="medium"
overwrite=0
keep_structure=0
ffmpeg_bin="${FFMPEG_BIN:-ffmpeg}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)
      input_path="${2:-}"
      shift 2
      ;;
    -o|--output)
      output_dir="${2:-}"
      shift 2
      ;;
    --crf)
      crf="${2:-}"
      shift 2
      ;;
    --preset)
      preset="${2:-}"
      shift 2
      ;;
    --overwrite)
      overwrite=1
      shift
      ;;
    --keep-structure)
      keep_structure=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_usage
      exit 1
      ;;
  esac
done

if [[ -z "$input_path" ]]; then
  echo "Error: --input is required." >&2
  print_usage
  exit 1
fi

if ! command -v "$ffmpeg_bin" >/dev/null 2>&1; then
  echo "Error: ffmpeg not found. Please install ffmpeg first." >&2
  exit 1
fi

if [[ ! -e "$input_path" ]]; then
  echo "Error: input path does not exist: $input_path" >&2
  exit 1
fi

if [[ -n "$output_dir" ]]; then
  mkdir -p "$output_dir"
fi

declare -a sources
if [[ -f "$input_path" ]]; then
  if ! is_avchd_file "$input_path"; then
    echo "Error: input file is not .MTS/.M2TS/.M2T: $input_path" >&2
    exit 1
  fi
  sources=("$input_path")
else
  mapfile -t sources < <(find "$input_path" -type f \( -iname '*.mts' -o -iname '*.m2ts' -o -iname '*.m2t' \) | sort)
fi

if [[ "${#sources[@]}" -eq 0 ]]; then
  echo "No AVCHD files found in: $input_path"
  exit 0
fi

echo "Found ${#sources[@]} file(s) to convert."

success=0
failed=0
skipped=0

for src in "${sources[@]}"; do
  src_dir="$(dirname "$src")"
  src_name="$(basename "$src")"
  stem="${src_name%.*}"

  if [[ -z "$output_dir" ]]; then
    dst="${src_dir}/${stem}.mp4"
  else
    if [[ -d "$input_path" && "$keep_structure" -eq 1 ]]; then
      rel="${src#"$input_path"/}"
      rel_stem="${rel%.*}"
      dst="${output_dir}/${rel_stem}.mp4"
    else
      dst="${output_dir}/${stem}.mp4"
    fi
  fi

  mkdir -p "$(dirname "$dst")"

  if [[ -e "$dst" && "$overwrite" -eq 0 ]]; then
    echo "[SKIP] Output exists: $dst (use --overwrite to replace)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "[CONVERT] $src -> $dst"

  ffmpeg_overwrite_flag="-n"
  if [[ "$overwrite" -eq 1 ]]; then
    ffmpeg_overwrite_flag="-y"
  fi

  if "$ffmpeg_bin" \
      -hide_banner \
      -loglevel warning \
      -stats \
      -nostdin \
      "$ffmpeg_overwrite_flag" \
      -i "$src" \
      -map 0:v:0? \
      -map 0:a:0? \
      -c:v libx264 \
      -preset "$preset" \
      -crf "$crf" \
      -pix_fmt yuv420p \
      -movflags +faststart \
      -c:a aac \
      -b:a 192k \
      "$dst"; then
    success=$((success + 1))
  else
    echo "[FAIL] $src" >&2
    failed=$((failed + 1))
  fi
done

echo
echo "Done."
echo "Success: $success"
echo "Skipped: $skipped"
echo "Failed:  $failed"

if [[ "$failed" -gt 0 ]]; then
  exit 1
fi

