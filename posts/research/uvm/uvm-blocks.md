----
title: "UVM Blocks"
date: January 22, 2019
public: true
disqus: true
tags:
    - systemverilog
    - uvm
    - verification
    - agent
    - driver
    - monitor
    - sequence
    - sequencer
slug: 'uvm-blocks'
----

[UVM 첫화면][uvm-verification]

1. [UVM 개요][uvm-introduction]
2. [Design Under Test (DUT)][uvm-dut]
3. [UVM Test Flow][uvm-flow]
4. UVM Blocks

----

이번 글에서는 UVM 환경을 만들기 위한 블럭을 구현해 보겠습니다. 전체를 다
구현하기엔 분량이 너무 많아서 오늘은 `uvm_agent`, `uvm_driver`, `uvm_sequencer`
세개를 구현해 볼까 합니다. 이 세개를 구현한다고 해서 곧장 테스트를 할 수는
없으니, 다음에 나올 `uvm_test`, `uvm_env`, `uvm_sequence` 까지는 구현해야 기본
UVM 시뮬레이션을 실행해 볼 수 있겠네요.

## Virtual Interface & `uvm_confib_db`

[DUT][uvm-dut] 글에서 언급했던 것 처럼, UVM 클래스와 DUT는 interface로 연결되어
있습니다. `tb.sv`에서 본것 처럼 실제 인터페이스는 tb module에 있고, 클래스는 그
인터페이스의 reference를 받아서 사용합니다. C 언어의 포인터같은 개념으로
생각하면 좀 쉬워요. 이걸 virtual interface라고 부릅니다.

`connect_phase` 단계에서 tb의 실제 interface, `bif`, `iif`를 `uvm_driver`에서
연결합니다. 이 연결이 조금은 독특한 방식으로 이뤄지는데요. 여기서 새로운 개념이
등장합니다. `uvm_config_db` 인데, 이것은 공용 저장소라고 생각하면 될 것 같네요.
`tb`에서 이곳에 virtual interface를 저장(set)하고, `uvm_driver`에서 virtual
interface 를 가져옵니다(get). 일단 저장하는 코드를 볼까요.

~~~~verilog
module tb;

  import uvm_pkg::*;
  // ...
  bus_if bif(clk, rst_n);
  intr_if iif(clk);

  initial begin
    uvm_config_db#(virtual bus_if)::set(null,"*","bif", bif);
    uvm_config_db#(virtual intr_if)::set(null,"*","iif", iif);
  end

  // ...
endmodule
~~~~

`tb`에 이전보다 몇 줄이 추가되었습니다. 일단 `uvm_config_db`를 사용하기 위해
`tb`에 `import uvm_pkg::*;` 가 추가되었네요. 이건 systemverilog에 익숙하다면 알
수 있을텐데 uvm_pkg 패키지에 선언된 클래스, 함수등을 불러오는 코드입니다. 이
안에는 config db 클래스도 있는거죠.

그럼 그 다음에 나오는 파라미터는 뭐냐면, 어느 타입의 config를 접근할 것인지
알려주는 역할입니다. c++코드의 generic (template)이라고 보면 되구요. 그래서
첫번째 `uvm_config_db`는 `virtual bus_if` 타입의 환경설정에 key는 *"bif"*로
`bif` 인터페이스를 저장하는 코드이겠네요. 두번째는 `virtual intr_if` 타입의
환경설정에 `iif` 인터페이스를 저장하겠구요.

그러면 이것을 어떻게 불러오는지는 set 대신에 get 함수를 쓰면 되겠죠?

~~~~verilog
// base/uvm_config_dv.svh

  // @uvm-ieee 1800.2-2017 auto C.4.2.2.2
  static function bit get(uvm_component cntxt,
                          string inst_name,
                          string field_name,
                          inout T value);
~~~~

실제로 `uvm_driver`에서는 아래처럼 쓰입니다.

~~~~verilog

