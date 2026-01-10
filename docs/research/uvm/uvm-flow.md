---
comments: true
date: 2019-01-15
slug: uvm-flow
tags:
- systemverilog
- uvm
- verification
- phase
title: UVM Test Flow
---

[UVM 첫화면](index.md)

1. [UVM 개요](uvm-introduction.md)
2. [Design Under Test (DUT)](dut.md)
3. UVM Test Flow
4. [UVM Blocks](uvm-blocks.md)

---

UVM을 처음 보면 이해하기가 어렵다고 말했었는데, 그 이유를 좀 생각해 보니, 타이핑
하는 코드 사이즈를 줄이기 위해 많은 축약이 들어간 것 때문이라는 생각이 듭니다.
코드 사이즈를 줄이기 위해 매크로를 쓴 것은 그럴 수 있다고 하는데, UVM으로
만들어진 검증 환경을 보면, 여러 클래스 사이에 어떻게 function, task가 호출되는
지 이해하기 어려울 정도로 연결고리가 끊겨있습니다.

익숙해진다면, 이 부분이 아무 문제가 되지 않고 코드 사이즈를 크게 늘리지 않고
코딩을 할 수 있게 되지만 처음에는 진입장벽이죠. 그 단적인 예가 `run_test()` 일
것 같네요.

모든 UVM 검증의 시작은 testbench (이전 글에 따르면 `tb.sv`)에서 `run_test()`를
호출하는 것으로 시작됩니다.

~~~~verilog
module tb;
  // ...

  initial begin
    run_test();
  end
endmodule
~~~~

그런데 UVM 검증환경을 아무리 뒤져봐도 `build_phase`, `connect_phase`, `body`
같은 function, task는 있지만 `run_test`는 찾을 수 없죠. 이건 상속된 클래스를
호출하는 게 아닌가? 라는 생각이 듭니다. 그러다보니 소스코드를 따라 갈래야 갈
수가 없죠.

`run_test`는 UVM 소스코드의 `base/uvm_globals.svh`에 정의되어 있습니다.

~~~~verilog
// @uvm-ieee 1800.2-2017 auto F.3.1.2
task run_test (string test_name="");
  uvm_root top;
  uvm_coreservice_t cs;
  cs = uvm_coreservice_t::get();
  top = cs.get_root();
  top.run_test(test_name);
endtask
~~~~

위의 코드를 보면, run_test는 uvm_root class의 run_test를 호출하는 거였네요.
`base/uvm_roots.svh`를 살펴보면 `run_test`가 어떻게 동작하는 지 살짝 감을 잡을
수 있을겁니다. Factory method로 `UVM_TESTNAME` plusarg 값에 해당하는 테스트
클래스를 만들어서 `uvm_phase` 클래스를 이용해 실행합니다.

아래에 조금 더 설명하겠지만, 대부분의 코드가 이런 축약이 들어가있습니다. 그래서
systemverilog에 익숙하다면, 처음 UVM을 배울 때 [UVM source code][uvm-src]를
보시면서 검증환경을 만드는 게 이해를 높일 수 있습니다. 저도 지금 소스코드를
열어두고 하고 있구요. 하드웨어 디자이너라면 간단히 훑어보고 넘어가도 괜찮겠지만,
검증 엔지니어라면 소스코드 이해는 거의 필수인 것 같네요.

[uvm-src]: https://www.accellera.org/downloads/standards/uvm

그러면 [UVM 소개](uvm-introduction.md)글에서 간략히 설명했던 UVM 클래스를 자세히
설명하기 전에, `run_test`에서부터 UVM 시뮬레이션이 끝나는 때 까지 어떤 단계로
진행되는 지 이해해 보는 게 좋겠네요. 저도 배우면서 기록하는 거라 설명이
자세하지는 않을 것 같아요.

## Run Test

위에서 언급한대로 `run_test`는 여러 복잡한 단계를 거쳐 `uvm_phase` 클래스의
`run_phase()` 를 실행하는 게 주된 목적입니다. 그러면 `uvm_phase`에 대해 좀
자세히 알아야 하는데, 이 phase가 UVM 검증환경의 실행 순서대로 class를 돌면서
실행을 하게 됩니다. 이를테면 전체 검증환경의 관리자인셈이죠.

## Phase

소스코드를 보거나 기타 UVM 코드를 보면 정말 많은 phase가 있는데, 그 중 가장 자주
쓰이는 phase 세개를 기억해 두면 좋을 것 같네요. 그 세개는 `build_phase`,
`connect_phase`(또는 deprecated `connect`), `run_phase`(또는 deprecated `run`)
입니다. 이것 외에 몇가지가 더 있는데, `base/uvm_components.svh`를 보면 아래의
단계가 선언이 되어있습니다.

~~~~verilog
// Build Phases
function void uvm_component::build_phase(uvm_phase phase);
function void uvm_component::connect_phase(uvm_phase phase);
function void uvm_component::end_of_elaboration_phase(uvm_phase phase);

// Run Phases
function void uvm_component::start_of_simulation_phase(uvm_phase phase);
task          uvm_component::run_phase(uvm_phase phase);

