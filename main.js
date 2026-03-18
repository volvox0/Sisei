const threshold = 15; // 許容角度 [cite: 1]
let warningTimer = null;
let sensorStarted = false;

const startBtn = document.getElementById("startBtn");
const angleText = document.getElementById("angleText");
const statusText = document.getElementById("statusText");
const statusCard = document.getElementById("statusCard");
const message = document.getElementById("message");

startBtn.addEventListener("click", async () => {
    if(sensorStarted) return;

    // iOS対応の権限リクエスト
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== "granted") {
                message.textContent = "センサー許可が必要です";
                return;
            }
        } catch(e) {
            message.textContent = "エラーが発生しました";
            return;
        }
    }

    window.addEventListener("deviceorientation", handleOrientation);
    sensorStarted = true;
    startBtn.style.display = "none";
    message.textContent = "測定を開始しました";
});

function handleOrientation(event) {
    if(event.beta === null) return;

    let beta = event.beta;
    angleText.textContent = `${beta.toFixed(1)}°`;

    // 姿勢判定ロジック [cite: 1]
    if(Math.abs(beta) > threshold) {
        updateUI(false);
        if(!warningTimer) {
            // 3秒継続でバイブ [cite: 1, 2]
            warningTimer = setTimeout(() => {
                if(navigator.vibrate) navigator.vibrate(500); 
            }, 3000);
        }
    } else {
        updateUI(true);
        if(warningTimer) {
            clearTimeout(warningTimer);
            warningTimer = null;
        }
    }
}

function updateUI(isGood) {
    if(isGood) {
        statusText.textContent = "良い姿勢";
        statusCard.className = "status-card good";
    } else {
        statusText.textContent = "姿勢が悪い！";
        statusCard.className = "status-card bad";
    }
}

// Service Worker登録 [cite: 1]
if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../service-worker.js");
}