class bus_driver extends uvm_driver #(bus_seq_item);

  // ....
  virtual bus_if vif;

  // ...
  function void connect_phase(uvm_phase phase);
    super.connect_phase(phase);
    if (!uvm_config_db#(virtual bus_if)::get(this,"","bif",vif)) begin
      `uvm_fatal("NO_VIF", {"virtual interface must be set for:",
        get_full_name(),".vif"});
    end
  endfunction : connect_phase

  // ...
endclass
~~~~

## Sequence Item

위의 코드에서 `bus_seq_item` 이라는 새로운게 등장했네요. 이것은 버스
인터페이스를 동작시키기 위한 레시피입니다. 버스 트랜잭션을 한번 동작하기 위해
충분한 정보가 있어야 하니 아래처럼 기술해 봅시다.

~~~~verilog
class bus_seq_item extends uvm_sequence_item;

  rand bit [31:0] address;
  rand bit        write;
  rand bit [31:0] wdata;
       bit [31:0] rdata;

  `uvm_object_utils_begin(bus_seq_item)
    `uvm_field_int (address, UVM_DEFAULT)
    `uvm_field_int (write,   UVM_DEFAULT)
    `uvm_field_int (wdata,   UVM_DEFAULT)
    `uvm_field_int (rdata,   UVM_DEFAULT)
  `uvm_object_utils_end

  function new(string name = "bus_seq_item");
    super.new(name);
  endfunction : new

endclass
~~~~

간단히 어드레스, 읽기/쓰기 상태, 쓰기값, 읽기값을 선언했습니다. 이 중에 처음
세개는 `rand` 설정을 했는데요, 나중에 `uvm_sequence`에서 randomize 할 때 지정된
필드가 랜덤값이 할당됩니다. 이 클래스에 systemverilog의 `constraint` 를 선언해서
randomize 수행될 때 지정된 범위내에서 값이 할당되도록 설정할 수 있습니다.

그 다음에 나오는 복잡한 `\`uvm_object_utils_begin(), \`uvm_field_int()` 같은
매크로는 무엇인지 이해가 안가실 수도 있겠습니다. 이것은
`macros/uvm_object_defines.svh`에 정의되어 있는데요. 저는 저 매크로를 따라가기
벅차더군요. 대충 훑어본 바로는 UVM에서 공통으로 사용되는 함수에 맞춰서 각
field가 동작할 수 있도록 이런 저런 함수를 추가하는 매크로더군요. Copy를 하고,
compare, pack, print를 하는 코드를 추가해 줍니다. 즉, 위의 `bus_seq_item`은
보이는 코드는 간단하지만 실제론 매우 복잡한 클래스라는거죠.

## UVM Driver

이제 sequence item도 선언했으니, 해당 아이템을 받은 `uvm_driver`가 어떻게 bus를
동작시키는 지 구현해 볼 차례네요.

위에서 언급한 대로 `connect_phase`에서 bus interface를 내부 `vif` 멤버변수에
할당했으면, `run_phase`에서 `bus_seq_item`이 주어질 때 마다 버스를 동작시키면
됩니다. 코드를 하나 하나 살펴보죠.

~~~~verilog
class bus_driver extends uvm_driver #(bus_seq_item);

  virtual bus_if vif;

  `uvm_component_utils(bus_driver)

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction : new

  function void connect_phase(uvm_phase phase);
    super.connect_phase(phase);

    if (!uvm_config_db#(virtual bus_if)::get(this,"","bif",vif)) begin
      `uvm_fatal("NO_VIF", {"virtual interface must be set for:",
        get_full_name(),".vif"});
    end
  endfunction : connect_phase

  virtual task run_phase(uvm_phase phase);
    // One request at a time
    vif.m2s_valid = 1'b0;
    vif.s2m_ready = 1'b0;

    wait(vif.rst_n == 1'b0);
    wait(vif.rst_n == 1'b1);

    @(negedge vif.clk);

    forever begin
      seq_item_port.get_next_item(req);

      // Send request
      vif.m2s_address = req.address;
      vif.m2s_write   = req.write;
      vif.m2s_data    = req.wdata;
      vif.m2s_valid   = 1'b1;
      @(posedge vif.clk iff vif.m2s_ready == 1'b1);
      vif.m2s_valid   = 1'b0;

      // Receive response
      vif.s2m_ready = 1'b1;
      @(posedge vif.clk iff vif.s2m_valid == 1'b1);
      assert (0 == vif.s2m_error)
        else `uvm_error(get_name(),
          $sformatf("BUS Error occurs: ADDR('h%08x)", req.address));
      req.rdata = vif.s2m_data;
      vif.s2m_ready = 1'b0;

      // Return response to Sequencer (eventually goes to sequence)
      seq_item_port.item_done(req);
    end
  endtask : run_phase

endclass : bus_driver
~~~~

이번 코드는 좀 길죠? 그래도 위에서 한번 봤던 부분이 있으니 그 부분을 넘어가고
실제로 봐야 할 곳은 `run_phase` 밖에 없는 것 같네요. 여기서 첫줄과 마지막 줄을
제외하고는 일반적인 forever loop task와 비슷합니다. 버스에 address, data를 싣고
response로 들어온 것을 rdata에 저장하는, 이해하기 쉬운 코드죠. 그러면 첫줄과
마지막줄의 `seq_item_port`의 `get_next_item()` 함수와 `item_done()` 함수를
살펴보면 되겠네요.

`seq_item_port`는 `uvm_driver`가 `uvm_sequencer`와 이야기할 수 있는 수단입니다.
이 포트를 통해 (`uvm_sequence_pull_port`) `uvm_sequencer`의 `get_next_item()`
함수를 호출해서 다음 `bus_seq_item`을 하나 가져오는 거죠. 그리고 모든 버스
동작이 끝나면 `item_done(req)`을 호출해서 해당 트랜잭션이 끝났다고 알려줍니다. 만일
리턴할 내용이 없다면 `item_done()`으로 인자를 비워두고 호출하면 됩니다.

좀 자세히 설명을 하면 더 복잡해 질 수 있는데 (예를 들면 `uvm_driver`는
parameter를하나가 아닌 두개, REQ, RSP 로 받는다던지 하는 것) 그 부분은 일단
생략하고 먼저 이 버스 드라이버를 동작하게 해서 시뮬레이션을 한번 돌려보는 걸로
하죠.

## UVM Sequencer

`bus_driver`가 sequencer에게서 `bus_seq_item`을 받아와야 하니 이제
`bus_sequencer`를 만들어봅시다. Sequencer는 이정도 복잡도의 검증환경에서는
딱히 할 일 없이 그저 `uvm_sequence`에서 전달해 주는 트랜잭션을 그대로 Driver가
가져가게 해주는 역할만 합니다.

~~~~verilog
class bus_sequencer extends uvm_sequencer #(bus_seq_item);

  `uvm_sequencer_utils(bus_sequencer)

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction : new

endclass : bus_sequencer
~~~~

간단하죠? 상속받은 클래스인 `uvm_sequencer` 안에 왠만한 함수가 다 들어가 있어서
특별히 수정할 필요가 없네요. 그러면 이제 `bus_driver`와 `bus_sequencer`를
관리하는 `bus_agent` 클래스를 만들면 proactive agent 구현은 거의 끝나게 됩니다.
`bus_monitor`는 나중에 scoreboard를 만들 때 같이 구현하도록 할게요.

## Agent

Agent도 사실 거의 형식적이고 그다지 수정할 부분이 없습니다.

~~~~verilog
class bus_agent extends uvm_agent;
  bus_driver     m_drv;
  bus_sequencer  m_seqr;

  `uvm_component_utils(bus_agent)

  function new (string name, uvm_component parent);
    super.new(name, parent);
  endfunction : new

  function void build_phase(uvm_phase phase);
    super.build_phase(phase);

    if (get_is_active() == UVM_ACTIVE) begin
      m_drv  = bus_driver::type_id::create("m_drv", this);
      m_seqr = bus_sequencer::type_id::create("m_seqr", this);
    end
  endfunction : build_phase

  function void connect_phase(uvm_phase phase);
    if (get_is_active() == UVM_ACTIVE) begin
      m_drv.seq_item_port.connect(m_seqr.seq_item_export);
    end
  endfunction : connect_phase

endclass : bus_agent
~~~~

여기서 한가지 눈에 띄이는 것이 있다면 `connect_phase`에서 `bus_driver`의
`seq_item_port`와 `bus_sequencer`의 `seq_item_export`를 연결하는 부분이겠네요.
이렇게 둘이 연결해 줌으로써 `bus_driver`가 `get_next_item()`을 호출할 때
`bus_sequencer`의 TLM FIFO에 접근하게 됩니다.


