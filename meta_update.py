#!/usr/bin/env python3
"""Read .meta.yml and update markdown files in the subdirectories."""

from typing import List, Dict
from dataclasses import dataclass
import argparse
import copy
import pprint
import yaml
import frontmatter
import os

_META_FILE = ".meta.yml"

def build_meta_struct(
    root: str = ".",
    meta_file: str = _META_FILE) -> Dict[str, dict]:
  """Build meta tree."""
  # os walk directories.
  meta_list: Dict[str, dict] = {}
  for base, dirs, files in os.walk(root):
    parent_meta = get_parent_meta(meta_list, root, base)
    if meta_file in files:
      meta_path = os.path.join(base, meta_file)
      meta = get_meta(parent_meta, meta_path)
      meta_list[base] = meta

    else:
      # re-use same parent
      meta_list[base] = parent_meta

    for dir_name in dirs:
      dir_path = os.path.join(base, dir_name)
      #print(dir_path)

  return meta_list

def get_meta(parent: dict, filename: str):
  """Read from filename and merge with parent."""
  with open(filename, 'r') as f:
    data = yaml.safe_load(f)

  # If override in key, then remove sub key from parent and store
  if "overrides" in data:
    overrides = copy.deepcopy(data["overrides"])
    del data["overrides"]
  else:
    overrides = {}
  if not parent:
    return data

  for key, value in parent.items():
    if key in overrides:
      data[key] = overrides[key]
      continue
    if key in data:
      # Merge both. Only possible when the key is list
      if isinstance(value, list):
        data[key].append(value)
      else:
        # just use data
        continue
    data[key] = value

  return data


def get_parent_meta(meta_list: Dict[str, dict], root: str, dirname: str) -> dict:
  if dirname == root:
    return None
  return meta_list[os.path.dirname(dirname)]


def process_md_with_meta(root: str, meta_list: Dict[str, dict], outdir: str):
  """Visit every markdown and update meta field."""
  # os walk directories.
  mds: Dict[str, List[str]] = {}
  for base, dirs, files in os.walk(root):
    md_files = [os.path.join(base, x) for x in files if x.endswith(".md")]
    if not md_files:
      continue
    mds[base] = md_files
    for md in md_files:
      update_md_with_meta(md, meta_list[base], root, outdir)

  pprint.pprint(mds)


def update_md_with_meta(md: str, meta: dict, root: str, outdir: str):
  """Read markdown and update meta field."""
  post = frontmatter.load(md)
  pprint.pprint(post.metadata)
  merge_meta_to_md(post.metadata, meta)
  #print(frontmatter.dumps(post))
  rel_path = os.path.relpath(md, root)
  out_path = os.path.join(outdir, rel_path)
  out_md_dir = os.path.dirname(out_path)
  print(md, root, rel_path, out_md_dir, out_path)
  if not os.path.exists(out_md_dir):
    os.makedirs(out_md_dir)
  with open(out_path, 'w') as f:
    f.write(frontmatter.dumps(post))


def merge_meta_to_md(post_meta, meta) -> dict:
  """Merge meta and post metadata."""
  for key, value in meta.items():
    if key in post_meta and isinstance(value, list):
        post_meta[key] += value
    else:
      post_meta[key] = value


if __name__ == "__main__":
  parse = argparse.ArgumentParser(prog = "meta")
  parse.add_argument("--dir", "-d", default="posts")
  parse.add_argument("--meta", "-f", default=_META_FILE)
  parse.add_argument("--outdir", "-o", default="docs")

  args = parse.parse_args()
  meta_list = build_meta_struct(args.dir, args.meta)
  pprint.pprint(meta_list)

  process_md_with_meta(args.dir, meta_list, args.outdir)
