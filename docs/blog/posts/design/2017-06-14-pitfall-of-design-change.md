---
date: 2017-06-14
tags: ['verilog', 'design-change', 'naming-convention', 'coding-guide']
slug: 'pitfall-of-design-change'
categories: ['design']
comments: true
---

# Pitfall of Design Change

하드웨어 설계는 한번 실수에 대한 비용이 정말 큰 것 같습니다.
공정이 세밀화 되면서 실수 하나로 인해 작게는 Metal ECO에서 크게는 Re-synthesis 까지 가게 되면 비용은 수십억이 소요될 수도 있죠.

최근에 겪었던 일화를 하나 소개할까 합니다.

새로운 프로젝트가 진행되면서 기존에 있던 디자인을 개선을 하게 되었습니다.
이 모듈은 주변의 몇몇 모듈과 서로 신호를 주고 받고 있었죠.
개선을 하면서, 내보내는 신호의 특성을 바꾸게 되었는데, 이 수정되는 부분을 통신하는 반대편 모듈에도 적용을 하였습니다.
이상없이 잘 동작하는 것을 보고 칩을 Tape-out했죠.

문제는 다른데서 터집니다.
또다른 개선버전 프로젝트가 Original project에서 갈라져 나오게 되었는데,
이 프로젝트에서 개선된 디자인을 **하나만** 가져다 쓰게 된거죠.
서로 바뀐 프로토콜을 이해하고 수정된 디자인이 아니니, 기존 디자인은 예전 방식으로 신호가 올 것이라 기대를 하고 새로운 디자인은 새로 정의된 방식으로 신호를 주게 됩니다.

일반적인 상황에서는 이 부분이 보이지 않았으나 예외의 상황 -- 버퍼가 가득찼다던지, 버퍼가 비었다던지 -- 에서 문제가 발생합니다.
결국 이 프로젝트도 칩이 이미 나와버려서, 이 부분을 수정하려면 Metal ECO 외에는 선택지가 없었고 큰 비용을 지불하고 새로운 마스크를 만들어야만 했습니다.

## 어떻게 미리 막을 수 있을까요?

어떻게 이런 불상사를 미리 막을 수 있을까요?

### Design Stage

일단, 디자인 단계에서부터 차근차근 방법을 생각해 봅시다.
디자인을 할 때, 양쪽 어디든 한 곳에서 [SVA(System Verilog Assertion)][ext:sva]을 사용 해, 기대하는 신호의 특성을 기술했었다면 디자인을 검증하는 단계에서 이 문제를 미리 찾을 수 있었을 겁니다.
예를 들면, 신호가 `req/grant` 방식에서 `pulse` 방식으로 바뀌었다고 하면, 양쪽의 SVA는 이렇게 달랐을 겁니다.

```verilog
// Old Design (In)
property p_req_grant;
    @(posedge clk) disable iff (!rst_n) I_REQ |-> ##[1:3] I_REQ && O_GRANT;
endproperty
ap_req_grant: assert property (p_req_grant);
```

```verilog
// New Design (Out)
property p_pulse;
    @(posedge clk) disable iff (!rst_n) O_REQ |-> ##1 !O_REQ;
endproperty
ap_pulse: assert property (p_pulse);
```

그러면, 받는 쪽에서 의도하지 않은 신호가 왔을 경우 Assertion Error가 났을겁니다.

다른 한 방법은 신호의 특성이 바뀌었으니 port 이름도 바꾸었다면 두 디자인을 엮을 때 발견할 수도 있었을 겁니다.
위의 예를 들면 `O_REQ`가 `O_REQ_PULSE` 로 바뀌는 것을 예로 들 수 있겠네요.

### IP Verification, SoC Verification

만일 디자인 단계에서 이 부분을 걸러내지 못했다면, 그 다음에 있을 검증 단계에서는 어떻게 찾을 수 있었을까요?
IP 검증이나 SoC 검증에서 [Functional Coverage][ext:functional-coverage]가 잘 기술되어 있었다면, 이 문제를 발견할 수 있었으리라 봅니다.
너무나 단순한 실수임에도 불구하고, 그 상황이 예외적인 상황이었다면 그 문제를 발견하지 못하고 진행될 경우가 많습니다.

그러나 시작은 이 한 부분이었을지라도 그것에 영향을 끼치는 부분은 꽤 많이 있습니다.
위에서 예를 들었던, 버퍼가 가득찬 상태를 보죠.

만일 `covgroup`이 buffer full 상태를 포함하고 있었다면, 검증 엔지니어가 coverage report에서 부족한 부분을 발견하고 해당 testcase를 추가했을 겁니다.
그러면 문제가 조기 발견될 수 있었겠죠.

```verilog
covergroup buffer @(posedge push_req);
    full: coverpoint buf_full {
        bins not_full = {0};
        bins full     = {1};
    }
    empty: coverpoint buf_empty {
        bins not_empty = {0};
        bins empty     = {1};
    }
endgroup
```

## Closing

디자인을 할 때에나, 디자인을 수정할 때에 엔지니어에게 가장 중요한 것은 아무리 봐도 **꼼꼼함** 인 것 같습니다.
저도 시간에 쫓기며 워낙에 덜렁대다보니 이런 저런 실수를 종종 해왔는데요.
저부터 반성을 많이 하게 됩니다.

하드웨어 디자인 엔지니어 대부분이 systemverilog의 `assertion` 이나 `covergroup`을 들어본 적도 없다는 사실에 깜짝 놀랄 때가 많습니다.
이미 수십년간 하드웨어 디자인 언어가 발전해 오면서 가장 빈번하게 발생하는 사람에 의한 실수를 막을 수 있는 많은 방법이 언어에 녹아들어있습니다.
이런 새롭게 추가된 기능을 툴이 허용하는 한도 내에서 충분히 활용한다면, **꼼꼼함**이 부족한 저같은 사람에게 큰 도움이 될 것 같네요.

새로운 기능을 시도할 때 주의할 점은, 이 기능이 현재의 디자인 프로세스에 모두 적용될 수 있는 지 검토하는 것 일것 같습니다.
SystemVerilog 가 Hardware Description 기능도 많이 추가되었는데, 그 중 몇몇은 현행 버전 도구에서도 아직 지원하지 않는 것이 있습니다.
이게 Design Compiler가 지원을 하지 않으면 합성 전에 수정이 되어 괜찮은데, Design Compiler는 지원을 하고, FPGA Synthesis 도구는 지원을 하지 않거나, LEC(Logic Equivalent Check) 도구가 지원을 하지 않게 되면 나중에 이러지도 저러지도 못하는 상황이 발생할 수 있습니다.

모두 꼼꼼함을 최 우선 덕목으로 삼고 버그 없는 칩을 잘 만들어 봐요.

## Reference

* [SystemVerilog Assertions][ext:sva]
* [Functional Coverage][ext:functional-coverage]

[ext:sva]: https://www.doulos.com/knowhow/sysverilog/tutorial/assertions/
[ext:functional-coverage]: http://www.asic-world.com/systemverilog/coverage1.html

