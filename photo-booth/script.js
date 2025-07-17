const video = document.getElementById('video');
const countdownEl = document.getElementById('countdown');
const takePhotosBtn = document.getElementById('takePhotos');
const printButton = document.getElementById('printButton');
const photoCanvas = document.getElementById('photoCanvas');
const printCanvas = document.getElementById('printCanvas');
const overlaySelect = document.getElementById('overlaySelect');
const overlaySelectContainer = document.getElementById('overlaySelectContainer');
const modeSelect = document.getElementById('mode');
const flash = document.getElementById('flash');

const photoCtx = photoCanvas.getContext('2d');
const printCtx = printCanvas.getContext('2d');

const STRIP_WIDTH = 600;
const STRIP_HEIGHT = 1800;
const SLOT_HEIGHT = 400;

let mediaStream;
let mediaRecorder;
let recordedChunks = [];

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  mediaStream = stream;
  video.srcObject = stream;
}).catch(err => alert('Camera access is required.'));

modeSelect.addEventListener('change', () => {
  const isStrip = modeSelect.value === 'strip';
  overlaySelectContainer.style.display = isStrip ? 'block' : 'none';
  printButton.style.display = 'none';
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    countdownEl.textContent = i;
    await sleep(1000);
  }
  countdownEl.textContent = '';
  flashScreen();
}

function flashScreen() {
  flash.style.opacity = 1;
  setTimeout(() => flash.style.opacity = 0, 150);
}

async function takePhotoStrip() {
  const images = [];
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');

  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;

  for (let i = 0; i < 3; i++) {
    await countdown(3);
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const img = new Image();
    img.src = tempCanvas.toDataURL('image/png');
    await new Promise(r => img.onload = r);
    images.push(img);
  }

  const template = new Image();
  template.src = overlaySelect.value;
  await new Promise(r => template.onload = r);

  photoCtx.clearRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  photoCtx.drawImage(template, 0, 0, STRIP_WIDTH, STRIP_HEIGHT);

  for (let i = 0; i < 3; i++) {
    photoCtx.drawImage(images[i], 0, 300 + i * SLOT_HEIGHT, STRIP_WIDTH, SLOT_HEIGHT);
  }

  const link = document.createElement('a');
  link.href = photoCanvas.toDataURL('image/png');
  link.download = 'photo-strip.png';
  link.click();

  printButton.style.display = 'inline-block';
}

function printTwoCopies() {
  printCtx.clearRect(0, 0, 1200, 1800);
  printCtx.drawImage(photoCanvas, 0, 0);
  printCtx.drawImage(photoCanvas, 600, 0);

  const win = window.open();
  const img = new Image();
  img.src = printCanvas.toDataURL('image/png');
  img.onload = () => {
    win.document.write(`<img src="${img.src}" style="width:100%;height:auto;">`);
    win.document.close();
    win.focus();
    win.print();
  };
}

async function recordBoomerang() {
  recordedChunks = [];
  const options = { mimeType: 'video/webm' };
  mediaRecorder = new MediaRecorder(mediaStream, options);

  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);

  await countdown(3);
  mediaRecorder.start();

  await sleep(3000);
  mediaRecorder.stop();

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const fileURL = URL.createObjectURL(blob);

    const videoEl = document.createElement('video');
    videoEl.src = fileURL;
    videoEl.loop = true;
    videoEl.autoplay = true;
    videoEl.style.maxWidth = '300px';
    document.body.appendChild(videoEl);

    const a = document.createElement('a');
    a.href = fileURL;
    a.download = 'boomerang.webm';
    a.textContent = 'Download Boomerang';
    document.body.appendChild(a);
  };
}

takePhotosBtn.addEventListener('click', () => {
  if (modeSelect.value === 'strip') {
    takePhotoStrip();
  } else {
    recordBoomerang();
  }
});

printButton.addEventListener('click', printTwoCopies);