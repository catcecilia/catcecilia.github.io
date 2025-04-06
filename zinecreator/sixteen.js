// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Interfaces
class Zine {
  constructor(title = '', pages = []) {
    this.title = title;
    this.pages = pages;
  }
}

class Page {
  constructor(type = 'text', content = '', filePath = '') {
    this.type = type;
    this.content = content;
    this.filePath = filePath;
  }
}

// Default pages (16 pages with Front and Back Covers)
const defaultPages = [
  new Page('text', 'Front Cover'),  // Page 1
  new Page('text', 'Page 2'),       // Page 2
  new Page('text', 'Page 3'),       // Page 3
  new Page('text', 'Page 4'),       // Page 4
  new Page('text', 'Page 5'),       // Page 5
  new Page('text', 'Page 6'),       // Page 6
  new Page('text', 'Page 7'),       // Page 7
  new Page('text', 'Page 8'),       // Page 8
  new Page('text', 'Page 9'),       // Page 9
  new Page('text', 'Page 10'),      // Page 10
  new Page('text', 'Page 11'),      // Page 11
  new Page('text', 'Page 12'),      // Page 12
  new Page('text', 'Page 13'),      // Page 13
  new Page('text', 'Page 14'),      // Page 14
  new Page('text', 'Page 15'),      // Page 15
  new Page('text', 'Back Cover')    // Page 16
];

// App State
let currentZine = new Zine('My 16-Page Zine', [...defaultPages]);
let editingPageIndex = null;
let canvasBackup = null;

// DOM Elements
const pagesGrid = document.querySelector('.pages-grid');
const zineTitleInput = document.getElementById('zine-title');
const exportPdfBtn = document.getElementById('export-pdf');
const export16PanelBtn = document.getElementById('export-16panel');
const drawingModal = document.getElementById('drawing-modal');
const closeDrawingModalBtn = document.getElementById('close-drawing-modal');
const drawingCanvas = document.getElementById('drawing-canvas');
const brushColorInput = document.getElementById('brush-color');
const brushSizeInput = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const addImageBtn = document.getElementById('add-image');
const toggleModeBtn = document.getElementById('toggle-mode');
const toggleResizeBtn = document.getElementById('toggle-resize');
const toggleEraserBtn = document.getElementById('toggle-eraser');
const clearCanvasBtn = document.getElementById('clear-canvas');
const saveDrawingBtn = document.getElementById('save-drawing');
const helpModal = document.getElementById('help-modal');
const showHelpBtn = document.getElementById('show-help');
const closeHelpModalBtn = document.getElementById('close-help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');

// Drawing Canvas State
let isDrawing = false;
let isErasing = false;
let brushColor = '#000000';
let brushSize = 5;
let actionType = 'draw';
let placedImage = null;
let resizeHandle = null;
let existingImage = null;
let canvasContext = null;

// Initialize the app
function init() {
  canvasContext = drawingCanvas.getContext('2d');
  renderPages();
  setupEventListeners();
  setupDrawingCanvas();
}

// Render all pages in a 4x4 grid
function renderPages() {
    pagesGrid.innerHTML = '';
    
    currentZine.pages.forEach((page, index) => {
      const pageElement = createPageElement(index);
      pagesGrid.appendChild(pageElement);
    });
    
    setupPageButtonListeners();
  }

function createPageElement(index) {
  const page = currentZine.pages[index];
  const pageElement = document.createElement('div');
  pageElement.className = 'zine-page';
  pageElement.style.margin = '0 10px';
  
  if (page.type === 'image') {
    pageElement.innerHTML = `
      <img src="${page.content}" alt="${getPageName(index)}">
      <div class="zine-page-buttons">
        <button class="page-btn replace-image-btn" data-index="${index}">
          <i class="fas fa-image"></i>
        </button>
        <button class="page-btn draw-btn" data-index="${index}">
          <i class="fas fa-paint-brush"></i>
        </button>
        <button class="page-btn clear-page-btn" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  } else {
    pageElement.innerHTML = `
      <div class="zine-page-text">
        ${page.content ? `<p>${page.content}</p>` : ''}
      </div>
      <div class="zine-page-buttons">
        <button class="page-btn replace-image-btn" data-index="${index}">
          <i class="fas fa-image"></i>
        </button>
        <button class="page-btn draw-btn" data-index="${index}">
          <i class="fas fa-paint-brush"></i>
        </button>
        <button class="page-btn clear-page-btn" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }
  
  return pageElement;
}

