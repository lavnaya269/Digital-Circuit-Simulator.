
const API_URL = window.SIMULATOR_API_URL || "http://localhost:3000/simulate";

// Store the IDs of the output elements
const outputElements = {
    AND: "andOutput",
    OR: "orOutput",
    NOT: "notOutput",
    XOR: "xorOutput",
    NAND: "nandOutput",
    NOR: "norOutput",
    XNOR: "xnorOutput",
    HA_SUM: "haSum",
    HA_CARRY: "haCarry",
    FA_SUM: "faSum",
    FA_CARRY: "faCarry",
    MUX: "muxOutput"
};

let simulationHistory = [];
let lastResult = null;


// Switch between single-bit and multiple-bit modes
function changeBinaryMode() {
    const mode = document.getElementById("binaryMode");

    if (!mode) return;

    const single = document.getElementById("singleBitInputs");
    const multiple = document.getElementById("multipleBitInputs");

    if (single) single.hidden = mode.value !== "single";
    if (multiple) multiple.hidden = mode.value !== "multiple";
}


// Run the actual Verilog simulation using the backend
async function simulate() {
    const A = Number(document.getElementById("inputA").value);
    const B = Number(document.getElementById("inputB").value);
    const Cin = Number(document.getElementById("carryIn").value);

    const muxSelect = document.getElementById("muxSelect");
    const S = muxSelect ? Number(muxSelect.value) : B;

    const status = document.getElementById("simulationStatus");

    if (status) {
        status.textContent = "Running Verilog simulation...";
        status.style.color = "#38bdf8";
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ A, B, Cin, S })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Simulation failed");
        }

        // Display logic gate outputs
        for (const [key, elementId] of Object.entries(outputElements)) {
            const element = document.getElementById(elementId);

            if (element && result[key] !== undefined) {
                element.textContent = result[key];
            }
        }

        // Save simulation result
        lastResult = { A, B, Cin, S, ...result };

        simulationHistory.unshift({
            ...lastResult,
            time: new Date().toLocaleTimeString()
        });

        // Keep the latest 20 simulations
        simulationHistory = simulationHistory.slice(0, 20);

        renderHistory();
        renderWaveform(lastResult);

        if (status) {
            status.textContent = "Simulation completed successfully!";
            status.style.color = "#4ade80";
        }

    } catch (error) {
        console.error("Simulation error:", error);

        if (status) {
            status.textContent =
                "Simulation failed. Check whether the backend is running.";
            status.style.color = "#fb7185";
        } else {
            alert("Simulation failed! Start the backend and try again.");
        }
    }
}


// Perform multiple-bit binary calculations
function calculateBinary() {
    const aText = document.getElementById("binaryA").value.trim();
    const bText = document.getElementById("binaryB").value.trim();
    const operation = document.getElementById("binaryOperation").value;

    const resultElement = document.getElementById("binaryResult");
    const decimalElement = document.getElementById("decimalResult");
    const statusElement = document.getElementById("binaryStatus");

    if (!/^[01]{1,32}$/.test(aText)) {
        showBinaryError("Enter A using only 0 and 1 (maximum 32 bits).");
        return;
    }

    if (
        operation !== "NOT" &&
        !/^[01]{1,32}$/.test(bText)
    ) {
        showBinaryError("Enter B using only 0 and 1 (maximum 32 bits).");
        return;
    }

    const A = BigInt("0b" + aText);
    const B = /^[01]{1,32}$/.test(bText)
        ? BigInt("0b" + bText)
        : 0n;

    let result;

    switch (operation) {
        case "ADD":
            result = A + B;
            break;

        case "SUB":
            result = A - B;
            break;

        case "AND":
            result = A & B;
            break;

        case "OR":
            result = A | B;
            break;

        case "XOR":
            result = A ^ B;
            break;

        case "NOT":
            result = BigInt(
                "0b" +
                [...aText]
                    .map(bit => bit === "0" ? "1" : "0")
                    .join("")
            );
            break;

        default:
            showBinaryError("Choose a valid operation.");
            return;
    }

    const binaryOutput =
        result < 0n
            ? "-" + (-result).toString(2)
            : result.toString(2);

    if (resultElement) {
        resultElement.textContent = binaryOutput;
    }

    if (decimalElement) {
        decimalElement.textContent =
            "Decimal result: " + result.toString();
    }

    if (statusElement) {
        statusElement.textContent = "Calculation completed successfully!";
        statusElement.style.color = "#4ade80";
    }
}


// Display binary calculation errors
function showBinaryError(message) {
    const resultElement = document.getElementById("binaryResult");
    const decimalElement = document.getElementById("decimalResult");
    const statusElement = document.getElementById("binaryStatus");

    if (resultElement) resultElement.textContent = "—";

    if (decimalElement) {
        decimalElement.textContent = "Decimal result: —";
    }

    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = "#fb7185";
    }
}


