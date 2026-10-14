
module dynamic_tb;
reg A, B, Cin, S;
wire AND_out, OR_out, NOT_out, XOR_out;
wire NAND_out, NOR_out, XNOR_out;
wire HA_sum, HA_carry, FA_sum, FA_carry, MUX_out;

digital_circuits dut (
    .A(A), .B(B), .Cin(Cin), .S(S),
    .AND_out(AND_out), .OR_out(OR_out), .NOT_out(NOT_out),
    .XOR_out(XOR_out), .NAND_out(NAND_out), .NOR_out(NOR_out),
    .XNOR_out(XNOR_out), .HA_sum(HA_sum), .HA_carry(HA_carry),
    .FA_sum(FA_sum), .FA_carry(FA_carry), .MUX_out(MUX_out)
);

initial begin
    A = 1; B = 0; Cin = 0; S = 0;
    #10;
    $display("RESULT %b %b %b %b %b %b %b %b %b %b %b %b",
        AND_out, OR_out, NOT_out, XOR_out, NAND_out, NOR_out,
        XNOR_out, HA_sum, HA_carry, FA_sum, FA_carry, MUX_out);
    $finish;
end
endmodule
