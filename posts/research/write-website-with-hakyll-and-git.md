---
comments: true
date: 2012-09-20
slug: write-website-with-hakyll-and-git
title: Write website with Hakyll and Git
---

*Updated*: 지금은 아래의 방법을 이용하고 있지 않고 [Github Pages와 Cloudflare를
이용한 웹사이트][github-pages-cloudflare]를 운용하고 있습니다. Github Pages가
정적 웹사이트로 쓰기에 안성맞춤인 것 같네요. Cloudflare를 이용하면 https 까지
지원할 수 있어서 좋은 듯 합니다.

원 글은 [Chris의 Write your blog with Hakyll and
Git](http://chrisdone.com/posts/2010-04-04-hakyll-and-git-for-you-blog.html)
입니다.  이 글 대로 진행하는 과정 중 몇몇가지가 수정되어야 해서 이 글을
작성하게 되었습니다.

이 홈페이지는 [Markdown][] 문법을 이용하여 [Hakyll][] 로 생성되었습니다.

위의 링크에서는 post-receive hook을 사용하여 git remote 에 push되었을 때 그
remote에서 최신을 checkout하고 hakyll을 다시 만들어 사이트를 build하는 과정을
담고 있습니다.

이 과정에서 remote git 저장소에 설정을 해줘야 하는 부분이 하나가 더 있습니다.
remote가 최신 master 브랜치를 보고 로컬도 같은 부분을 볼 경우, remote에 push
하려고 하면 충돌이 나게 됩니다. 이는 remote 저장소가 checkout된, 즉 다시
말하면 bare repository[^1] 가 아니기 때문에 발생합니다.

[^1]: bare repository에 대한 내용은 [ProGit](http://git-scm.com/book) 문서를
참조하시면 좋습니다.

이를 위해 remote 저장소의 **.git/config** 에 아래의 사항을 추가해 주어야 합니다.

    [receive]
        denyCurrentBranch = false

이렇게 하면 checkout된 branch로 push가 가능하게됩니다.