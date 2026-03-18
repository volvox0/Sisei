let threshold = 15; // 垂直(90°)からの許容誤差
let warningCount = 0;
let sensorStarted = false;
let badPostureStartTime = null;
let vibrationInterval = null;
let appStartTime = null;

// 通知用サウンド（より確実に鳴るパブリックな音源に変更）
const woodSound = new Audio('https://raw.githubusercontent.com/the-maldridge/open-asset-library/master/audio/sfx/wood_knock.mp3');
woodSound.load(); // 事前読み込み

const startBtn = document.getElementById("startBtn");
const angleText = document.getElementById("angleText");
const statusText = document.getElementById("statusText");
const statusCard = document.getElementById("statusCard");
const message = document.getElementById("message");
const thresholdRange = document.getElementById("thresholdRange");
const thresholdDisplay = document.getElementById("thresholdDisplay");
const goalText = document.getElementById("goalText");
const warningCountEl = document.getElementById("warningCount");
const scoreTextEl = document.getElementById("scoreText");
const permissionOverlay = document.getElementById("permissionOverlay");
const requestBtn = document.getElementById("requestBtn");

// 許容角度の設定
thresholdRange.addEventListener("input", (e) => {
    threshold = parseInt(e.target.value);
    thresholdDisplay.textContent = `${threshold}°`;
    goalText.textContent = `垂直から${threshold.toFixed(1)}° 以内`;
});

startBtn.addEventListener("click", () => {
    if (sensorStarted) {
        stopSensor();
    } else {
        startSensorRequest();
    }
});

async function startSensorRequest() {
    // ボタンクリックの瞬間に音声を「アンロック」する（重要！）
    woodSound.play().then(() => {
        woodSound.pause();
        woodSound.currentTime = 0;
    }).catch(e => console.log("Audio unlock failed:", e));

    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        permissionOverlay.style.display = "flex";
        requestBtn.onclick = async () => {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === "granted") {
                    permissionOverlay.style.display = "none";
                    initSensor();
                }
            } catch (e) { message.textContent = "エラーが発生しました"; }
        };
    } else {
        initSensor();
    }
}

function initSensor() {
    window.addEventListener("deviceorientation", handleOrientation);
    sensorStarted = true;
    appStartTime = Date.now();
    startBtn.textContent = "センサー停止";
    startBtn.classList.add("stop");
    message.textContent = "測定中...";
}

function stopSensor() {
    window.removeEventListener("deviceorientation", handleOrientation);
    sensorStarted = false;
    startBtn.textContent = "センサー開始";
    startBtn.classList.remove("stop");
    statusText.textContent = "待機中";
    statusCard.className = "status-card";
    resetTimers();
}

function handleOrientation(event) {
    if (event.beta === null) return;
    
    // beta: 0(水平) 〜 90(垂直)
    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 90度（直立）を基準としたズレを計算
    let diff = Math.abs(90 - beta);

    // 判定ロジック：ズレがしきい値以内なら「良い」 
    if (diff <= threshold) {
        updateUI(true);  // 良い姿勢
        manageAlert(false);
    } else {
        updateUI(false); // 姿勢が悪い
        manageAlert(true);
    }
    updateScore();
}

function updateUI(isGood) {
    if (isGood) {
        statusText.textContent = "良い姿勢";
        statusCard.className = "status-card good";
    } else {
        statusText.textContent = "姿勢が悪い！";
        statusCard.className = "status-card bad";
    }
}

function manageAlert(isBad) {
    if (isBad) {
        if (!badPostureStartTime) badPostureStartTime = Date.now();
        let duration = Date.now() - badPostureStartTime;
        
        // 3秒継続で警告 
        if (duration >= 3000 && !vibrationInterval) {
            triggerAlert();
            vibrationInterval = setInterval(triggerAlert, 2000); 
            warningCount++;
            warningCountEl.textContent = warningCount;
        }
    } else {
        resetTimers();
    }
}

function triggerAlert() {
    // 振動 
    if (navigator.vibrate) {
        navigator.vibrate(500);
    }
    // 音声再生
    woodSound.currentTime = 0;
    woodSound.play().catch(e => console.log("Sound play error:", e));
}

function resetTimers() {
    badPostureStartTime = null;
    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }
}

function updateScore() {
    if (!appStartTime) return;
    let score = 100 - (warningCount * 5);
    scoreTextEl.textContent = Math.max(0, score);
}

// Service WorkerのパスをGitHub Pages用に修正
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js");
    });
}
