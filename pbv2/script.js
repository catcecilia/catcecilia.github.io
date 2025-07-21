const video = document.getElementById('video');
const photoCanvas = document.getElementById('photoCanvas');
const printCanvas = document.getElementById('printCanvas');
const ctx = photoCanvas.getContext('2d');
const printCtx = printCanvas.getContext('2d');
const takePhotosBtn = document.getElementById('takePhotos');
const printBtn = document.getElementById('printButton');
const overlaySelect = document.getElementById('overlaySelect');
const overlaySelectContainer = document.getElementById('overlaySelectContainer');
const modeSelect = document.getElementById('mode');
const flash = document.getElementById('flash');
const status = document.getElementById('status');
const countdownEl = document.getElementById('countdown');
const qrModal = document.getElementById('qrModal');
const qrCodeEl = document.getElementById('qrcode');
const qrCountdownEl = document.getElementById('qrCountdown');
const closeQRBtn = document.getElementById('closeQR');

let mediaStream;
let countdownTimer;
let qrAutoCloseTimer;

async function initCamera() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = mediaStream;
}

function flashScreen() {
  flash.style.display = 'block';
  setTimeout(() => (flash.style.display = 'none'), 200);
}

function drawImageToCanvas(canvas, context, images, overlay) {
  const height = canvas.height / images.length;
  context.clearRect(0, 0, canvas.width, canvas.height);
  images.forEach((img, i) => context.drawImage(img, 0, i * height, canvas.width, height));
  if (overlay) {
    const overlayImg = new Image();
    overlayImg.onload = () => context.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
    overlayImg.src = overlay;
  }
}

function drawToPrintCanvas() {
  printCtx.clearRect(0, 0, printCanvas.width, printCanvas.height);
  printCtx.drawImage(photoCanvas, 0, 0);
  printCtx.drawImage(photoCanvas, photoCanvas.width, 0);
}

function startCountdown(seconds) {
  return new Promise(resolve => {
    countdownEl.textContent = seconds;
    countdownTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(countdownTimer);
        countdownEl.textContent = '';
        resolve();
      } else {
        countdownEl.textContent = seconds;
      }
    }, 1000);
  });
}

async function takePhotoStrip() {
  status.classList.remove('is-hidden');
  status.textContent = 'Get ready!';
  const images = [];
  for (let i = 0; i < 3; i++) {
    await startCountdown(3);
    flashScreen();
    const image = new Image();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0);
    image.src = tempCanvas.toDataURL('image/jpeg');
    await new Promise(res => (image.onload = res));
    images.push(image);
  }
  drawImageToCanvas(photoCanvas, ctx, images, overlaySelect.value !== 'overlays/none.png' ? overlaySelect.value : null);
  photoCanvas.classList.remove('is-hidden');
  drawToPrintCanvas();
  printBtn.classList.remove('is-hidden');
  uploadAndGenerateQR(photoCanvas);
  status.classList.add('is-hidden');
}

async function takeBoomerang() {
  status.classList.remove('is-hidden');
  status.textContent = 'Recording boomerang...';
  const chunks = [];
  const options = { mimeType: 'video/webm' };
  const recorder = new MediaRecorder(mediaStream, options);
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();
  await new Promise(res => setTimeout(res, 3000));
  recorder.stop();
  await new Promise(res => (recorder.onstop = res));
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'boomerang.webm';
  a.click();
  uploadAndGenerateQR(blob, true);
  status.classList.add('is-hidden');
}

async function uploadAndGenerateQR(source, isVideo = false) {
  const formData = new FormData();
  const timestamp = Date.now();
  const fileName = isVideo ? `boomerang_${timestamp}.webm` : `photo_strip_${timestamp}.png`;
  const blob = isVideo ? source : await new Promise(resolve => {
    photoCanvas.toBlob(resolve, 'image/png');
  });
  formData.append('file', blob, fileName);
  formData.append('upload_preset', 'unsigned_preset');
  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
      showQRModal(data.secure_url);
    }
  } catch (e) {
    console.error('Upload failed', e);
  }
}

function showQRModal(url) {
  qrCodeEl.innerHTML = '';
  new QRCode(qrCodeEl, url);
  qrModal.classList.add('is-active');
  let secondsLeft = 60;
  qrCountdownEl.textContent = `This window will close in ${secondsLeft} seconds.`;
  qrAutoCloseTimer = setInterval(() => {
    secondsLeft--;
    qrCountdownEl.textContent = `This window will close in ${secondsLeft} seconds.`;
    if (secondsLeft <= 0) {
      clearInterval(qrAutoCloseTimer);
      qrModal.classList.remove('is-active');
    }
  }, 1000);
}

closeQRBtn.onclick = () => {
  qrModal.classList.remove('is-active');
  clearInterval(qrAutoCloseTimer);
};

takePhotosBtn.onclick = () => {
  if (modeSelect.value === 'strip') takePhotoStrip();
  else takeBoomerang();
};

printBtn.onclick = () => {
  const a = document.createElement('a');
  a.href = printCanvas.toDataURL('image/png');
  a.download = 'print_2copies.png';
  a.click();
};

modeSelect.onchange = () => {
  overlaySelectContainer.style.display = modeSelect.value === 'boomerang' ? 'none' : '';
};

initCamera();