
const API_URL = "http://localhost:3000/simulate";

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

// Run Verilog simulation
async function simulate() {
    const A = Number(document.getElementById("inputA").value);
    const B = Number(document.getElementById("inputB").value);
    const Cin = Number(document.getElementById("carryIn").value);

    const muxSelect = document.getElementById("muxSelect");
    const S = muxSelect ? Number(muxSelect.value) : B;

    const button = document.getElementById("simulateButton");
    const status = document.getElementById("simulationStatus");

    if (button) button.disabled = true;

    if (status) {
        status.textContent = "Running Icarus Verilog simulation...";
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

        // Display all circuit outputs
        for (const [key, elementId] of Object.entries(outputElements)) {
            const element = document.getElementById(elementId);

            if (element) {
                element.textContent =
                    result[key] !== undefined ? result[key] : "—";
            }
        }

        // Save simulation results
        lastResult = { A, B, Cin, S, ...result };

        simulationHistory.unshift({
            ...lastResult,
            time: new Date().toLocaleTimeString()
        });

        simulationHistory = simulationHistory.slice(0, 20);

        renderHistory();
        renderWaveform(lastResult);

        if (status) {
            status.textContent = "Simulation completed successfully!";
            status.style.color = "#4ade80";
        }

    } catch (error) {
        console.error(error);

        if (status) {
            status.textContent = "Simulation error: " + error.message;
            status.style.color = "#fb7185";
        } else {
            alert("Simulation error: " + error.message);
        }
    } finally {
        if (button) button.disabled = false;
    }
}

// Reset circuit outputs
function resetOutputs() {
    for (const elementId of Object.values(outputElements)) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = "—";
    }

    lastResult = null;

    const status = document.getElementById("simulationStatus");

    if (status) {
        status.textContent = "Outputs cleared. Run a new simulation.";
    }
}

// Clear history
function clearHistory() {
    simulationHistory = [];
    renderHistory();

    const waveform = document.getElementById("waveform");

    if (waveform) {
        waveform.innerHTML =
            '<p class="empty-state">Run a simulation to display signal levels.</p>';
    }
}

// Show simulation history
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
            <td>${item.FA_SUM ?? "—"}</td>
            <td>${item.FA_CARRY ?? "—"}</td>
            <td>${item.time}</td>
        </tr>
    `).join("");
}

// Show illustrative signal levels
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

    waveform.innerHTML = signals.map(([name, rawValue]) => {
        const value = Number(rawValue);
        const y = value === 1 ? 5 : 25;

        return `
            <div class="wave-row">
                <span class="wave-label">${name} = ${value}</span>
                <svg viewBox="0 0 360 30" preserveAspectRatio="none"
                     role="img" aria-label="${name} signal value ${value}">
                    <line x1="0" y1="15" x2="360" y2="15"
                          stroke="#26354f" stroke-width="1"/>
                    <line x1="0" y1="${y}" x2="360" y2="${y}"
                          stroke="#22d3ee" stroke-width="2"
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
                    A, B, A & B, A | B, A ^ B,
                    1 - (A & B), 1 - (A | B),
                    1 - (A ^ B), 1 - A
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
                        A, B, Cin, total % 2, Math.floor(total / 2)
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
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
            ${rows.map(row =>
                `<tr>${row.map(value => `<td>${value}</td>`).join("")}</tr>`
            ).join("")}
        </tbody>
    `;
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    renderTruthTable();
    renderHistory();
});
