---
comments: true
date: 2016-11-17
header-img: /media/page/research/hackintosh/hackintosh_sierra.svg
tags:
- mac-os
- sierra
- hackintosh
- alienware-alpha
- dell
- bcm94352z
title: 에얼리언웨어 알파에 macOS 시에라 설치하기
---

Andrew Ng교수의 [Machine Learning 강의][coursera-ml]를 듣고 난 후 [Tensor Flow][tensor-flow]를 배워볼 생각입니다.
머신러닝을 배우면서 내용도 재미있었고, 실생활에 적용할 만한 부분이 많이 있어서, 가장 잘 알려진 Tensor Flow 라이브러리를 이용할 생각입니다.

[coursera-ml]: https://coursera.org/learn/machine-learning
[tensor-flow]: https://www.tensorflow.org/

Tensor Flow를 설치하려고 하니, Linux와 macOS 만 지원을 하더군요.
에얼리언웨어 알파에 설치된 Windows10에서는 설치할 방법이 없을까 생각해보니, Bash On Windows가 생각났습니다.
Ubuntu가 그대로 Windows 10에 들어와서 Bash 쉘을 실행할 수 있었죠.

설치해 보니, 텐서플로우는 잘 설치 되었는데 Cuda 라이브러리가 설치가 안됩니다.
계속 에러를 내서, 결국 포기하고 에얼리언웨어에 해킨토시를 설치하기로 결정합니다.

## Hackintosh?

해킨토시는 애플의 Mac OS X (시에라부터는 macOS 로 이름이 바뀌었습니다) 를 일반 데스크탑이나 랩탑에 설치하도록 약간 수정된 macOS를 말합니다.
애플이 인텔 CPU를 사용하기 전에는 이 방법이 불가능했습니다.
그때에는 PowerPC를 사용하고 있어서 커널을 포팅할 수가 없었죠.
2005년에 인텔로 이주를 발표한 후 OS X를 PC로 포팅하는 방법이 나오기 시작했던걸로 기억합니다.

해킨토시를 왜 사용하는지는 사람마다 다르겠죠.
저는 맥북프로를 사용하면서 macOS가 일반적인 사용과 개발이 매끄럽게 연동되는 것이 정말 마음에 들었습니다.
macOS에서 곧바로 리눅스에서도 돌아갈 수 있는 앱을 만들 수 있었고, 그렇다고 리눅스처럼 Enduser의 사용이 불편한 것도 아니였습니다.
매우 풍부한 애플리케이션이 많이 있어서 오히려 효율적으로 사용할 수 있었죠.
윈도우즈는 Enduser 사용은 매우 편하지만, 반대로 리눅스나 서버 애플리케이션 개발은 매우 어렵습니다.
macOS가 BSD를 차용하면서 그 중간에서 줄타기를 잘 한 것이지요.

## Alienware Alpha

서론이 길었네요.
위에서 언급한 Tensor Flow를 설치하기 위해 에얼리언웨어 알파를 뒤집어 엎기로 합니다.

{{Figure: Alienware Alpha}}

에얼리언웨어 알파는 정말 작은 케이스에 적당한 CPU와(i7까지 업그레이드가 가능합니다) 콘솔 성능보다 약간 앞서는 GPU가 들어있는 미니 베어본 PC입니다.
같은 스펙으로 Steam OS를 설치해서 나온 제품도 있죠.
위쳐3, Dirt3, Forza, Project CARS등 몇몇 게임을 돌려보면, 별다른 무리없이 매끄럽게 실행될 정도로 적당한 성능이 나옵니다.

여기에 들어있는 GPU가 CUDA를 지원하기에 Tensor Flow에서 GPU 가속 기능을 사용할 수 있습니다.

## Hackintosh 준비 및 설치

먼저 해킨토시를 설치하기 위해서는 가장 유명한 [TonyMacX86][tonymacx86]사이트를 알아두시는 것이 좋습니다.
이 사이트에 왠만한 정보는 다 들어있구요.
제가 설명하려고 하는 정보도 여기 사이트에 다 나옵니다.
다만 영어를 읽기 귀찮으신 분들을 위해, 그리고 제가 작업한 내용을 저 스스로 잊어먹지 않기 위해 이 글을 씁니다.
또한 [X86(한글)][x86-kr] 사이트에도 좋은 정보가 정말 많습니다.

[tonymacx86]: https://www.tonymacx86.com/threads/unibeast-install-macos-sierra-on-any-supported-intel-based-pc.200564/
[x86-kr]: https://x86.co.kr

macOS 시에라를 설치하기 위해서는 macOS가 설치 된 컴퓨터와 8GB 이상의 USB 메모리가 필요합니다.
저에겐 맥북프로가 있어서 이걸로 설치를 준비했네요.

![](../media/page/research/hackintosh/hackintosh_app-store-sierra.jpg)

앱스토어에서 macOS Sierra 를 다운로드 받습니다.
그 후 설치화면이 나오는 데 설치하지 마시고 그대로 창을 닫고 USB를 준비합니다.