// Cleanup Phases
function void uvm_component::extract_phase(uvm_phase phase);
function void uvm_component::check_phase(uvm_phase phase);
function void uvm_component::report_phase(uvm_phase phase);
function void uvm_component::final_phase(uvm_phase phase);
~~~~

일단은 위의 세개만 기억해 두시고 `report_phase`는 스코어보드에서 사용되니 그때
한번 더 보면 될 것 같네요. 그 외에 유의할 점은 `run_phase`를 제외한 다른 모든
phase는 function이라는 점입니다. 그래서 `forever`, `initial` 같은 task 관련된
구문은 쓸 수 없고 0 time execution 코드(다른 클래스의 함수 호출이나 값 지정)만
가능합니다.

### Build Phases

`build_phase`, `connect_phase`, `end_of_elaboration_phase`를 묶어서 Build
Phases로 지칭하는데, 이 세 단계에서 검증코드가 하는 일은 선언된 클래스를
생성하고 클래스 간의 통신 포트(`uvm_analysis_port`나 `tlm_fifo` 등)를 서로
연결하고 testbench의 interface를 받아오는 등, 검증 테스트가 수행될 수 있도록
환경을 설정합니다.

-   **`build_phase`**: 클래스를 생성하고 클래스 내부에서 사용될 데이터 구조를
    만듭니다. `uvm_agent` 같은 클래스는 `uvm_component` 클래스를 상속 받았는데,
    이런 클래스는 factory method를 사용해 생성합니다.

    검증 코드를 보다보면 아래와 같은 코드가 `build_phase`에서 종종 보일겁니다.

    ~~~~verilog
    function void irq_agent::build_phase(uvm_phase phase);
        // ...
        m_mon = irq_monitor::type_id::create("m_mon", this);
        // ..
    endfunction
    ~~~~

    factory method에 익숙하시다면, 위의 코드에서 `type_id::create()`가 factory
    생성 코드라고 생각하시면 됩니다. factory 에 익숙하지 않는 분이면 Object
    Oriented Programming에서 Factory pattern을 검색해 보시는걸 추천합니다.

    `type_id`는 `uvm_abstract_component_registry` 클래스로 `get`,
    `get_type_name`, `create` 등의 함수를 가지고 있습니다.
    `base/uvm_registry.svh` 파일에서 찾을 수 있어요.

-   **`connect_phase`**: 클래스간의 인터페이스를 연결합니다. 다음에
    설명하겠지만, [이전글](uvm-introduction.md)에서 설명한 '빵굽는 레시피'를
    전달하는 TLM FIFO를 연결합니다. `uvm_sequencer`가 `uvm_sequence_item`을
    받아서 `uvm_driver`에게 전해주는데, 이 연결을 `connect_phase`에서 합니다.
    또한 `uvm_scoreboard`로 전달되는 analysis port 연결도 이 단계에서
    이뤄집니다.

    ~~~~verilog
    class irq_agent extends uvm_agent;
      // ....
      irq_driver m_drf;

      // ....

      function void connect_phase(uvm_phase phase);
        m_drv.seq_item_port.connect(m_seqr.seq_item_export);
      endfunction : connect_phase

      // ....
    endclass : irq_agent
    ~~~~

    위의 agent 코드에서 `connect_phase` 함수에서 sequencer의 포트를 driver의
    포트에 연결합니다.

### Run Phases

시뮬레이션이 동작하는 주된 부분이죠. `start_of_simulation_phase`에서는
시뮬레이션이 시작할 때 세팅할 부분이 들어갑니다. 헤더를 출력한다던지 기본 값을
assign한다던지 하죠. 크게 신경 안써도 될 부분입니다.

-   **`run_phase`**: 메인 코드를 실행하는 부분인데, UVM스펙을 보면 정말 세부적인
    단계가 있습니다. `pre_reset`, `reset`, `post_reset`, `pre_configure`,
    `configure`, `post_configure`, `pre_main`, `main`, `post_main`,
    `pre_shutdown`, `shutdown`, `post_shutdown`, 등 정말 눈이 휘둥그레질 정도로
    복잡한데, 사실 이거 왠만큼 큰 검증환경을 만들지 않는이상 안쓰일 것 같습니다.

    그냥 복잡한 부분은 생략하고 `run_phase`에서 실제 테스트 코드를 작성하기로
    하죠.

    `run_phase`는 실제 동작이 구현되는 부분이니 이 코드가 들어갈만한 곳은
    `uvm_driver`나 `uvm_monitor`, `uvm_sequence`정도 일것 같습니다. 각 블럭은
    다음 글에서 설명드릴텐데, `uvm_driver`나 `uvm_monitor`는 `run_phase`에서
    실행되는 게 맞으나, `uvm_sequence`는 `body` task에서 메인 코드가 실행됩니다.
    `uvm_sequence`는 `uvm_test` 에서 `start`함수로 호출이 되어 `pre_body`,
    `body`, `post_body` task가 실행되게 선언이 되어있습니다. 구지 그럴 이유가
    없는데 이것 하나 이상하게 선언되어있더군요.

