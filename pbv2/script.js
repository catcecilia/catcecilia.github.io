
let video = document.getElementById('video');
let photoCanvas = document.getElementById('photoCanvas');
let printCanvas = document.getElementById('printCanvas');
let modeSelect = document.getElementById('mode');
let overlaySelect = document.getElementById('overlaySelect');
let countdown = document.getElementById('countdown');
let status = document.getElementById('status');
let flash = document.getElementById('flash');
let takePhotosBtn = document.getElementById('takePhotos');
let printButton = document.getElementById('printButton');

let qrModal = document.getElementById("qrModal");
let qrCodeDiv = document.getElementById("qrcode");
let qrCountdown = document.getElementById("qrCountdown");
let closeQR = document.getElementById("closeQR");


const modeSelect = document.getElementById("mode");
const overlaySelectContainer = document.getElementById("overlaySelectContainer");

let qrAutoCloseTimer;
let qrCountdownInterval;

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showFlash() {
  flash.style.display = 'block';
  flash.style.position = 'fixed';
  flash.style.top = 0;
  flash.style.left = 0;
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = 'white';
  flash.style.zIndex = 9999;
  setTimeout(() => flash.style.display = 'none', 100);
}

function showStatus(msg) {
  status.textContent = msg;
  status.classList.remove("is-hidden");
}

function hideStatus() {
  status.classList.add("is-hidden");
}

async function takePhotoStrip() {
  let ctx = photoCanvas.getContext('2d');
  let overlay = new Image();
  overlay.src = overlaySelect.value;

  for (let i = 0; i < 3; i++) {
    countdown.textContent = 3;
    await sleep(1000);
    countdown.textContent = 2;
    await sleep(1000);
    countdown.textContent = 1;
    await sleep(1000);
    countdown.textContent = '';
    showFlash();
    ctx.drawImage(video, 0, i * 600, 600, 600);
    await sleep(500);
  }

  overlay.onload = () => {
    if (overlay.src.includes("none.png")) return;
    ctx.drawImage(overlay, 0, 0, 600, 1800);
  };

  generatePrintLayout();
  await uploadImage(photoCanvas.toDataURL("image/png"));
}

function generatePrintLayout() {
  let printCtx = printCanvas.getContext('2d');
  printCtx.fillStyle = "white";
  printCtx.fillRect(0, 0, 1200, 1800);
  printCtx.drawImage(photoCanvas, 0, 0, 600, 1800);
  printCtx.drawImage(photoCanvas, 600, 0, 600, 1800);
  printButton.classList.remove("is-hidden");
}

async function recordBoomerang() {
  let chunks = [];
  let stream = video.captureStream();
  let recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => chunks.push(e.data);

  countdown.textContent = "Recording...";
  recorder.start();
  await sleep(3000);
  recorder.stop();

  await new Promise(resolve => recorder.onstop = resolve);
  countdown.textContent = "";

  let blob = new Blob(chunks, { type: "video/webm" });
  let videoURL = URL.createObjectURL(blob);

  let gif = new GIF({
    workers: 2,
    quality: 10,
    width: 300,
    height: 300
  });

  let boomerangVideo = document.createElement('video');
  boomerangVideo.src = videoURL;
  boomerangVideo.muted = true;
  boomerangVideo.playbackRate = 2.0;

  await new Promise(resolve => {
    boomerangVideo.onloadeddata = () => {
      boomerangVideo.play();
      let interval = setInterval(() => {
        let tempCanvas = document.createElement("canvas");
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        tempCanvas.getContext("2d").drawImage(boomerangVideo, 0, 0, 300, 300);
        gif.addFrame(tempCanvas, { delay: 80 });

        if (boomerangVideo.ended) {
          clearInterval(interval);
          boomerangVideo.playbackRate = 2.0;
          boomerangVideo.currentTime = 0;
          boomerangVideo.play();

          let reverseInterval = setInterval(() => {
            let tempCanvas = document.createElement("canvas");
            tempCanvas.width = 300;
            tempCanvas.height = 300;
            tempCanvas.getContext("2d").drawImage(boomerangVideo, 0, 0, 300, 300);
            gif.addFrame(tempCanvas, { delay: 80 });

            if (boomerangVideo.ended) {
              clearInterval(reverseInterval);
              gif.on('finished', blob => {
                let url = URL.createObjectURL(blob);
                uploadImage(url, "gif");
              });
              gif.render();
              resolve();
            }
          }, 100);
        }
      }, 100);
    };
  });
}

async function uploadImage(dataURL, type = "png") {
  showStatus("Uploading...");

  const formData = new FormData();
  formData.append("file", dataURL);
  formData.append("upload_preset", "YOUR_UNSIGNED_UPLOAD_PRESET");

  const response = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  hideStatus();

  if (result.secure_url) {
    generateQRCode(result.secure_url);
  } else {
    alert("Upload failed!");
  }
}

function generateQRCode(url) {
  qrCodeDiv.innerHTML = "";
  new QRCode(qrCodeDiv, {
    text: url,
    width: 200,
    height: 200
  });

  qrModal.classList.add("is-active");

  let timeLeft = 60;
  qrCountdown.textContent = `This window will close in ${timeLeft} seconds.`;

  clearTimeout(qrAutoCloseTimer);
  clearInterval(qrCountdownInterval);

  qrCountdownInterval = setInterval(() => {
    timeLeft--;
    qrCountdown.textContent = `This window will close in ${timeLeft} seconds.`;
    if (timeLeft <= 0) clearInterval(qrCountdownInterval);
  }, 1000);

  qrAutoCloseTimer = setTimeout(() => {
    closeQRModal();
  }, 60000);
}

function closeQRModal() {
  qrModal.classList.remove("is-active");
  qrCodeDiv.innerHTML = "";
  qrCountdown.textContent = "";
  clearTimeout(qrAutoCloseTimer);
  clearInterval(qrCountdownInterval);
}

closeQR.addEventListener("click", closeQRModal);

takePhotosBtn.addEventListener('click', async () => {
  printButton.classList.add("is-hidden");
  let mode = modeSelect.value;
  if (mode === "strip") {
    await takePhotoStrip();
  } else {
    await recordBoomerang();
  }
});

modeSelect.addEventListener("change", () => {
  if (modeSelect.value === "boomerang") {
    overlaySelectContainer.style.display = "none";
  } else {
    overlaySelectContainer.style.display = "block";
  }
});

if (modeSelect.value === "boomerang") {
  overlaySelectContainer.style.display = "none";
}