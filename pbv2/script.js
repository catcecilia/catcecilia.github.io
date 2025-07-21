// DOM Elements
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
const qrModal = document.getElementById('qrModal');
const qrCodeElement = document.getElementById('qrCode');
const countdownTimer = document.getElementById('countdownTimer');

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name'; // Replace with your actual cloud name
const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset'; // Replace with your upload preset
const cloudinary = window.cloudinary.Cloudinary.new({ cloud_name: CLOUDINARY_CLOUD_NAME });

// Constants
const STRIP_WIDTH = 600;
const STRIP_HEIGHT = 1800;
const SLOT_HEIGHT = 400;
const PHOTO_COUNT = 3;
const COUNTDOWN_SECONDS = 3;
const BOOMERANG_DURATION = 3000; // 3 seconds

// State variables
let mediaStream;
let mediaRecorder;
let recordedChunks = [];
let modalTimeout;

// Initialize camera
async function initCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 },
        facingMode: 'user' 
      } 
    });
    video.srcObject = mediaStream;
    video.play();
  } catch (err) {
    alert('Camera access is required for the photo booth to work.');
    console.error('Camera error:', err);
  }
}

// Initialize app
initCamera();

// Event listeners
modeSelect.addEventListener('change', () => {
  const isStrip = modeSelect.value === 'strip';
  overlaySelectContainer.style.display = isStrip ? 'block' : 'none';
  printButton.style.display = 'none';
});

takePhotosBtn.addEventListener('click', () => {
  takePhotosBtn.disabled = true;
  if (modeSelect.value === 'strip') {
    takePhotoStrip().finally(() => takePhotosBtn.disabled = false);
  } else {
    recordBoomerang().finally(() => takePhotosBtn.disabled = false);
  }
});

printButton.addEventListener('click', printTwoCopies);

