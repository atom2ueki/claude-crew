/**
 * Image Generator for Claude Crew CLI
 * Node.js implementation using node-canvas
 */

import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import {
  SCALE,
  calculateCanvasDimensions,
  drawHeader,
  drawFooter,
  drawCards
} from 'claude-crew-shared/card';

/**
 * Preload avatar images from URLs
 * Uses node-canvas loadImage which supports HTTP URLs
 * @param {Array} agents - Array of agent objects
 * @returns {Promise<Map>} - Map of agent name to loaded image
 */
async function preloadAvatars(agents) {
  const map = new Map();

  await Promise.all(agents.map(async (agent) => {
    if (!agent.avatarUrl) return;

    try {
      const img = await loadImage(agent.avatarUrl);
      map.set(agent.name, img);
    } catch (err) {
      console.warn(`Failed to load avatar for ${agent.name}:`, err.message);
    }
  }));

  return map;
}

/**
 * Main export function - generates the crew image and saves to file
 *
 * @param {Array} agents - Array of agent objects with metadata
 * @param {string} outputPath - Path to save the PNG file
 */
export async function generateCrewImage(agents, outputPath) {
  if (!agents || agents.length === 0) {
    throw new Error('No agents to generate image for');
  }

  // Preload all avatars
  console.log('  Loading avatars...');
  const avatarMap = await preloadAvatars(agents);

  // Calculate dimensions
  const { columns, width, height } = calculateCanvasDimensions(agents.length);

  // Create canvas
  const canvas = createCanvas(width * SCALE, height * SCALE);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw header
  drawHeader(ctx, canvas.width, SCALE, 'sans-serif');

  // Draw cards
  console.log('  Rendering cards...');
  drawCards(ctx, agents, avatarMap, columns, SCALE, 'sans-serif');

  // Draw footer
  drawFooter(ctx, canvas.width, canvas.height, SCALE, 'sans-serif');

  // Export as PNG
  console.log('  Writing file...');
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
}
