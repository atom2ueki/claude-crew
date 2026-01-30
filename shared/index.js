/**
 * Claude Crew Shared Library
 * Common utilities for CLI, backend, and frontend
 */

// Avatar generation
export {
  validateGender,
  generateAvatar,
  buildAvatarUrl,
  getAvatarPools
} from './avatarService.js';

// Frontmatter parsing
export {
  parseFrontmatter,
  serializeFrontmatter,
  parseAgentFile,
  serializeAgentFile,
  parseSkillFile
} from './frontmatterUtils.js';

// Agent loading utilities
export {
  expandPath,
  extractDescription,
  parseValue
} from './agentLoader.js';

// Card rendering
export {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_GAP,
  PADDING,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  SCALE,
  CARD_RADIUS,
  CARD_HOLE_WIDTH,
  CARD_HOLE_HEIGHT,
  PILL_HEIGHT,
  PILL_RADIUS,
  AVATAR_SIZE,
  calculateOptimalColumns,
  calculateCanvasDimensions,
  roundRect,
  drawHeader,
  drawFooter,
  drawCard,
  drawCards
} from './cardRenderer.js';

// Metadata cache
export {
  loadAllMetadata,
  getMetadata,
  setMetadata,
  deleteMetadata,
  getAllDisplayNames,
  clearCache,
  getDataFilePath
} from './metadataCache.js';
