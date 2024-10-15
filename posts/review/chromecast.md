---
comments: true
date: 2014-07-31
tags: chromecast, roku, google, android, streaming
title: Google Chromecast
---

<img src="../media/page/review/chromecast-product.png" width="350px" align="left">
[구글이 크롬캐스트(Chromecast)를 발표][gigaom-chromecast]한 지 벌써 일년이
지났습니다. 비록 하드웨어 성능은 좋다고 말할 수는 없었지만 35달러라는 가격은
많은 사람들이 플레이스토어의 문을 두드리기에 충분했습니다.

일년이 지난 지금에서야 크롬캐스트를 만져보게 되었습니다. 미국으로 건너와서
TV에 연결할 스트리밍 장치를 찾다가 선택한 것이 [Roku 3][]였습니다. 성능도 좋고
컨텐츠도 많긴 한데 불편한 점이 내부 Samba나 DLNA를 지원하지 못하고 재생하는
영상의 코덱 제한이 많다는 점이었습니다. 그래서 WD Live TV 같은 NAS 영상 재생용
장치를 보다가 크롬캐스트가 손에 들어왔습니다.

일단 크롬캐스트도 Roku와 마찬가지로 재생할 수 있는 영상에 제약이 많습니다. (아래
[Tip 항목](#converting-video-in-mac) 참조) 그래서 영상을 변환해야 하는데, 어차피
Roku로 PLEX를 통해서 보려고 해도 변환해야 했던 영상이기에 그러려니.. 하고
변환하는 중입니다.

## Roku 3 vs Chromecast
Roku에 비해서 좋은 점은, Google Play Video를 스트리밍 할 수 있다는 점과
스마트폰을 미러링할 수 있다는 점 두가지네요. 그 이외는 Roku가 더 낫습니다. 다만
이 두가지로 인해 Roku를 버리고 크롬캐스트를 사용하게 될 것 같습니다.

한국의 Play Store에서 구매하였던 영화를 여기 미국에서는 재생할 수 없었습니다. 제
돈 주고 산 것인데도 재생할 수 없는 국가라고 뜨더군요. 그러나 스마트폰에서는
재생이 되었는데 이를 크롬캐스트로 보내니 다행히 재생이 되네요! 한국의 Play Store
영화 가격이 대체로 미국보다 저렴해서 예전에 구매해 둔 것이 몇 있는데 다시 볼 수
있게되서 참 좋습니다.

안드로이드와 조화를 잘 이루는 점은 매우 만족합니다. 지원하는 앱도 늘어나서 종종
크롬캐스트 버튼이 보입니다. 넷플릭스와 유투브는 Roku에서도 스트리밍이 되었기
때문에 별반 차이는 없지만 Google Photo, Play Video, Play Music이 된다는 점은
축복이네요.

![Chromecast Logo on TV](../media/page/review/chromecast-booting.jpg)

또한 Roku는 티비 전원을 끄더라도 상시 켜져있었는데 크롬캐스트는 티비의 USB
포트에서 전원을 가져오기 때문에 티비를 켜면 그때 같이 켜집니다. 왠지 전기를
절약하는 느낌이 듭니다. 부팅도 빨라서 그다지 위화감이 있다는 느낌은 들지
않습니다. 티비를 켰는데 크롬캐스트 로고가 뜨니 왠지 크롬TV를 보는 느낌이네요.

Tips
---

### Converting Video in Mac

[크롬캐스트가 재생할 수 있는 영상포맷은 몇가지 되지 않습니다.][cast_media]
추가로 mkv가 재생 가능합니다. 그러나 영상/소리 코덱은 몇 되지 않습니다.
영상을 재생하기 위해 대부분의 (디지털 카메라로 촬영된 영상도) 영상은 이
영상포맷으로 변환되어야 합니다. 매우 귀찮은 일이지만 편리함을 누리기 위해서는
어쩔 수 없는 일이기도 하죠. 요즘은 자동으로 변환해 주는 스크립트를 만들어 볼까
생각중입니다.

영상 변환 방법은 맥을 기준으로 설명하겠습니다. 먼저 GUI 방식을 선호하신다면
[HandBrake][]가 최고의 선택입니다. 아래의 이미지를 참조해서 Video탭을 설정하시고
(Bitrate 10Mbps, fastdecode, mp4 container) Audio 탭은 AAC 코덱을 선택해서
변환하시면 됩니다.

![HandBrake Video Option](../media/page/review/chromecast-handbrake.png)

터미널에서 작업하는 걸 좋아한다면 _ffmpeg_ 툴을 사용합니다. 이미 [Homebrew][]가
깔려있다고 가정하고, 다음의 패키지를 깔아줍시다.

    $ brew install fdk-aac
    $ brew install ffmpeg --with-fdk-aac

이제 비디오를 변환합니다:

    $ ffmpeg -i [input] -c:v libx264 -profile:v high -level 5 -crf 18 -maxrate 10M -bufsize 16M -pix_fmt yuv420p -vf "scale=iw*sar:ih, scale='if(gt(iw,ih),min(1920,iw),-1)':'if(gt(iw,ih),-1,min(1080,ih))'" -x264opts bframes=3:cabac=1 -movflags faststart -c:a libfdk_aac -b:a 320k -y [output]

매번 이렇게 긴 명령을 입력할 수 없으니 **.bash_profile**에 간단한 구문을
추가합니다.

    ccenc () {
        ffmpeg -i $1 -c:v libx264 -profile:v high -level 5 -crf 18 -maxrate 10M -bufsize 16M -pix_fmt yuv420p -vf "scale=iw*sar:ih, scale='if(gt(iw,ih),min(1920,iw),-1)':'if(gt(iw,ih),-1,min(1080,ih))'" -x264opts bframes=3:cabac=1 -movflags faststart -c:a libfdk_aac -b:a 320k -y $2
    }

이제는 비디오를 변환하기 위해 `ccenc [input] [output]`를 입력하면 됩니다.

[cast_media]: https://developers.google.com/cast/docs/media
[gigaom-chromecast]: http://gigaom.com/2013/07/24/google-announces-chromecast-a-dongle-to-stream-online-videos-to-your-tv/