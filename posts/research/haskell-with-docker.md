---
comments: true
date: 2015-12-28
tags: docker, stack, haskell, yesod, virtualization
title: Haskell with Docker
---

**주의: 아래의 내용은 Docker에 대해 배워가면서 작성한 글이기에 정확하지 않거나, 잘못된 내용이 있을 수 있습니다.
실제 업무 환경에 적용하고자 하신다면 충분히 테스트 및 검증하기를 권장합니다**

요즘 클라우드 서비스에서 한창 뜨겁게 달궈지는 이슈를 뽑으라면 [Docker][]를 꼽을 수 있습니다.
가상화에서 발생하는 문제점을 우회하는 방법인데, 몇년 전 부터 급부상 하고 있죠.

[Docker]: https://www.docker.com

가상화는 Guest OS를 Hypervisor위에 올리는 방식 때문에 성능 하락이 가장 큰 문제점이었습니다.
이를 해결하기 위해 Intel에서 가상화 전용 기술도 내어놓고, SR-IOV 를 적용한 이더넷 카드나 스토리지 장치가 등장해서 병목현상을 최소화 하기 위한 여러 기술을 내어놓았죠.
하지만 이런 기술은 각 부품의 단가 상승을 유발하기도 하고 성능 상승도 크지 않아서 그다지 주목받지는 못했습니다.

이 가상화를 다른 방식으로 접근하여 해결하려고 한 것이 [Docker][] 입니다.
컨테이너를 이용해서 실제 Host OS에서 동작하지만 내부 이미지만 접근하도록 만들어 성능과 보안 두가지를 다 잡으려 했습니다.
한가지 단점이 있다면 Host OS위에서 동작하기 때문에 가상화와는 다르게 다른 종류의 Guest OS를 돌릴 수 없고 Host OS에 종속된다는 점이 있습니다.

## Haskell

오늘은 Docker 에 대한 이야기 보다는 Haskell을 어떻게 Docker에서 운용할 것인지에 대한 이야기를 하려 합니다.
Haskell 함수형 언어는 `cabal` 을 이용해 패키지(라이브러리) 관리, 빌드, 배포를 담당하는데, 여러 프로젝트를 진행할 때 `cabal`로는 감당할 수 없는 부분이 많았습니다.
저야 Haskell을 쓰는 곳이 이 사이트를 만드는 데에만 쓰이니 크게 문제되는 일은 없었지만, 개발자 입장에서는 패키지가 충돌나는 경우가 무척 많았다고 하네요.

이를 해결하기 위해 [stack][]이 등장했습니다.
stack은 빌드에 `cabal`을 이용하지만 각 프로젝트별로 라이브러리를 관리해서 다른 프로젝트 라이브러리와 충돌 나는 것을 제거해 줍니다.
공통적으로 사용되는 라이브러리는 중복되지 않게 해서 추가로 용량을 잡아먹지 않게 하는 것은 물론이지요.
그래서 저도 이 사이트 제작하는 도구를 `stack` 환경으로 옮긴 지 몇 달 되었습니다.

[stack]: https://www.stackage.org

## Docker

Haskell로 앱을 제작했다고 할 때 Docker를 이용하려면 크게 두가지 방법이 있습니다.

1.  ubuntu base image를 이용해 개발도구(GHC 포함)등을 Docker Image 내부에서 설치한 후 release.
    가장 쉽게 접근할 수 있는 방법입니다.
    다만 이미지 사이즈가 커지게 됩니다. (build tool이 포함)

2.  외부에서 executable을 만든 후 Docker image를 제작.
    개발툴을 포함시킬 필요가 없지만 config, static 등을 같이 포함시켜야 합니다.
    다만 이미지가 가볍고, 개발툴을 다시 설치할 필요가 없기 때문에 배포에 시간이 짧게 소요됩니다.

어차피 코드는 repository에 관리되고 있으니 2번의 방법으로 개발하는 것이 여러모로 좋아보이는 것이 사실입니다.
stack 개발도구는 2번 방식을 더욱 편하게 하기 위해 docker를 stack에서 사용할 수 있도록 지원하고 있습니다.

```yaml
resolver: lts-3.19

docker:
    enable: true

image:
    container:
        name: eunchan/webapp
        base: fpco/stack-run
        add:
            config: /app/config
            static: /app/static
```

`stack.yaml`에 간단히 docker를 활성화 하면, stack으로 빌드 시 docker를 이용해서 임시적인 이미지를 만들어 실행합니다.
앱을 종료시 자동으로 이미지는 삭제됩니다.

배포를 하고자 한다면 `stack image container` 명령만으로 Docker Image를 만들 수 있습니다.
이 이미지를 private docker repository든 [Docker Hub][]든 push 할 수 있습니다.

다만 docker image를 만들기 위해서는 host system이 리눅스여야 합니다.
Windows와 Mac OS X는 리눅스 기반이 아니기 때문에 [boot2docker][] 를 이용해서 가상환경에서 만들어야 합니다.
boot2docker는 docker를 사용 가능하게 해 주는 점에서는 좋지만, virtualbox 를 기반으로 하기 때문에 느린 성능 + shared directory에 대한 느린 IO가 문제점으로 꼽힙니다.


[Docker Hub]: https://hub.docker.com
[boot2docker]: http://boot2docker.io

## References

1.  [Yesod Hosting Docker and Kubernetes](http://www.yesodweb.com/blog/2015/12/yesod-hosting-docker-kubernetes)
2.  [Stack: Docker Integration](http://docs.haskellstack.org/en/stable/docker_integration.html)
3.  [FPComplete: How stack can use Docker under the hood](https://www.fpcomplete.com/blog/2015/08/stack-docker)