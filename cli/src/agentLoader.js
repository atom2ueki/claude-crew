import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { expandPath, extractDescription } from 'claude-crew-shared/agents';
import { parseFrontmatter } from 'claude-crew-shared/frontmatter';

/**
 * Load all agent definitions from a directory
 * Scans for .md files and parses their frontmatter
 *
 * @param {string} agentsDir - Path to agents directory (default: ~/.claude/agents)
 * @returns {Promise<Array>} - Array of agent objects
 */
export async function loadAgents(agentsDir = '~/.claude/agents') {
  const expandedPath = expandPath(agentsDir);

  if (!existsSync(expandedPath)) {
    throw new Error(`Agents directory not found: ${expandedPath}`);
  }

  const files = readdirSync(expandedPath).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    throw new Error(`No agent files (.md) found in: ${expandedPath}`);
  }

  const agents = [];

  for (const file of files) {
    const filePath = join(expandedPath, file);
    const content = readFileSync(filePath, 'utf-8');

    // Parse frontmatter with lenient parser
    const { data: frontmatter, content: body } = parseFrontmatter(content);

    // Extract agent name from frontmatter or filename
    const name = frontmatter.name || basename(file, '.md');

    // Build agent object
    const agent = {
      name,
      description: frontmatter.description || extractDescription(body),
      scope: frontmatter.scope || 'global',
      tools: frontmatter.tools || [],
      model: frontmatter.model || null,
      color: frontmatter.color || null,
      filePath,
      source: 'agent',
      // These will be filled in by metadataGenerator
      displayName: null,
      gender: null,
      tagline: null,
      avatar: null,
      avatarUrl: null
    };

    agents.push(agent);
  }

  return agents;
}

/**
 * Load installed plugins from ~/.claude/plugins/
 *
 * @returns {Promise<Array>} - Array of plugin objects (formatted like agents)
 */
export async function loadPlugins() {
  const pluginsPath = expandPath('~/.claude/plugins/installed_plugins.json');
  const settingsPath = expandPath('~/.claude/settings.json');

  if (!existsSync(pluginsPath)) {
    return [];
  }

  const installedPlugins = JSON.parse(readFileSync(pluginsPath, 'utf-8'));
  const settings = existsSync(settingsPath)
    ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
    : {};

  const enabledPlugins = settings.enabledPlugins || {};
  const plugins = [];

  for (const [pluginId, installations] of Object.entries(installedPlugins.plugins || {})) {
    // Skip disabled plugins
    if (enabledPlugins[pluginId] === false) continue;

    const latestInstall = installations[0];
    if (!latestInstall) continue;

    const installPath = latestInstall.installPath;
    if (!existsSync(installPath)) continue;

    // Try to load plugin.json
    const pluginJsonPath = join(installPath, '.claude-plugin', 'plugin.json');
    const readmePath = join(installPath, 'README.md');

    let pluginMeta = { name: pluginId.split('@')[0] };
    if (existsSync(pluginJsonPath)) {
      pluginMeta = { ...pluginMeta, ...JSON.parse(readFileSync(pluginJsonPath, 'utf-8')) };
    }

    // Get description from README if not in plugin.json
    let description = pluginMeta.description || '';
    if (!description && existsSync(readmePath)) {
      const readme = readFileSync(readmePath, 'utf-8');
      description = extractDescription(readme);
    }

    plugins.push({
      name: pluginMeta.name,
      description: description || `${pluginMeta.name} plugin`,
      scope: 'plugin',
      source: 'plugin',
      filePath: installPath,
      displayName: null,
      gender: null,
      tagline: null,
      avatar: null,
      avatarUrl: null
    });
  }

  return plugins;
}

/**
 * Load both agents and plugins
 *
 * @param {string} agentsDir - Path to agents directory
 * @param {object} options - Options
 * @param {boolean} options.includePlugins - Whether to include plugins
 * @returns {Promise<Array>} - Combined array of agents and plugins
 */
export async function loadAll(agentsDir = '~/.claude/agents', options = {}) {
  const { includePlugins = true } = options;

  let agents = [];
  try {
    agents = await loadAgents(agentsDir);
  } catch (err) {
    // No agents found - that's okay if we have plugins
    if (!includePlugins) throw err;
  }

  let plugins = [];
  if (includePlugins) {
    try {
      plugins = await loadPlugins();
    } catch (err) {
      console.warn('Failed to load plugins:', err.message);
    }
  }

  return [...agents, ...plugins];
}

/**
 * Get count of agents and plugins
 *
 * @param {string} agentsDir - Path to agents directory
 * @param {object} options - Options
 * @returns {object} - { agents: number, plugins: number, total: number }
 */
export function getCounts(agentsDir = '~/.claude/agents', options = {}) {
  const { includePlugins = true } = options;
  const expandedPath = expandPath(agentsDir);

  let agentCount = 0;
  if (existsSync(expandedPath)) {
    agentCount = readdirSync(expandedPath).filter(f => f.endsWith('.md')).length;
  }

  let pluginCount = 0;
  if (includePlugins) {
    const pluginsPath = expandPath('~/.claude/plugins/installed_plugins.json');
    const settingsPath = expandPath('~/.claude/settings.json');

    if (existsSync(pluginsPath)) {
      const installedPlugins = JSON.parse(readFileSync(pluginsPath, 'utf-8'));
      const settings = existsSync(settingsPath)
        ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
        : {};
      const enabledPlugins = settings.enabledPlugins || {};

      for (const pluginId of Object.keys(installedPlugins.plugins || {})) {
        if (enabledPlugins[pluginId] !== false) {
          pluginCount++;
        }
      }
    }
  }

  return {
    agents: agentCount,
    plugins: pluginCount,
    total: agentCount + pluginCount
  };
}

// Legacy function for backward compatibility
export function getAgentCount(agentsDir = '~/.claude/agents') {
  return getCounts(agentsDir, { includePlugins: false }).agents;
}
