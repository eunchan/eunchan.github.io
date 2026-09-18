.PHONY: build serve clean

ZOLA_PATH = ./tools/zola
ZOLA_TARGET = release
ZOLA = ${ZOLA_PATH}/target/${ZOLA_TARGET}/zola

zola:
	cargo build --${ZOLA_TARGET} --manifest-path ${ZOLA_PATH}/Cargo.toml

build:
	${ZOLA} build

serve:
	${ZOLA} serve

clean:
	rm -rf public
