+++
title = "Actual Budget, YNAB 완벽 대체재"
slug = "actual-budget"
date = 2026-09-13
[taxonomies]
tags = ["actual-budget", "budget", "ynab"]
[extra]
comments = true
+++

# Actual Budget

10여 년 전 Budget Envelope 도구 [YNAB][]에 관해 이야기한 적이 있습니다. 그
이후로 [YNAB]을 꽤 유용하게 사용했고, 적어도 2019년까지는 가계부를 꾸준히 썼던
것 같습니다. 하지만 그 이후로는 결국 사용을 중단했습니다.

<!-- more -->

단종된 YNAB 4에서 웹 기반의 'New YNAB'으로 넘어가면서 로컬 단독 실행이
불가능해졌고, 결제 방식도 월/연 단위 구독형으로 바뀌었기 때문입니다. 예전 YNAB
4처럼 한 번 라이선스를 사면 평생 쓰는 구조가 아니었죠. 초기에는 기존 사용자에게
할인 혜택을 주었지만, 2019년쯤이었을까요? 그 혜택마저 사라지며 연간 110달러에
달하는 구독료를 내야 하는 상황이 되었습니다.

가계부 하나 쓰자고 1년에 110달러를 내는 것은 아무리 생각해도 너무 과하게
느껴지더군요. 물론 철저한 예산 관리를 통해 아끼는 돈이 구독료보다 훨씬 크다는
'무형의 이득'을 감안하더라도, 소프트웨어 하나에 매달 10달러씩 고정 지출을
만들고 싶지는 않았습니다. 지금처럼 온 세상이 구독 경제로 뒤덮이기 전이기도
했고요.

자연스레 이런저런 대안을 찾아보았습니다. [이전 글][YNAB]에서 언급했던
Financier도 살펴보고, Monarch Money나 Quicken 등 널리 쓰이는 앱들을 두루
테스트해 보았지만 딱히 손에 잡히는 도구가 없었습니다. 대부분의 가계부 앱은 이미
지출된 돈을 사후에 분석하는 지출 추적(Tracking) 방식이었고, 수입을 미리 봉투에
나눠 담아 관리하는 YNAB 특유의 제로 기반 예산(Zero-based budgeting) 철학을
깔끔하게 구현한 앱이 없더군요.

그 즈음부터 다행히 재정 상황에 조금 여유가 생기며 가계부를 써야 할 절박함도
점차 희미해졌습니다. 감사하게도 회사 주식이 올라주면서 예산 관리를 하면 좋고,
굳이 안 하더라도 당장 통장에 구멍이 나는 상황까지는 아니었으니까요.

그런데 얼마 전부터 통장에 다시 구멍이 나기 시작했습니다. 마당의 창고를
재택근무용 홈오피스로 개조하는 공사, 낡은 집 이곳저곳을 수리하는 비용, 그리고
아이들이 자라면서 훌쩍 늘어난 교육비가 맞물리며 지출 규모가 걷잡을 수 없이 커진
탓이었습니다. 어디로 돈이 얼마나 새어 나가고 있는지 정확히 파악해야겠다는
위기감이 번쩍 들더군요.

다시 레딧의 YNAB 포럼을 기웃거려 보았지만, 상황은 예전보다 더 험악해져
있었습니다. 눈에 띄는 기능 개선은 없는데 가격은 계속 인상되어, 오랜 충성
유저들마저 하나둘 서비스를 떠나고 있는 분위기였습니다.

그러다 다른 레딧에서 [Actual Budget(이하 Actual)][AB]을 추천하는 글들을
발견했습니다. YNAB에서 Actual로 갈아탄 유저들의 만족도가 매우 높아 보였습니다.

가장 끌렸던 점은 **오픈소스 로컬에서 동작가능한 소프트웨어**라는 점이었습니다.
구독료 없이 내 집의 서버에서 직접 돌릴 수 있고, 오픈소스임에도 [SimpleFIN][]
브릿지를 연동하면 미국 은행 계좌의 거래 내역을 자동으로 긁어올 수 있더군요.
게다가 웹 인터페이스를 지원하므로 저 혼자만 쓰는 것이 아니라 아내와 함께 동일한
가계부에 접속해 실시간으로 지출을 공유할 수 있었습니다.[^1]


[^1]: 서버를 띄우지 않고 로컬 PC에 데스크탑 앱을 설치해 쓸 수도 있습니다.