// Reset output values
function resetOutputs() {
    for (const elementId of Object.values(outputElements)) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = "—";
        }
    }

    lastResult = null;

    const status = document.getElementById("simulationStatus");

    if (status) {
        status.textContent = "Outputs cleared. Run a new simulation.";
    }
}


// Clear simulation history
function clearHistory() {
    simulationHistory = [];
    renderHistory();

    const waveform = document.getElementById("waveform");

    if (waveform) {
        waveform.innerHTML =
            '<p class="empty-state">Run a simulation to display signal levels.</p>';
    }
}


// Display previous simulation results
function renderHistory() {
    const body = document.getElementById("historyBody");

    if (!body) return;

    if (simulationHistory.length === 0) {
        body.innerHTML =
            '<tr><td colspan="8" class="empty-state">No simulations recorded yet.</td></tr>';
        return;
    }

    body.innerHTML = simulationHistory.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.A}</td>
            <td>${item.B}</td>
            <td>${item.Cin}</td>
            <td>${item.S}</td>
            <td>${item.FA_SUM}</td>
            <td>${item.FA_CARRY}</td>
            <td>${item.time}</td>
        </tr>
    `).join("");
}


// Display illustrative signal levels
function renderWaveform(item) {
    const waveform = document.getElementById("waveform");

    if (!waveform) return;

    const signals = [
        ["A", item.A],
        ["B", item.B],
        ["Cin", item.Cin],
        ["S", item.S],
        ["AND", item.AND],
        ["XOR", item.XOR],
        ["HA_SUM", item.HA_SUM],
        ["FA_SUM", item.FA_SUM],
        ["FA_CARRY", item.FA_CARRY],
        ["MUX", item.MUX]
    ];

    const width = 360;

    waveform.innerHTML = signals.map(([name, rawValue]) => {
        const value = Number(rawValue);
        const y = value === 1 ? 5 : 25;

        return `
            <div class="wave-row">
                <span class="wave-label">${name} = ${value}</span>

                <svg viewBox="0 0 ${width} 30"
                     preserveAspectRatio="none"
                     role="img"
                     aria-label="${name} signal value ${value}">
                    <line x1="0" y1="15"
                          x2="${width}" y2="15"
                          stroke="#26354f"
                          stroke-width="1"/>

                    <line x1="0" y1="${y}"
                          x2="${width}" y2="${y}"
                          stroke="#22d3ee"
                          stroke-width="2"
                          vector-effect="non-scaling-stroke"/>
                </svg>
            </div>
        `;
    }).join("");
}


// Generate truth tables
function renderTruthTable() {
    const selector = document.getElementById("truthTableType");
    const table = document.getElementById("truthTable");

    if (!selector || !table) return;

    const type = selector.value;

    let headers = [];
    let rows = [];

    if (type === "gates") {
        headers = [
            "A", "B", "AND", "OR", "XOR",
            "NAND", "NOR", "XNOR", "NOT A"
        ];

        for (let A = 0; A <= 1; A++) {
            for (let B = 0; B <= 1; B++) {
                rows.push([
                    A, B,
                    A & B,
                    A | B,
                    A ^ B,
                    1 - (A & B),
                    1 - (A | B),
                    1 - (A ^ B),
                    1 - A
                ]);
            }
        }

    } else if (type === "half") {
        headers = ["A", "B", "SUM", "CARRY"];

        for (let A = 0; A <= 1; A++) {
            for (let B = 0; B <= 1; B++) {
                rows.push([A, B, A ^ B, A & B]);
            }
        }

    } else if (type === "full") {
        headers = ["A", "B", "Cin", "SUM", "CARRY"];

        for (let A = 0; A <= 1; A++) {
            for (let B = 0; B <= 1; B++) {
                for (let Cin = 0; Cin <= 1; Cin++) {
                    const total = A + B + Cin;

                    rows.push([
                        A,
                        B,
                        Cin,
                        total % 2,
                        Math.floor(total / 2)
                    ]);
                }
            }
        }

    } else if (type === "mux") {
        headers = ["A", "B", "S", "OUTPUT"];

        for (let A = 0; A <= 1; A++) {
            for (let B = 0; B <= 1; B++) {
                for (let S = 0; S <= 1; S++) {
                    rows.push([A, B, S, S === 0 ? A : B]);
                }
            }
        }
    }

    table.innerHTML = `
        <thead>
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${rows.map(row => `
                <tr>
                    ${row.map(value => `<td>${value}</td>`).join("")}
                </tr>
            `).join("")}
        </tbody>
    `;
}


// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
    changeBinaryMode();
    renderTruthTable();
    renderHistory();
});
