#!/usr/bin/env python3
"""
compress-pptx.py — Shrink an exported PPTX by converting large PNG slide
screenshots to JPEG and scaling them down to 1920×1080.

Usage:
    python3 scripts/compress-pptx.py [input.pptx] [output.pptx]

Defaults:
    input  — newest .pptx under .local/outputs/
    output — <input-basename>-compressed.pptx in the same directory
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

JPEG_QUALITY = 90
MAX_W = 1920
MAX_H = 1080
SIZE_THRESHOLD = 200 * 1024  # only compress PNGs larger than 200 KB


def find_latest_pptx():
    outputs = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".local", "outputs")
    outputs = os.path.normpath(outputs)
    if not os.path.isdir(outputs):
        return None
    files = [f for f in os.listdir(outputs) if f.endswith(".pptx") and "compressed" not in f]
    if not files:
        return None
    files.sort(key=lambda f: os.path.getmtime(os.path.join(outputs, f)), reverse=True)
    return os.path.join(outputs, files[0])


def png_dimensions(data: bytes):
    if data[:4] != b'\x89PNG':
        return None, None
    import struct
    w = struct.unpack('>I', data[16:20])[0]
    h = struct.unpack('>I', data[20:24])[0]
    return w, h


def compress_image(data: bytes, name: str) -> tuple[bytes, str]:
    """Return (compressed_bytes, new_extension). extension is 'jpg' or 'png'."""
    w, h = png_dimensions(data)
    if w is None:
        return data, "png"

    needs_resize = (w > MAX_W or h > MAX_H)
    needs_compress = len(data) > SIZE_THRESHOLD

    if not needs_resize and not needs_compress:
        return data, "png"

    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "slide.png")
        dst = os.path.join(tmp, "slide.jpg")
        with open(src, 'wb') as f:
            f.write(data)

        cmd = [
            "magick", src,
            "-resize", f"{MAX_W}x{MAX_H}>",
            "-quality", str(JPEG_QUALITY),
            "-background", "white",
            "-flatten",
            dst,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  Warning: magick failed for {name}: {result.stderr.strip()}", file=sys.stderr)
            return data, "png"

        with open(dst, 'rb') as f:
            jpg_data = f.read()

    ratio = len(jpg_data) / len(data)
    print(f"  {name}: {len(data)//1024} KB → {len(jpg_data)//1024} KB ({ratio:.1%})")
    return jpg_data, "jpg"


def compress_pptx(input_path: str, output_path: str):
    print(f"Input:  {input_path} ({os.path.getsize(input_path) // 1024} KB)")
    print(f"Output: {output_path}")
    print()

    renames: dict[str, str] = {}

    with tempfile.TemporaryDirectory() as tmp:
        out_pptx = os.path.join(tmp, "out.pptx")

        with zipfile.ZipFile(input_path, 'r') as zin, \
             zipfile.ZipFile(out_pptx, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:

            for item in zin.infolist():
                data = zin.read(item.filename)

                if item.filename.startswith("ppt/media/") and item.filename.endswith(".png"):
                    compressed, ext = compress_image(data, item.filename)
                    if ext == "jpg":
                        new_name = item.filename[:-4] + ".jpg"
                        renames[item.filename] = new_name
                        item.filename = new_name
                    data = compressed

                zout.writestr(item, data)

        if renames:
            print(f"\nRenaming {len(renames)} PNG(s) to JPEG in relationships and XML...")
            _patch_xml_references(out_pptx, renames)

        shutil.copy2(out_pptx, output_path)

    final_size = os.path.getsize(output_path)
    print(f"\nDone. Final size: {final_size // 1024} KB ({final_size / 1024 / 1024:.1f} MB)")


def _patch_xml_references(pptx_path: str, renames: dict[str, str]):
    """Rewrite all XML files inside the PPTX to use the new .jpg filenames."""
    replacements = {
        os.path.basename(old): os.path.basename(new)
        for old, new in renames.items()
    }

    with tempfile.TemporaryDirectory() as tmp:
        patched = os.path.join(tmp, "patched.pptx")
        with zipfile.ZipFile(pptx_path, 'r') as zin, \
             zipfile.ZipFile(patched, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename.endswith(('.xml', '.rels')):
                    text = data.decode('utf-8', errors='replace')
                    for old_base, new_base in replacements.items():
                        text = text.replace(old_base, new_base)
                        old_no_ext = old_base[:-4]
                        new_no_ext = new_base[:-4]
                        text = re.sub(
                            rf'(Extension=")png("\s*ContentType="image/png")',
                            r'\1png\2',
                            text,
                        )
                    data = text.encode('utf-8')
                zout.writestr(item, data)
        shutil.copy2(patched, pptx_path)


if __name__ == "__main__":
    args = sys.argv[1:]
    if args:
        input_path = os.path.abspath(args[0])
    else:
        input_path = find_latest_pptx()
        if not input_path:
            print("No .pptx file found in .local/outputs/. Pass the path as the first argument.")
            sys.exit(1)

    if len(args) >= 2:
        output_path = os.path.abspath(args[1])
    else:
        base, ext = os.path.splitext(input_path)
        output_path = base + "-compressed" + ext

    compress_pptx(input_path, output_path)
