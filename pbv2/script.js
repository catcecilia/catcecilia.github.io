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
const statusMessage = document.getElementById('status');
const qrContainer = document.getElementById('qrCodeContainer');
const photoCtx = photoCanvas.getContext('2d');
const printCtx = printCanvas.getContext('2d');

const STRIP_WIDTH = 600;
const STRIP_HEIGHT = 1800;
const SLOT_HEIGHT = 400;

let mediaStream;
let mediaRecorder;
let recordedChunks = [];

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/auto/upload";
const UPLOAD_PRESET = "YOUR_UNSIGNED_UPLOAD_PRESET";

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  mediaStream = stream;
  video.srcObject = stream;
}).catch(err => alert('Camera access is required.'));

modeSelect.addEventListener('change', () => {
  const isStrip = modeSelect.value === 'strip';
  overlaySelectContainer.style.display = isStrip ? 'block' : 'none';
  printButton.style.display = 'none';
  qrContainer.innerHTML = '';
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

async function uploadToCloudinary(blob, filename) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', filename);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  } catch (e) {
    console.error("Cloudinary upload failed", e);
    return null;
  }
}

function generateQR(link) {
  qrContainer.innerHTML = '';
  const img = new Image();
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`;
  qrContainer.appendChild(img);
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

  const blob = await new Promise(resolve => photoCanvas.toBlob(resolve, 'image/png'));
  const cloudUrl = await uploadToCloudinary(blob, 'photo-strip');

  if (cloudUrl) {
    generateQR(cloudUrl);
  }

  // fallback + default
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
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
  statusMessage.textContent = "Recording...";
  mediaRecorder.start();
  await sleep(3000);
  mediaRecorder.stop();

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(blob);

    const videoEl = document.createElement('video');
    videoEl.src = videoURL;
    videoEl.crossOrigin = "anonymous";
    videoEl.muted = true;
    videoEl.playsInline = true;
    document.body.appendChild(videoEl);
    await videoEl.play();
    await sleep(100);

    const isPortrait = window.innerHeight > window.innerWidth;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = isPortrait ? videoEl.videoHeight : videoEl.videoWidth;
    canvas.height = isPortrait ? videoEl.videoWidth : videoEl.videoHeight;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: 'libs/gif.worker.js',
      width: canvas.width,
      height: canvas.height
    });

    const duration = videoEl.duration;
    const frameRate = 15;
    const totalFrames = Math.floor(duration * frameRate);
    const frameTimes = Array.from({ length: totalFrames }, (_, i) => i / frameRate);
    const boomerangTimes = frameTimes.concat([...frameTimes].reverse());

    statusMessage.textContent = "Processing boomerang...";

    for (const t of boomerangTimes) {
      await new Promise((resolve) => {
        videoEl.currentTime = Math.min(t, duration - 0.05);
        const handleSeeked = () => {
          ctx.save();
          if (isPortrait) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(90 * Math.PI / 180);
            ctx.drawImage(
              videoEl,
              -canvas.height / 2,
              -canvas.width / 2,
              canvas.height,
              canvas.width
            );
          } else {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          }
          ctx.restore();
          gif.addFrame(ctx, { copy: true, delay: 1000 / frameRate });
          videoEl.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        videoEl.addEventListener('seeked', handleSeeked);
      });
    }

    gif.on('finished', async function (gifBlob) {
      statusMessage.textContent = "";
      const cloudUrl = await uploadToCloudinary(gifBlob, 'boomerang');

      if (cloudUrl) {
        generateQR(cloudUrl);
      }

      // fallback + default
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boomerang.gif';
      a.click();
    });

    gif.render();
  };
}

takePhotosBtn.addEventListener('click', () => {
  qrContainer.innerHTML = '';
  if (modeSelect.value === 'strip') {
    takePhotoStrip();
  } else {
    recordBoomerang();
  }
});

printButton.addEventListener('click', printTwoCopies);