function getPageName(index) {
  if (index === 0) return 'Front Cover';
  if (index === 15) return 'Back Cover';
  return `Page ${index + 1}`;
}

function setupPageButtonListeners() {
    showHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
      });
      
      closeHelpModalBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
      });
      
      closeHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
      });
      
      // Close modal when clicking outside content
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.style.display = 'none';
        }
      });
  document.querySelectorAll('.replace-image-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      replaceWithImage(index);
    });
  });
  
  document.querySelectorAll('.draw-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      startDrawing(index);
    });
  });
  
  document.querySelectorAll('.clear-page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      clearPage(index);
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Export buttons
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }
  
  if (export16PanelBtn) {
    export16PanelBtn.addEventListener('click', exportTo16PanelZine);
  }
  
  
  // Drawing modal
  closeDrawingModalBtn.addEventListener('click', () => {
    if (confirm('Discard changes?')) {
      if (canvasBackup) {
        const img = new Image();
        img.onload = () => {
          canvasContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
          canvasContext.drawImage(img, 0, 0);
        };
        img.src = canvasBackup;
      }
      drawingModal.style.display = 'none';
      editingPageIndex = null;
    }
  });
  
  // Brush controls
  brushColorInput.addEventListener('input', (e) => {
    brushColor = e.target.value;
    if (!isErasing) {
      canvasContext.strokeStyle = brushColor;
    }
  });
  
  brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
    canvasContext.lineWidth = brushSize;
  });
  
  // Drawing actions
  addImageBtn.addEventListener('click', handleAddImage);
  toggleModeBtn.addEventListener('click', () => {
    actionType = actionType === 'draw' ? 'move' : 'draw';
    toggleModeBtn.textContent = actionType === 'draw' ? 'Move Mode' : 'Draw Mode';
    updateCanvasCursor();
  });
  toggleResizeBtn.addEventListener('click', () => {
    actionType = actionType === 'resize' ? 'move' : 'resize';
    toggleResizeBtn.textContent = actionType === 'resize' ? 'Move Mode' : 'Resize Mode';
    updateCanvasCursor();
  });
  toggleEraserBtn.addEventListener('click', toggleEraser);
  clearCanvasBtn.addEventListener('click', clearCanvas);
  saveDrawingBtn.addEventListener('click', handleSaveDrawing);
}

// Setup drawing canvas
function setupDrawingCanvas() {
  // Set initial styles
  canvasContext.fillStyle = '#FFFFFF';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';
  canvasContext.lineWidth = brushSize;
  canvasContext.strokeStyle = brushColor;
  
  // Event listeners for drawing
  drawingCanvas.addEventListener('mousedown', startDrawingOnCanvas);
  drawingCanvas.addEventListener('mousemove', drawOnCanvas);
  drawingCanvas.addEventListener('mouseup', stopDrawing);
  drawingCanvas.addEventListener('mouseleave', stopDrawing);
}

function updateCanvasCursor() {
  drawingCanvas.style.cursor = actionType === 'move' ? 'move' : 'crosshair';
}

// Replace page with image
function replaceWithImage(index) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        currentZine.pages[index] = new Page('image', e.target.result);
        renderPages();
      };
      reader.readAsDataURL(files[0]);
    }
  };
  input.click();
}

// Start drawing on a page
function startDrawing(index) {
  editingPageIndex = index;
  const page = currentZine.pages[index];
  
  // Save current canvas state as backup
  canvasBackup = drawingCanvas.toDataURL();
  
  // Initialize canvas with existing image if present
  existingImage = page.type === 'image' ? page.content : undefined;
  initializeCanvas(existingImage);
  
  drawingModal.style.display = 'flex';
}

