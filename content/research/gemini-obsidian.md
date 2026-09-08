+++
title = "Gemini + Obsidian: AI가 보조하는 지식 관리 시스템"
date = 2026-04-22
slug = "gemini-obsidian"
[taxonomies]
tags = ["ai", "obsidian", "gemini", "productivity", "knowledge-management", "pkm"]
[extra]
public = true
+++
## Overview

한 5년 전 즈음에 [FOAM](../blog/posts/2020/2020-06-30-foam/)에 대해서 언급한
적이 있습니다. 그때 즈음에 Personal Knowledge Management System (PKMS)에 대해
접하고 Zettelkasten, ROAM 같은 개념들을 알게 되었죠. 당시에는 VS Code 기반의
FOAM에 안착해 노트를 관리해왔습니다.

하지만 폴더로 노트를 분류하기를 좋아하던 저에게 당시 FOAM의 인터링크 기능은 조금
아쉬운 부분이 있었습니다. 자연스럽게 관리에 소홀해졌고, 애플 입사 후에는 자료
아카이빙이 강력한
[DevonThink](https://www.devontechnologies.com/apps/devonthink)를 주로 사용하게
되었습니다. 어떤 자료라도 던져 넣으면 검색이 가능하다는 점은 무척 편리했지만,
데이터가 특정 도구에 종속된다는 점이 늘 마음에 걸렸습니다.

다시 구글로 옮긴 후, 코딩 도구로 써오던 Gemini CLI를 보며 문득 그런 생각이
들었습니다. '코드도 텍스트고 문서도 텍스트인데, 이 녀석이 내 노트 관리도 도와줄
수 있지 않을까?' 그 길로 예전에 잠시 써봤던 [Obsidian](https://obsidian.md)을
다시 설치했고, 제 지식 관리의 마지막 조각이 맞춰지는 기분이 들었습니다.

## LLM Wiki (AI as librarian) & AI as assistant

최근 Andrej Karpathy가 제안한 [LLM
Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 개념이
화제가 되었습니다. 수만 개의 노트를 사람이 직접 검색하고 연결하는 데 한계가
있으니, 아예 AI가 정보를 읽고 스스로 위키를 만들게 하자는 발상입니다. 사용자는
날것의 정보(raw source)만 제공하고, 정리는 AI가 전담하는 'AI 중심의 지식
관리'죠. 무척 흥미롭고 효율적인 접근이라고 생각합니다.

하지만 저는 조금 다른 방향으로 AI를 활용하고 있었습니다. 저는 AI가 모든 걸
정리해 주는 결과물보다, 제가 노트를 정리하며 느끼는 그 '맥락'과 '과정'을
소중하게 생각하는 편입니다. 그래서 저는 AI에게 사서의 역할을 맡기기보다, 제가
만든 체계 안에서 귀찮은 일들을 도와주는 '조수'의 역할을 맡기기로 했습니다.

카파시의 방식이 'AI가 주도하는 위키'라면, 제 방식은 제가 오랫동안 유지해온
[**PARA(Project-Area-Resources-Archive)**](https://www.buildingasecondbrain.com/para)
+ **Journal** 체계를 AI가 보조하는 '에이전틱 워크플로우(Agentic Workflow)'에
가깝습니다.

## My Environment

이 조수(Gemini)를 제대로 활용하기 위해 저만의 소박한 작업 환경을 꾸렸습니다.

단순한 키워드 검색(`grep`)은 단어가 조금만 달라도 정보를 찾지 못하는 경우가
많았습니다. 그래서 `ChromaDB`와 `sentence-transformers`를 활용해 의미 기반의
검색 환경을 만들었습니다. 덕분에 제가 정확한 단어를 기억하지 못해도, Gemini는
"이전에 이런 비슷한 고민을 하셨던 것 같아요"라며 관련 노트를 찾아줍니다.

이 과정에서 한국어 처리를 위해 로컬 모델을 활용하기도 하고, `index_vault.py`나
`search_vault.py` 같은 작은 스크립트들을 만들어 Gemini가 제 노트를 더 잘
이해하도록 도왔습니다. 이 모든 과정은 누군가에게 가르쳐주기 위한 거창한
시스템이라기보다, 순전히 제가 더 편하게 생각에 집중하고 싶어서 만든 저만의
장치들입니다.

매일 쓰는 저널에서 아이디어를 캐내어 프로젝트 문서로 옮기거나, 새로 추가한
자료를 요약해 기존 노트와 연결하는 일들. 예전에는 손으로 일일이 해야 했던 이
지루한 노동을 이제는 Gemini와 대화하며 처리합니다.

## Conclusion: More time to think

제 방식이 정답이라고 생각하지 않습니다. 시간이 흐르면 카파시의 LLM Wiki가 훨씬
더 강력해질 수도 있고, 혹은 이 모든 고민을 한 번에 해결해 줄 새로운 툴이 나올
수도 있겠죠. 그래서 저 역시 [tolaria](https://github.com/refactoringhq/tolaria)
같은 새로운 프로젝트들을 유심히 지켜보고 있습니다.

다만 지금 이 시스템이 구축되고 나서 가장 좋은 점은, 귀찮은 정리는 AI에게 맡기고
저는 '생각'할 시간이 조금 더 늘어났다는 점입니다. 아무리 AI가 똑똑해져도, 결국
제 삶의 맥락을 담고 고민을 이어가는 건 제 몫으로 남겨두고 싶습니다. 그 작은
여유가 주는 즐거움이 제가 지식 관리를 계속하게 만드는 힘인 것 같습니다.
