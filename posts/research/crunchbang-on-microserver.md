----
title: Crunchbang on HP Microserver
date: May 7, 2013
tags: debian, crunchbang, kotex, latex
public: true
disqus: on
----

Making Bootable USB in Windows
------------------------------

일단 [크런치뱅][] 에서 ISO를 다운받고
[Win32DiskImager](http://sourceforge.net/projects/win32diskimager/) 프로그램을
이용해 남아도는 2GB USB 드라이브에 설치 ISO를 구웠습니다. 이 프로그램으로
간단하게 구울 수 있었습니다. 중간에 사용중이라고 에러가 간혹 나는데 이때는
관리자 권한이나 호환성모드로 실행해 보시고 그래도 안되면 리부팅 등을 계속
하면서 시도하면 되더군요. UNetBootIn 같은 프로그램은 [크런치뱅][] 을 지원하지
않아서 포기했습니다.

추가적인 정보를 드리자면 설치 후 USB를 기존으로 복구하고 싶을 때는 아래의
방법으로 복구하시면 됩니다.

    "cmd 관리자 권한으로 실행
    > diskpart
    > list disk       "해당 USB 번호 확인
    > select disk <N> "위의 USB 번호
    > clean
    > exit

이 방법으로 파티션을 초기화 한 후 관리도구에서 디스트 볼륨 할당을 해주시면
됩니다.

Configuring Crunchbang for Web developing
-----------------------------------------

제 홈페이지 및 기타 문서 작업을 위해 몇가지 설정을 추가로 하였습니다.

먼저 [Hakyll][] 을 위해서 Haskell package를 설치했습니다

    $ sudo apt-get install ghc libghc-zlib-dev cabal-install alex happy
    $ cabal update
    $ cabal install hakyll

또한 Nodejs도 필요하네요

    $ sudo apt-get install python g++ make checkinstall
    $ mkdir ~/src && cd $_
    $ wget -N http://nodejs.org/dist/node-latest.tar.gz
    $ tar xzvf node-latest.tar.gz
    $ cd node-v*      "압축 풀리는 것 보고 알맞은 버전
    $ ./configure
    $ sudo checkinstall
    $ sudo dpkg -i node_*

node가 설치되었으면 npm을 통해 less css를 설치합니다

    $ npm install less -g

Installing Ko.TeX
-----------------

이제 한글 PDF 문서를 만들기 위한 texlive와 kotex를 설치합니다. texlive는
apt-get을 통해 간단히 설치할 수 있습니다

    $ sudo apt-get install texlive texlive-xelatex texlive-latex-extra

Ko.TeX는 설치가 윈도우에 비해 까다로운 편입니다. 일단 [공식 리눅스
설치](http://faq.ktug.org/faq/Ubuntu%BF%A1%BC%ADTeX%C7%CF%B1%E2) 페이지를
참고하도록 합니다.

페이지에 나온 kotex파일을 다운 받은 후 압축을 풉니다. 그리고
source/latex/kotex/에 있는 hbibtex.c hmakeindex.c를 컴파일하여 /usr/bin/에
복사합니다. script/perl에 있는 파일들도 /usr/bin/에 복사한 후 나머지는
/usr/share/texmf/ 폴더에 모두 복사합니다

    $ tar cv | sudo tar x -C /usr/share/texmf/

이 후 Map을 업데이트 하면 kotex를 사용할 수 있습니다

    $ mktexlsr
    $ updmap-sys --enable Map=kotex-base.map
    $ updmap-sys --enable Map=kotex-extra.map
    $ updmap-sys --enable Map=kotex-midkor.map

Installing Postgres
-------------------

    $ sudo apt-get install postgresql
    $ sudo su postgres
    $ createuser user1
    $ exit
    $ createdb -h localhost -U user1 -W userdb

Backup Solution
---------------

Microserver 를 구입하게 된 계기도 데이터를 한번 날려버린 적이 있어서 백업에
대한 중요성을 느꼈기에 구입하게 되었습니다. 처음에는 RAID 1 으로 사용하다가
사용자의 실수에 의한 삭제에 대처를 못하기 때문에 디스크를 다시 분리하며
정기적으로 백업하는 방식으로 변경하였습니다.

### rsnapshot

정기적인 백업을 위해 rsnapshot을 이용하기로 하였습니다. rsnapshot은 하나의
원본을 두고 hard link를 이용해서 변경점만을 복사하는 방식으로 rsync 프로그램의
wrapper 라고 생각하면 됩니다.

이 툴을 이용해서 특정 디렉토리 + Database 를 매일 단위로 백업하고 있습니다.
