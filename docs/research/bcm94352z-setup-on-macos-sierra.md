---
comments: true
date: 2016-11-19
header-img: /media/page/research/hackintosh/hackintosh_sierra.svg
tags:
- mac-os
- sierra
- hackintosh
- alienware-alpha
- bcm94352z
- wifi
- bluetooth
- fake-pciid
- clover
title: Broadcom BCM94352Z, macOS 시에라에서 설정하기
---

[에얼리언웨어 알파 해킨토시 설치](./installing-macos-on-alienware-alpha.md)
글에서 잠깐 언급했는데, 알파에 기본으로 내장된 WIFI 모듈은 인텔 제조라 macOS에서
드라이버가 없어서 동작을 못합니다. 그래서 인터넷을 수소문 한 결과, 브로드컴의
BCM94352Z가 문제없이 잘 동작한다길래 [아마존에서 주문][bcm-amazon]해서 막
받았네요.

[bcm-amazon]: https://www.amazon.com/BCM94352Z-NGFF-WiFi-Bluetooth-802-11ac/dp/B00JGFA50U

그런데 이놈이 이렇게 고생을 시킬 줄은 꿈에도 몰랐죠. ㅜ.ㅜ
인터넷 설명이 죄다 El Capitan, 아니면 Sierra 10.12 여서, 제가 설치한 버전인 10.12.1 에는 동작을 안하더군요.

## Final Result

고생기를 먼저 장황하게 쓸 필요는 없을 것 같고, 일단 고생한 결과물을 알려드릴게요.

1.  [RehabMan의 BrcmPatchRAM](https://bitbucket.org/RehabMan/os-x-brcmpatchram/downloads)과
    [RehabMan의 FakePCIID](https://bitbucket.org/RehabMan/os-x-fake-pci-id/downloads)을 다운로드 받아둡니다.

2.  EFI Mounter로 EFI 파티션을 연결합니다. 수정을 하기 전 EFI 폴더를 백업해 둡시다.
    만일을 위해서 Clover Bootable USB도 준비합니다.
    이전에 Sierra를 설치했다면 그 USB만 있어도 됩니다.

3.  `EFI/CLOVER/kexts/Other` 디렉토리에 위의 두 파일을 압축을 풀어서, 아래 4개의 파일을 복사합니다.

    + BrcmPatchRAM2.kext
    + BrcmFirmwareData.kext
    + FakePCIID.kext
    + FakePCIID_Broadcom_WiFi.kext

4.  `EFI/CLOVER/config.plist`를 엽니다. 그러면 Clover Configurator 앱이 열릴겁니다.

5.  **Acpi** 탭에서 **DropOEM**을 선택합니다. (SSDT 항목에 있어요)

6.  **Boot** 탭에서 **kexts-dev-mode=1** 을 선택합니다.

7.  **Device** 탭에서 WiFi 에 `0x43B114E4`를 입력합니다.
    이 값은 DPCIManager.app 에서 보이는 브로드컴 WIFI 의 Device/Vendor ID 입니다.
    만일 DPCIManager.app에서 브로드컴이 안보인다면 연결이 잘 안된것이므로 윗판을 뜯어서 다시 확인합시다.

8.  **System Parameters** 탭에서 **Inject Kext**를 **Yes**로 바꿔줍니다.

9.  저장 후 나갑니다.

10. Terminal을 열어서 vim이나 기타 텍스트 에디터로 `EFI/CLOVER/config.plist`를 엽니다.
    **TextEdit.app** 은 사용하지 마세요. 인식이 안되서 오동작할 수 있습니다.
    아래 내용을 입력하는데, tab으로 띄어쓰기 해야 합니다.
    안그러면 인식이 안될 수 있어요.

````
	<key>KernelAndKextPatches</key>
	<dict>
        ...
		<key>KextsToPatch</key>
		<array>
			<dict>
				<key>Comment</key>
				<string>AirPortBrcm4360 - fcvo</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				gflSqgAAdSk=
				</data>
				<key>Name</key>
				<string>AirPortBrcm4360</string>
				<key>Replace</key>
				<data>
				gflSqgAAZpA=
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>AirPortBrcm4360 - PCI Error 1</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				QTnEdRs=
				</data>
				<key>Name</key>
				<string>AirPortBrcm4360</string>
				<key>Replace</key>
				<data>
				QTnEZpA=
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>AirPortBrcm4360 - PCI Error 2</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				QQ+3zTnBdQw=
				</data>
				<key>Name</key>
				<string>AirPortBrcm4360</string>
				<key>Replace</key>
				<data>
				QQ+3zTnBZpA=
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>AirPortBrcm4360 - PCI Error 3</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				g33EBHQG
				</data>
				<key>Name</key>
				<string>AirPortBrcm4360</string>
				<key>Replace</key>
				<data>
				g33EBGaQ
				</data>
			</dict>
		</array>
````

11. 재부팅 합니다.

이제 와이파이가 잘 뜰겁니다.

## Downloads

위에서 설명된 프로그램은 아래의 링크에서 받을 수 있습니다.

- EFI Mounter : <https://www.tonymacx86.com/resources/efi-mounter-v3.280/>
- DPCIManager : <https://sourceforge.net/projects/dpcimanager/>