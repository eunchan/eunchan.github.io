#!/usr/bin/env python3
"""
Scan markdown files under `docs/**.md`, extract `date` from YAML front-matter,
sort entries in reverse chronological order, and print a JSON list.

Usage:
  python scripts/collect_dates.py [--root docs] [--output out.json]
"""

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

FRONT_MATTER_RE = re.compile(r"^---\s*\n(.*?\n)---\s*\n", re.DOTALL)
DATE_LINE_RE = re.compile(r"^\s*date\s*:\s*(.+)$", re.IGNORECASE | re.MULTILINE)
TITLE_LINE_RE = re.compile(r"^\s*title\s*:\s*(.+)$", re.IGNORECASE | re.MULTILINE)


def extract_front_matter(text: str) -> Optional[str]:
    m = FRONT_MATTER_RE.match(text)
    return m.group(1) if m else None


def extract_date(fm: str) -> Optional[str]:
    if not fm:
        return None
    m = DATE_LINE_RE.search(fm)
    if m:
        return m.group(1).strip().strip('"\'')
    return None


def extract_title(fm: Optional[str], text: str) -> Optional[str]:
    # Prefer title from front-matter
    if fm:
        m = TITLE_LINE_RE.search(fm)
        if m:
            return m.group(1).strip().strip('"\'')

    # Fallback: first markdown H1
    m = re.search(r"^\s*#\s+(.+)$", text, re.MULTILINE)
    if m:
        return m.group(1).strip()

    return None


def parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    s = s.strip()
    # Try ISO parse first
    try:
        return datetime.fromisoformat(s)
    except Exception:
        pass
    # Common patterns
    patterns = ["%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]
    for p in patterns:
        try:
            return datetime.strptime(s, p)
        except Exception:
            continue
    # Fallback: pick leading YYYY-MM-DD
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        try:
            return datetime.strptime(m.group(1), "%Y-%m-%d")
        except Exception:
            pass
    return None


def collect(root: Path) -> List[Dict]:
    results = []
    for md in root.rglob("*.md"):
        try:
            text = md.read_text(encoding="utf-8")
        except Exception:
            continue
        fm = extract_front_matter(text)
        raw_date = extract_date(fm) if fm else None
        dt = parse_date(raw_date) if raw_date else None
        title = extract_title(fm, text)
        # Use a stable path string; avoid relative_to() errors when paths are already
        # relative or resolved differently. Keep workspace-relative formatting.
        try:
            rel = str(md.relative_to(Path.cwd()))
        except Exception:
            rel = str(md)
        results.append({"path": rel, "date": dt, "raw_date": raw_date, "title": title})

    # Sort: entries with dates first, newest -> oldest; None dates last
    results.sort(key=lambda e: (e["date"] is None, e["date"] if e["date"] else datetime.min), reverse=True)

    # Convert datetimes to ISO strings for JSON
    out = [
        {
            "path": r["path"],
            "date": r["date"].isoformat() if r["date"] else None,
            "raw_date": r["raw_date"],
            "title": r.get("title"),
        }
        for r in results
    ]
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="docs", help="Root folder to search (default: docs)")
    ap.add_argument("--output", help="Write JSON output to file (default: stdout)")
    ap.add_argument("--num", "-n", type=int, help="Limit number of entries in output (default: all)", default=None)
    ap.add_argument("--md", "-m", action="store_true", help="Generate output in markdown format", default=False)
    args = ap.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"Root path not found: {root}")

    out = collect(root)

    # Ignore entries without a parsed date
    out_with_date = [r for r in out if r.get("date")]

    # Apply numeric limit if provided
    if args.num and args.num > 0:
        out_with_date = out_with_date[: args.num]

    if args.md:
        # Markdown output: - [{title}](path/to/markdown) - {raw_date}
        lines = []
        for r in out_with_date:
            title = r.get("title") or Path(r["path"]).stem
            # Remove leading docs/ from path for the link
            display_path = r["path"].removeprefix("docs/") if r["path"].startswith("docs/") else r["path"]
            raw = r.get("raw_date") or r.get("date")
            lines.append(f"- [{title}]({display_path}) - {raw}")
        md_out = "\n".join(lines)
        if args.output:
            Path(args.output).write_text(md_out, encoding="utf-8")
            print(f"Wrote {args.output}")
        else:
            print(md_out)
    else:
        j = json.dumps(out_with_date, ensure_ascii=False, indent=2)
        if args.output:
            Path(args.output).write_text(j, encoding="utf-8")
            print(f"Wrote {args.output}")
        else:
            print(j)


if __name__ == "__main__":
    main()
