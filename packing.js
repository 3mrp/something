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
const MIN_SHAPE_SIZE = 5;
const MAX_SHAPE_SIZE = 15;
const SIZE_SCALE_FACTOR = 4.0;
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

// Get bounding box for a shape
function getShapeBounds(shapeType, x, y, size) {
  if (shapeType === 'circle') {
    return {
      minX: x - size,
      maxX: x + size,
      minY: y - size,
      maxY: y + size,
      type: 'circle',
      cx: x, cy: y, r: size
    };
  } else if (shapeType === 'square') {
    return {
      minX: x - size,
      maxX: x + size,
      minY: y - size,
      maxY: y + size,
      type: 'square'
    };
  } else if (shapeType === 'triangle') {
    const height = (Math.sqrt(3) / 2) * size * 2;
    const top = y - height * 0.6;
    const bottom = y + height * 0.4;
    return {
      minX: x - size,
      maxX: x + size,
      minY: top,
      maxY: bottom,
      type: 'triangle',
      cx: x, cy: y, size: size, h: height
    };
  }
}

// Check if a circle is fully inside the container
function isCircleInsideContainer(containerShape, x, y, radius) {
  if (containerShape === 'square') {
    const halfSize = containerSize / 2;
    return x - radius >= centerX - halfSize &&
           x + radius <= centerX + halfSize &&
           y - radius >= centerY - halfSize &&
           y + radius <= centerY + halfSize;
  } else if (containerShape === 'circle') {
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance + radius <= containerSize / 2;
  } else if (containerShape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * containerSize;
    const topY = centerY - height * 0.6;
    const bottomY = centerY + height * 0.4;
    
    // Check multiple points on the circle's perimeter
    const numPoints = 16;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      
      if (!isPointInTriangle(px, py, topY, bottomY)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Check if a square is fully inside the container
function isSquareInsideContainer(containerShape, x, y, size) {
  if (containerShape === 'square') {
    const halfSize = containerSize / 2;
    return x - size >= centerX - halfSize &&
           x + size <= centerX + halfSize &&
           y - size >= centerY - halfSize &&
           y + size <= centerY + halfSize;
  } else if (containerShape === 'circle') {
    // Check all 4 corners
    const corners = [
      {x: x - size, y: y - size},
      {x: x + size, y: y - size},
      {x: x - size, y: y + size},
      {x: x + size, y: y + size}
    ];
    for (const corner of corners) {
      const dist = Math.sqrt((corner.x - centerX) ** 2 + (corner.y - centerY) ** 2);
      if (dist > containerSize / 2) return false;
    }
    return true;
  } else if (containerShape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * containerSize;
    const topY = centerY - height * 0.6;
    const bottomY = centerY + height * 0.4;
    
    // Check all 4 corners
    const corners = [
      {x: x - size, y: y - size},
      {x: x + size, y: y - size},
      {x: x - size, y: y + size},
      {x: x + size, y: y + size}
    ];
    for (const corner of corners) {
      if (!isPointInTriangle(corner.x, corner.y, topY, bottomY)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Check if a triangle is fully inside the container
function isTriangleInsideContainer(containerShape, x, y, size) {
  const height = (Math.sqrt(3) / 2) * size * 2;
  const vertices = [
    {x: x, y: y - height * 0.6},
    {x: x - size, y: y + height * 0.4},
    {x: x + size, y: y + height * 0.4}
  ];
  
  if (containerShape === 'square') {
    const halfSize = containerSize / 2;
    for (const v of vertices) {
      if (v.x < centerX - halfSize || v.x > centerX + halfSize ||
          v.y < centerY - halfSize || v.y > centerY + halfSize) {
        return false;
      }
    }
    return true;
  } else if (containerShape === 'circle') {
    for (const v of vertices) {
      const dist = Math.sqrt((v.x - centerX) ** 2 + (v.y - centerY) ** 2);
      if (dist > containerSize / 2) return false;
    }
    return true;
  } else if (containerShape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * containerSize;
    const topY = centerY - height * 0.6;
    const bottomY = centerY + height * 0.4;
    
    for (const v of vertices) {
      if (!isPointInTriangle(v.x, v.y, topY, bottomY)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Helper: check if point is in triangle container
function isPointInTriangle(px, py, topY, bottomY) {
  if (py < topY || py > bottomY) return false;
  
  const height = bottomY - topY;
  const relY = (py - topY) / height;
  const maxX = (containerSize / 2) * (1 - relY);
  return Math.abs(px - centerX) <= maxX;
}

// Check if a point is inside the container (dispatch to specific functions)
function isInsideContainer(containerShape, x, y, shapeSize, shapeType) {
  if (shapeType === 'circle') {
    return isCircleInsideContainer(containerShape, x, y, shapeSize);
  } else if (shapeType === 'square') {
    return isSquareInsideContainer(containerShape, x, y, shapeSize);
  } else if (shapeType === 'triangle') {
    return isTriangleInsideContainer(containerShape, x, y, shapeSize);
  }
  return false;
}

// Check if two circles overlap
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  return distance < r1 + r2;
}

// Check if circle and square overlap
function circleSquareOverlap(cx, cy, r, sx, sy, ss) {
  // Find closest point on square to circle center
  const closestX = Math.max(sx - ss, Math.min(cx, sx + ss));
  const closestY = Math.max(sy - ss, Math.min(cy, sy + ss));
  
  const distX = cx - closestX;
  const distY = cy - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);
  
  return distance < r;
}

// Check if two squares overlap
function squaresOverlap(x1, y1, s1, x2, y2, s2) {
  return !(x1 + s1 <= x2 - s2 || x1 - s1 >= x2 + s2 ||
           y1 + s1 <= y2 - s2 || y1 - s1 >= y2 + s2);
}

// Check if circle and triangle overlap (conservative check using bounding circle)
function circleTriangleOverlap(cx, cy, r, tx, ty, ts) {
  // Use bounding circle of triangle for simplicity
  const th = (Math.sqrt(3) / 2) * ts * 2;
  const tr = Math.max(ts, th * 0.6); // Approximate radius
  return circlesOverlap(cx, cy, r, tx, ty, tr);
}

// Check if square and triangle overlap (conservative check using bounding boxes)
function squareTriangleOverlap(sx, sy, ss, tx, ty, ts) {
  const th = (Math.sqrt(3) / 2) * ts * 2;
  // Bounding box check
  return !(sx + ss < tx - ts || sx - ss > tx + ts ||
           sy + ss < ty - th * 0.6 || sy - ss > ty + th * 0.4);
}

// Check if two triangles overlap (conservative check using bounding boxes)
function trianglesOverlap(x1, y1, s1, x2, y2, s2) {
  const h1 = (Math.sqrt(3) / 2) * s1 * 2;
  const h2 = (Math.sqrt(3) / 2) * s2 * 2;
  
  return !(x1 + s1 < x2 - s2 || x1 - s1 > x2 + s2 ||
           y1 + h1 * 0.4 < y2 - h2 * 0.6 || y1 - h1 * 0.6 > y2 + h2 * 0.4);
}

// Check if two shapes overlap (dispatch to specific functions)
function shapesOverlap(shapeType, x1, y1, x2, y2, size) {
  if (shapeType === 'circle') {
    return circlesOverlap(x1, y1, size, x2, y2, size);
  } else if (shapeType === 'square') {
    return squaresOverlap(x1, y1, size, x2, y2, size);
  } else if (shapeType === 'triangle') {
    return trianglesOverlap(x1, y1, size, x2, y2, size);
  }
  return false;
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
    if (!isInsideContainer(containerShape, x, y, baseSize, packedShapeType)) {
      continue;
    }
    
    // Check for overlaps with existing shapes
    let overlaps = false;
    for (const shape of packedShapes) {
      if (shapesOverlap(packedShapeType, x, y, shape.x, shape.y, baseSize)) {
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
