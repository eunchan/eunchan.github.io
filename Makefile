.PHONY: build deploy gen_md recent

REPO_TOP=$(shell git rev-parse --show-toplevel)
MKDOCS=/opt/homebrew/bin/mkdocs

#gen_md:
#	find docs -type f -name "*.md" -delete
#	./meta_update.py -d posts -o docs

build: # gen_md
	${MKDOCS} build

serve: # gen_md
	${MKDOCS} serve

CURR_BRANCH=$(shell git branch --show-current)
ifneq ($(CURR_BRANCH), main)
deploy:
	@echo "Need to be in main branch to deploy" >&2
else
deploy: recent
	${MKDOCS} gh-deploy
endif

recent:  # Add recent posts in docs/index.md
	awk '/^## 최근 글/ { exit } { print }' docs/index.md > /tmp/index.md.head
	echo '## 최근 글' >> /tmp/index.md.head
	echo '' >> /tmp/index.md.head
	python3 scripts/collect_dates.py -m -n 10 >> /tmp/index.md.head
	mv /tmp/index.md.head docs/index.md
