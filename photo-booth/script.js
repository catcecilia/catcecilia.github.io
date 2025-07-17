const video = document.getElementById('video');
const countdownEl = document.getElementById('countdown');
const flash = document.getElementById('flash');
const photoCanvas = document.getElementById('photoCanvas');
const printCanvas = document.getElementById('printCanvas');
const overlaySelect = document.getElementById('overlaySelect');
const modeSelect = document.getElementById('modeSelect');
const downloadLink = document.getElementById('downloadLink');
const startBtn = document.getElementById('startBtn');
const printBtn = document.getElementById('printBtn');

let mediaStream = null;
let mode = 'strip';

// Access camera
async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = mediaStream;
  } catch (e) {
    alert('Camera access denied.');
    console.error(e);
  }
}

// Flash effect
function doFlash() {
  flash.style.opacity = 1;
  setTimeout(() => flash.style.opacity = 0, 100);
}

// Countdown timer
function countdown(seconds) {
  return new Promise((resolve) => {
    let counter = seconds;
    countdownEl.textContent = counter;
    const interval = setInterval(() => {
      counter--;
      if (counter <= 0) {
        clearInterval(interval);
        countdownEl.textContent = '';
        resolve();
      } else {
        countdownEl.textContent = counter;
      }
    }, 1000);
  });
}

// Capture still frame from video
function captureFrame() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  return tempCanvas;
}

// Compose 3-photo strip
async function takePhotoStrip() {
  const width = 600, height = 1800;
  const ctx = photoCanvas.getContext('2d');
  photoCanvas.width = width;
  photoCanvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const overlay = new Image();
  overlay.src = overlaySelect.value;

  const photos = [];

  for (let i = 0; i < 3; i++) {
    await countdown(3);
    doFlash();
    const frame = captureFrame();
    photos.push(frame);
  }

  // Draw white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw photos
  const photoH = 540;
  photos.forEach((photo, i) => {
    ctx.drawImage(photo, 30, i * (photoH + 60) + 60, 540, photoH);
  });

  overlay.onload = () => {
    ctx.drawImage(overlay, 0, 0, width, height);

    // Auto-save
    const dataURL = photoCanvas.toDataURL('image/png');
    downloadLink.href = dataURL;
    downloadLink.download = 'photo-strip.png';
    downloadLink.click();

    // Prepare for printing
    const printCtx = printCanvas.getContext('2d');
    printCtx.clearRect(0, 0, 1200, 1800);
    printCtx.fillStyle = 'white';
    printCtx.fillRect(0, 0, 1200, 1800);
    printCtx.drawImage(photoCanvas, 0, 0);
    printCtx.drawImage(photoCanvas, 600, 0);

    printBtn.style.display = 'inline-block';
  };
}

// Record Boomerang as GIF
async function takeBoomerang() {
  await countdown(3);
  doFlash();

  const recorderCanvas = document.createElement('canvas');
  recorderCanvas.width = video.videoWidth;
  recorderCanvas.height = video.videoHeight;
  const ctx = recorderCanvas.getContext('2d');

  const frames = [];
  const duration = 3000; // ms
  const fps = 10;
  const totalFrames = (duration / 1000) * fps;

  const interval = 1000 / fps;

  for (let i = 0; i < totalFrames; i++) {
    ctx.drawImage(video, 0, 0, recorderCanvas.width, recorderCanvas.height);
    frames.push(ctx.getImageData(0, 0, recorderCanvas.width, recorderCanvas.height));
    await new Promise(res => setTimeout(res, interval));
  }

  // Create GIF
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: recorderCanvas.width,
    height: recorderCanvas.height
  });

  [...frames, ...frames.reverse()].forEach(frameData => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = recorderCanvas.width;
    tempCanvas.height = recorderCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(frameData, 0, 0);
    gif.addFrame(tempCtx, { copy: true, delay: interval });
  });

  gif.on('finished', blob => {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = 'boomerang.gif';
    downloadLink.click();
  });

  gif.render();
}

// Handle Start
startBtn.addEventListener('click', () => {
  mode = modeSelect.value;
  if (mode === 'strip') {
    takePhotoStrip();
  } else {
    takeBoomerang();
  }
});

// Print two-up layout
printBtn.addEventListener('click', () => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Print</title></head><body style="margin:0">
    <img src="${printCanvas.toDataURL('image/png')}" style="width:100%">
    <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
    </body></html>
  `);
});

startCamera();