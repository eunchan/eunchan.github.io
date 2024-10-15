----
title: 'Github Pages와 Cloudflare 이용한 정적 사이트 구축'
date: February 5, 2017
public: true
disqus: true
slug: 'github-pages-cloudflare'
tags: ['github', 'github-pages', 'cloudflare', 'cdn', 'static-website']
----

예전에 [Write Website with Hakyll and Git][write-website-with-hakyll-and-git] 글을 쓰면서, 정적인 사이트를 배포하는 방법에 대해 언급한 적이 있습니다.
그 사이 사이트 주소도 eunchan.net에서 eunchan.kim으로 바뀌었고, 배포도 [Amazon S3][ext:amazon-s3] 를 사용하다가 Amazon S3 + [Cloudfront][ext:cloudfront] 로 변경되었습니다.

그러다 최근에 내용은 그대로 두고 [Github Pages][] 옮겨서 S3 버킷을 사용하지 않게 변경하였고, Cloudfront 서비스도 제거하였습니다.
Github Pages가 단일 파일 용량의 제한이 있긴 하지만, 그 사이즈 (100MB)를 넘기기 쉽지 않고, 정적 웹사이트가 1GB를 넘길일도 거의 없어서 괜찮겠다 싶어서 넘어갔습니다.
(그런데 웹사이트 사이즈가 벌써 400MB인건 함정..)

넘어가고 나니, Cloudfront를 쓸 때의 장점 (https 연결)이 사라져서 아쉽더군요.
그러다 발견한 게 [Cloudflare][ext:cloudflare] 입니다.
CDN(Contents Delivery Network) 서비스임에도 개인용으로 가볍게 쓰는 것은 무료로 서비스를 제공해서 한번 써보자 하는 마음으로 옮겼습니다.

이번 글에서는 정적 웹사이트를 Github Page로 올리는 것, Cloudflare로 github custom domain을 연동하는 과정을 설명해 볼까 합니다.

## Github Page 생성하기

[Github Pages][]는 Github에서 유저들에게 제공하는 정적웹사이트 서비스 입니다.
어느 유저나 쓸 수 있습니다.
일단 Github에 가입되어있다고 가정할게요.

### Pages repository 생성

모든 Github Pages는 기본 주소가 `{username}.github.io` 입니다.
즉, 제 깃헙 아이디가 eunchan이니 제 Github Pages 주소는 <https://eunchan.github.io> 가 됩니다.

이 페이지를 만들려면 새로운 저장소를 만들어야 하는데 위의 이름 그대로 만들어야 합니다.
즉 저장소 이름이 `{username}.github.io`가 됩니다.

![username.github.io 이름으로 새 저장소 만들기](/media/page/research/github-pages/github-pages-create-repository.png)

### 정적 사이트 업로드

저장소를 만들었으면, 해당 저장소를 먼저 clone 합시다.

    $ git clone https://github.com/{username}/{username}.github.io

기존에 유지하고 있던 사이트가 있으면 해당 사이트를 복사 후 `git add --> git commit --> git push` 하시고, 아니면 새로 `index.html` 을 만드셔서 추가 후 push 합니다.

그 후 깃헙 저장소로 가서 Setting 항목에 들어갑니다.

![깃헙 Pages 설정화면](/media/page/research/github-pages/github-pages-setting.png)

설정 화면에 보면, **Github Pages** 항목이 있는 걸 확인할 수 있습니다.
여기서 위의 화면에 보이는 대로 설정되어있는지 확인하시고, 아직은 **Custom Domain** 에는 아무것도 넣지 않아요.

잠시 후 웹브라우저로 해당 주소를 접속해 보면, 정적 저장소 페이지가 보일겁니다.

### 개인 도메인 연결하기

이제 가지고 있는 도메인을 github로 연결할 차례입니다.
여기서 몇몇 도메인 서비스에서는 문제가 될 수 있는데, 웹사이트 주소를 www 없이 root domain 으로 사용하고 있었다면 CNAME 레코드가 안먹힐 수 있습니다.
그 때에는 Custom Domain만 설정 후 바로 Cloudflare 로 넘어가서 거기서 CNAME 설정을 해주시면 되요.

