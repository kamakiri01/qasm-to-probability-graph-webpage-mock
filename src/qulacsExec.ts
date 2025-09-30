import { initQulacs } from "qulacs-wasm";
import * as qasm from "qasm-ts";
import { QuantumDeclaration, IntegerLiteral, QuantumGateCall, SubscriptedIdentifier } from "qasm-ts/dist/qasm3/ast";

let q: typeof import("qulacs-wasm");

initQulacs()
    .then(async () => {
        q = await import("qulacs-wasm");
    });

    // X/Y/Z/H/CNOTのみ対応している
export function qulacsExec(parsedCircuit: qasm.Qasm3QuantumInstruction[]) {
    let count: number;
    let gates: QuantumGateCall[] = [];
    parsedCircuit.forEach((e) => {
        if (e instanceof QuantumDeclaration) {
            const size = e.size as IntegerLiteral;
            count = Number(size.value);
        } else if (e instanceof QuantumGateCall) {
            gates.push(e);
        }
    });

    const state = new q.QuantumState(count);
    state.set_zero_state();
    const circuit = new q.QuantumCircuit(count);
    gates.forEach(g => {
        let value0 = ((g.qubits[0] as SubscriptedIdentifier).subscript as IntegerLiteral).value;
        value0 = Number(value0);
        switch (g.quantumGateName.name) {
            case "x":
                circuit.add_X_gate(value0);
                break;
            case "y":
                circuit.add_Y_gate(value0);
                break;
            case "z": 
                circuit.add_Z_gate(value0);
                break;
            case "h":
                circuit.add_H_gate(value0);
                break;
            case "cx":
                let value1 = ((g.qubits[1] as SubscriptedIdentifier).subscript as IntegerLiteral).value;
                circuit.add_CNOT_gate(value0, Number(value1));
                break;
            default:
                // do nothing
        }
    });
    circuit.update_quantum_state(state);
    return state.get_vector();
}