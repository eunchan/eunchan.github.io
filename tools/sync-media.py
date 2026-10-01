#!/usr/bin/env python3
"""
tools/sync-media.py

Google Cloud Storage (gs://storage.eunchan.kim)와 로컬 미디어 디렉토리 간의
양방향 증분 동기화(Sync/Push/Pull) 스크립트입니다.

사용법:
    python3 tools/sync-media.py push   # 로컬 -> GCS 동기화 (새 사진 업로드)
    python3 tools/sync-media.py pull   # GCS -> 로컬 복구 (clone 후 또는 분실 시 다운로드)
    python3 tools/sync-media.py status # 로컬과 GCS 상태 비교 (dry-run)
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path

BUCKET_NAME = "storage.eunchan.kim"
GCS_MEDIA_URI = f"gs://{BUCKET_NAME}/media"
GCS_CONTENT_URI = f"gs://{BUCKET_NAME}/content"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
STATIC_MEDIA_DIR = PROJECT_ROOT / "static" / "media"
CONTENT_DIR = PROJECT_ROOT / "content"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".heic"}


def find_cloud_cli() -> tuple[str, str]:
    """
    gcloud 또는 gsutil CLI를 탐색합니다.
    우선순위: gcloud storage > gsutil
    반환값: (도구유형: 'gcloud'|'gsutil', 바이너리경로)
    """
    gcloud_candidates = [
        shutil.which("gcloud"),
        "/opt/homebrew/bin/gcloud",
        str(Path.home() / "google-cloud-sdk/bin/gcloud"),
        "/usr/local/bin/gcloud",
    ]
    for c in gcloud_candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return "gcloud", c

    gsutil_candidates = [
        shutil.which("gsutil"),
        "/opt/homebrew/bin/gsutil",
        str(Path.home() / "Library/Python/3.9/bin/gsutil"),
        str(Path.home() / "google-cloud-sdk/bin/gsutil"),
        "/usr/local/bin/gsutil",
    ]
    for c in gsutil_candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return "gsutil", c

    print("❌ 오류: gcloud 또는 gsutil 명령어를 찾을 수 없습니다.", file=sys.stderr)
    print("   brew install --cask gcloud-cli 로 설치 후 gcloud auth login 을 실행해주세요.", file=sys.stderr)
    sys.exit(1)


def run_command(cmd: list[str]) -> int:
    """명령어를 실행하고 종료 코드를 반환합니다."""
    env = os.environ.copy()
    env["PYTHONWARNINGS"] = "ignore:urllib3"
    proc = subprocess.run(cmd, env=env)
    return proc.returncode


def build_rsync_cmd(cli_type: str, bin_path: str, src: str, dst: str, dry_run: bool = False) -> list[str]:
    """CLI 종류에 맞게 최적화된 rsync 명령어를 구성합니다."""
    exclude_regex = r".*\.DS_Store$|.*\.gitkeep$"

    if cli_type == "gcloud":
        cmd = [bin_path, "storage", "rsync", "--recursive", "-u", f"--exclude={exclude_regex}"]
        if dry_run:
            cmd.append("--dry-run")
        cmd.extend([src, dst])
        return cmd
    else:
        # gsutil fallback
        cmd = [
            bin_path,
            "-o", "GSUtil:parallel_process_count=1",
            "-m", "rsync", "-r",
            "-x", exclude_regex,
        ]
        if dry_run:
            cmd.append("-n")
        cmd.extend([src, dst])
        return cmd


def sync_push(cli_type: str, bin_path: str, dry_run: bool = False):
    """로컬의 static/media 및 content 내 이미지를 GCS로 업로드합니다."""
    print(f"🚀 [Push] 로컬 미디어를 {GCS_MEDIA_URI} 로 동기화합니다...")

    if not STATIC_MEDIA_DIR.exists():
        print(f"⚠️  경고: {STATIC_MEDIA_DIR} 디렉토리가 없습니다. 생략합니다.")
    else:
        cmd = build_rsync_cmd(cli_type, bin_path, str(STATIC_MEDIA_DIR), GCS_MEDIA_URI, dry_run)
        print(f"▶ 실행: {' '.join(cmd)}")
        ret = run_command(cmd)
        if ret != 0:
            print(f"❌ static/media 동기화 실패 (코드 {ret})", file=sys.stderr)
            sys.exit(ret)

    # content 디렉토리 내에 개별적으로 포함된 이미지가 있는지 검사
    content_images = []
    if CONTENT_DIR.exists():
        for root, _, files in os.walk(CONTENT_DIR):
            for file in files:
                if Path(file).suffix.lower() in IMAGE_EXTENSIONS:
                    content_images.append(Path(root) / file)

    if content_images:
        print(f"📸 content 디렉토리에서 {len(content_images)}개의 이미지를 발견했습니다.")
        for img_path in content_images:
            rel_path = img_path.relative_to(CONTENT_DIR)
            target_uri = f"{GCS_CONTENT_URI}/{rel_path.as_posix()}"
            if cli_type == "gcloud":
                cmd = [bin_path, "storage", "cp"]
                if dry_run:
                    cmd.append("--dry-run")
                cmd.extend([str(img_path), target_uri])
            else:
                cmd = [bin_path, "-m", "cp", "-c", str(img_path), target_uri]
                if dry_run:
                    print(f"[dry-run] {img_path} -> {target_uri}")
                    continue
            run_command(cmd)

    print("✅ 미디어 동기화(Push) 완료!")


def sync_pull(cli_type: str, bin_path: str, dry_run: bool = False):
    """GCS의 미디어를 로컬로 다운로드하여 복원합니다."""
    print(f"📥 [Pull] {GCS_MEDIA_URI} 에서 로컬 {STATIC_MEDIA_DIR} 로 복원합니다...")
    STATIC_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    cmd = build_rsync_cmd(cli_type, bin_path, GCS_MEDIA_URI, str(STATIC_MEDIA_DIR), dry_run)
    print(f"▶ 실행: {' '.join(cmd)}")
    ret = run_command(cmd)
    if ret != 0:
        print(f"❌ static/media 복원 실패 (코드 {ret})", file=sys.stderr)
        sys.exit(ret)

    # GCS에 content 미디어가 있는지 확인 후 복원 시도
    check_cmd = [bin_path, "storage", "ls", GCS_CONTENT_URI] if cli_type == "gcloud" else [bin_path, "ls", GCS_CONTENT_URI]
    res = subprocess.run(check_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if res.returncode == 0:
        print(f"📥 [Pull] {GCS_CONTENT_URI} 에서 로컬 {CONTENT_DIR} 로 복원합니다...")
        cmd_content = build_rsync_cmd(cli_type, bin_path, GCS_CONTENT_URI, str(CONTENT_DIR), dry_run)
        run_command(cmd_content)

    print("✅ 미디어 복원(Pull) 완료!")


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("push", "pull", "status"):
        print("사용법:")
        print("  python3 tools/sync-media.py push   # 로컬 -> GCS 동기화")
        print("  python3 tools/sync-media.py pull   # GCS -> 로컬 복원")
        print("  python3 tools/sync-media.py status # 차이점 미리보기 (dry-run)")
        sys.exit(1)

    action = sys.argv[1]
    cli_type, bin_path = find_cloud_cli()

    if action == "push":
        sync_push(cli_type, bin_path, dry_run=False)
    elif action == "pull":
        sync_pull(cli_type, bin_path, dry_run=False)
    elif action == "status":
        print("🔍 [Status] 변경 사항 미리보기 (dry-run)...")
        sync_push(cli_type, bin_path, dry_run=True)


if __name__ == "__main__":
    main()