Setting 항목에서 **Custom Domain** 부분에 도메인 주소를 넣습니다.
저같은 경우는 `www.eunchan.kim` 을 쓰므로 이 주소를 넣었습니다.

그 후 DNS 설정을 변경하셔야 하는데요.
DNS 서비스에서 `www`에 대한 `CNAME` 레코드를 추가하거나 수정해서 `{username}.github.io`로 지정합니다.
이렇게 하면 유저가 `www.eunchan.kim`을 접속했을 때 해당 요청을 `eunchan.github.io` 로 리다이렉션 시켜줍니다.
우리가 `eunchan.github.io`의 실제 IP를 몰라도 되는거죠 :)

## Cloudflare

[Cloudfront][ext:cloudfront]나 [Cloudflare][ext:cloudflare]나 둘 다 CDN 서비스입니다.
지역적으로 가까운 곳에 사이트를 캐싱해서 접속시 사이트 내용을 빠르게 전달해 주기위한 서비스죠.
CDN을 이용해서 미국에서나 한국에서나 빠르게 웹페이지를 접속할 수 있게됩니다.

Cloudflare를 사용하려면 DNS 서버를 Cloudflare로 변경해야 합니다.
먼저 회원가입을 한 후, Add Website가 나오면 기존에 사용하던 도메인 이름을 입력합니다.

![Cloudflare에 도메인 추가](/media/page/research/github-pages/cloudflare-add-website.png)

입력하면 DNS 레코드를 검색하면서 어떤 주소가 Cloudflare로 캐싱될 수 있는지 화면이 나옵니다.

![Cloudflare의 DNS 레코드 살펴보기](/media/page/research/github-pages/cloudflare-step-2.png)

여기서 필요한 레코드에 Cloudflare 구름을 선택해서 활성화시키고 필요없는 부분은 빼도록 합시다.
그 후, 요금제 선택하는 화면에서 과감하게 Free Plan을 선택합니다.
우리는 월 20달러를 내려고 Cloudflare를 쓰려는게 아니니까요 :)

![요금제 선택(Free Plan)](/media/page/research/github-pages/cloudflare-select-plan.png)

그 다음은 변경할 Nameserver 주소가 나오는데 이 화면이 나오면 도메인의 네임서버 주소를 해당 주소로 변경해 줍니다.

잠시의 시간이 지나면 Cloudflare가 바뀐 네임서버를 인식하고 사이트를 캐싱하기 시작합니다.
네임서버가 바뀌는 것이라 시간이 최대 24시간까지 걸릴 수 있고 그동안은 양쪽 DNS 레코드가 모두 인식되므로 이전 사이트를 닫으면 안됩니다.

### HTTPS 설정

유저와의 연결은 HTTP / HTTPS 모두 지원하는데, 강제로 HTTPS로 하고싶으면, Page Rule을 추가해야 합니다.
무료 플랜은 Page Rule이 3개까지만 지원되므로 이 설정을 하면 두개만 추가로 지정이 가능합니다.

![HTTPS 설정 페이지 (Page Rule)](/media/page/research/github-pages/cloudflare-page-rule.png)

위의 화면에 보이는 대로 도메인을 맞춰서 설정 후 "Always Use HTTPS" 를 선택하면 http로 접속하더라도 Https로 자동으로 연결되게 바뀝니다.

## 마무리

깃헙과 클라우드플레어로 변경 후 deploy가 매우 간단해 졌습니다.
생성된 정적웹사이트 내용을 git으로 관리하게 되서 어디서든지 https 포트만 열려있으면 git push로 사이트를 업데이트 할 수 있습니다.
업데이트 된 사이트는 CDN을 통해서 빠르게 유저가 접속하는 지역으로 배포되고 안그래도 쾌적한 정적사이트를 더욱 더 쾌적하게 즐길 수 있게 되었습니다.
