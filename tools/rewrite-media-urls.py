#!/usr/bin/env python3
"""
tools/rewrite-media-urls.py

Zola 빌드 산출물(public/) 디렉토리 내의 HTML 및 XML 파일들을 스캔하여,
마크다운 소스 변경 없이 이미지 URL을 GCS/Cloudflare CDN(https://storage.eunchan.kim)으로 치환합니다.
치환이 완료된 후 public/ 내의 대용량 이미지 파일들을 정리하여 배포 아티팩트 크기를 최소화합니다.

치환 규칙:
  1. /media/... -> https://storage.eunchan.kim/media/...
  2. post markdown colocation 상대 경로 (예: photo.jpg) -> https://storage.eunchan.kim/<page_path>/photo.jpg
  3. /img/ (파비콘, 로고 등 테마 필수 에셋)은 로컬 유지
"""

import sys
import re
import shutil
import urllib.parse
from pathlib import Path

CDN_BASE_URL = "https://storage.eunchan.kim"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".heic"}

# 제외할 로컬 테마/벤더 에셋 접두사
EXCLUDE_PREFIXES = ("/img/", "/vendor/", "data:", "http://", "https://", "//")


def is_image_url(url: str) -> bool:
    """URL의 경로가 이미지 확장자를 가졌는지 확인합니다."""
    parsed = urllib.parse.urlparse(url)
    ext = Path(parsed.path).suffix.lower()
    return ext in IMAGE_EXTENSIONS


def rewrite_url(url: str, html_url_path: str) -> str:
    """
    단일 이미지 URL을 CDN URL로 변환합니다.
    - url: 원본 src 또는 href 문자열
    - html_url_path: 현재 HTML 파일이 서비스되는 절대 URL 경로 (예: '/travel/24italy/')
    """
    url_clean = url.strip()

    # 외부 URL 또는 인라인 데이터 URI 또는 제외 대상
    for prefix in EXCLUDE_PREFIXES:
        if url_clean.startswith(prefix):
            return url

    # 1. 글로벌 미디어: /media/...
    if url_clean.startswith("/media/"):
        return f"{CDN_BASE_URL}{url_clean}"

    # 2. 상대 경로 이미지 (예: photo.jpg, ./sub/photo.png)
    if is_image_url(url_clean):
        # 현재 HTML의 기준 URL 경로와 상대 경로를 결합
        joined_path = urllib.parse.urljoin(html_url_path, url_clean)
        # joined_path 예: '/travel/24italy/photo.jpg'
        return f"{CDN_BASE_URL}{joined_path}"

    return url


