+++
title = "Migrating to Zola"
date = 2026-09-10
slug = "zola-migration"
[taxonomies]
tags = ["ai", "gemini", "zola", "mkdocs", "ssg", "website", "generator"]
[extra]
comments = true
+++

이 웹사이트는 처음엔 [Hakyll][]로 만들어졌다가, 얼마 전 [Mkdocs][]로
마이그레이션 했습니다. Hakyll로 만들 때에는 이게 static site generator 수준이
아니라 거의 커스텀으로 만든 터라, 이런 저런 기능이 들어갔었네요. 대표적으로,
천체관측 기록을 맵에 표시하게 하는 기능도 있었습니다.

[Hakyll]: https://jaspervdj.be/hakyll/
[Mkdocs]: https://squidfunk.github.io/mkdocs-material/

Mkdocs로 마이그레이션 한 후에는 그런 기능을 추가하는 게 거의 불가능 했습니다.
그래서 쓰면서 항상 아쉬움이 남더군요.

그러다 이번에 조금 시간이 난 김에 Antigravity에서 이런 저런 방법을 물어보니,
Rust [Zola][]나 Go [Hugo][]를 기반으로 몇가지 기능을 추가하는 것을 추천하네요.
두가지 도구는 예전에 몇번 사용해 봤었는데, 무척이나 빨랐던 기억이 있어서, 지금
사용하는 Mkdocs보다는 낫겠다 싶었습니다. 게다가 Zola나 Hugo는 Github Actions로
배포하기도 무척이나 쉽기도 했고요.

[Zola]: https://www.getzola.org/
[Hugo]: https://gohugo.io/

일단 Hugo가 대세긴 하지만, 개인적으로 Go 보다는 Rust를 좋아해서, Rust 기반
Zola로 마이그레이션 하기로 했습니다. 이젠 변환 스크립트도 제가 작성할 필요가
없더군요. Gemini에게 시키니 알아서 툴 설치하고, 알아서 스크립트 만들어서,
Mkdocs기반으로 작성된 문서를 Zola에 맞게 변환해 줍니다. Template도 기존
사이트와 대충 비슷하게 만들어 주더군요.

그 변환 후, 이런 저런 사소한 부분을 고치느라 정식 Zola로는 안되어서, Zola
코드를 수정해서 사용했습니다 (이것도 Gemini가..) 수정된 Zola를 배포하고, 이것을
이용해서 Github Actions에서 웹사이트를 배포하는 것 까지, 총 이틀 저녁으로
완료되네요.

그 사이에 제가 코드를 건든 것은 하나도 없습니다. AI가 작성한 코드를 리뷰하고
그러긴 했지만, 그저 가이드만 해줄 뿐 코드 자체는 고칠 일이 없네요.

