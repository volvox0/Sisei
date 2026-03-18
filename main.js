let threshold = 15; 
let warningCount = 0;
let sensorStarted = false;
let badPostureStartTime = null;
let vibrationInterval = null;
let appStartTime = null;

// 【重要】自分で用意した音源ファイル名を指定
const woodSound = new Audio('alert.mp3'); 

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

thresholdRange.addEventListener("input", (e) => {
    threshold = parseInt(e.target.value);
    thresholdDisplay.textContent = `${threshold}°`;
    goalText.textContent = `垂直から±${threshold}°以内`;
});

startBtn.addEventListener("click", () => {
    if (sensorStarted) {
        stopSensor();
    } else {
        // iPhoneの音声制限を解除
        woodSound.play().then(() => { woodSound.pause(); woodSound.currentTime = 0; }).catch(() => {});
        startSensorRequest();
    }
});

async function startSensorRequest() {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        permissionOverlay.style.display = "flex";
        requestBtn.onclick = async () => {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === "granted") {
                permissionOverlay.style.display = "none";
                initSensor();
            }
        };
    } else { initSensor(); }
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
    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 垂直(90度)を基準に判定
    let diff = Math.abs(90 - beta);

    if (diff <= threshold) {
        updateUI(true);
        manageAlert(false);
    } else {
        updateUI(false);
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
        if ((Date.now() - badPostureStartTime) >= 3000 && !vibrationInterval) {
            triggerAlert();
            vibrationInterval = setInterval(triggerAlert, 3000); // 3秒おきに警告
            warningCount++;
            warningCountEl.textContent = warningCount;
        }
    } else { resetTimers(); }
}

function triggerAlert() {
    if (navigator.vibrate) navigator.vibrate(500);
    woodSound.currentTime = 0;
    woodSound.play().catch(() => {});
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
    scoreTextEl.textContent = Math.max(0, 100 - (warningCount * 5));
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js?v=8");
    });
}
