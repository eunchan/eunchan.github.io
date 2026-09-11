+++
title = "Migrating to Zola"
date = 2026-09-10
slug = "zola-migration"
[taxonomies]
tags = ["ai", "gemini", "zola", "mkdocs", "ssg", "rust", "antigravity"]
[extra]
comments = true
+++

# Migrating to Zola

그동안 잘 써오던 Material for MkDocs를 뒤로하고, Rust 기반의 정적 사이트
생성기인 [Zola][]로 블로그를 마이그레이션 했습니다. Antigravity와 함께 단 이틀
저녁 만에 250여 편의 글을 이전하고, 순정 Zola의 한계를 넘기 위해 오픈소스
코드를 직접 패치해 20초 만에 끝나는 초고속 GitHub Actions 배포 파이프라인까지
구축한 과정을 정리해 봅니다.

<!-- more -->

### 또 한 번의 이사

제 개인 웹사이트는 2012년부터 [Hakyll][]을 오랫동안 사용하다가, [재작년에
Material for MkDocs][Switch-to-MkDocs]로 한 차례 이사를 했습니다.

Hakyll을 쓰던 시절에는 단순한 정적 사이트 생성기라기보다 하스켈 라이브러리에
가까워서, 밤하늘 천체관측 기록을 지도 위에 띄우는 등 제 입맛에 맞춘 온갖 커스텀
기능들을 직접 만들어 넣었더랬죠. 하지만 MkDocs로 넘어온 뒤로는 그런 독자적인
기능을 덧붙이기가 여간 까다로운 게 아니었습니다. 파이썬 환경의 플러그인을
이것저것 세팅하고 전처리 스크립트를 돌려야 했고, 글이 늘어날수록 빌드 속도도
조금씩 답답해지더군요. 쓰면서도 마음 한구석엔 늘 아쉬움이 남아 있었습니다.

그러다 이번에 저녁 시간을 내어 요즘 개발에 애용하고 있는 [Google
Antigravity][Antigravity-Post]와 잡담하듯 대안을 의논해 보았습니다.
Antigravity는 단일 바이너리로 빠르고 깔끔한 Rust 기반의 [Zola][]나 Go 기반의
[Hugo][]로의 전환을 추천하더군요.

둘 다 예전에 써보며 놀라운 빌드 속도에 감탄했던 기억이 있고, GitHub Actions로
배포 파이프라인을 구축하기도 훨씬 수월해 보였습니다. 요즘 대세는 Hugo라지만,
개인적인 취향으로는 Go보다는 Rust에 훨씬 더 애정이 가더군요. [예전에 Rust를
배워보겠다고 직접 웹사이트 생성기를 만들려다 머리 아파서 포기했던
기억][Switch-to-MkDocs]도 떠올라, 이번엔 망설임 없이 Zola를 선택했습니다.

### 코딩 없는 마이그레이션

예전 같았으면 250개가 넘는 기존 마크다운 글들의 YAML 프론트매터를 TOML로
변환하고, 디렉토리 구조를 맞추고, Jinja2/Tera 템플릿을 새로 짜느라 며칠 밤을
새웠을 겁니다. 그런데 이번엔 제가 직접 짠 스크립트가 단 한 줄도 없습니다.

Antigravity에게 마이그레이션 목표를 설명해 주니, 알아서 필요한 도구들을 찾고
마이그레이션 파이썬 스크립트를 작성해서 250여 편의 글과 미디어 파일들을 Zola
구조로 단숨에 변환해 주더군요. 기존 MkDocs 사이트의 Pretendard 폰트와 깔끔한
레이아웃, 모바일 드로어 메뉴까지 Zola 템플릿과 CSS로 거의 흡사하게 복원해
냈습니다.

### 순정 Zola로 안 된다면?

MkDocs에서 사용하던 깔끔한 `.html` URL 구조(`use_directory_urls: false`)와
슬러그 기반의 상대 경로 링크 처리가 순정 Zola에서는 지원되지 않는 문제가
있었습니다. 기존 방식을 포기하고 Zola 기본 방식인 `/slug/index.html` 디렉토리
구조로 가자니, VS Code나 Obsidian에서 파일 검색을 할 때 온통 `index.md`만 뜨는
이른바 'index.md 지옥'에 빠지게 생겼더군요.

"순정 기능에 없다면, Zola 소스코드를 직접 패치해서 쓰면 되지 않을까?"

생각난 김에 Antigravity에게 [Zola 저장소를 포크][Zola-Fork]해서 필요한
기능(`use_directory_urls` 설정 지원 및 링크 리졸버 패치)을 Rust로 직접 구현해
달라고 요청했습니다.

그러자 AI가 Zola의 내부 크레이트(`components/config`, `components/content`,
`components/site`) 소스코드를 분석하더니, 필요한 구조체와 렌더 큐 로직을 쓱쓱
수정하고 단위 테스트까지 통과시켰습니다. 심지어 이 커스텀 Zola를 GitHub
Actions에서 Linux와 macOS용 릴리즈 바이너리로 자동 빌드해 배포하는
워크플로우까지 만들어 주더군요.

### 20초 만에 끝나는 배포, 그리고 격세지감

마지막으로 블로그 저장소의 GitHub Actions를 손봤습니다. 매번 무거운 러스트를
컴파일할 필요 없이, 방금 빌드해 둔 커스텀 Zola 릴리즈 바이너리를 `curl`로
다운받아 사이트를 빌드하도록 구성했습니다.

이제 글을 커밋하고 `main` 브랜치에 푸시하면:

1. 커스텀 Zola 다운로드 (2초)
2. 250여 개 전체 페이지 빌드 (0.7초)
3. GitHub Pages 배포 완료 (약 15초)

푸시하고 브라우저를 새로고침하면 **단 20초 만에** 라이브 사이트에 글이
올라갑니다.

마이그레이션 검토부터 템플릿 재현, Zola 오픈소스 코드 패치, 릴리즈 바이너리
빌드, 그리고 GitHub Actions 배포 자동화까지... 이 모든 과정이 **단 이틀 저녁**
만에 끝났습니다.

그 사이에 제가 직접 작성한 코드는 단 한 줄도 없습니다. 저는 그저 방향을
제시하고, AI가 제시한 계획과 코드를 리뷰하며 가이드만 해 주었을 뿐입니다.

몇 년 전 일 끝나고 혼자 머리 싸매며 Rust 코딩을 하다가 진도가 안 나가 포기했던
기억이 오버랩되면서, 새삼 코딩과 소프트웨어 개발의 패러다임이 완전히 바뀌었음을
피부로 실감하게 됩니다.

이제 툴 세팅도 끝났으니, 다시 가벼운 마음으로 글쓰기에 집중해야겠습니다.

[Hakyll]: https://jaspervdj.be/hakyll/
[Switch-to-MkDocs]: ../2024/2024-10-15-swich-to-mkdocs.md
[Zola]: https://www.getzola.org/
[Hugo]: https://gohugo.io/
[Antigravity-Post]: ../2025/2025-11-24-antigravity.md
[Zola-Fork]: https://github.com/eunchan/zola

