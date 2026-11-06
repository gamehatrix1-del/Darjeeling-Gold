#!/usr/bin/env bash
# Usage: ./scripts/extract-frames.sh [video.mp4] [fps]
# Builds two WebP frame sets so each visitor downloads only what their screen needs:
#   public/frames     1920x1080  (large / retina screens)
#   public/frames-md  1280x720   (phones, normal screens, data-saver)
# Pipeline: delogo (removes the generator sparkle watermark) -> minterpolate (motion-compensated
# frames up to FPS, default 48 = 2x the 24fps source) -> lanczos scale + light luma sharpen -> cwebp.
# Keep TOTAL_FRAMES / FPS in src/tea/main.ts in sync with the output.
set -e
INPUT_VIDEO="${1:-assets/raw-video.mp4}"
FPS="${2:-48}"
[ -f "$INPUT_VIDEO" ] || { echo "Error: '$INPUT_VIDEO' not found"; exit 1; }
command -v cwebp >/dev/null || { echo "Install cwebp (brew install webp)"; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p public/frames public/frames-md && rm -f public/frames/*.webp public/frames-md/*.webp

ffmpeg -v error -i "$INPUT_VIDEO" -filter_complex \
 "[0:v]delogo=x=1128:y=568:w=64:h=64,minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,split=2[a][b];\
[a]scale=1920:1080:flags=lanczos,unsharp=5:5:0.6:5:5:0.0[l];\
[b]scale=1280:720:flags=lanczos,unsharp=3:3:0.4:3:3:0.0[m]" \
 -map "[l]" "$TMP/l_%04d.png" -map "[m]" "$TMP/m_%04d.png"

enc() { # $1=src png  $2=out dir  $3=quality
  n="$(basename "$1" .png | cut -d_ -f2)"
  cwebp -quiet -q "$3" -sharp_yuv -m 4 "$1" -o "$2/frame_$n.webp"
}
export -f enc
ls "$TMP"/l_*.png | xargs -P 6 -I{} bash -c 'enc "{}" public/frames 72'
ls "$TMP"/m_*.png | xargs -P 6 -I{} bash -c 'enc "{}" public/frames-md 68'
echo "Generated $(ls public/frames/*.webp | wc -l | tr -d ' ') frames per set at ${FPS}fps"
du -sh public/frames public/frames-md
