let threshold = 15; 
let warningCount = 0;
let sensorStarted = false;
let badPostureStartTime = null;
let vibrationInterval = null;
let appStartTime = null;

// 通知用サウンド（より信頼性の高いURLに変更）
const woodSound = new Audio('https://raw.githubusercontent.com/rafael-m-faria/posture-checker/master/public/sounds/wood-knock.mp3');
woodSound.preload = 'auto';

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
    goalText.textContent = `垂直から${threshold.toFixed(1)}° 以内`;
});

startBtn.addEventListener("click", () => {
    if (sensorStarted) {
        stopSensor();
    } else {
        // 【重要】ボタンクリックと同時に音声を有効化
        woodSound.play().then(() => {
            woodSound.pause();
            woodSound.currentTime = 0;
        }).catch(e => console.log("Audio unlock failed:", e));
        
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
            } catch (e) { message.textContent = "センサー許可に失敗しました"; }
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
    
    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 90度（垂直）を基準にしたズレ
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
        let duration = Date.now() - badPostureStartTime;
        
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
    // 振動 (Androidのみ動作) 
    if (navigator.vibrate) {
        navigator.vibrate(500);
    }
    // 音声再生
    woodSound.currentTime = 0;
    woodSound.play().catch(e => {
        console.log("Play error:", e);
        message.textContent = "音声再生に失敗しました";
    });
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
