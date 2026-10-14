module digital_circuits(
    input A,
    input B,
    input Cin,
    input S,

    output AND_out,
    output OR_out,
    output NOT_out,
    output XOR_out,
    output NAND_out,
    output NOR_out,
    output XNOR_out,

    output HA_sum,
    output HA_carry,

    output FA_sum,
    output FA_carry,

    output MUX_out
);

    // Logic Gates
    assign AND_out  = A & B;
    assign OR_out   = A | B;
    assign NOT_out  = ~A;
    assign XOR_out  = A ^ B;
    assign NAND_out = ~(A & B);
    assign NOR_out  = ~(A | B);
    assign XNOR_out = ~(A ^ B);

    // Half Adder
    assign HA_sum   = A ^ B;
    assign HA_carry = A & B;

    // Full Adder
    assign FA_sum   = A ^ B ^ Cin;
    assign FA_carry = (A & B) | (B & Cin) | (A & Cin);

    // 2:1 MUX
    assign MUX_out = S ? B : A;

endmodule