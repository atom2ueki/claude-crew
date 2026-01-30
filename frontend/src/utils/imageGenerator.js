/**
 * Image Generator for Claude Crew Frontend
 * Browser implementation using native Canvas API
 */

import {
  SCALE,
  calculateCanvasDimensions,
  drawHeader,
  drawFooter,
  drawCards
} from 'claude-crew-shared/card';

// System font stack for browser
const FONT_FAMILY = 'system-ui, -apple-system, sans-serif';

/**
 * Preload avatar images to avoid CORS issues
 * Fetches images as blobs and creates Image objects
 * @param {Array} agents - Array of agent objects
 * @returns {Promise<Map>} - Map of agent name to loaded image
 */
async function preloadAvatars(agents) {
  const map = new Map();

  await Promise.all(agents.map(async (agent) => {
    if (!agent.avatarUrl) return;

    try {
      const res = await fetch(agent.avatarUrl);
      const blob = await res.blob();
      const img = new Image();
      img.src = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      map.set(agent.name, img);
    } catch (err) {
      console.warn(`Failed to load avatar for ${agent.name}:`, err);
    }
  }));

  return map;
}

/**
 * Trigger download of the generated image
 * @param {Blob} blob - The image blob
 * @param {string} filename - The filename for download
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main export function - generates and downloads the crew image
 * @param {Array} agents - Array of agent objects with metadata
 */
export async function generateCrewImage(agents) {
  if (!agents || agents.length === 0) {
    throw new Error('No agents to generate image for');
  }

  // Wait for fonts to be ready
  await document.fonts.ready;

  // Preload all avatars
  const avatarMap = await preloadAvatars(agents);

  // Calculate dimensions
  const { columns, width, height } = calculateCanvasDimensions(agents.length);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;

  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw header
  drawHeader(ctx, canvas.width, SCALE, FONT_FAMILY);

  // Draw cards
  drawCards(ctx, agents, avatarMap, columns, SCALE, FONT_FAMILY);

  // Draw footer
  drawFooter(ctx, canvas.width, canvas.height, SCALE, FONT_FAMILY);

  // Export as PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'claude-crew.png');
        resolve();
      } else {
        reject(new Error('Failed to generate image blob'));
      }
    }, 'image/png');
  });
}