def process_html_content(content: str, html_url_path: str) -> tuple[str, int]:
    """
    HTML/XML 파일 내용에서 이미지 관련 태그의 URL을 치환합니다.
    """
    count = 0

    # 패턴 1: <img ... src="..." ...> 및 <img ... src='...' ...>
    def replace_img_src(match):
        nonlocal count
        prefix = match.group(1)
        quote = match.group(2)
        url = match.group(3)
        suffix = match.group(4)
        new_url = rewrite_url(url, html_url_path)
        if new_url != url:
            count += 1
            return f'{prefix}src={quote}{new_url}{quote}{suffix}'
        return match.group(0)

    # <img ... src="..." ...>
    content = re.sub(
        r'(<img\b[^>]*?\s)src=(["\'])(.*?)\2([^>]*>)',
        replace_img_src,
        content,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # 패턴 2: <picture><source ... srcset="..." ...>
    def replace_source_srcset(match):
        nonlocal count
        prefix = match.group(1)
        quote = match.group(2)
        srcset = match.group(3)
        suffix = match.group(4)
        # srcset은 'url 1x, url 2x' 형태일 수 있음
        parts = []
        changed = False
        for part in srcset.split(","):
            part_stripped = part.strip()
            if not part_stripped:
                continue
            tokens = part_stripped.split()
            url = tokens[0]
            new_url = rewrite_url(url, html_url_path)
            if new_url != url:
                changed = True
                tokens[0] = new_url
            parts.append(" ".join(tokens))
        if changed:
            count += 1
            return f'{prefix}srcset={quote}{", ".join(parts)}{quote}{suffix}'
        return match.group(0)

    content = re.sub(
        r'(<source\b[^>]*?\s)srcset=(["\'])(.*?)\2([^>]*>)',
        replace_source_srcset,
        content,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # 패턴 3: <a ... href="image.jpg" ...> (이미지를 직접 링크한 경우)
    def replace_a_href(match):
        nonlocal count
        prefix = match.group(1)
        quote = match.group(2)
        url = match.group(3)
        suffix = match.group(4)
        if is_image_url(url):
            new_url = rewrite_url(url, html_url_path)
            if new_url != url:
                count += 1
                return f'{prefix}href={quote}{new_url}{quote}{suffix}'
        return match.group(0)

    content = re.sub(
        r'(<a\b[^>]*?\s)href=(["\'])(.*?)\2([^>]*>)',
        replace_a_href,
        content,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # 패턴 4: OpenGraph / Twitter meta image
    # <meta property="og:image" content="..." />
    def replace_meta_image(match):
        nonlocal count
        tag = match.group(0)
        # content="..." 추출
        m = re.search(r'content=(["\'])(.*?)\1', tag, flags=re.IGNORECASE)
        if m:
            quote = m.group(1)
            url = m.group(2)
            new_url = rewrite_url(url, html_url_path)
            if new_url != url:
                count += 1
                return tag.replace(f'content={quote}{url}{quote}', f'content={quote}{new_url}{quote}')
        return tag

    content = re.sub(
        r'<meta\b[^>]*?(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]*>',
        replace_meta_image,
        content,
        flags=re.IGNORECASE,
    )

    return content, count


def get_html_url_path(file_path: Path, public_dir: Path) -> str:
    """HTML 파일의 웹 URL 경로를 계산합니다. (예: public/blog/index.html -> '/blog/')"""
    rel_path = file_path.relative_to(public_dir)
    if rel_path.name == "index.html":
        parent = rel_path.parent.as_posix()
        return "/" if parent == "." else f"/{parent}/"
    else:
        return f"/{rel_path.as_posix()}"


def rewrite_all(clean_artifacts: bool = True):
    """public/ 디렉토리 내의 모든 HTML/XML 파일을 처리합니다."""
    if not PUBLIC_DIR.exists():
        print(f"❌ 오류: {PUBLIC_DIR} 디렉토리가 없습니다. 먼저 zola build를 실행하세요.", file=sys.stderr)
        sys.exit(1)

    print(f"🔄 [Rewrite] {PUBLIC_DIR} 내의 HTML/XML 파일에서 이미지 링크를 {CDN_BASE_URL} 로 치환합니다...")

    total_files = 0
    total_replaced_urls = 0

    for file_path in PUBLIC_DIR.rglob("*"):
        if file_path.suffix.lower() in (".html", ".xml"):
            html_url_path = get_html_url_path(file_path, PUBLIC_DIR)
            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"⚠️  {file_path} 읽기 실패: {e}", file=sys.stderr)
                continue

            new_content, count = process_html_content(content, html_url_path)
            if count > 0:
                file_path.write_text(new_content, encoding="utf-8")
                total_files += 1
                total_replaced_urls += count

    print(f"✅ 총 {total_files}개 파일에서 {total_replaced_urls}개의 이미지 링크 치환 완료!")

    # 배포 산출물 최적화: public/media 디렉토리 삭제 (이미 GCS에 존재)
    if clean_artifacts:
        public_media = PUBLIC_DIR / "media"
        if public_media.exists():
            print(f"🧹 배포 산출물 최적화: {public_media} 제거 중...")
            shutil.rmtree(public_media, ignore_errors=True)
            print("✅ public/media 제거 완료 (GitHub Pages 배포 아티팩트 경량화)")


def main():
    clean = "--no-clean" not in sys.argv
    rewrite_all(clean_artifacts=clean)


if __name__ == "__main__":
    main()
