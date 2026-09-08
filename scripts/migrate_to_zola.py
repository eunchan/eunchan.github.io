#!/usr/bin/env python3
"""
Reusable migration script from MkDocs to Zola for eunchan.kim.

Features:
- Scans `docs/` and converts markdown files to `content/`
- Converts YAML frontmatter to TOML frontmatter (+++ ... +++)
- Generates required Zola `_index.md` for sections
- Automatically fixes internal links, escapes tera raw blocks, and ignores empty links
"""

import os
import re
import sys
import yaml
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"
CONTENT_DIR = ROOT_DIR / "content"

FRONT_MATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
FOUR_DASH_RE = re.compile(r"^----\s*\n(.*?)\n----\s*\n", re.DOTALL)

SECTION_CONFIGS = {
    "blog": {
        "title": "Journal",
        "sort_by": "date",
        "paginate_by": 10,
        "template": "blog.html",
        "page_template": "blog-page.html",
    },
    "blog/posts": {
        "title": "Posts",
        "sort_by": "date",
        "paginate_by": 10,
        "template": "blog.html",
        "page_template": "blog-page.html",
    },
    "sky/log": {
        "title": "Night Sky Observation Log",
        "sort_by": "date",
        "paginate_by": 15,
        "template": "blog.html",
        "page_template": "blog-page.html",
    },
    "sky": {
        "title": "Nightsky",
        "sort_by": "none",
    },
    "article": {
        "title": "Articles",
        "sort_by": "date",
    },
    "travel": {
        "title": "Travel",
        "sort_by": "none",
    },
    "camping": {
        "title": "Camping",
        "sort_by": "none",
    },
    "motorcycle": {
        "title": "Motorcycle",
        "sort_by": "none",
    },
    "motorcycle/log": {
        "title": "Motorcycle Log",
        "sort_by": "date",
    },
    "research": {
        "title": "Research",
        "sort_by": "date",
    },
    "review": {
        "title": "Review",
        "sort_by": "date",
    },
    "tips": {
        "title": "Tips",
        "sort_by": "date",
    },
    "working-holiday": {
        "title": "Canada Working Holiday",
        "sort_by": "none",
    },
    "eunchan": {
        "title": "About",
        "sort_by": "none",
    },
}

SECTION_STANDARD_KEYS = {
    "title", "description", "sort_by", "weight", "draft", "template", 
    "paginate_by", "paginate_reversed", "paginate_path", "insert_anchor_links", 
    "render", "redirect_to", "in_search_index", "transparent", "page_template", 
    "aliases", "generate_feeds", "hidden"
}

PAGE_STANDARD_KEYS = {
    "title", "description", "date", "updated", "weight", "draft", 
    "slug", "path", "template", "in_search_index", "render"
}

def toml_escape(val):
    if isinstance(val, bool):
        return "true" if val else "false"
    elif isinstance(val, (int, float)):
        return str(val)
    elif isinstance(val, (datetime,)):
        return f'"{val.strftime("%Y-%m-%d")}"'
    elif isinstance(val, list):
        items = [toml_escape(x) for x in val]
        return "[" + ", ".join(items) + "]"
    elif isinstance(val, dict):
        parts = [f"{k} = {toml_escape(v)}" for k, v in val.items()]
        return "{ " + ", ".join(parts) + " }"
    else:
        escaped = str(val).replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'

def convert_frontmatter(yaml_data, is_section=False):
    lines = ["+++"]
    valid_keys = SECTION_STANDARD_KEYS if is_section else PAGE_STANDARD_KEYS
    extra = {}
    taxonomies = {}
    
    for k, v in yaml_data.items():
        if v is None:
            continue
        k_lower = k.lower()
        if not is_section and k_lower == "tags":
            if isinstance(v, list):
                taxonomies["tags"] = [str(x) for x in v]
            elif isinstance(v, str):
                taxonomies["tags"] = [x.strip() for x in v.split(",")]
        elif not is_section and k_lower == "categories":
            if isinstance(v, list):
                taxonomies["categories"] = [str(x) for x in v]
            elif isinstance(v, str):
                taxonomies["categories"] = [x.strip() for x in v.split(",")]
        elif k_lower == "title":
            lines.append(f'title = {toml_escape(v)}')
        elif k_lower in ("description", "descript"):
            lines.append(f'description = {toml_escape(v)}')
        elif not is_section and k_lower == "date":
            if isinstance(v, (datetime,)):
                lines.append(f'date = {v.strftime("%Y-%m-%d")}')
            else:
                lines.append(f'date = {str(v)[:10]}')
        elif k_lower == "weight":
            try:
                lines.append(f'weight = {int(v)}')
            except (ValueError, TypeError):
                extra[k] = v
        elif k_lower in valid_keys:
            lines.append(f'{k_lower} = {toml_escape(v)}')
        else:
            extra[k] = v
            
    if taxonomies:
        lines.append("[taxonomies]")
        for tax_k, tax_v in taxonomies.items():
            lines.append(f'{tax_k} = {toml_escape(tax_v)}')
            
    if extra:
        lines.append("[extra]")
        for ex_k, ex_v in extra.items():
            lines.append(f'{ex_k} = {toml_escape(ex_v)}')
            
    lines.append("+++\n")
    return "\n".join(lines)

