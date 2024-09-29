---
date: 2016-03-11
comments: true
slug: parse-metadata-date-field-to-route
tags:
  - hakyll
  - haskell
  - metadata
  - customRoute
---

# Hakyll Route for Metadata `date` Field

블로그 URL을 보면 이전과는 좀 달라졌습니다.
예전엔 url이 `blog/YYYY-MM-DD-post.html` 방식이었다면, 새로운 URL은 `blog/YYYY/MM/DD/post.html` 형태로 바뀌었습니다.

변경을 한 이유는, 블로그 글이라면 제목과 연관된 URL이 유지되어야 하는데 그 앞에 항상 년,월,일 이 디렉토리 형태도 아니고 같은 묶음으로 다니는게 조금은 이치에 맞지 않는 것 같았기 때문입니다.
그래서 아카이브 형태로 년,월,일 을 디렉토리로 구분하였습니다.
글을 자주 쓰는 게 아니니 년,월,일 보다 2016, 2015 해서 년만 넣어도 충분하겠지만 일단은 이렇게 가는 걸로 하죠. ㅎㅎ

기존에 블로그에 글을 쓸 때에는 `blog/` 디렉토리 밑에 URL과 동일했던 마크다운 파일을 두고 글을 썼습니다.
지금이야 글이 꼴랑 20개 남짓이라 문제가 없지만, 나중에,, 아마 한 5년은 걸리겠지만, 나중에 100개 이상이 되었을 때 한 폴더에 모든 글을 다 보관한다는 건 조금은 번거로운 일이 될 것 같아서 방식을 바꾸기로 했습니다.

새로운 방식은, `blog/` 밑에 어느 폴더에 두더라도 `blog/YYYY/MM/DD/post.html` 형태로 바꾸도록 변경했습니다.
Hakyll에서는 URL을 결정하는 Rule을 `Route`라는 이름으로 만들었습니다.
이 Route에 원하는 규칙을 넣으면 그 규칙대로 대상 URL이 결정됩니다.

아래의 코드는 위의 `blog/` 를 위해 만든 규칙입니다.

```haskell
-- | Route based on metadata field 'date' -------------------------------------
dateRoute :: FilePath -> Routes
dateRoute prefix = metadataRoute (f prefix)
  where
    f p md = customRoute $ pullDateToFilePath p md

-- | Add prefix then compose YYYY/MM/DD/post.html format ----------------------
pullDateToFilePath :: FilePath -> Metadata -> Identifier -> FilePath
pullDateToFilePath p m i = p </> (convertDateToFilePath m i)
  where
    convertDateToFilePath md id' = convertLocalTimetoISO (md M.! "date") (M.lookup "slug" md) $ toFilePath id'
    -- convertLocalTimetoISO :: String -> Maybe String -> FilePath -> FilePath
    convertLocalTimetoISO d (Just s) _ = toISO d </> s <.> ".html"
    convertLocalTimetoISO d Nothing fp = toISO d </> chopDayFromFileName fp
    chopDayFromFileName fp' = replaceAll "[0-9]{4}-[0-9]{2}-[0-9]{2}-" (const "") $ takeFileName fp'
    toISO dateString = formatTime defaultTimeLocale "%Y/%m/%d" $ readTimeFromMetadataString dateString

-- TODO: Make more format
readTimeFromMetadataString :: String -> UTCTime
readTimeFromMetadataString dateString = parseTimeOrError False defaultTimeLocale "%B %e, %Y" dateString
```

일단 post 내의 메타데이터 `date` 를 이용하기 위해 `metadataRoute` 가 사용됩니다.
이 `metadataRoute` 는 함수 인자를 받는데 `Metadata -> Route`, 즉 `Metadata`를 입력으로 받고 결과가 `Route`인 함수를 인자로 받습니다.

`Metadata`를 이용해 `YYYY/MM/DD` 형식으로 변경해야 하므로 `customRoute`를 사용해서 원하는 형태로 바꿔주도록 합니다.
`customRoute`는 `metadataRoute`와 비슷하게 함수 하나를 인자로 받습니다.
이 함수는 `Identifier -> FilePath` 타입으로 `Identifier`를 입력으로 받고 최종 URL인 `FilePath`를 결과로 내는 함수입니다.

```haskell
f p md = customRoute $ pullDateToFilePath p md
```

Higher Order Function을 이용해서 `pullDateToFilePath` 함수를 `Identifier -> FilePath` 처럼 인식되게 했습니다.
실제 `pullDateToFilePath`의 타입은 `pullDateToFilePath :: FilePath -> Metadata -> Identifier -> FilePath` 이죠.
즉, FilePath, Metadata, Identifier를 입력 받아서 FilePath를 리턴하는 함수입니다.

`Metadata`는 `Data.Map` 타입이라 원하는 필드, `date`, `slug` 를 검색할 수 있습니다.
이를 검색해서 `date`는 YYYY/MM/DD 형태로 바꿔주도록 하고 `slug`가 있다면 사용하고 없다면 파일 이름을 사용하도록 합니다.

그래서 `slug`를 검색할 때는 `M.lookup "slug" md` 로 해서 `Maybe` Monad로 결과를 받고 `Just` 또는 `Nothing`으로 처리합니다.

```haskell
    convertDateToFilePath md id' = convertLocalTimetoISO (md M.! "date") (M.lookup "slug" md) $ toFilePath id'
    -- convertLocalTimetoISO :: String -> Maybe String -> FilePath -> FilePath
    convertLocalTimetoISO d (Just s) _ = toISO d </> s <.> ".html"
    convertLocalTimetoISO d Nothing fp = toISO d </> chopDayFromFileName fp
```

이 방식을, `sky/log/` 에도 적용해서 그 부분도 YYYY/MM/DD 형식으로 저장되도록 했습니다.

이번 수정을 하면서 Haskell의 깔끔한 구현 방식이 논리적으로 생각하는 흐름에 맞게 잘 되어있구나, 라는 생각이 다시 한번 들었습니다.
생각의 흐름 그대로 top down이나 bottom up 구현을 해 나갈 수 있어서 큰 무리 없이 수정이 가능했습니다.
