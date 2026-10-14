
const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SIM_DIR = path.resolve(__dirname, "..");
const VERILOG_FILE = path.join(SIM_DIR, "digital_circuits.v");
const TB_FILE = path.join(SIM_DIR, "dynamic_tb.v");
const OUTPUT_FILE = path.join(SIM_DIR, "dynamic_tb.vvp");

const IVERILOG = "C:\\iverilog\\bin\\iverilog.exe";
const VVP = "C:\\iverilog\\bin\\vvp.exe";

app.get("/", (req, res) => {
    res.send("Digital Circuit Simulator Backend is Running!");
});

app.post("/simulate", (req, res) => {
    const { A, B, Cin, S } = req.body;

    if (![A, B, Cin, S].every(v => v === 0 || v === 1)) {
        return res.status(400).json({
            error: "Inputs A, B, Cin and S must be 0 or 1."
        });
    }

    if (!fs.existsSync(VERILOG_FILE)) {
        return res.status(500).json({
            error: "Verilog file not found: " + VERILOG_FILE
        });
    }

    const testbench = `
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
    A = ${A}; B = ${B}; Cin = ${Cin}; S = ${S};
    #10;
    $display("RESULT %b %b %b %b %b %b %b %b %b %b %b %b",
        AND_out, OR_out, NOT_out, XOR_out, NAND_out, NOR_out,
        XNOR_out, HA_sum, HA_carry, FA_sum, FA_carry, MUX_out);
    $finish;
end
endmodule
`;

    try {
        fs.writeFileSync(TB_FILE, testbench);
    } catch (error) {
        return res.status(500).json({
            error: "Could not write testbench: " + error.message
        });
    }

    execFile(
        IVERILOG,
        ["-o", OUTPUT_FILE, VERILOG_FILE, TB_FILE],
        { cwd: SIM_DIR },
        (compileError, stdout, stderr) => {
            if (compileError) {
                console.error("Compile error:", stderr || compileError.message);
                return res.status(500).json({
                    error: "Verilog compilation failed: " +
                        (stderr || compileError.message)
                });
            }

            execFile(
                VVP,
                [OUTPUT_FILE],
                { cwd: SIM_DIR },
                (runError, runStdout, runStderr) => {
                    if (runError) {
                        console.error("Simulation error:", runStderr || runError.message);
                        return res.status(500).json({
                            error: "Verilog simulation failed: " +
                                (runStderr || runError.message)
                        });
                    }

                    const match = runStdout.match(
                        /RESULT\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])\s+([01])/
                    );

                    if (!match) {
                        return res.status(500).json({
                            error: "Could not read results: " + runStdout
                        });
                    }

                    const v = match.slice(1).map(Number);

                    res.json({
                        AND: v[0], OR: v[1], NOT: v[2], XOR: v[3],
                        NAND: v[4], NOR: v[5], XNOR: v[6],
                        HA_SUM: v[7], HA_CARRY: v[8],
                        FA_SUM: v[9], FA_CARRY: v[10], MUX: v[11]
                    });
                }
            );
        }
    );
});

app.listen(PORT, () => {
    console.log("ACTIVE SERVER FILE:", __filename);
    console.log("Icarus executable:", IVERILOG);
    console.log(`Server running at http://localhost:${PORT}`);
});
