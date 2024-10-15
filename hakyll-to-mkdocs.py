#!/usr/bin/env python3
"""Convert Hakyll markdown doc to mkdocs markdown."""

from typing import Dict, List, Tuple

from datetime import datetime, date
import os
import sys
import shutil
import argparse
import re
import frontmatter as fm


def custom_date_representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data.strftime('%d/%m/%Y'))


def convert_hakyll_date(old_date: str) -> str:
  """Converte Hakyll style date to ISO."""
  date_obj = datetime.strptime(old_date, "%B %d, %Y")
  #return datetime.strptime(date_obj.strftime("%Y-%m-%d"), "%Y-%m-%d").date
  return date(date_obj.year, date_obj.month, date_obj.day)


def process_hakyll_md(root_relpath: str, md: str):
  post = fm.load(md)
  # process Date
  if "date" in post.metadata and "nodate" not in post.metadata:
    old_date = post.metadata["date"]
    post.metadata["date"] = convert_hakyll_date(old_date)
    # post.metadata["date"] = old_date
  elif "nodate" in post.metadata:
    del post.metadata["nodate"]
    del post.metadata["date"]

  # Remove public
  if "public" in post.metadata:
    del post.metadata["public"]

  # disqus to comments
  if "disqus" in post.metadata:
    discuss = post.metadata["disqus"]
    if discuss in [True, "true", "on"]:
      del post.metadata["disqus"]
      post.metadata["comments"] = True

  # For index.md, add hide: ['toc']
  if md.endswith("index.md"):
    post.metadata["hide"] = ["toc"]


  # relpath to media
  new_content = re.sub(r"\(\/media\/", f"({root_relpath}/media/", post.content)
  post.content = new_content

  with open(md, 'w') as f:
    f.write(fm.dumps(post))

def main():
  parser = argparse.ArgumentParser(prog="hakyll-to-mkdocs.py")
  parser.add_argument("--dir", "-d", default="docs", help="Markdown directories")
  parser.add_argument("--root", "-r", default="posts", help="root docs directory to compute media")
  args = parser.parse_args()

  # Repleace ---- to ---
  os.system(f"find {args.dir} -type f -name \"*.md\"  -exec gawk -i inplace '{{gsub(\"^----$\",\"---\",$0); print $0}}' {{}} +")
  for base, dirs, files in os.walk(args.dir):
    mds = [os.path.join(base, x) for x in files if x.endswith(".md")]
    for md in mds:
      # compute rel path
      root_relpath = os.path.relpath(args.root, md)
      process_hakyll_md(root_relpath, md)


if __name__ == "__main__":
  main()
