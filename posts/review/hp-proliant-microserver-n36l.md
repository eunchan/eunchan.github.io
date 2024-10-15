---
comments: true
date: 2012-02-23
title: Microserver N36L
---

![HP Microserver](../media/page/review/hp-proliant-microserver-n36l.jpg)\


Motivation
----------

늘어가는 사진, 동영상 데이터의 안전한 보관을 위해 RAID1(Mirroring) 시스템을
이용한 백업장치가 필요한 상황이었습니다. NAS의 선택도 가능하지만 조금 괜찮다
싶은 NAS는 가격이 기 백만원이 넘어가는 상황이라 쉬이 사기 껄끄러운
가격이었습니다.

그러는 와중에 HP Proliant Microserver를 보게 되었죠. 작은 베어본 타입의 PC에
하드디스크 4bay + ODD 1bay해서 총 5개의 드라이브를 장착할 수 있어서 공간의
활용성이 좋아 보였습니다. NAS처럼 펌웨어로 업데이트하는 방식이 아닌 소형
PC형태이기 때문에 직접 운영체제를 설치해서 유연하게 활용할 수 있어 보였습니다.

이 기기를 알게 된게 2010년부터 인듯 한데, 그때부터 살까 말까 고민 고민을 하다가
결국 2년이 지난 지금에서야 구입하게되었습니다. (구입일 : 2012년 2월 20일) 그
당시에는 국내에 출시도 안되고 꽤 비싼 가격이었지만 요새 새 버전이 나온 상태라
30만원 미만으로 구매할 수 있었습니다.

First Look
----------

작은 크기에 비해 배송된 박스는 꽤 컸습니다. 내부에 완충재가 들어가있어 실제
PC는 아담한 모습이었습니다. 동봉된 것은 전원케이블과 분해 설명서, CD가
전부였습니다. ODD를 위한 SATA 케이블조차 없습니다. :)

내부를 뜯어보니 분해가 쉽게 잘 되어있었습니다. 작은 몸체에 어떻게 그 많은게 다
들어가있음에도 배선정리하기 쉽게 만들어져있었습니다. 배선을 위한 통로를 따로
두어서 걸리적거리지 않고 깔끔하게 정리할 수 있었습니다.

기본 사양은 HDD, RAM이 없는 AMD Neo 36L CPU가 달린 녀석이라 집에 굴러다니는
400GB 하드와 새로 구입한 4GB DDR3 RAM을 달아주었습니다.

Usage
-----

이 녀석을 사면서 대강의 계획을 세워두었습니다. 일단 OS는 익숙한 Ubuntu를 쓸까
하다가 Major release를 신경써야 하는 귀찮음에 접고 [Archlinux][] 로 가기로
하였습니다. [Archlinux][] 는 간결함을 추구하는 OS로 원본 소스에 최소한의
수정만을 하고 배포하고 있습니다. 패키지의 버전 반영이 빠른 편이라 제 성격에도
부합하는 녀석인것 같네요.

그 외에 데스크탑과 파일 공유가 되어야 하므로 Samba와 SFTP를 위한 OpenSSH를
설치하였습니다. 또한 Source repository를 위한 Mercurial도 설치하였고, 이
사이트를 이전시키기 위한 NGINX + Django를 설치하였습니다.

Shift to Windows
----------------

최초 [Arch Linux][] 를 설치하여 사용해왔습니다. 그러나 윈도우즈에서만 돌아가는
특정 프로그램으로 인해 서버 운영체제를 Windows 로 전향하였습니다.

### Installed

1. IIS + .NET framework 4.0 + ASP.NET
2. CACert.org Certificate
3. Git Web Access
4. Git for Windows
5. Haskell + hakyll + pandoc
6. uTorrent

### Hakyll for Windows

[Hakyll][] 을 윈도우즈에서 설치하려고 하면 dependancy가 맞질 않고 unix
filter의 사용으로 인해 설치가 되지 않습니다. 이를 해결하기 위해서 cabal로
설치시 아래의 명령으로 설치가 가능합니다.

    cabal install --flags="-unixFilter" --constraints="directory installed" \
    hakyll

이 후 정상적으로 [Hakyll][] 을 import하여 사용할 수 있습니다.

[Hakyll][] 을 컴파일 후 build시 영어가 아닌 UTF-8 인코딩을 사용할 때 글자가
깨지는 경우가 있습니다. 이는 GHC에서 파일을 읽어들일 때 UNICODE로 읽어들이기
때문에 발생하는 것으로 아래의 구문을 hakyll.hs나 site.hs에 추가하면 됩니다.

    import      GHC.IO.Encoding

    main = do
        setLocaleEncoding utf8
        hakyllWith ...

### RAID on Windows 7

Windows 7에서 설치시 BIOS에서 RAID를 선택했다면 설치가 안되는 경우가 있습니다.
이게 Windows 버전을 가리는 것 같은데 안되는 버전에서는 RAID driver를 복사해서
드라이버 로드를 하더라도 실패합니다.

이 경우에는 다시 AHCI로 BIOS에서 변경 후 설치를 진행하는 것이 좋습니다. 그 후
Windows에서 regedit를 이용해 RAID driver를 로드합니다. HP 사이트에서 제공하는
RAID 드라이버는 설치되어 있지 않지만, Windows 7에는 기본적으로 같은 device
ID를 가지는 녀석에 대한 드라이버가 내장되어 있습니다. regedit.exe를 실행하셔서
`HKEY_LOCAL_MACHINE -- SYSTEM -- CurrentControlSet -- services -- amdsbs`
항목을 가서 **Start** 값을 0으로 바꿔줍니다.

이 Start 값을 0으로 바꾸면 Windows 커널이 올라오면서 해당 드라이버도 같이
로드합니다. amdsbs가 N36L의 RAID controller와 같은 Device ID를 지원하는
드라이버이므로 호환됩니다. 이 후 BIOS에서 RAID로 바꾸고 RAID 설정을 하면
정상적으로 윈도우가 부팅되는 것을 볼 수 있습니다. 드라이버를 로드하지 않고
RAID로 변경하면 무한재부팅 현상이 나타납니다.