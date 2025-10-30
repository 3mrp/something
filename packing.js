// Canvas and context
const canvas = document.getElementById('packingCanvas');
const ctx = canvas.getContext('2d');

// DOM elements
const containerShapeSelect = document.getElementById('containerShape');
const packedShapeSelect = document.getElementById('packedShape');
const shapeCountInput = document.getElementById('shapeCount');
const shapeCountValue = document.getElementById('shapeCountValue');
const packBtn = document.getElementById('packBtn');
const resetBtn = document.getElementById('resetBtn');
const packingEfficiency = document.getElementById('packingEfficiency');
const shapesPlaced = document.getElementById('shapesPlaced');

// Configuration constants
const MIN_SHAPE_SIZE = 8;
const MAX_SHAPE_SIZE = 30;
const SIZE_SCALE_FACTOR = 2.5;
const COLLISION_MARGIN = 2.2;
const ATTEMPTS_PER_SHAPE = 100;

// State
let packedShapes = [];
let containerSize = 500;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

// Update shape count display
shapeCountInput.addEventListener('input', () => {
  shapeCountValue.textContent = shapeCountInput.value;
});

// Draw container shape
function drawContainer(shape) {
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';

  ctx.beginPath();
  if (shape === 'square') {
    const halfSize = containerSize / 2;
    ctx.rect(centerX - halfSize, centerY - halfSize, containerSize, containerSize);
  } else if (shape === 'circle') {
    ctx.arc(centerX, centerY, containerSize / 2, 0, Math.PI * 2);
  } else if (shape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * containerSize;
    ctx.moveTo(centerX, centerY - height * 0.6);
    ctx.lineTo(centerX - containerSize / 2, centerY + height * 0.4);
    ctx.lineTo(centerX + containerSize / 2, centerY + height * 0.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

// Draw a single packed shape
function drawPackedShape(shape, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(x - size, y - size, size * 2, size * 2);
  } else if (shape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * size * 2;
    ctx.moveTo(x, y - height * 0.6);
    ctx.lineTo(x - size, y + height * 0.4);
    ctx.lineTo(x + size, y + height * 0.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

// Check if a point is inside the container
function isInsideContainer(containerShape, x, y, shapeSize) {
  if (containerShape === 'square') {
    const halfSize = containerSize / 2;
    return x - shapeSize >= centerX - halfSize &&
           x + shapeSize <= centerX + halfSize &&
           y - shapeSize >= centerY - halfSize &&
           y + shapeSize <= centerY + halfSize;
  } else if (containerShape === 'circle') {
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance + shapeSize <= containerSize / 2;
  } else if (containerShape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * containerSize;
    const topY = centerY - height * 0.6;
    const bottomY = centerY + height * 0.4;
    
    // Simplified triangle bounds check
    if (y - shapeSize < topY || y + shapeSize > bottomY) return false;
    
    // Check if point is inside triangle with margin
    const relY = (y - topY) / height;
    const maxX = (containerSize / 2) * (1 - relY);
    return Math.abs(x - centerX) + shapeSize <= maxX;
  }
  return false;
}

// Check if two shapes overlap
function shapesOverlap(x1, y1, x2, y2, size) {
  const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  return distance < size * COLLISION_MARGIN;
}

// Generate random color
function randomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B88B', '#B19CD9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Pack shapes using simple random placement with collision detection
function packShapes() {
  const containerShape = containerShapeSelect.value;
  const packedShapeType = packedShapeSelect.value;
  const count = parseInt(shapeCountInput.value);
  
  packedShapes = [];
  
  // Calculate shape size based on count
  const baseSize = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, containerSize / (Math.sqrt(count) * SIZE_SCALE_FACTOR)));
  
  // Try to place each shape
  let attempts = 0;
  const maxAttempts = count * ATTEMPTS_PER_SHAPE;
  
  while (packedShapes.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Generate random position within bounds
    const margin = baseSize * 2;
    const x = centerX - containerSize / 2 + margin + Math.random() * (containerSize - margin * 2);
    const y = centerY - containerSize / 2 + margin + Math.random() * (containerSize - margin * 2);
    
    // Check if position is valid
    if (!isInsideContainer(containerShape, x, y, baseSize)) {
      continue;
    }
    
    // Check for overlaps with existing shapes
    let overlaps = false;
    for (const shape of packedShapes) {
      if (shapesOverlap(x, y, shape.x, shape.y, baseSize)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      packedShapes.push({
        x, y,
        size: baseSize,
        color: randomColor()
      });
    }
  }
  
  // Draw everything
  redraw();
  
  // Update info
  const efficiency = ((packedShapes.length / count) * 100).toFixed(1);
  packingEfficiency.textContent = `Efficiency: ${efficiency}%`;
  shapesPlaced.textContent = `Shapes placed: ${packedShapes.length} / ${count}`;
}

// Redraw the canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw container
  drawContainer(containerShapeSelect.value);
  
  // Draw packed shapes
  const packedShapeType = packedShapeSelect.value;
  for (const shape of packedShapes) {
    drawPackedShape(packedShapeType, shape.x, shape.y, shape.size, shape.color);
  }
}

// Reset canvas
function reset() {
  packedShapes = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawContainer(containerShapeSelect.value);
  packingEfficiency.textContent = 'Efficiency: --';
  shapesPlaced.textContent = 'Shapes placed: 0';
}

// Event listeners
packBtn.addEventListener('click', packShapes);
resetBtn.addEventListener('click', reset);
containerShapeSelect.addEventListener('change', reset);
packedShapeSelect.addEventListener('change', () => {
  if (packedShapes.length > 0) {
    redraw();
  }
});

// Initial draw
drawContainer(containerShapeSelect.value);
