.PHONY: build deploy gen_md

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
deploy: # gen_md
	${MKDOCS} gh-deploy
endif