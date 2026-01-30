/**
 * Agent Loader Utilities
 * Common functions for loading and parsing agent files
 */

import { homedir } from 'os';
import { join } from 'path';

/**
 * Expand ~ to home directory
 * @param {string} filepath - Path that may contain ~
 * @returns {string} - Expanded path
 */
export function expandPath(filepath) {
  if (filepath.startsWith('~')) {
    return join(homedir(), filepath.slice(1));
  }
  return filepath;
}

/**
 * Extract description from markdown body if not in frontmatter
 * Takes the first paragraph or first few sentences
 *
 * @param {string} body - Markdown content without frontmatter
 * @returns {string} - Extracted description
 */
export function extractDescription(body) {
  // Remove any leading headers
  const cleaned = body.replace(/^#+\s+.*$/gm, '').trim();

  // Get first paragraph (up to double newline or 200 chars)
  const firstPara = cleaned.split(/\n\n/)[0] || cleaned;

  // Limit length
  if (firstPara.length > 200) {
    return firstPara.slice(0, 197) + '...';
  }

  return firstPara || 'No description available';
}

/**
 * Parse a YAML value (handles strings, arrays, etc.)
 * Simpler version for basic parsing needs
 * @param {string} value - Raw value string
 * @returns {*} - Parsed value
 */
export function parseValue(value) {
  // Empty
  if (!value) return '';

  // Array (simple format: [item1, item2])
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1);
    return inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  }

  // Quoted string - remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  return value;
}

// Default paths for Claude Code configuration
export const USER_AGENTS_DIR = '~/.claude/agents';
export const PROJECT_AGENTS_DIR = './.claude/agents';
export const PLUGINS_DIR = '~/.claude/plugins';
export const SETTINGS_PATH = '~/.claude/settings.json';
export const INSTALLED_PLUGINS_PATH = '~/.claude/plugins/installed_plugins.json';
