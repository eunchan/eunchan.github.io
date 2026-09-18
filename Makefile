.PHONY: build serve deploy clean

ZOLA_PATH = ./tools/zola
ZOLA_TARGET = release
ZOLA = ${ZOLA_PATH}/target/${ZOLA_TARGET}/zola

zola:
	cargo build --${ZOLA_TARGET} --manifest-path ${ZOLA_PATH}/Cargo.toml

build:
	${ZOLA} build

serve:
	${ZOLA} serve

deploy:
	@if [ "$$(jj --no-pager log -r '@' --no-graph -T 'empty')" != "true" ]; then \
		echo "❌ Error: 작업 복사본(@)에 커밋되지 않은 변경사항이 있습니다. 커밋 후 실행하세요." >&2; \
		exit 1; \
	fi
	@jj --no-pager git fetch
	@if [ -n "$$(jj --no-pager log -r 'main@origin ~ ::@-' --no-graph -T 'commit_id')" ]; then \
		echo "❌ Error: main@origin에서 forward integration이 불가능합니다. (원격이 앞서있거나 분기됨). rebase 하세요." >&2; \
		exit 1; \
	fi
	@if [ -n "$$(jj --no-pager log -r 'conflicts() & @-' --no-graph -T 'commit_id')" ]; then \
		echo "❌ Error: 배포할 커밋(@-)에 해결되지 않은 충돌(conflicts)이 있습니다." >&2; \
		exit 1; \
	fi
	@echo "✅ Pre-check 통과: main 북마크 이동 및 푸시를 진행합니다."
	jj bookmark set -r @- main && jj git push -b main

clean:
	rm -rf public
