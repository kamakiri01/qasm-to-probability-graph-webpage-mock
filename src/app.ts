import * as qasm from "qasm-ts";
import {
    Chart,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { qulacsExec } from "./qulacsExec";
// Chart.jsの必要なコンポーネントを登録
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

// ファイルの内容を保存する変数
let currentFile = null;
let currentFileContent: any = '';
let quantumChart: any = null;

// DOM要素の取得
const dropZone = document.getElementById('dropZone')!;
const fileInput = document.getElementById('fileInput')!;
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileContent = document.getElementById('fileContent');
const executeBtn = document.getElementById('executeBtn') as any;
const resultArea = document.getElementById('resultArea');
const errorArea = document.getElementById('errorArea');
const graphContainer = document.getElementById('graphContainer');
const resultChart = document.getElementById('resultChart') as any;

// ドラッグ＆ドロップイベントのセットアップ
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragenter', handleDragEnter);
dropZone.addEventListener('dragleave', handleDragLeave);

// ファイル選択イベント
fileInput.addEventListener('change', handleFileSelect);

executeBtn.addEventListener("click", executeQuantumCircuit);

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    // ファイルの拡張子チェック
    if (!file.name.toLowerCase().endsWith('.qasm')) {
        showError('QASMファイル (.qasm) を選択してください。');
        return;
    }

    currentFile = file;

    // ファイル読み込み
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileContent = e.target.result;
        showFileInfo();
        hideError();
    };

    reader.onerror = function() {
        showError('ファイルの読み込み中にエラーが発生しました。');
    };

    reader.readAsText(file);
}

function showFileInfo() {
    fileName.textContent = `${currentFile.name} (${currentFile.size} bytes)`;

    // ファイル内容を表示
    if (fileContent) {
        fileContent.textContent = currentFileContent;
    }

    fileInfo.style.display = 'block';
    executeBtn.disabled = false;
}

function showError(message) {
    errorArea.innerHTML = `<div class="error">${message}</div>`;
    errorArea.style.display = 'block';
}

function hideError() {
    errorArea.style.display = 'none';
}

async function executeQuantumCircuit() {
    try {
        hideError();
        executeBtn.disabled = true;
        executeBtn.textContent = '実行中...';

        // QASMファイルのパース（qasm-ts使用）
        const qasmParseCircuit = qasm.parseString(currentFileContent, 3);
        console.log("qasmParseCircuit", qasmParseCircuit);

        const result = qulacsExec(qasmParseCircuit);
        displayResults(result);

    } catch (error) {
        showError(`実行中にエラーが発生しました: ${error.message}`);
    } finally {
        executeBtn.disabled = false;
        executeBtn.textContent = '量子回路を実行';
    }
}

// 結果をグラフで表示する関数
function displayResults(results) {
    // 状態ベクトルの正規化
    const mags = results.map(r => {
        return {
            ...r,
            magnitude: Math.sqrt(r.real * r.real + r.imag * r.imag)
        };
    });
    const totalMagnitude = Math.sqrt(mags.reduce((sum, state) => sum + state.magnitude * state.magnitude, 0));
    mags.forEach(state => {
        state.real /= totalMagnitude;
        state.imag /= totalMagnitude;
        state.magnitude /= totalMagnitude;
        state.probability = state.magnitude * state.magnitude;
    });

    resultArea.style.display = 'block';

    // Chart.jsを使用した確率分布のグラフ
    const ctx = resultChart.getContext('2d');

    // 既存のチャートがあれば破棄
    if (quantumChart) {
        quantumChart.destroy();
        quantumChart = null;
    }

    const labels = mags.map((_, index) => `|${index.toString(2).padStart(Math.log2(mags.length), '0')}⟩`);
    const probabilities = mags.map(state => state.probability);

    quantumChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '確率',
                data: probabilities,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: '確率'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '量子状態'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '量子状態の確率分布'
                },
                legend: {
                    display: true
                }
            }
        }
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('QASM量子回路シミュレーターが初期化されました');
});
