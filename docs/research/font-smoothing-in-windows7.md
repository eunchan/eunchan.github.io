---
date: 2012-01-03
title: Font Smoothing
---

Windows에서 Cleartype이 활성화되어있음에도 몇몇 폰트들, 예를들면 Helvetica나
[Roboto][] 폰트같은 Manual hint가 포함되지 않은 글꼴들은 작은 폰트 크기에서
명료하게 보이지 않습니다. Cleartype자체가 어느정도 한계를 지니고 있습니다.

[Roboto][] 폰트의 경우 Mac OS X나 리눅스, 안드로이드에서 매우 깔끔하게
보입니다. 그러나 Windows 7에서는 이 폰트는 거칠고 울퉁불퉁하여 사용할 수 없을
수준입니다.

이러한 문제를 해결하기 위해 몇몇 프로젝트가 진행되고 있습니다. 저는
[GDI++](http://code.google.com/p/gdipp/) 를 사용하였습니다. 매우 좋은
대안으로는 [MacType](http://mactype.themex.net) 이 있습니다. 이러한 프로젝트는
Windows의 기본 라이브러리인 **GDI+** 를 대체하여 폰트 그리기를 독자적으로
수행합니다. 이 프로그램을 이용하면 리눅스에서 보이는 것과 동일하게 위의
폰트들에서도 작은 폰트크기로 깔끔한 글꼴을 보여줍니다.

[Roboto]: http://developer.android.com/design/style/typography.html