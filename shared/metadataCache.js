/**
 * Shared Metadata Cache
 * Provides access to pre-generated agent metadata for both CLI and backend
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store data in shared/data directory
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'agent-metadata.json');

// In-memory cache for performance
let metadataCache = null;

/**
 * Load all agent metadata from the cache file
 * @returns {Promise<object>} - Map of agent names to their metadata
 */
export async function loadAllMetadata() {
  // Return cached data if available
  if (metadataCache !== null) {
    return metadataCache;
  }

  if (!existsSync(DATA_FILE)) {
    metadataCache = {};
    return metadataCache;
  }

  try {
    const content = await readFile(DATA_FILE, 'utf-8');
    metadataCache = JSON.parse(content);
    return metadataCache;
  } catch (err) {
    console.error('Error loading metadata cache:', err);
    metadataCache = {};
    return metadataCache;
  }
}

/**
 * Get metadata for a specific agent
 * @param {string} agentName - The agent's identifier name
 * @returns {Promise<object|null>} - The agent's metadata or null if not found
 */
export async function getMetadata(agentName) {
  const all = await loadAllMetadata();
  return all[agentName] || null;
}

/**
 * Set/update metadata for an agent
 * @param {string} agentName - The agent's identifier name
 * @param {object} data - The metadata to store (displayName, tagline, avatar, etc.)
 * @returns {Promise<object>} - The updated metadata
 */
export async function setMetadata(agentName, data) {
  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }

  const all = await loadAllMetadata();
  all[agentName] = { ...all[agentName], ...data };

  // Update in-memory cache
  metadataCache = all;

  await writeFile(DATA_FILE, JSON.stringify(all, null, 2));
  return all[agentName];
}

/**
 * Delete metadata for an agent
 * @param {string} agentName - The agent's identifier name
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteMetadata(agentName) {
  const all = await loadAllMetadata();
  if (!all[agentName]) return false;

  delete all[agentName];
  metadataCache = all;
  await writeFile(DATA_FILE, JSON.stringify(all, null, 2));
  return true;
}

/**
 * Get all existing display names to avoid duplicates
 * @returns {Promise<string[]>} - Array of existing display names
 */
export async function getAllDisplayNames() {
  const all = await loadAllMetadata();
  return Object.values(all)
    .map(m => m.displayName)
    .filter(Boolean);
}

/**
 * Clear the in-memory cache (useful for testing or forcing a reload)
 */
export function clearCache() {
  metadataCache = null;
}

/**
 * Get the path to the data file (for debugging/testing)
 * @returns {string} - The path to the data file
 */
export function getDataFilePath() {
  return DATA_FILE;
}