Disk Utility (Cmd + Space 후 Disk Utility 검색하시면 나와요)에서 USB를 선택 후, Erase 해서 "Mac OS Extended", "Master Boot Record" 를 설정한 상태로 포맷합니다.

![](../media/page/research/hackintosh/hackintosh_disk-utility.jpg)

TonyMacX86에서 [Unibeast][] 를 다운 받고 실행하면 아래 화면이 나오는데, 여기서 "Legacy Boot", "Sierra" 를 선택 후 설치를 진행합니다.
나중에 쓰이니 같은 다운로드 페이지에 Multibeast도 받아둡니다.

[Unibeast]: https://www.tonymacx86.com/resources/categories/tonymacx86-downloads.3/

![](../media/page/research/hackintosh/hackintosh_unibeast-1.jpg)
![](../media/page/research/hackintosh/hackintosh_unibeast-2.jpg)
![](../media/page/research/hackintosh/hackintosh_unibeast-3.jpg)

USB 속도에 따라 10분에서 20분 사이에 USB 준비가 완료됩니다.
중간에 OS X Boot 이미지가 마운트되면서 파인더 창이 뜨는데, 그대로 두고 설치가 완료될 때 까지 기다립니다.

이미지 준비가 완료되면, Multibeast 앱도 같이 USB에 넣어줍니다.
추후 작업을 편하게 하려면 NVIDIA Web Driver, KEXT Installer, Clover Configurator, EFI Mounter v3 등을 같이 넣어주시면 더 편합니다.

이제 준비가 되었으니 macOS Sierra를 설치해 봅시다.

### High Sierra

High Sierra는 Unibeast가 아직 안되는 것 같네요.
일단 High Sierra 설치 이미지를 받아서 USB에 이미지를 옮기신 후 Clover를 설치합니다.
Clover를 Sierra나 High Sierra에서 설치해야 할 경우, SIP 를 꺼줘야 합니다.

시스템을 재시작하고 Cmd + R 키를 누르고 있으면 복구모드로 들어갑니다.
여기서 터미널 (Utilities > Terminal)을 실행한 후

    $ csrutil disable

위 명령을 실행하면 SIP 를 끌 수 있습니다.
그 후 재시작하고 Clover를 설치합니다.
SIP가 활성화 되어있으면 Clover 설치시 에러가 나서 진행이 되질 않습니다.

## BIOS Setup

에얼리언웨어 글자가 보이면 F2를 눌러서 BIOS 세팅으로 갑니다.
여기서 해제해 줘야할 것이 몇 있는데, 이 부분을 바꾸지 않으면 USB 설치가 되지 않습니다.

1.  CPU : Intel Virtualization Technology : 끄기
2.  CPU : Limit CPUID Value: 끄기
3.  BOOT : Boot mode를 Legacy로 바꾸기
4.  BOOT : 부팅

다 설정하였으면 저장 후 재부팅 합니다.

## Sierra

그 이후 설치는 보통의 맥 OS 설치와 동일합니다.
다만 처음 부팅할 때 Clover 부트로더가 뜨는데, 여기서 External로 USB를 선택해 주셔야 합니다.

Sierra 설치 시 전 Windows 파티션을 다 날렸습니다.
Disk Utility를 이용해 GUID partition으로 Mac OS Extended로 포맷하셔야 합니다. (**데이터백업은 필수! 아시죠? **)

설치가 끝나면 아직 USB를 뽑지 마시고 재부팅 합니다.
아직 디스크에 Clover 부트로더가 설치되지 않았기 때문에 USB 드라이브의 Clover 부트로더를 이용해 디스크의 macOS를 실행합니다.

## 설정하기

일단 시에라 설정화면까지 보이면 이제 조금 복잡해 집니다.
유저이름, 비밀번호, 언어등을 설정하신 다음 Ethernet 으로 인터넷 연결을 합니다.
에얼리언웨어 알파에 들어있는 Wifi 모듈은 인텔 제조인데, 인텔이 OS X 드라이버를 제공하지 않아서 인식이 안됩니다.

저같은 경우는 현재 Broadcom (경쟁사인데!) 의 [BCM94352Z NGFF M.2 모듈](./bcm94352z-setup-on-macos-sierra.md)을 주문해두었습니다.
macOS에서 가장 인식이 잘되는 무선랜 모듈이라고 하네요.

### Graphic, Audio (HDMI)

에얼리얼웨어 알파 (2015년 버전)에는 커스텀 NVIDIA GPU가 들어있습니다.
일단은 Nvidia에서 제공하는 Webdriver 를 설치하면 되는데, 설치하지 않은 상태에 부팅할 때 화면이 번쩍이는 걸 보셨을 겁니다.
이 현상은 Nvidia Webdriver와 NVidiaStartupWeb.kext 커널 확장모듈을 설치한 후 Clover (아래에 설치 내용이 있습니다) 에서 설정해 주면 제대로 그래픽이 잡히면서 사라집니다.

HDMIAudio.kext는 HDMI로 소리까지 전송하게 하는 확장프로그램입니다.
일단 에얼리언웨어 알파에 따로 3.5mm 잭도 없어서 (니가 애플이냐), HDMI Audio 출력이나 외부 DAC, 또는 블루투스 스피커를 통해 소리를 출력할 수 밖에 없습니다.