// Utility functions
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

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Cloudinary Upload Function
async function uploadToCloudinary(file, type) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'photo-booth');
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type === 'strip' ? 'image' : 'video'}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// QR Code Functions
async function generateQRCode(url) {
  return new Promise((resolve) => {
    qrCodeElement.innerHTML = '';
    QRCode.toCanvas(qrCodeElement, url, { 
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) {
        console.error('QR code generation failed:', error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function showQRModal(url) {
  const success = await generateQRCode(url);
  if (success) {
    qrModal.classList.add('is-active');
    
    let secondsLeft = 60;
    countdownTimer.textContent = secondsLeft;
    
    const timer = setInterval(() => {
      secondsLeft--;
      countdownTimer.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        clearInterval(timer);
        closeQRModal();
      }
    }, 1000);
    
    modalTimeout = setTimeout(closeQRModal, 60000);
  }
}

function closeQRModal() {
  qrModal.classList.remove('is-active');
  clearTimeout(modalTimeout);
}

// Photo strip functions
async function takePhotoStrip() {
  try {
    statusMessage.textContent = "Get ready!";
    await sleep(1000);
    
    const images = [];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');

    // Capture photos
    for (let i = 0; i < PHOTO_COUNT; i++) {
      statusMessage.textContent = `Photo ${i+1} of ${PHOTO_COUNT}`;
      await countdown(COUNTDOWN_SECONDS);
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      images.push(tempCanvas.toDataURL('image/png'));
    }

    // Load template if not "none"
    let template = null;
    if (overlaySelect.value !== 'overlays/none.png') {
      template = await loadImage(overlaySelect.value);
    }

    // Compose strip
    photoCtx.clearRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);
    
    if (template) {
      photoCtx.drawImage(template, 0, 0, STRIP_WIDTH, STRIP_HEIGHT);
    }

    // Draw photos
    for (let i = 0; i < PHOTO_COUNT; i++) {
      const img = await loadImage(images[i]);
      if (img) {
        photoCtx.drawImage(img, 0, 300 + i * SLOT_HEIGHT, STRIP_WIDTH, SLOT_HEIGHT);
      }
    }

    // Save and share
    await saveAndSharePhotoStrip();
    
  } catch (error) {
    console.error('Photo strip error:', error);
    statusMessage.textContent = "Error creating photo strip";
    setTimeout(() => statusMessage.textContent = "", 3000);
  }
}

async function saveAndSharePhotoStrip() {
  // First save locally
  const dataUrl = photoCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `photo-strip-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Show print button
  printButton.style.display = 'inline-block';

  // Then upload to Cloudinary and generate QR
  try {
    statusMessage.textContent = "Uploading...";
    
    // Convert data URL to blob
    const blob = await (await fetch(dataUrl)).blob();
    
    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(blob, 'strip');
    
    // Generate QR code
    await showQRModal(cloudinaryUrl);
  } catch (error) {
    console.error('Upload failed:', error);
    statusMessage.textContent = "Sharing failed, but image was saved";
    setTimeout(() => statusMessage.textContent = "", 3000);
  }
}

// Boomerang functions
async function recordBoomerang() {
  try {
    statusMessage.textContent = "Get ready!";
    await sleep(1000);
    
    recordedChunks = [];
    const options = { 
      mimeType: 'video/webm;codecs=vp9',
      bitsPerSecond: 2500000 // 2.5 Mbps
    };
    
    mediaRecorder = new MediaRecorder(mediaStream, options);
    mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);

    // Countdown before recording
    await countdown(COUNTDOWN_SECONDS);
    
    // Start recording
    statusMessage.textContent = "Recording...";
    mediaRecorder.start();
    
    // Record for 3 seconds
    await sleep(BOOMERANG_DURATION);
    
    // Stop recording
    mediaRecorder.stop();
    await new Promise(resolve => mediaRecorder.onstop = resolve);
    
    // Process the recorded video
    await processBoomerangVideo();
    
  } catch (error) {
    console.error('Boomerang error:', error);
    statusMessage.textContent = "Error creating boomerang";
    setTimeout(() => statusMessage.textContent = "", 3000);
  }
}

async function processBoomerangVideo() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const videoURL = URL.createObjectURL(blob);

  const videoEl = document.createElement('video');
  videoEl.src = videoURL;
  videoEl.muted = true;
  videoEl.playsInline = true;
  
  // Wait for video to be ready
  await new Promise(resolve => {
    videoEl.onloadedmetadata = resolve;
    videoEl.play().catch(console.error);
  });

  const isPortrait = videoEl.videoHeight > videoEl.videoWidth;
  const canvas = document.createElement('canvas');
  canvas.width = isPortrait ? videoEl.videoHeight : videoEl.videoWidth;
  canvas.height = isPortrait ? videoEl.videoWidth : videoEl.videoHeight;
  const ctx = canvas.getContext('2d');

  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: 'libs/gif.worker.js',
    width: canvas.width,
    height: canvas.height,
    transparent: null,
    dither: false
  });

  // Setup GIF event handlers
  gif.on('error', (err) => {
    console.error("GIF render error", err);
    statusMessage.textContent = "Error creating GIF";
  });

  const duration = videoEl.duration;
  const frameRate = 15;
  const totalFrames = Math.min(Math.floor(duration * frameRate), 45); // Max 45 frames
  const frameTimes = Array.from({ length: totalFrames }, (_, i) => i / frameRate);
  const boomerangTimes = [...frameTimes, ...frameTimes.reverse()];

  statusMessage.textContent = "Processing...";

  // Capture frames
  for (const t of boomerangTimes) {
    await captureFrame(videoEl, ctx, gif, t, duration, isPortrait, frameRate);
  }

  statusMessage.textContent = "Finalizing...";

  // Render GIF
  await new Promise(resolve => {
    gif.on('finished', async (gifBlob) => {
      statusMessage.textContent = "";
      await saveAndShareBoomerang(gifBlob);
      resolve();
    });
    gif.render();
  });
}

async function captureFrame(videoEl, ctx, gif, t, duration, isPortrait, frameRate) {
  return new Promise((resolve) => {
    videoEl.currentTime = Math.min(t, duration - 0.05);
    
    const handleSeeked = () => {
      ctx.save();
      if (isPortrait) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180);
        ctx.drawImage(videoEl, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
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

async function saveAndShareBoomerang(gifBlob) {
  // First save locally
  const url = URL.createObjectURL(gifBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `boomerang-${new Date().toISOString().slice(0, 10)}.gif`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  // Then upload to Cloudinary and generate QR
  try {
    statusMessage.textContent = "Uploading...";
    const cloudinaryUrl = await uploadToCloudinary(gifBlob, 'boomerang');
    await showQRModal(cloudinaryUrl);
  } catch (error) {
    console.error('Upload failed:', error);
    statusMessage.textContent = "Sharing failed, but GIF was saved";
    setTimeout(() => statusMessage.textContent = "", 3000);
  }
}

// Print functions
function printTwoCopies() {
  printCtx.clearRect(0, 0, printCanvas.width, printCanvas.height);
  printCtx.drawImage(photoCanvas, 0, 0);
  printCtx.drawImage(photoCanvas, STRIP_WIDTH, 0);

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Photo Strip Print</title>
      <style>
        body { margin: 0; padding: 0; }
        img { width: 100%; height: auto; }
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0.5cm; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close()">
      <img src="${printCanvas.toDataURL('image/png')}" />
    </body>
    </html>
  `);
  win.document.close();
}

// Close modal when clicking background
qrModal.querySelector('.modal-background').addEventListener('click', closeQRModal);