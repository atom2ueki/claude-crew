import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { USER_AGENTS_DIR, PROJECT_AGENTS_DIR, PLUGINS_DIR } from '../config.js';
import { parseAgentFile, serializeAgentFile } from 'claude-crew-shared/frontmatter';

/**
 * Get the agents directory for a given scope
 */
function getAgentsDir(scope = 'user') {
  return scope === 'project' ? PROJECT_AGENTS_DIR : USER_AGENTS_DIR;
}

/**
 * Ensure the agents directory exists
 */
async function ensureAgentsDir(scope = 'user') {
  const dir = getAgentsDir(scope);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

/**
 * List all agents from a specific scope
 */
async function listAgentsFromScope(scope) {
  const dir = getAgentsDir(scope);

  if (!existsSync(dir)) {
    return [];
  }

  try {
    const files = await readdir(dir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const agents = await Promise.all(
      mdFiles.map(async (filename) => {
        const content = await readFile(join(dir, filename), 'utf-8');
        const name = filename.replace(/\.md$/, '');
        const agent = parseAgentFile(content, name);
        return { ...agent, scope };
      })
    );

    return agents;
  } catch (err) {
    console.error(`Error reading agents from ${scope}:`, err.message);
    return [];
  }
}

/**
 * Recursively find all agent .md files in a directory
 */
async function findAgentFiles(dir, agents = []) {
  if (!existsSync(dir)) return agents;

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // If this is an 'agents' directory, read .md files from it
        if (entry.name === 'agents') {
          const agentFiles = await readdir(fullPath);
          for (const file of agentFiles) {
            if (file.endsWith('.md')) {
              agents.push(join(fullPath, file));
            }
          }
        } else {
          // Otherwise, recurse into subdirectory
          await findAgentFiles(fullPath, agents);
        }
      }
    }
  } catch (err) {
    // Ignore errors (permission issues, etc.)
  }

  return agents;
}

/**
 * List all agents from plugins directory
 */
async function listAgentsFromPlugins() {
  const agentFiles = await findAgentFiles(PLUGINS_DIR);
  const agents = [];

  for (const filePath of agentFiles) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const filename = filePath.split('/').pop();
      const name = filename.replace(/\.md$/, '');
      const agent = parseAgentFile(content, name);
      agents.push({ ...agent, scope: 'plugin', filePath });
    } catch (err) {
      console.error(`Error reading plugin agent ${filePath}:`, err.message);
    }
  }

  return agents;
}

/**
 * List all agents from all scopes (user, project, plugins)
 */
export async function listAgents() {
  const [userAgents, projectAgents, pluginAgents] = await Promise.all([
    listAgentsFromScope('user'),
    listAgentsFromScope('project'),
    listAgentsFromPlugins()
  ]);

  // Deduplicate by name (user > project > plugin priority)
  const seen = new Set();
  const result = [];

  for (const agent of [...userAgents, ...projectAgents, ...pluginAgents]) {
    if (!seen.has(agent.name)) {
      seen.add(agent.name);
      result.push(agent);
    }
  }

  return result;
}

/**
 * Get a single agent by name
 */
export async function getAgent(name, scope = 'user') {
  const dir = getAgentsDir(scope);
  const filePath = join(dir, `${name}.md`);

  if (!existsSync(filePath)) {
    // Try the other scope if not found
    const altScope = scope === 'user' ? 'project' : 'user';
    const altDir = getAgentsDir(altScope);
    const altPath = join(altDir, `${name}.md`);

    if (existsSync(altPath)) {
      const content = await readFile(altPath, 'utf-8');
      return { ...parseAgentFile(content, name), scope: altScope };
    }

    return null;
  }

  const content = await readFile(filePath, 'utf-8');
  return { ...parseAgentFile(content, name), scope };
}

/**
 * Create a new agent
 */
export async function createAgent(agent, scope = 'user') {
  const dir = await ensureAgentsDir(scope);
  const filePath = join(dir, `${agent.name}.md`);

  if (existsSync(filePath)) {
    throw new Error(`Agent "${agent.name}" already exists`);
  }

  const content = serializeAgentFile(agent);
  await writeFile(filePath, content, 'utf-8');

  return { ...agent, scope };
}

/**
 * Update an existing agent
 */
export async function updateAgent(name, updates, scope = 'user') {
  const existing = await getAgent(name, scope);

  if (!existing) {
    throw new Error(`Agent "${name}" not found`);
  }

  // Use the scope where the agent was found
  const actualScope = existing.scope;
  const dir = getAgentsDir(actualScope);
  const filePath = join(dir, `${name}.md`);

  const updated = {
    ...existing,
    ...updates,
    name // Ensure name doesn't change
  };

  const content = serializeAgentFile(updated);
  await writeFile(filePath, content, 'utf-8');

  return { ...updated, scope: actualScope };
}

/**
 * Delete an agent
 */
export async function deleteAgent(name, scope = 'user') {
  const existing = await getAgent(name, scope);

  if (!existing) {
    throw new Error(`Agent "${name}" not found`);
  }

  const actualScope = existing.scope;
  const dir = getAgentsDir(actualScope);
  const filePath = join(dir, `${name}.md`);

  await unlink(filePath);

  return { success: true, name, scope: actualScope };
}

