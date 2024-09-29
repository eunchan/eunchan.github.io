---
date: 2015-11-19
tags:
  - go
  - golang
  - mac
  - osx
  - cross-compile
---

# Cross Compiling Go program

오늘은 뜬금없이 Go 언어에 관해서 글을 써 볼까 합니다.
제가 Synology NAS (정확히는 N36L을 이용한 해놀로지)를 사용하고 있는데,
이 NAS에서 Go로 만들어진 프로그램을 	실행해야 할 상황이 되어 몇가지 알아보았습니다.

크로스 컴파일은 일반적인 컴파일러에서 자주 사용되는 기법인데,
개발 PC에서 ARM 용 코드를 ARM 에서 실행될 수 있는 바이너리로 컴파일 하는 것이 가장 많이 접해볼 수 있는 크로스 컴파일 상황일 것 같습니다.

일단 golang을 linux/amd64 용으로 만들어야 합니다.
Mac 에서 Homebrew를 사용하고 있으면 Source directory로 가서 아래의 문구를 실행해 봅시다.

```
$ cd $(brew --prefix go)/libexec/src
$ export GOROOT_BOOTSTRAP=$(brew --prefix go)/libexec
$ GOOS=linux GOARCH=amd64 CGO_ENABLED=0 ./make.bash --no-clean
```

이 컴파일 과정이 끝나면 linux/amd64용 go 컴파일러가 `../bin/go` 에 만들어 집니다.
현재 맥에서 사용하는 go와 구별하기 위해서 이 파일을 카피해서 파일명을 `syno.go` 로 변경하도록 합시다.

그 후 컴파일 할 프로그램이 있는 곳으로 가서 빌드를 합니다.

```
GOOS=linux GOARCH=amd64 syno.go build
```

그러면 해당 디렉토리에 실행파일이 만들어지는데, 실제 실행해 보면 executable이 아니라고 에러가 나면서 실행이 되지 않습니다.
이 파일은 synology에서 실행될 수 있는 파일이므로 synology NAS에 복사 후 실행해 보면 실행이 잘 되는 것을 볼 수 있습니다.
