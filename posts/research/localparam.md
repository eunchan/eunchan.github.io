----
title: 'localparam in param port list'
date: May 29, 2019
disqus: true
public: true
slug: 'localparam'
tags: ['verilog', 'systemverilog', 'sv2009', 'parameter', 'hdl', 'digital-design']
----

Designing configurable hardware IP is hard but necessary to be flexible IPs. As
design cost increases over time due to increasing the salaries of the designers,
increasing the tape-out cost, it is essential to reduce the development time.
Preparing configurable designs can be a way to achieve it.

## Early Era

The configurable hardware IP can be designed with multiple ways. In early era of
Hardware Description Language, verilog-1995, it was common to use preprocessor
`define` to design the IP configurable. Look at below example.

```verilog

// module_a.v
`include "define.v"

module a (
  clk, rst_n, addr, din, dout
);
  //...
  input  [`AW-1:0] addr;
  input  [`DW-1:0] din;
  output [`DW-1:0] dout;

  // ...
endmodule

// define.vh
`ifndef __DEFINE_H__
`define __DEIFNE_H__

`define AW 10
`define DW 32

`endif // __DEFINE_H__
```

By changing `AW` and `DW`, the module can have various width of address and
data. But if this module is used (instantiated) multiple times with different
`AW` or `DW`, then it becomes bothersome. It needs `undef` for `AW`, and `DW`,
after reading the module and needs a prefix to the module name to distinguish
among multiple configurations.

## Verilog-2001 Era

`parameter` existed prior to verilog 2001 but it became widely used with other
verilog-2001 syntax. Module can have parameter port list prior to definitions of
input and output ports. Look at the example below.

```verilog
// b.v
module b #(
    parameter AW = 10,
    parameter DW = 32
) (
    input               clk,
    input               rst_n,
    input      [AW-1:0] addr,
    input      [DW-1:0] din,
    output reg [DW-1:0] dout
);
  //...
endmodule

// c.v: parent module
module c ;

  b #(.AW(10), .DW(64)) u_b0 (...);
  b #(.AW(14), .DW(32)) u_b1 (...);

endmodule
```

Now without having `define`, the module can have multiple configurations as
above. While synthesizing (uniquify) the design module `b` is duplicated into
`b_AW_10_DW_64` and `b_AW_14_DW_32`.

This seems to solve everything but apparently not. If one of the parameter is
derived from other parameter, and used in the ports, it also needs to be defined
as `parameter`. It doesn't prevent the parent module from overriding the derived
parameter. In the below example, the parent module overrides `AW` which supposes
to not be modified.

```verilog
module d #(
    parameter DEPTH = 64,
    // Do not change below.
    parameter AW = $clog2(DEPTH)
) ( ... 
    input [AW-1:0] addr,
);
  // ...
endmodule

// e.v: parent

module e;

  d #(.DEPTH(65), .AW(10)) u_d;

endmodule
```

To avoid this, every module which has derived parameters, need to have some
assertion using `generate if`.

```verilog
module d #( ...) (...);

  localparam AW_LOCAL = $clog2(DEPTH);

  generate if AW != AW_LOCAL: gen_error
    $fatal();
  endgenerate

endmodule
```

## Systemverilog Era

Systemverilog 2009 LRM introduced quite useful syntax to solve this issue. From
SV 2009, `localparam` can be used in the parameter port list. Previously,
`localparam` is only allowed after the module port definition. By allowing
`localparam` in the port list, it removes above issues.

```verilog
module f #(
    parameter  int DEPTH = 64,
    localparam int AW = $clog2(DEPTH)
) (
    input [AW-1:0] addr,
);
  //...

endmodule
```

If the parent module tries to override localparam, it raises an error.

```verilog
module g;

  f #(.DEPTH(128))          u_f0 (...); // Good
  f #(.DEPTH(129), .AW(10)) u_f1 (...); // Compile error

endmodule
```

## Compatibility

Using newly introduced syntax in the HDL area always considered risky. One tool
may support it but other tools may not. If the other tool is used later of the
design process such as equivalent checking, it consumes significant time to roll
back the design. So, before adopting the new syntax to the design it is wise to
check the compatibility of the widely used tools.

As I check, at least Vivado (Xilinx FPGA), VCS (Synopsys), Conformal (Cadence),
Design Compiler (Synopsys), Verdi (Synopsys) Verilator support the `localparam`
syntax. A few of those tools need additional options (for instance, verdi needs
`-2009` option to read the syntax). For the simulator in the Cadence, Incisive
doesn't support it so Xcelium should be used to run the simulation if you only
have Cadence license.