function initializeCanvas(imgSrc) {
  // Clear canvas
  canvasContext.fillStyle = '#FFFFFF';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  
  // Draw existing image if provided
  if (imgSrc) {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(
        drawingCanvas.width / img.width,
        drawingCanvas.height / img.height
      );
      const width = img.width * ratio;
      const height = img.height * ratio;
      const x = (drawingCanvas.width - width) / 2;
      const y = (drawingCanvas.height - height) / 2;
      canvasContext.drawImage(img, x, y, width, height);
    };
    img.src = imgSrc;
  }
  
  // Reset drawing state
  isDrawing = false;
  isErasing = false;
  brushColor = '#000000';
  brushSize = 5;
  actionType = 'draw';
  resizeHandle = null;
  
  // Update UI to match state
  brushColorInput.value = brushColor;
  brushSizeInput.value = brushSize;
  brushSizeValue.textContent = brushSize;
  toggleModeBtn.textContent = 'Move Mode';
  toggleResizeBtn.textContent = 'Resize Mode';
  toggleEraserBtn.textContent = 'Eraser';
}

function startDrawingOnCanvas(e) {
  const { x, y } = getMousePos(e);
  
  if (placedImage && placedImage.isSelected) {
    const { x: imgX, y: imgY, width, height } = placedImage;
    
    // Check resize handles
    if (actionType === 'resize') {
      if (isInResizeHandle(x, y, imgX, imgY)) {
        resizeHandle = 'top-left';
      } else if (isInResizeHandle(x, y, imgX + width, imgY)) {
        resizeHandle = 'top-right';
      } else if (isInResizeHandle(x, y, imgX, imgY + height)) {
        resizeHandle = 'bottom-left';
      } else if (isInResizeHandle(x, y, imgX + width, imgY + height)) {
        resizeHandle = 'bottom-right';
      } else {
        placedImage.isDragging = true;
      }
    } else {
      // Check if clicking on image
      if (x >= imgX && x <= imgX + width && y >= imgY && y <= imgY + height) {
        placedImage.isDragging = true;
        return;
      } else {
        // Clicked outside image - deselect
        placedImage.isSelected = false;
      }
    }
  }
  
  // Start normal drawing
  if (actionType === 'draw') {
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
    isDrawing = true;
  }
}

function drawOnCanvas(e) {
  const { x, y } = getMousePos(e);
  
  if (placedImage?.isDragging) {
    placedImage.x = x - placedImage.width / 2;
    placedImage.y = y - placedImage.height / 2;
    redrawCanvas();
    return;
  }
  
  if (placedImage?.isSelected && resizeHandle) {
    let newWidth = placedImage.width;
    let newHeight = placedImage.height;
    let newX = placedImage.x;
    let newY = placedImage.y;
    
    switch (resizeHandle) {
      case 'top-left':
        newWidth = placedImage.x + placedImage.width - x;
        newHeight = newWidth / placedImage.aspectRatio;
        newX = x;
        newY = placedImage.y + placedImage.height - newHeight;
        break;
      case 'top-right':
        newWidth = x - placedImage.x;
        newHeight = newWidth / placedImage.aspectRatio;
        newY = placedImage.y + placedImage.height - newHeight;
        break;
      case 'bottom-left':
        newWidth = placedImage.x + placedImage.width - x;
        newHeight = newWidth / placedImage.aspectRatio;
        newX = x;
        break;
      case 'bottom-right':
        newWidth = x - placedImage.x;
        newHeight = newWidth / placedImage.aspectRatio;
        break;
    }
    
    // Minimum size constraint
    if (newWidth < 20 || newHeight < 20) {
      return;
    }
    
    placedImage.x = newX;
    placedImage.y = newY;
    placedImage.width = newWidth;
    placedImage.height = newHeight;
    
    redrawCanvas();
    return;
  }
  
  if (isDrawing && actionType === 'draw') {
    canvasContext.lineTo(x, y);
    canvasContext.stroke();
  }
}

