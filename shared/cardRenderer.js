/**
 * Card Renderer
 * Platform-agnostic card drawing logic for agent crew images
 * Works with both node-canvas (CLI) and browser Canvas API (frontend)
 */

// Constants for card and layout dimensions
export const CARD_WIDTH = 280;
export const CARD_HEIGHT = 420;
export const CARD_GAP = 30;
export const PADDING = 60;
export const HEADER_HEIGHT = 120;
export const FOOTER_HEIGHT = 50;
export const SCALE = 2; // 2x for retina quality

// Card styling constants
export const CARD_RADIUS = 24;
export const CARD_HOLE_WIDTH = 80;
export const CARD_HOLE_HEIGHT = 12;
export const PILL_HEIGHT = 36;
export const PILL_RADIUS = 8;
export const AVATAR_SIZE = 200;

/**
 * Calculate optimal columns to make grid as square as possible
 * @param {number} count - Number of agents
 * @returns {number} - Optimal column count
 */
export function calculateOptimalColumns(count) {
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 3) return 3;
  if (count <= 4) return 2;  // 2x2
  if (count <= 6) return 3;  // 3x2
  if (count <= 9) return 3;  // 3x3
  if (count <= 12) return 4; // 4x3
  if (count <= 16) return 4; // 4x4
  if (count <= 20) return 5; // 5x4
  return Math.ceil(Math.sqrt(count * (CARD_HEIGHT / CARD_WIDTH)));
}

/**
 * Calculate canvas dimensions based on agent count
 * @param {number} count - Number of agents
 * @returns {{ columns: number, rows: number, width: number, height: number }}
 */
export function calculateCanvasDimensions(count) {
  const columns = calculateOptimalColumns(count);
  const rows = Math.ceil(count / columns);

  const gridWidth = columns * CARD_WIDTH + (columns - 1) * CARD_GAP;
  const gridHeight = rows * CARD_HEIGHT + (rows - 1) * CARD_GAP;

  return {
    columns,
    rows,
    width: gridWidth + PADDING * 2,
    height: gridHeight + PADDING * 2 + HEADER_HEIGHT + FOOTER_HEIGHT
  };
}

/**
 * Draw rounded rectangle helper
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} radius - Corner radius
 */
export function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw the header with "Claude Crew" branding
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} width - Canvas width
 * @param {number} scale - Scale factor
 * @param {string} fontFamily - Font family to use (default: sans-serif)
 */
export function drawHeader(ctx, width, scale, fontFamily = 'sans-serif') {
  const centerX = width / 2;

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${32 * scale}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('Claude Crew', centerX, PADDING * scale + 50 * scale);

  // Subtitle
  ctx.fillStyle = '#888888';
  ctx.font = `${16 * scale}px ${fontFamily}`;
  ctx.fillText('Your personalized AI squad', centerX, PADDING * scale + 80 * scale);
}

/**
 * Draw the footer with "Made with Claude Crew"
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} scale - Scale factor
 * @param {string} fontFamily - Font family to use (default: sans-serif)
 */
export function drawFooter(ctx, width, height, scale, fontFamily = 'sans-serif') {
  const centerX = width / 2;
  const footerY = height - PADDING * scale - 10 * scale;

  ctx.fillStyle = '#666666';
  ctx.font = `${14 * scale}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('Made with Claude Crew', centerX, footerY);
}

/**
 * Draw a single agent card
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {object} agent - Agent object with name, displayName, scope, tagline
 * @param {number} x - X position (unscaled)
 * @param {number} y - Y position (unscaled)
 * @param {Image|null} avatarImage - Preloaded avatar image or null
 * @param {number} scale - Scale factor
 * @param {string} fontFamily - Font family to use (default: sans-serif)
 */
export function drawCard(ctx, agent, x, y, avatarImage, scale, fontFamily = 'sans-serif') {
  const cardX = x * scale;
  const cardY = y * scale;
  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;
  const radius = CARD_RADIUS * scale;

  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 40 * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20 * scale;

  // Card background
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius);
  ctx.fill();
  ctx.restore();

  // Card hole at top
  const holeWidth = CARD_HOLE_WIDTH * scale;
  const holeHeight = CARD_HOLE_HEIGHT * scale;
  const holeX = cardX + (cardWidth - holeWidth) / 2;
  const holeY = cardY + 12 * scale;

  ctx.fillStyle = '#1c1c1c';
  roundRect(ctx, holeX, holeY, holeWidth, holeHeight, holeHeight / 2);
  ctx.fill();

  // Black name pill
  const pillMarginX = 20 * scale;
  const pillMarginTop = 40 * scale;
  const pillWidth = cardWidth - pillMarginX * 2;
  const pillHeight = PILL_HEIGHT * scale;
  const pillX = cardX + pillMarginX;
  const pillY = cardY + pillMarginTop;

  ctx.fillStyle = '#000000';
  roundRect(ctx, pillX, pillY, pillWidth, pillHeight, PILL_RADIUS * scale);
  ctx.fill();

  // Name in pill
  const displayName = agent.displayName || agent.name;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${14 * scale}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText(displayName, pillX + 16 * scale, pillY + pillHeight / 2 + 5 * scale);

  // Scope badge if project-level
  if (agent.scope === 'project') {
    const badgeText = 'project';
    ctx.font = `500 ${10 * scale}px ${fontFamily}`;
    const badgeWidth = ctx.measureText(badgeText).width + 16 * scale;
    const badgeX = pillX + pillWidth - badgeWidth - 8 * scale;
    const badgeY = pillY + (pillHeight - 18 * scale) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    roundRect(ctx, badgeX, badgeY, badgeWidth, 18 * scale, 8 * scale);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 13 * scale);
  }

  // Avatar
  const avatarSize = AVATAR_SIZE * scale;
  const avatarX = cardX + (cardWidth - avatarSize) / 2;
  const avatarY = pillY + pillHeight + 30 * scale;

  if (avatarImage) {
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    // Placeholder circle if no avatar
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Agent name (role title) - positioned at bottom of card
  const nameY = cardY + cardHeight - 70 * scale;
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${18 * scale}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(agent.name, cardX + cardWidth / 2, nameY);

  // Tagline - positioned below name, near bottom of card
  if (agent.tagline) {
    const taglineY = nameY + 22 * scale;
    ctx.fillStyle = '#888888';
    ctx.font = `italic ${13 * scale}px ${fontFamily}`;
    ctx.textAlign = 'center';

    // Wrap tagline if too long
    const maxWidth = cardWidth - 40 * scale;
    const words = agent.tagline.split(' ');
    let line = '';
    let lineY = taglineY;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), cardX + cardWidth / 2, lineY);
        line = words[i] + ' ';
        lineY += 18 * scale;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), cardX + cardWidth / 2, lineY);
  }
}

/**
 * Draw all cards on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} agents - Array of agent objects
 * @param {Map} avatarMap - Map of agent name to preloaded avatar image
 * @param {number} columns - Number of columns in grid
 * @param {number} scale - Scale factor
 * @param {string} fontFamily - Font family to use (default: sans-serif)
 */
export function drawCards(ctx, agents, avatarMap, columns, scale, fontFamily = 'sans-serif') {
  const gridStartX = PADDING;
  const gridStartY = PADDING + HEADER_HEIGHT;

  agents.forEach((agent, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const cardX = gridStartX + col * (CARD_WIDTH + CARD_GAP);
    const cardY = gridStartY + row * (CARD_HEIGHT + CARD_GAP);

    const avatarImage = avatarMap.get(agent.name);
    drawCard(ctx, agent, cardX, cardY, avatarImage, scale, fontFamily);
  });
}
