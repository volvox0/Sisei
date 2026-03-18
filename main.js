let threshold = 15; // 許容されるズレの角度
let warningCount = 0;
let sensorStarted = false;
let badPostureStartTime = null;
let vibrationInterval = null;
let appStartTime = null;

// 通知用サウンド（木のノック音）
const woodSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

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
    
    // ブラウザの音声を有効化するための空再生
    woodSound.play().then(() => {
        woodSound.pause();
        woodSound.currentTime = 0;
    }).catch(() => {});
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
    
    // beta: 0(水平) 〜 90(垂直)
    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 【修正】90度（直立）を基準としたズレを計算
    let diff = Math.abs(90 - beta);

    if (diff > threshold) {
        updateUI(false); // 姿勢が悪い
        manageAlert(true);
    } else {
        updateUI(true);  // 姿勢が良い
        manageAlert(false);
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
        
        if (duration >= 3000 && !vibrationInterval) {
            triggerAlert();
            vibrationInterval = setInterval(triggerAlert, 2000); // 2秒おきに通知
            warningCount++;
            warningCountEl.textContent = warningCount;
        }
    } else {
        resetTimers();
    }
}

function triggerAlert() {
    // 振動
    if (navigator.vibrate) navigator.vibrate(500);
    // 音声再生
    woodSound.currentTime = 0;
    woodSound.play().catch(e => console.log("Audio play failed:", e));
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

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js");
    });
}
