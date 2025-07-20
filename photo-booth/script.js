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
  statusMessage.textContent = "Recording...";
  mediaRecorder.start();
  await sleep(3000);

  // ✅ Set onstop *before* stopping
  mediaRecorder.onstop = async () => {
    statusMessage.textContent = "Rendering";

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(blob);

    const videoEl = document.createElement('video');
    videoEl.src = videoURL;
    videoEl.crossOrigin = "anonymous";
    videoEl.muted = true;
    videoEl.playsInline = true;

    videoEl.onerror = (e) => {
      console.error("Video element error:", e);
    };

    videoEl.addEventListener('loadedmetadata', async () => {

      let isPortrait = false;
      if (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined) {
        isPortrait = window.screen.orientation.angle === 0 || window.screen.orientation.angle === 180;
      } else {
        isPortrait = window.innerHeight > window.innerWidth;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (isPortrait) {
        canvas.width = videoEl.videoHeight;
        canvas.height = videoEl.videoWidth;
      } else {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
      }

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
      const frameTimes = [];
      for (let i = 0; i < totalFrames; i++) {
        frameTimes.push(i / frameRate);
      }
      const boomerangTimes = frameTimes.concat([...frameTimes].reverse());

      const captureFrameAt = (t) => {
        return new Promise((resolve) => {
          const seekHandler = () => {
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
            videoEl.removeEventListener('seeked', seekHandler);
            resolve();
          };

          videoEl.addEventListener('seeked', seekHandler);
          videoEl.currentTime = Math.min(t, videoEl.duration - 0.01);
        });
      };

      statusMessage.textContent = "Processing boomerang...";

      for (const t of boomerangTimes) {
        await captureFrameAt(t);
      }

      statusMessage.textContent = "Finalizing...";

      gif.on('finished', function (gifBlob) {
        console.log("done");
        statusMessage.textContent = "Boomerang ready!";
        const url = URL.createObjectURL(gifBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'boomerang.gif';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      });

      gif.render();
    });

    document.body.appendChild(videoEl);
    videoEl.load();
  };

  mediaRecorder.stop(); 
  statusMessage.textContent = "";
}

takePhotosBtn.addEventListener('click', () => {
  if (modeSelect.value === 'strip') {
    takePhotoStrip();
  } else {
    recordBoomerang();
  }
});

printButton.addEventListener('click', printTwoCopies);