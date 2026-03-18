// State Management
let threshold = 15; // [cite: 1]
let warningCount = 0; // [cite: 1]
let sensorStarted = false;
let badPostureStartTime = null;
let vibrationInterval = null;
let appStartTime = null;

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

// 許容角度の調整 [cite: 1]
thresholdRange.addEventListener("input", (e) => {
    threshold = parseInt(e.target.value);
    thresholdDisplay.textContent = `${threshold}°`;
    goalText.textContent = `${threshold.toFixed(1)}° 以内`;
});

startBtn.addEventListener("click", () => {
    if (sensorStarted) {
        stopSensor();
    } else {
        startSensorRequest();
    }
});

async function startSensorRequest() {
    // iOS Permission Check
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        permissionOverlay.style.display = "flex";
        requestBtn.onclick = async () => {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === "granted") {
                    permissionOverlay.style.display = "none";
                    initSensor();
                } else {
                    message.textContent = "センサー許可が拒否されました";
                }
            } catch (e) {
                message.textContent = "エラーが発生しました";
            }
        };
    } else {
        initSensor();
    }
}

function initSensor() {
    window.addEventListener("deviceorientation", handleOrientation); // [cite: 1]
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
    angleText.textContent = "0.0°";
    message.textContent = "計測を停止しました";
    resetTimers();
}

function handleOrientation(event) {
    if (event.beta === null) return;

    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 姿勢判定 [cite: 1]
    if (Math.abs(beta) > threshold) {
        updateUI(false);
        manageVibration(true);
    } else {
        updateUI(true);
        manageVibration(false);
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

function manageVibration(isBad) {
    if (isBad) {
        if (!badPostureStartTime) badPostureStartTime = Date.now();
        let duration = Date.now() - badPostureStartTime;
        
        // 3秒継続判定 [cite: 1]
        if (duration >= 3000) {
            if (!vibrationInterval) {
                doVibrate();
                // 2秒おきに連続振動 [cite: 1]
                vibrationInterval = setInterval(doVibrate, 2000);
                warningCount++; // 警告回数カウント [cite: 1]
                warningCountEl.textContent = warningCount;
            }
        }
    } else {
        resetTimers();
    }
}

function doVibrate() {
    if (navigator.vibrate) navigator.vibrate(500); // [cite: 1, 2]
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
    // 簡易的なスコアロジック: 100点から減点 [cite: 1]
    let score = 100 - (warningCount * 5);
    scoreTextEl.textContent = Math.max(0, score);
}

// Service Worker登録 [cite: 1]
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js");
    });
}
