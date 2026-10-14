`timescale 1ns/1ps

module digital_circuits_tb;

    reg A;
    reg B;
    reg Cin;
    reg S;

    wire AND_out;
    wire OR_out;
    wire NOT_out;
    wire XOR_out;
    wire NAND_out;
    wire NOR_out;
    wire XNOR_out;

    wire HA_sum;
    wire HA_carry;

    wire FA_sum;
    wire FA_carry;

    wire MUX_out;

    digital_circuits DUT (
        .A(A),
        .B(B),
        .Cin(Cin),
        .S(S),

        .AND_out(AND_out),
        .OR_out(OR_out),
        .NOT_out(NOT_out),
        .XOR_out(XOR_out),
        .NAND_out(NAND_out),
        .NOR_out(NOR_out),
        .XNOR_out(XNOR_out),

        .HA_sum(HA_sum),
        .HA_carry(HA_carry),

        .FA_sum(FA_sum),
        .FA_carry(FA_carry),

        .MUX_out(MUX_out)
    );

    initial begin

        $dumpfile("digital_circuits.vcd");
        $dumpvars(0, digital_circuits_tb);

        $monitor(
        "Time=%0t A=%b B=%b Cin=%b S=%b | AND=%b OR=%b NOT=%b XOR=%b NAND=%b NOR=%b XNOR=%b | HA_SUM=%b HA_CARRY=%b | FA_SUM=%b FA_CARRY=%b | MUX=%b",
        $time,
        A, B, Cin, S,
        AND_out, OR_out, NOT_out, XOR_out,
        NAND_out, NOR_out, XNOR_out,
        HA_sum, HA_carry,
        FA_sum, FA_carry,
        MUX_out
        );

        A = 0; B = 0; Cin = 0; S = 0;
        #10;

        A = 0; B = 1; Cin = 0; S = 0;
        #10;

        A = 1; B = 0; Cin = 1; S = 1;
        #10;

        A = 1; B = 1; Cin = 0; S = 1;
        #10;

        A = 1; B = 1; Cin = 1; S = 0;
        #10;

        $finish;

    end

endmodule