`run_phase` 코드를 볼 기회가 있다면 다른 phase와는 다르게 시작부분에
`phase.raise_obejction()` 과 끝 부분에 `phase.drop_objection()` 이 있는 걸 볼 수
있습니다. 보통은 `uvm_test` 클래스를 상속받은 클래스에서 sequence를 시작하기
전에 `raise_objection()`을 하고 시퀀스가 끝나면 `drop_objection()`을 하죠.

이게 조금은 독특하게 느껴질 수 있는데, 이 기능으로 인해 `run_phase`에서 자유롭게
forever loop를 쓸 수 있습니다. `uvm_monitor`나 `uvm_driver`는 forever 구문을
통해 버스를 계속 살펴보고 transaction이 있으면 버스를 드라이브 하거나 버스
트랜잭션을 scoreboard에 넘기는데, 이 구문을 그대로 계속 실행하면 시뮬레이션이
끝나질 않게 됩니다.

그래서 `uvm_phase`는 `uvm_object` 클래스를 이용해 시뮬레이션 시작, 끝을
결정합니다. `raise_objection()`을 호출하면 `uvm_object` 클래스의 카운트가
증가해서 0 값이 아닌 다른 값을 가지게 되고 그러면 `uvm_phase`의 phase executer가
시뮬레이션을 종료하지 않게 됩니다. `drop_objection()`을 호출하면 count가
줄어들어 최종적으로 0 값이 되면 phase가 그 값을 보고 forever loop이 다른
클래스에서 실행되고 있다고 할지라도 종료를 시키죠. 아래는
`base/uvm_phase.svh`에서 기술된 시뮬레이션 종료 상태를 확인하는 코드입니다.

~~~~verilog
fork
  // JUMP
  begin
    wait (m_premature_end);
    `UVM_PH_TRACE("PH/TRC/EXE/JUMP",
                  "PHASE EXIT ON JUMP REQUEST",
                  this,
                  UVM_DEBUG)
  end

  // WAIT_FOR_ALL_DROPPED
  begin
    bit do_ready_to_end  ; // bit used for ready_to_end iterations
    uvm_objection phase_done;
    phase_done = get_objection();
    // OVM semantic: don't end until objection raised or stop request
    if (phase_done.get_objection_total(top) ||
        m_use_ovm_run_semantic && m_imp.get_name() == "run") begin
      if (!phase_done.m_top_all_dropped)
        phase_done.wait_for(UVM_ALL_DROPPED, top);
      `UVM_PH_TRACE("PH/TRC/EXE/ALLDROP",
                    "PHASE EXIT ALL_DROPPED",this,UVM_DEBUG)
    end
    else begin
      if (m_phase_trace) begin
        `UVM_PH_TRACE("PH/TRC/SKIP",
                      "No objections raised, skipping phase",
                      this,
                      UVM_LOW)
      end
    end

    wait_for_self_and_siblings_to_drop() ;
    do_ready_to_end = 1;

    // ...
  end
    // Time out checker
join_any
disable fork;
~~~~

### Cleanup Phases

시뮬레이션을 다 수행후 (sequence를 다 실행 후) 결과를 뽑아내는 단계입니다.
예측한 결과값과 실제 DUT에서 관찰된 결과값이 같은지 다른지 확인하는
`uvm_scoreboard`가 주된 역할을 하는 것 같네요. 이 단계에서는 4 세부 단계가
있으나 가장 많이 보게 될 단계는 `report_phase`일 겁니다. 어차피 순차적으로
실행되는 터라 `report_phase`안에서 구현하는게 대부분인것 같네요.

## Interactive Debugging Mode

UVM component를 코딩하기에 앞서, 한가지 유용한 팁을 지인에게 들은바 있어서
공유할까 합니다. 위에서, 그리고 이전 글에서 언급한 '축약이 많아서 이해가 어려운'
부분을 좀 더 이해하기 쉽게 해 주는 도구인데, 시뮬레이션을 실행할 때 interactive
debug mode를 사용하는 방법입니다.

code 따라 가는 것을 돕기 위해서 VCS-verdi, MTI-visualizer, NC-indago 등을
추천합니다. 이런 tool을 사용해서 interactive debugging mode를 사용하면 쉽게 UVM
code를 trace할 수 있다네요. 자세한 방법은 이후에 코딩 후 시뮬레이션을 돌려보면서
같이 보기로 하죠.

## Conclusion

이번 글에서는 UVM 검증 환경이 실행되어서 어떤 단계를 거치고 어떻게 종료되는 지
살펴봤습니다. 이 글에서 등장한 복잡한 용어나 코드는 크게 신경쓸 필요가 없어요.
그저 `build_phase`, `connect_phase`, `run_phase`, `report_phase` 이 네개가
순서대로 실행된다고 기억해 두시면 될 것 같네요.

다음 글에서는 Agent, Driver, Monitor.. 등 UVM 의 기본 블럭을 알아보고 기본
골격을 짜볼게요. 이제 슬슬 UVM 코딩을 해볼 차례입니다.