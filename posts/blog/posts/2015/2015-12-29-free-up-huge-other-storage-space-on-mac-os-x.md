---
date: 2015-12-29
tags:
  - os-x
  - crashplan
  - other-storage
  - out-of-space
slug: 'free-up-huge-other-storage-space-on-mac-os-x'
---

# OS X Other 공간 비우기

![Disk Utility](/media/blog/2015-12-29-disk-utility-status.png)

오늘에서야 발견했는데, "Disk Utility"에서 Other 공간이 170GB를 차지하고 있는 것을 보았습니다.
어느 녀석이 이리 잡아먹나 알아보기 위해 [OmniDiskSweeper][]를 설치해서 살펴보았는데 이상한 점이 발견됩니다.

[OmniDiskSweeper]: https://www.omnigroup.com/more

분명히 가용 공간은 겨우 20GB 인데 실제로 검색되는 파일의 총 크기는 125GB 남짓밖에 되지 않았습니다.
뭔가 이상해서 구글링을 해 보니, [OmniDiskSweeper][] 같은 디스크 검사 툴은 `root`권한으로 실행하는 것이 좋다고 하더군요.

    $ sudo /Application/OmniDiskSweeper.app/Contents/MacOSX/OmniDiskSweeper

루트권한으로 실행하니 범인이 드러납니다.
`/.MobileBackups.trash` 디렉토리가 77 GB를 잡아먹고 있었네요.

왜 이렇게 잡아먹나 궁금해서 다시 구글링을 해보니, `CrashPlan`이 범인이었습니다.
CrashPlan을 NAS에서 사용하기위해 Headless로 설치 후 클라이언트만 사용하기에 서비스를 실행 시킬 필요가 없어서 서비스를 중지하고 `/.MobileBackups.trash` 공간을 확보하기로 합니다.

```
서비스 동작 중인지 확인:
$ ps aux | grep CrashPlanService
서비스 비활성화 :
$ sudo launchctl unload /Library/LaunchDaemons/com.crashplan.engine.plist
재시작시 다시 동작하는 것을 없애기 위해 서비스 파일 삭제:
$ sudo rm /Library/LaunchDaemons/com.crashplan.engine.plist
```

지우고 나니 100 GB가 확보되었네요. :)