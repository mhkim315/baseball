"""
배포 폴더(deploy/) 생성 + PNG→JPG 압축.
사용: python scripts/build_deploy.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / "deploy"
JPG_QUALITY = 85  # 85% 품질 (육안 차이 거의 없음)

# deploy에 포함할 파일
PUBLIC_FILES = [
    "index.html",
    "cheering.html",
    "stadium-guide.html",
    "schedule-standings.html",
    "rules.html",
    "package.json",
]

PUBLIC_DIRS = [
    "css",
    "js",
    "data",
]

# 변환: picture/**/*.png → picture/**/*.jpg
IMAGE_DIRS = [
    "picture/food-admin-maps",
    "picture/rules",
    "picture/stadium-seats",
]

# deploy에서 제외할 JS 파일 (개발/관리자 도구)
EXCLUDE_JS = [
    "food-admin-page.js",
    "stadium-map-admin-page.js",
]

# deploy에서 제외할 데이터 파일
EXCLUDE_DATA = [
    "cheering-players.json",
    "cheering-patterns.json",
]


def convert_images():
    """PNG → JPG 변환. 같은 크기 유지."""
    total_before = 0
    total_after = 0

    for rel_dir in IMAGE_DIRS:
        src_dir = ROOT / rel_dir
        dst_dir = DEPLOY / rel_dir
        dst_dir.mkdir(parents=True, exist_ok=True)

        for png_path in src_dir.glob("*.png"):
            name = png_path.stem
            jpg_path = dst_dir / f"{name}.jpg"

            img = Image.open(png_path)
            if img.mode in ("RGBA", "P"):
                # 투명도 있으면 흰색 배경으로
                rgb = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                rgb.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = rgb
            elif img.mode != "RGB":
                img = img.convert("RGB")

            img.save(jpg_path, "JPEG", quality=JPG_QUALITY, optimize=True)

            before = png_path.stat().st_size
            after = jpg_path.stat().st_size
            total_before += before
            total_after += after
            reduction = (1 - after / before) * 100
            print(f"  {rel_dir}/{name}.png → .jpg  {before//1024}KB → {after//1024}KB ({reduction:.0f}% 감소)")

    print(f"\n  총 {total_before//1024}KB → {total_after//1024}KB ({(1-total_after/total_before)*100:.0f}% 감소)")


def update_references():
    """HTML/JS/CSS에서 .png → .jpg 참조 변경."""
    replacements = {
        "food-admin-maps": True,
        "rules": True,
        "stadium-seats": True,
    }

    for ext in ["html", "js", "css", "json"]:
        for f in DEPLOY.rglob(f"*.{ext}"):
            content = f.read_text(encoding="utf-8")
            orig = content
            for dir_name in replacements:
                # picture/food-admin-maps/xxx.png → picture/food-admin-maps/xxx.jpg
                content = content.replace(
                    f"picture/{dir_name}/", f"picture/{dir_name}/"
                ).replace(
                    f'{dir_name}/', f'{dir_name}/'
                )
            # 일반적인 .png → .jpg 치환 (picture/ 경로만)
            if content != orig:
                f.write_text(content, encoding="utf-8")


def update_png_refs_in_files():
    """모든 배포 파일에서 .png → .jpg 치환."""
    for ext in ["html", "js", "css", "json"]:
        for f in DEPLOY.rglob(f"*.{ext}"):
            content = f.read_text(encoding="utf-8")
            new_content = content
            for dir_name in ["food-admin-maps", "rules", "stadium-seats"]:
                new_content = new_content.replace(
                    f"picture/{dir_name}/", f"picture/{dir_name}/"
                )
            # 구체적인 .png → .jpg
            new_content = new_content.replace('.png"', '.jpg"')
            new_content = new_content.replace(".png'", ".jpg'")
            new_content = new_content.replace(".png)", ".jpg)")
            if new_content != content:
                f.write_text(new_content, encoding="utf-8")
                print(f"  Updated refs in {f.relative_to(DEPLOY)}")


def main():
    if DEPLOY.exists():
        shutil.rmtree(DEPLOY)
    DEPLOY.mkdir()

    print("Converting PNG → JPG...")
    convert_images()

    print("\nCopying public files...")
    for f in PUBLIC_FILES:
        shutil.copy2(ROOT / f, DEPLOY / f)
        print(f"  {f}")

    for d in PUBLIC_DIRS:
        src = ROOT / d
        dst = DEPLOY / d
        shutil.copytree(src, dst, dirs_exist_ok=True)
        # 제외 파일 삭제
        if d == "js":
            for ex in EXCLUDE_JS:
                p = dst / ex
                if p.exists():
                    p.unlink()
        if d == "data":
            for ex in EXCLUDE_DATA:
                p = dst / ex
                if p.exists():
                    p.unlink()
        print(f"  {d}/")

    print("\nUpdating .png references → .jpg...")
    update_png_refs_in_files()

    # 크기 요약
    total_size = sum(f.stat().st_size for f in DEPLOY.rglob("*") if f.is_file())
    print(f"\nDone! deploy/ total size: {total_size // 1024}KB ({total_size / 1024 / 1024:.1f}MB)")


if __name__ == "__main__":
    main()
