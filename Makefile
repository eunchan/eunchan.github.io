.PHONY: build serve clean

ZOLA = ./tools/zola/target/release/zola

build:
	${ZOLA} build

serve:
	${ZOLA} serve

clean:
	rm -rf public