function stopDrawing() {
  isDrawing = false;
  resizeHandle = null;
  if (placedImage) {
    placedImage.isDragging = false;
  }
}

function getMousePos(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function isInResizeHandle(x, y, handleX, handleY) {
  const handleSize = 8;
  return x >= handleX - handleSize && x <= handleX + handleSize &&
         y >= handleY - handleSize && y <= handleY + handleSize;
}

function redrawCanvas() {
  // Create a temporary canvas to preserve drawings
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = drawingCanvas.width;
  tempCanvas.height = drawingCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(drawingCanvas, 0, 0);
  
  // Clear and redraw everything
  canvasContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  canvasContext.fillStyle = '#FFFFFF';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  
  // Draw existing image if present
  if (existingImage) {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(
        drawingCanvas.width / img.width,
        drawingCanvas.height / img.height
      );
      const width = img.width * ratio;
      const height = img.height * ratio;
      const x = (drawingCanvas.width - width) / 2;
      const y = (drawingCanvas.height - height) / 2;
      canvasContext.drawImage(img, x, y, width, height);
      canvasContext.drawImage(tempCanvas, 0, 0);
      
      if (placedImage) {
        drawPlacedImage();
      }
    };
    img.src = existingImage;
  } else {
    canvasContext.drawImage(tempCanvas, 0, 0);
    if (placedImage) {
      drawPlacedImage();
    }
  }
  
  // Set drawing styles
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';
  canvasContext.lineWidth = brushSize;
  canvasContext.strokeStyle = isErasing ? '#FFFFFF' : brushColor;
}

function drawPlacedImage() {
  const { img, x, y, width, height, isSelected } = placedImage;
  canvasContext.drawImage(img, x, y, width, height);
  
  // Draw resize handles if selected and in resize mode
  if (isSelected && actionType === 'resize') {
    const handleSize = 8;
    canvasContext.fillStyle = '#007aff';
    
    // Top-left
    canvasContext.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    // Top-right
    canvasContext.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    canvasContext.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    canvasContext.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
  }
}

function handleAddImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = drawingCanvas.width * 0.5;
          const aspectRatio = img.width / img.height;
          const width = maxWidth;
          const height = width / aspectRatio;
          
          placedImage = {
            img,
            x: (drawingCanvas.width - width) / 2,
            y: (drawingCanvas.height - height) / 2,
            width,
            height,
            isSelected: true,
            isDragging: false,
            isResizing: false,
            aspectRatio
          };
          actionType = 'move';
          redrawCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(files[0]);
    }
  };
  input.click();
}

function toggleEraser() {
  isErasing = !isErasing;
  canvasContext.strokeStyle = isErasing ? '#FFFFFF' : brushColor;
  toggleEraserBtn.textContent = isErasing ? 'Pen' : 'Eraser';
}

function clearCanvas() {
  placedImage = null;
  canvasContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  canvasContext.fillStyle = '#FFFFFF';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  
  if (existingImage) {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(
        drawingCanvas.width / img.width,
        drawingCanvas.height / img.height
      );
      const width = img.width * ratio;
      const height = img.height * ratio;
      const x = (drawingCanvas.width - width) / 2;
      const y = (drawingCanvas.height - height) / 2;
      canvasContext.drawImage(img, x, y, width, height);
    };
    img.src = existingImage;
  }
}

function handleSaveDrawing() {
  const imgData = drawingCanvas.toDataURL('image/png');
  if (editingPageIndex !== null) {
    currentZine.pages[editingPageIndex] = new Page('image', imgData);
    renderPages();
  }
  drawingModal.style.display = 'none';
  editingPageIndex = null;
  canvasBackup = null;
}

function clearPage(index) {
  const defaultContent = defaultPages[index]?.content || getPageName(index);
  currentZine.pages[index] = new Page('text', defaultContent);
  renderPages();
}

function exportToPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - 2 * margin;

  // Process each page
  const processPage = (index) => {
    return new Promise((resolve) => {
      if (index >= currentZine.pages.length) {
        resolve();
        return;
      }

      if (index > 0) {
        doc.addPage();
      }

      const page = currentZine.pages[index];
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      if (page.type === 'image') {
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          let imgWidth = contentWidth;
          let imgHeight = contentWidth / ratio;
          
          if (imgHeight > contentHeight) {
            imgHeight = contentHeight;
            imgWidth = contentHeight * ratio;
          }
          
          const x = margin + (contentWidth - imgWidth) / 2;
          const y = margin + (contentHeight - imgHeight) / 2;
          
          doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
          processPage(index + 1).then(resolve);
        };
        img.onerror = () => {
          doc.text('Image failed to load', margin, margin + 10);
          processPage(index + 1).then(resolve);
        };
        img.src = page.content;
      } else {
        const lines = doc.splitTextToSize(page.content, contentWidth);
        doc.text(lines, margin, margin + 10);
        processPage(index + 1).then(resolve);
      }
    });
  };

  // Start processing pages
  processPage(0).then(() => {
    doc.save(`${currentZine.title || 'zine'}.pdf`);
  });
}

function exportTo16PanelZine() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const panelWidth = pageWidth / 4;
  const panelHeight = pageHeight / 4;

  // Layout for 16-panel zine (1-based indexing)
  const panelLayout = [
    // First row (rotated 180°)
    [15, 14, 13, 12],
    // Second row (normal)
    [16, 1, 10, 11],
    // Third row (rotated 180°)
    [3, 2, 9, 8],
    // Fourth row (normal)
    [4, 5, 6, 7]
  ];

  // Create all page images (1-16)
  const createPageImages = () => {
    return Promise.all(currentZine.pages.map((page, index) => {
      const pageNumber = index + 1; // 1-based
      return new Promise((resolve) => {
        if (page.type === 'image') {
          const img = new Image();
          img.onload = () => resolve({ 
            img: img, 
            pageNumber: pageNumber,
            content: page.content 
          });
          img.onerror = () => resolve(null);
          img.src = page.content;
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(page.content || getPageName(index), canvas.width/2, canvas.height/2);
          }
          const img = new Image();
          img.onload = () => resolve({ 
            img: img, 
            pageNumber: pageNumber,
            content: canvas.toDataURL('image/jpeg') 
          });
          img.src = canvas.toDataURL('image/jpeg');
        }
      });
    }));
  };

  // Process the layout
  createPageImages().then(pageImages => {
    const validPages = pageImages.filter(p => p !== null);
    
    // Draw each panel
    panelLayout.forEach((row, rowIndex) => {
      const isRotatedRow = rowIndex % 2 === 0; // Rotate every other row
      
      row.forEach((targetPageNumber, colIndex) => {
        const x = colIndex * panelWidth;
        const y = rowIndex * panelHeight;
        
        const page = validPages.find(p => p.pageNumber === targetPageNumber);
        if (page) {
          if (isRotatedRow) {
            // Create rotated canvas
            const canvas = document.createElement('canvas');
            canvas.width = page.img.width;
            canvas.height = page.img.height;
            const ctx = canvas.getContext('2d');
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
            ctx.drawImage(page.img, 0, 0);
            doc.addImage(
              canvas.toDataURL('image/jpeg'),
              'JPEG',
              x,
              y,
              panelWidth,
              panelHeight
            );
          } else {
            // Normal orientation
            doc.addImage(
              page.content,
              'JPEG',
              x,
              y,
              panelWidth,
              panelHeight
            );
          }
        } else {
          // Error placeholder
          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, panelWidth, panelHeight, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text(`Page ${targetPageNumber}`, x + 5, y + 15);
        }
      });
    });

    doc.save(`${currentZine.title || 'zine'}-16panel.pdf`);
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);