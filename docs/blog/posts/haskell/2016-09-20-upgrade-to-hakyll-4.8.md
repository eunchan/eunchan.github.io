---
date: 2016-09-20
slug: upgrade-to-hakyll-4.8
tags: ['hakyll', 'haskell', 'metadata', 'yaml']
comments: true
---

# Upgrade to Hakyll 4.8

[Hakyll][] 이 4.8 버전으로 업그레이드 되면서 달라진 점이 하나 있는데, Metadata field가 YAML 형식으로 바뀌었습니다.
이로 인해, 기존의 `Data.Map` 타입에서 `YAML.Object` 가 되면서 기존의 `Metadata`를 이용한 함수를 대부분 고쳐야 했습니다.

예를 들면 `match` 함수에서 public 인 것만을 추려내서 html을 만드는 데, 이때 쓰이는 함수가 Hakyll 4.7에서는 아래와 같았습니다.

```haskell
metadataFieldIs :: String -> String -> Metadata -> Bool
metadataFieldIs key value metadata = case M.lookup key metadata of
    Just v  -> value == v
    Nothing -> False
```
`Data.Map` 이기에 `M.lookup` 함수로 찾아서 public인지 아닌지 검사합니다.
하지만, `YAML.Object`로 변경되었기 때문에, Aeson 라이브러리를 이용하거나 `Data.HashMap` 을 이용해야 합니다.

다행스럽게도 Hakyll-4.8 에서 비슷한 역할을 하는 함수를 이미 만들어서 제공하고 있습니다 (Jasper 짱!)
바로 `lookupString` 인데요. [`Hakyll.Core.Metadata`][hcm] 에 정의되어 있습니다.

[hcm]: https://github.com/jaspervdj/hakyll/blob/master/src/Hakyll/Core/Metadata.hs

그래서 아래와 같이 코드를 간편하게 변경할 수 있었네요.

```haskell
metadataFieldIs key value metadata =
    case lookupString key metadata of
        Just v  -> value == v
        Nothing -> False
```

다른 하나는, 이건 YAML에 관련된 이야기 인데, YAML은 on, yes 등의 값을 무조건 Bool로 인식해서 true로 변경하더군요.
그래서 disqus를 표시하는 metadata field가 on 에서 true로 바뀌는 바람에 disqus가 사라져 버려서 찾느라 고생좀 했습니다.