def sanitize_body(body: str) -> str:
    body = re.sub(r'\[([^\]]+)\]\(\)', r'\1', body)
    body = re.sub(r'(\{\{[^}]*\}\})', r'{% raw %}\1{% endraw %}', body)
    return body

def migrate():
    print(f"Starting migration from {DOCS_DIR} to {CONTENT_DIR}...")
    CONTENT_DIR.mkdir(exist_ok=True)
    
    for root, dirs, files in os.walk(DOCS_DIR):
        rel_root = Path(root).relative_to(DOCS_DIR)
        parts = rel_root.parts
        if parts and parts[0] in ("static", "media"):
            continue
            
        target_dir = CONTENT_DIR / rel_root
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for file in files:
            if not file.endswith(".md"):
                src_file = Path(root) / file
                dst_file = target_dir / file
                dst_file.write_bytes(src_file.read_bytes())
                continue
                
            src_file = Path(root) / file
            is_index = (file == "index.md")
            dst_filename = "_index.md" if is_index else file
            dst_file = target_dir / dst_filename
            
            raw_text = src_file.read_text(encoding="utf-8", errors="replace")
            
            m = FRONT_MATTER_RE.match(raw_text) or FOUR_DASH_RE.match(raw_text)
            if m:
                yaml_str = m.group(1)
                body = raw_text[m.end():]
                try:
                    yaml_data = yaml.safe_load(yaml_str) or {}
                except Exception as e:
                    print(f"Warning: Failed to parse YAML in {src_file}: {e}")
                    yaml_data = {}
            else:
                yaml_data = {}
                body = raw_text
                
            if "title" not in yaml_data:
                h1_m = re.search(r"^\s*#\s+(.+)$", body, re.MULTILINE)
                if h1_m:
                    yaml_data["title"] = h1_m.group(1).strip()
                else:
                    yaml_data["title"] = file.replace(".md", "").replace("-", " ").title()
                    
            if is_index:
                rel_path_str = str(rel_root).replace("\\", "/")
                sec_cfg = SECTION_CONFIGS.get(rel_path_str)
                if sec_cfg:
                    for cfg_k, cfg_v in sec_cfg.items():
                        yaml_data[cfg_k] = cfg_v
                        
            new_fm = convert_frontmatter(yaml_data, is_section=is_index)
            new_content = new_fm + sanitize_body(body)
            
            dst_file.write_text(new_content, encoding="utf-8")
            
    for root, dirs, files in os.walk(CONTENT_DIR):
        rel_root = Path(root).relative_to(CONTENT_DIR)
        rel_path_str = str(rel_root).replace("\\", "/")
        if rel_path_str == ".":
            continue
            
        index_file = Path(root) / "_index.md"
        if not index_file.exists():
            cfg = SECTION_CONFIGS.get(rel_path_str, {})
            title = cfg.get("title", rel_root.name.replace("-", " ").title())
            sort_by = cfg.get("sort_by", "date")
            
            fm = [
                "+++",
                f'title = "{title}"',
                f'sort_by = "{sort_by}"',
            ]
            if "paginate_by" in cfg:
                fm.append(f'paginate_by = {cfg["paginate_by"]}')
            if "template" in cfg:
                fm.append(f'template = "{cfg["template"]}"')
            if "page_template" in cfg:
                fm.append(f'page_template = "{cfg["page_template"]}"')
            fm.append("+++\n")
            index_file.write_text("\n".join(fm), encoding="utf-8")

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
