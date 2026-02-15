---
comments: true
date: 2026-02-15
slug: home-network
tags:
- fiber
- firewalla
- unifi
- camera
- security
title: Home Network
---

[AT&T Bypass](./att-bypass.md) 글에서 예전 홈 네트워크 구성을 간단히
다뤘었는데요. 그 이후로 장비를 몇 가지 교체하고 구성을 조금 더 다듬었습니다.
아직 100% 만족하는 최종 설정은 아니지만, 어느 정도 안정화된 현재 구성을 기록해
봅니다.

<!-- more -->

![Home Network](../media/page/research/home-network/home-network-2026.png)

## 장비 구성

### Gateway

AT&T 게이트웨이는 IP Passthrough 모드로 설정해 두었습니다. 게이트웨이 자체의
와이파이 기능은 끄고, 단순히 모뎀 역할만 하도록 했죠. 내부 네트워크의 관문이자
라우터 역할은 [Firewalla Gold
Plus](https://firewalla.com/products/firewalla-gold-plus)에게 맡겼습니다.

현재 사용하는 인터넷 플랜은 Fiber 1Gbps이지만, 실제 측정해보면 그보다 약간 더
높은 속도가 나오기도 하고 향후 업그레이드를 고려해 2.5Gbps 포트를 지원하는
Firewalla Gold Plus를 선택했습니다.

### Router

앞서 언급했듯이 라우터는 Firewalla Gold Plus입니다. 2.5Gbps 포트 덕분에 기가비트
이상의 속도를 온전히 활용할 수 있죠.

나머지 네트워크 장비들은 대부분 Unifi 생태계로 구성했지만, 라우터만큼은
Firewalla를 고집했습니다. Unifi의 Gateway 제품군(UDM 등)은 상세한 설정이 다소
제한적이고, 특히 IDS/IPS(침입 탐지/방지 시스템) 기능이나 세밀한 트래픽 제어
면에서 Firewalla가 월등히 강력하기 때문입니다.

### Switch

라우터(Firewalla)의 2.5Gbps 포트 4개 중 하나는 WAN(AT&T 게이트웨이)에, 하나는
메인 스위치에 연결했습니다. 메인 스위치는 [**Unifi Enterprise 8
PoE**](https://store.ui.com/us/en/pro/category/all-switching/products/usw-enterprise-8-poe)를
사용 중입니다. (지금은 단종 수순이고, 비슷한 신제품으로 Pro XG 8 PoE가
나왔더군요.)

이 스위치는 모든 포트가 2.5Gbps와 PoE+를 지원해서 홈 네트워크의 허브 역할을
톡톡히 하고 있습니다. 여기에 [Unifi U7 Pro AP
2대](https://store.ui.com/us/en/category/wifi-flagship/products/u7-pro-xg)가
연결되어 집안 전체의 와이파이를 책임집니다.

나머지 2.5Gbps 포트들은 각각 [QNAP NAS](https://www.qnap.com/en/product/ts-464),
거실의 IoT 허브용 Flex Mini 스위치, 그리고 서재 방의 이더넷 포트로 연결됩니다.
마지막 하나는 보안 카메라 녹화용
[NVR](https://store.ui.com/us/en/pro/category/all-network-video-recorders/products/unvr-instant)에
할당했습니다.

처음엔 8개 포트면 충분할 줄 알았는데, PoE 장비가 하나둘 늘어나다 보니 어느새
포트가 꽉 차버렸네요. 조만간 16포트나 24포트 스위치로 기변해야 할지도
모르겠습니다.

참고로 서재 방에는 컴퓨터가 여러 대 있어서, 벽면 포트에서 [**Flex 2.5G
Mini**](https://store.ui.com/us/en/category/switching-utility/products/usw-flex-2-5g-5)스위치를
통해 각 PC로 분배하고 있습니다. 이 스위치는 메인 스위치로부터 PoE+ 전원을 받아
작동하므로 별도 전원 어댑터가 필요 없어 선정리가 깔끔합니다.

### Access Point

와이파이는 [**Unifi U7
Pro**](https://store.ui.com/us/en/category/wifi-flagship/products/u7-pro-xg) AP
두 대로 커버합니다. 하나는 거실 천장에, 다른 하나는 복도 쪽에 설치해서 모든 방과
주방, 거실을 음영 지역 없이 커버하고 있습니다.

U7 Pro는 WiFi 7을 지원하고 2.5Gbps 업링크 포트를 가지고 있어서, 메인 스위치와
2.5Gbps로 연결해 무선에서도 기가비트 인터넷 속도를 병목 없이 쓸 수 있게 해
줍니다.

### Network Video Recorder (NVR)

보안 카메라는 UniFi Protect 시스템을 사용합니다. 녹화기는 [**Unifi NVR
Instant**](https://store.ui.com/us/en/pro/category/all-network-video-recorders/products/unvr-instant)
모델을 쓰고 있는데, 1Gbps 이더넷 포트로 연결되지만 UNVR 자체가 많은 트래픽을
요구하진 않아서 문제는 없습니다. 게다가 카메라나 도어벨 리더를 연결하는 이더넷
포트는 PoE를 지원해서 설치가 간편합니다. 카메라는 [Unifi
G6](https://store.ui.com/us/en/category/all-cameras-nvrs/products/uvc-g6-bullet)
모델을 연결해 사용 중입니다.

## 향후 업그레이드 계획

현재 구성도 꽤 만족스럽지만, 몇 가지 아쉬운 점들을 보완할 계획을 세우고
있습니다.

첫째는 **스위치 포트 부족** 문제입니다. 앞서 말했듯이 8포트 스위치가 이미 포화
상태라, PoE 장비를 더 추가하려면 16포트나 24포트 스위치로 업그레이드가 불가피해
보입니다.

둘째는 **전원 안정성(UPS)** 확보입니다. 예전에 Unifi U6 AP가 두 번이나 고장 난
적이 있었는데, 둘 다 전원 문제로 의심되더군요. 갑작스러운 정전에 대비하고 장비를
보호하기 위해 UPS(무정전 전원 장치)를 도입해 전원을 보강할 생각입니다.

셋째는 **출입문 자동화**입니다. 지금은 [네스트(Nest)
도어벨](https://store.google.com/config/nest_doorbell_wired_3rd_gen)을 쓰고
있는데, 단순히 누가 왔는지 확인하고 대화하는 정도라 아쉽습니다. [Unifi Access
도어벨](https://store.ui.com/us/en/category/all-door-access/collections/doorbell-entry)과
[스트라이커(Striker)](https://store.ui.com/us/en/category/all-door-access/collections/accessories-pro-door-access-bolt-lock/products/uacc-lock-strike-secure-15mm)를
설치해서 원격으로 문을 열어주는 기능까지 구현해보고 싶네요. 다만 최소 3개의 문을
자동화하려면 PoE+ 전원이 꽤 많이 필요할 텐데, 현재 메인 스위치로는 역시나 용량이
부족할 것 같습니다.

이 모든 계획을 실행하려면 장비가 꽤 늘어날 텐데, 지금처럼 선반에 대충 올려두는
것보다 전용 **서버 랙(Rack)**을 도입해야 할 것 같습니다. 대략 9U 정도 사이즈면
적당할 것 같은데, 9U 사이즈에 바퀴 달린 깔끔한 제품을 찾기가 쉽지 않네요. 정 안
되면 [Unifi의 Toolless Mini
Rack](https://store.ui.com/us/en/category/accessories-rack-mount/products/toolless-mini-rack)
두 개를 쌓아서 쓰는 방법도 고려 중입니다.

![Home Network Plan](../media/page/research/home-network/home-network-plan.png)
