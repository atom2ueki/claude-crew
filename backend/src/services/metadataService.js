/**
 * Metadata Service
 * Re-exports from the shared metadata cache for backend compatibility
 */

export {
  loadAllMetadata,
  getMetadata,
  setMetadata,
  deleteMetadata,
  getAllDisplayNames,
  clearCache,
  getDataFilePath
} from 'claude-crew-shared/metadata';
