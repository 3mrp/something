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
const MAX_SHAPE_SIZE = 30;
const SIZE_SCALE_FACTOR = 2.5;
const COLLISION_MARGIN = 1.1;
const ATTEMPTS_PER_SHAPE = 150;

// State
let packedShapes = [];
let containerSize = 280;
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
    // Triangle pointing down
    ctx.moveTo(centerX, centerY + height * 0.6);
    ctx.lineTo(centerX - containerSize / 2, centerY - height * 0.4);
    ctx.lineTo(centerX + containerSize / 2, centerY - height * 0.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

// Draw a single packed shape
function drawPackedShape(shape, x, y, size, color, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.fillStyle = color;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, size, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(-size, -size, size * 2, size * 2);
  } else if (shape === 'triangle') {
    const height = (Math.sqrt(3) / 2) * size * 2;
    // Triangle pointing down
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(-size, -height * 0.4);
    ctx.lineTo(size, -height * 0.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Get bounding box for a shape (with rotation support)
function getShapeBounds(shapeType, x, y, size, rotation = 0) {
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
    // For rotated squares, use conservative bounding circle
    const diagonal = size * Math.sqrt(2);
    return {
      minX: x - diagonal,
      maxX: x + diagonal,
      minY: y - diagonal,
      maxY: y + diagonal,
      type: 'square',
      cx: x, cy: y, size: size, rotation: rotation
    };
  } else if (shapeType === 'triangle') {
    const height = (Math.sqrt(3) / 2) * size * 2;
    // Get rotated vertices
    const vertices = getTriangleVertices(x, y, size, rotation);
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      type: 'triangle',
      cx: x, cy: y, size: size, h: height, rotation: rotation
    };
  }
}

// Get triangle vertices accounting for rotation
function getTriangleVertices(x, y, size, rotation = 0) {
  const height = (Math.sqrt(3) / 2) * size * 2;
  // Base vertices (pointing down)
  const baseVertices = [
    {x: 0, y: height * 0.6},
    {x: -size, y: -height * 0.4},
    {x: size, y: -height * 0.4}
  ];
  
  // Apply rotation and translation
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return baseVertices.map(v => ({
    x: x + v.x * cos - v.y * sin,
    y: y + v.x * sin + v.y * cos
  }));
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
function isTriangleInsideContainer(containerShape, x, y, size, rotation = 0) {
  const vertices = getTriangleVertices(x, y, size, rotation);
  
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
    const topY = centerY - height * 0.4;
    const bottomY = centerY + height * 0.6;
    
    for (const v of vertices) {
      if (!isPointInTriangle(v.x, v.y, topY, bottomY)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Helper: check if point is in triangle container (pointing down)
function isPointInTriangle(px, py, topY, bottomY) {
  if (py < topY || py > bottomY) return false;
  
  const height = bottomY - topY;
  const relY = (py - topY) / height;
  // For downward pointing triangle, width increases as we go down
  const maxX = (containerSize / 2) * relY;
  return Math.abs(px - centerX) <= maxX;
}

// Check if a point is inside the container (dispatch to specific functions)
function isInsideContainer(containerShape, x, y, shapeSize, shapeType, rotation = 0) {
  if (shapeType === 'circle') {
    return isCircleInsideContainer(containerShape, x, y, shapeSize);
  } else if (shapeType === 'square') {
    return isSquareInsideContainer(containerShape, x, y, shapeSize);
  } else if (shapeType === 'triangle') {
    return isTriangleInsideContainer(containerShape, x, y, shapeSize, rotation);
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

// Check if two shapes overlap (dispatch to specific functions, accounting for rotation)
function shapesOverlap(shapeType, x1, y1, r1, x2, y2, r2, size) {
  if (shapeType === 'circle') {
    return circlesOverlap(x1, y1, size, x2, y2, size);
  } else if (shapeType === 'square') {
    // Use conservative bounding circle check for rotated squares
    const diagonal = size * Math.sqrt(2);
    return circlesOverlap(x1, y1, diagonal * 0.7, x2, y2, diagonal * 0.7);
  } else if (shapeType === 'triangle') {
    // Use conservative bounding circle check for rotated triangles
    const height = (Math.sqrt(3) / 2) * size * 2;
    const radius = Math.max(size, height * 0.6);
    return circlesOverlap(x1, y1, radius, x2, y2, radius);
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

// Pack shapes using grid-based placement with random jitter and rotation
function packShapes() {
  const containerShape = containerShapeSelect.value;
  const packedShapeType = packedShapeSelect.value;
  const count = parseInt(shapeCountInput.value);
  
  packedShapes = [];
  
  // Calculate shape size based on count with better scaling
  const baseSize = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, containerSize / (Math.sqrt(count) * SIZE_SCALE_FACTOR)));
  
  // Use grid-based approach for better packing
  const gridSize = Math.ceil(Math.sqrt(count)) * 2;
  const cellSize = containerSize / gridSize;
  
  // Track attempts
  let totalAttempts = 0;
  const maxTotalAttempts = count * ATTEMPTS_PER_SHAPE;
  
  // First pass: grid-based placement with jitter
  for (let row = 0; row < gridSize && packedShapes.length < count && totalAttempts < maxTotalAttempts; row++) {
    for (let col = 0; col < gridSize && packedShapes.length < count && totalAttempts < maxTotalAttempts; col++) {
      totalAttempts++;
      
      // Calculate grid position with random jitter
      const gridX = centerX - containerSize / 2 + (col + 0.5) * cellSize;
      const gridY = centerY - containerSize / 2 + (row + 0.5) * cellSize;
      const jitterX = (Math.random() - 0.5) * cellSize * 0.5;
      const jitterY = (Math.random() - 0.5) * cellSize * 0.5;
      const x = gridX + jitterX;
      const y = gridY + jitterY;
      
      // Try random rotation for non-circle shapes
      let rotation = 0;
      if (packedShapeType === 'square') {
        rotation = Math.random() * Math.PI / 2; // 0 to 90 degrees
      } else if (packedShapeType === 'triangle') {
        rotation = Math.random() * Math.PI * 2 / 3; // 0, 120, or 240 degrees
      }
      
      // Check if position is valid
      if (!isInsideContainer(containerShape, x, y, baseSize, packedShapeType, rotation)) {
        continue;
      }
      
      // Check for overlaps with existing shapes
      let overlaps = false;
      for (const shape of packedShapes) {
        if (shapesOverlap(packedShapeType, x, y, rotation, shape.x, shape.y, shape.rotation, baseSize)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        packedShapes.push({
          x, y,
          size: baseSize,
          rotation: rotation,
          color: randomColor()
        });
      }
    }
  }
  
  // Second pass: random placement for remaining shapes
  while (packedShapes.length < count && totalAttempts < maxTotalAttempts) {
    totalAttempts++;
    
    // Generate random position within bounds with better margins
    const margin = baseSize * 1.5;
    const x = centerX - containerSize / 2 + margin + Math.random() * (containerSize - margin * 2);
    const y = centerY - containerSize / 2 + margin + Math.random() * (containerSize - margin * 2);
    
    // Try random rotation
    let rotation = 0;
    if (packedShapeType === 'square') {
      rotation = Math.random() * Math.PI / 2;
    } else if (packedShapeType === 'triangle') {
      rotation = Math.random() * Math.PI * 2 / 3;
    }
    
    // Check if position is valid
    if (!isInsideContainer(containerShape, x, y, baseSize, packedShapeType, rotation)) {
      continue;
    }
    
    // Check for overlaps with existing shapes
    let overlaps = false;
    for (const shape of packedShapes) {
      if (shapesOverlap(packedShapeType, x, y, rotation, shape.x, shape.y, shape.rotation, baseSize)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      packedShapes.push({
        x, y,
        size: baseSize,
        rotation: rotation,
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
    drawPackedShape(packedShapeType, shape.x, shape.y, shape.size, shape.color, shape.rotation || 0);
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