이 두가지는 **Kext Utility.app** 을 이용해 설치할 수 있습니다.
제가 설치한 NVidia Web Driver는 버전이 **WebDriver-367.15.10.15f01** 입니다.
버전마다 지원하는 macOS 버전또한 다르니 꼭 잘 맞는 버전으로 설치해야 합니다.

### Clover 부트로더

이제 부트로더를 설치해서 USB 없이 부팅할 수 있게 합시다.
USB를 준비할 때 복사해 둔 **Multibeast.app** 을 실행해서 Clover를 설치합시다.
_Quick Start_ 메뉴에서 Legacy mode를 선택한 다음 _Build_ 탭에서 파티션을 Main을 설정 후 (파티션 만들 때 이름), **Install** 을 눌러 Clover를 설치합니다.

### EFI config.plist

Clover 설치 후 EFI 파티션을 수정해야 합니다.
수정하지 않아도 동작은 되지만, 좀 더 부드럽게 하기위해 config.plist를 수정합니다.

먼저 EFI mounter로 EFI를 파인더에서 찾을 수 있게 마운트 합니다.
**Clover Configurator.app**을 열면 바로 'EFI/CLOVER/config.plist' 파일을 여는데, 만일 열리지 않았다면 직접 이 위치로 가서 로드합시다.

1.  Boot 탭에서 `nv_disable=1`이 체크해제되었는지 확인합니다.
2.  System Parameters 탭에서 `NvidiaWeb`을 체크합니다.

이 두가지를 한 후 재부팅하면 깜박임이 사라진 것을 볼 수 있습니다.

연김에 몇가지 더 합시다. 제대로 시리얼넘버와 SmUUID를 설정하여 나중에 iMessage 를 사용하도록 합니다.

1.  Rt Variable 탭에서 **Calculate**를 클릭해서 자동으로 계산이 나오는 것을 확인합니다.
2.  SMBIOS 에서 오른쪽 아래에 있는 마법봉 (Magic wand)을 클릭해서 맨위에 모델을 **iMac(14,2)** 로 선택합니다.
3.  Rt Variable에서 Serial Number를 SMBIOS 탭의 Board Serial Number에 복사하고 뒤에 알파벳+숫자로 5글자를 더 입력합니다.
4.  Terminal을 열어서 `uuidgen` 을 실행해서 나오는 값을 SMBIOS 탭의 smUUID 항목에 복사합니다.

### Power Management

잠자기를 하면 실제로 잠들지 않고 화면이 켜져있는 상태로 유지되는 걸 볼 수 있을 겁니다.
제대로 그래픽까지 꺼서 절전에 들어가기위해, EFI 파티션이 마운트 된 상태에서
DSDT / SSDT 파일을 'EFI/CLOVER/ACPI/patched' 디렉토리에 복사합니다.

그 후에 잠자기를 테스트하면 잘 들어가게 됩니다.

### Trim

Trim은 SSD를 사용할 때 비어있는 공간을 purge 해서 SSD를 효율적으로 사용할 수 있게 하는 방법입니다.
애플은 자사 OEM 드라이브가 아니면 기본으로 Trim이 비활성화 되어있어서 강제로 켜줘야 합니다.

Terminal 앱에서 아래 명령을 실행합시다.

    $ sudo trimforce enable

### Enable HiDPI

만일 4K 모니터를 사용하고 있다면 HiDPI를 켜주면 미려한 폰트를 즐길 수 있습니다.

<https://github.com/syscl/Enable-HiDPI-OSX> 에 나온 스크립트를 실행합니다.

Terminal에서 아래 명령을 입력합시다.

    $ curl -o ~/enable-HiDPI.sh https://raw.githubusercontent.com/syscl/Enable-HiDPI-OSX/master/enable-HiDPI.sh

이 명령을 실행 후 `ls -al ~`을 하면 `enable-HiDPI.sh` 파일이 다운받아진 것을 볼 수 있습니다.
실행권한을 주고 실행합니다.

    $ chmod +x ~/enable-HiDPI.sh
    $ ~/enable-HiDPI.sh

재부팅 하면 레티나 설정을 할 수 있게 됩니다.

## 추가

### Facetime, iMessage (검증되지 않음)

일단 위에서 Clover의 config.plist를 설정했으면 터미널에서 아래 명령을 입력하면 Facetime 을 사용할 수 있습니다.

    $ cd ~/Library/Caches/
    $ sudo rm -R com.apple.Messages*
    $ sudo rm -R com.apple.imfoundation*
    $ cd ~/Library/Preferences/
    $ sudo rm com.apple.iChat*
    $ sudo rm com.apple.imagent*
    $ sudo rm com.apple.imessage*
    $ sudo rm com.apple.imservice*
    $ sudo rm -R ~/Library/Messages/

### 볼륨 조절 (검증되지 않음)

1.  Install SoundFlower and SoundFlowerBed.
2.  Select 'HDMI' for 'Soundflower(2ch)' in SoundFlower.
3.  select output as 'Soundflower(2ch)' in Sound of System Preferences.