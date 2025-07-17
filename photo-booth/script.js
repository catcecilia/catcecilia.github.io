const video = document.getElementById('video');
const countdownEl = document.getElementById('countdown');
const captureBtn = document.getElementById('capture-btn');
const modeSelect = document.getElementById('mode');
const overlaySelect = document.getElementById('overlay');
const flash = document.getElementById('flash');

let mediaStream;
let mediaRecorder;
let recordedChunks = [];

async function initCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 960 }
      },
      audio: false
    });
    video.srcObject = mediaStream;
    await video.play();
  } catch (e) {
    alert("Unable to access camera.");
    console.error(e);
  }
}

function triggerFlash() {
  flash.classList.add('flash');
  setTimeout(() => flash.classList.remove('flash'), 150);
}

function countdown(seconds = 3) {
  return new Promise(resolve => {
    let count = seconds;
    countdownEl.style.display = 'block';
    countdownEl.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        countdownEl.textContent = '';
        countdownEl.style.display = 'none';
        resolve();
      } else {
        countdownEl.textContent = count;
      }
    }, 1000);
  });
}

function captureImageFromVideo() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas;
}

async function capturePhotoStrip(overlayUrl) {
  const stripCanvas = document.createElement('canvas');
  const stripWidth = 600;
  const stripHeight = 1800;

  stripCanvas.width = stripWidth;
  stripCanvas.height = stripHeight;
  const stripCtx = stripCanvas.getContext('2d');

  const headerHeight = 200;
  const footerHeight = 200;
  const photoHeight = (stripHeight - headerHeight - footerHeight) / 3;

  // Optional overlay image
  let overlayImg = null;
  if (overlayUrl && overlayUrl !== 'none') {
    overlayImg = new Image();
    overlayImg.src = overlayUrl;
    await new Promise(res => overlayImg.onload = res);
  }

  for (let i = 0; i < 3; i++) {
    await countdown();
    triggerFlash();
    const canvas = captureImageFromVideo();

    // Resize image to strip format
    const resized = document.createElement('canvas');
    resized.width = stripWidth;
    resized.height = photoHeight;
    const resizedCtx = resized.getContext('2d');
    resizedCtx.drawImage(canvas, 0, 0, resized.width, resized.height);

    if (overlayImg) {
      resizedCtx.drawImage(overlayImg, 0, 0, resized.width, resized.height);
    }

    stripCtx.drawImage(resized, 0, headerHeight + i * photoHeight);
  }

  // Save automatically
  const a = document.createElement('a');
  a.href = stripCanvas.toDataURL('image/png');
  a.download = 'photo-strip.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function recordBoomerangGif() {
  recordedChunks = [];

  await countdown();
  triggerFlash();

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
  mediaRecorder.onstop = () => processBoomerangGIF();
  mediaRecorder.start();

  setTimeout(() => {
    mediaRecorder.stop();
  }, 3000); // Record 3s
}

function processBoomerangGIF() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const videoURL = URL.createObjectURL(blob);

  const videoEl = document.createElement('video');
  videoEl.src = videoURL;
  videoEl.crossOrigin = "anonymous";
  videoEl.muted = true;
  videoEl.playsInline = true;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const FRAME_INTERVAL = 0.1;
  const DURATION = 3;

  videoEl.onloadedmetadata = async () => {
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: 'libs/gif.worker.js'
    });

    const captureFrames = async () => {
      for (let t = 0; t < DURATION; t += FRAME_INTERVAL) {
        videoEl.currentTime = t;
        await new Promise(r => videoEl.onseeked = r);
        ctx.drawImage(videoEl, 0, 0);
        gif.addFrame(ctx, { copy: true, delay: 100 });
      }

      for (let t = DURATION - FRAME_INTERVAL; t >= 0; t -= FRAME_INTERVAL) {
        videoEl.currentTime = t;
        await new Promise(r => videoEl.onseeked = r);
        ctx.drawImage(videoEl, 0, 0);
        gif.addFrame(ctx, { copy: true, delay: 100 });
      }

      gif.on('finished', function(blob) {
        const save = confirm("Boomerang GIF ready! Would you like to save it?");
        if (save) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'boomerang.gif';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(videoURL);
      });

      gif.render();
    };

    await captureFrames();
  };

  videoEl.play();
}

captureBtn.addEventListener('click', () => {
  const mode = modeSelect.value;
  const overlay = overlaySelect.value;

  if (mode === 'strip') {
    capturePhotoStrip(overlay === 'none' ? null : overlay);
  } else if (mode === 'boomerang') {
    recordBoomerangGif();
  }
});

window.addEventListener('load', initCamera);