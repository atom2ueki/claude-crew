import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { USER_SKILLS_DIR, PROJECT_SKILLS_DIR } from '../config.js';
import { parseFrontmatter } from 'claude-crew-shared/frontmatter';

/**
 * Get the skills directory for a given scope
 */
function getSkillsDir(scope = 'user') {
  return scope === 'project' ? PROJECT_SKILLS_DIR : USER_SKILLS_DIR;
}

/**
 * Parse a skill from its SKILL.md file
 * @param {string} content - Raw file content
 * @param {string} skillName - The skill directory name
 * @returns {object} - Skill object with all properties
 */
function parseSkillFile(content, skillName) {
  const { data, content: body } = parseFrontmatter(content);

  return {
    name: data.name || skillName,
    description: data.description || '',
    tools: data['allowed-tools'] || data.tools || '',
    license: data.license || '',
    compatibility: data.compatibility || '',
    metadata: data.metadata || {},
    prompt: body
  };
}

/**
 * List all skills from a specific scope
 * Skills are stored as directories with SKILL.md inside
 */
async function listSkillsFromScope(scope) {
  const dir = getSkillsDir(scope);

  if (!existsSync(dir)) {
    return [];
  }

  try {
    const entries = await readdir(dir);
    const skills = [];

    for (const entry of entries) {
      // Skip hidden files/directories
      if (entry.startsWith('.')) continue;

      const entryPath = join(dir, entry);
      const entryStat = await stat(entryPath);

      // Skills are directories
      if (!entryStat.isDirectory()) continue;

      // Look for SKILL.md inside the directory
      const skillFilePath = join(entryPath, 'SKILL.md');

      if (!existsSync(skillFilePath)) {
        // Try lowercase skill.md as fallback
        const altSkillFilePath = join(entryPath, 'skill.md');
        if (!existsSync(altSkillFilePath)) {
          continue;
        }
        const content = await readFile(altSkillFilePath, 'utf-8');
        const skill = parseSkillFile(content, entry);
        skills.push({ ...skill, scope, path: entryPath });
        continue;
      }

      const content = await readFile(skillFilePath, 'utf-8');
      const skill = parseSkillFile(content, entry);
      skills.push({ ...skill, scope, path: entryPath });
    }

    return skills;
  } catch (err) {
    console.error(`Error reading skills from ${scope}:`, err.message);
    return [];
  }
}

/**
 * List all skills from both scopes
 */
export async function listSkills() {
  const [userSkills, projectSkills] = await Promise.all([
    listSkillsFromScope('user'),
    listSkillsFromScope('project')
  ]);

  return [...userSkills, ...projectSkills];
}

/**
 * Get a single skill by name
 */
export async function getSkill(name, scope = 'user') {
  const dir = getSkillsDir(scope);
  const skillDir = join(dir, name);

  if (!existsSync(skillDir)) {
    // Try the other scope if not found
    const altScope = scope === 'user' ? 'project' : 'user';
    const altDir = getSkillsDir(altScope);
    const altSkillDir = join(altDir, name);

    if (existsSync(altSkillDir)) {
      const skillFilePath = join(altSkillDir, 'SKILL.md');
      const altSkillFilePath = join(altSkillDir, 'skill.md');

      const filePath = existsSync(skillFilePath) ? skillFilePath : altSkillFilePath;
      if (!existsSync(filePath)) return null;

      const content = await readFile(filePath, 'utf-8');
      return { ...parseSkillFile(content, name), scope: altScope, path: altSkillDir };
    }

    return null;
  }

  const skillFilePath = join(skillDir, 'SKILL.md');
  const altSkillFilePath = join(skillDir, 'skill.md');

  const filePath = existsSync(skillFilePath) ? skillFilePath : altSkillFilePath;
  if (!existsSync(filePath)) return null;

  const content = await readFile(filePath, 'utf-8');
  return { ...parseSkillFile(content, name), scope, path: skillDir };
}