## 설정하기

가장 간단한 시작 방법은 [공식 다운로드
페이지](https://actualbudget.org/download)에서 본인 OS에 맞는 데스크톱 앱을
설치하는 것입니다. 하지만 로컬 앱 방식은 컴퓨터가 항상 켜져 있어야 하고
모바일이나 다른 가족과의 동기화가 불편하므로, 상시 구동 서버를 띄우는 것이 훨씬
권장됩니다.

저는 집에 홈서버 역할을 하는 라즈베리파이가 상시 가동 중이라, Docker로 Actual
서버를 올렸습니다. 아래와 같이 간단한 `docker-compose.yml`을 구성하고 `docker
compose up -d`를 실행하면 곧바로 포트 `5006`을 통해 데스크톱 앱과 완전히 동일한
웹 환경이 열립니다.

```yaml
services:
  actual_server:
    image: actualbudget/actual-server:latest
    container_name: actual_server
    ports:
      - '5006:5006'
    volumes:
      - ./actual-data:/data
    restart: unless-stopped
```

브라우저에서 `http://<라즈베리파이_IP>:5006`으로 접속하면 시원하고 깔끔한
대시보드가 맞이해 줍니다.


![Actual Budget Main Page](/media/page/review/actual-main-budget-dark.webp)
*Actual Budget 기본 화면 (출처: Actual Budget)*

## 외부 접속 및 보안 설정 (Cloudflare Tunnel & OpenID)

하지만 로컬 HTTP 환경 그대로 외부에서 쓰기에는 무리가 있습니다. 최신 브라우저와
모바일 환경에서는 보안 프로토콜(HTTPS)이 적용되지 않으면 PWA 설치나 보안 기능이
제한되고 경고창이 뜨기 때문입니다.

자체 서명(Self-signed) 인증서를 만들어 볼까도 했지만, 스마트폰과 태블릿 등
접속하는 모든 기기마다 루트 인증서를 수동으로 신뢰 등록하는 과정이 너무
번거로웠습니다. 그래서 공유기 포트포워딩 없이도 안전하게 공인 HTTPS 도메인을
연결해 주는 [Cloudflare Tunnel][cloudflared]을 활용했습니다.

```yaml
services:
  actual_server:
    image: actualbudget/actual-server:latest
    container_name: actual_server
    ports:
      - '5006:5006'
    volumes:
      - ./actual-data:/data
    restart: unless-stopped

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared_tunnel
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=<Cloudflare_Tunnel_Token>
    restart: unless-stopped
```

Cloudflare 대시보드에서 개인 서브도메인을 로컬의
`http://actual_server:5006`으로 포워딩하도록 지정해 주니, 외부에서도 안전한
HTTPS 주소로 매끄럽게 접속되었습니다.

한 가지 삽질했던 부분은 OpenID 인증 설정이었습니다. Cloudflare Tunnel을 붙이기
전 로컬 주소 기준으로 OpenID를 먼저 활성화해 두었던 탓에, Redirect URI가 이전
주소로 고정되어 로그인 오류가 발생하더군요. OpenID 설정을 비활성화했다가 도메인
주소로 다시 활성화하니 정상 작동했습니다. Google OpenID를 쓸 경우 승인된
리디렉션 URI에 반드시 `https://<내도메인>/openid/callback`을 추가해 주어야
합니다.

## 정리

이로써 매년 110달러씩 나가던 YNAB을 완전히 대체할 수 있게 되었습니다.

내 금융 데이터가 제3자 클라우드 기업의 서버에 종속되지 않고 우리 집
라즈베리파이에 안전하게 보관된다는 안도감이 크고(물론 백업은 잘
챙겨야겠지만요), 기능적으로도 YNAB의 핵심이었던 봉투식 예산 관리를 그대로
재현할 수 있습니다.

은행 거래 내역을 자동으로 동기화해 주는 [SimpleFIN][] 브릿지 비용으로 1년에
15달러가 들긴 하지만, YNAB의 연 110달러에 비하면 10분의 1 수준이라 아주 기분
좋게 감수할 만한 비용입니다.


[YNAB]: you-need-a-budget.md
[AB]: https://actualbudget.org/
[SimpleFIN]: https://beta-bridge.simplefin.org/
[cloudflared]: https://github.com/cloudflare/cloudflared

