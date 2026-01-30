/**
 * Frontmatter Utilities
 * Parse and serialize markdown files with YAML frontmatter
 */

import matter from 'gray-matter';
import yaml from 'js-yaml';

/**
 * Parse a markdown file with YAML frontmatter
 * Handles complex YAML values that may contain unquoted colons
 * @param {string} content - The raw markdown content
 * @returns {{ data: object, content: string }} - Parsed frontmatter and body
 */
export function parseFrontmatter(content) {
  // Preprocess: quote description values that contain problematic characters
  const preprocessed = preprocessFrontmatter(content);

  try {
    const { data, content: body } = matter(preprocessed);
    return { data, content: body.trim() };
  } catch (err) {
    // If gray-matter still fails, fall back to manual extraction
    console.warn('Frontmatter parsing failed, using fallback parser:', err.message);
    return parseFrontmatterManual(content);
  }
}

/**
 * Preprocess frontmatter to quote description values containing colons
 * This fixes YAML parsing issues with unquoted strings like "Examples: <example>Context:"
 * @param {string} content - Raw file content
 * @returns {string} - Content with quoted description
 */
function preprocessFrontmatter(content) {
  const lines = content.split('\n');

  // Check for frontmatter
  if (lines[0] !== '---') return content;

  // Find the closing delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return content;

  // Process frontmatter lines
  const result = ['---'];
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i];

    // Check if this is a description line with unquoted value containing colons
    const descMatch = line.match(/^description:\s*(.+)$/);
    if (descMatch) {
      const value = descMatch[1];
      // If value is not already quoted and contains colons or angle brackets, quote it
      if (!value.startsWith('"') && !value.startsWith("'") &&
          (value.includes(':') || value.includes('<') || value.includes('>'))) {
        // Escape any existing double quotes and wrap in double quotes
        const escaped = value.replace(/"/g, '\\"');
        result.push(`description: "${escaped}"`);
        continue;
      }
    }
    result.push(line);
  }

  // Add closing delimiter and rest of content
  result.push(...lines.slice(endIndex));
  return result.join('\n');
}

/**
 * Manual frontmatter parser for files that fail standard YAML parsing
 * Handles Claude Code agent files which use unquoted description values
 * @param {string} content - Raw file content
 * @returns {{ data: object, content: string }} - Parsed frontmatter and body
 */
function parseFrontmatterManual(content) {
  const lines = content.split('\n');

  // Check for frontmatter delimiters
  if (lines[0] !== '---') {
    return { data: {}, content: content.trim() };
  }

  // Find the closing delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, content: content.trim() };
  }

  // Extract frontmatter lines (excluding delimiters)
  const frontmatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join('\n').trim();

  // Parse each line as key: value
  const data = {};
  let currentKey = null;
  let currentValue = '';

  for (const line of frontmatterLines) {
    // Check if this line starts a new key (no leading whitespace and contains :)
    const keyMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)/);

    if (keyMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      // Save previous key-value if exists
      if (currentKey !== null) {
        data[currentKey] = parseYamlValue(currentValue.trim());
      }

      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey !== null) {
      // Continuation of previous value (multi-line)
      currentValue += '\n' + line;
    }
  }

  // Save the last key-value
  if (currentKey !== null) {
    data[currentKey] = parseYamlValue(currentValue.trim());
  }

  return { data, content: body };
}

/**
 * Parse a YAML value string, handling quoted strings and basic types
 * @param {string} value - Raw value string
 * @returns {any} - Parsed value
 */
function parseYamlValue(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  // Remove surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Handle multi-line block scalars (| or >)
  if (value.startsWith('|') || value.startsWith('>')) {
    const lines = value.split('\n').slice(1);
    return lines.map(l => l.trimStart()).join('\n').trim();
  }

  // Handle boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle null
  if (value === 'null' || value === '~') return null;

  // Handle numbers
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;

  // Return as string
  return value;
}

/**
 * Serialize data and content back to markdown with frontmatter
 * @param {object} data - The frontmatter data
 * @param {string} content - The markdown body content
 * @returns {string} - Complete markdown file with frontmatter
 */
export function serializeFrontmatter(data, content) {
  // Filter out null/undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v != null && v !== '')
  );

  const frontmatter = yaml.dump(cleanData, {
    lineWidth: -1,  // Don't wrap lines
    quotingType: '"',
    forceQuotes: false
  }).trim();

  return `---\n${frontmatter}\n---\n\n${content.trim()}\n`;
}

/**
 * Parse an agent markdown file into a structured object
 * @param {string} content - Raw file content
 * @param {string} filename - The filename (without extension)
 * @returns {object} - Agent object with all properties
 */
export function parseAgentFile(content, filename) {
  const { data, content: prompt } = parseFrontmatter(content);

  return {
    name: filename,
    description: data.description || '',
    model: data.model || 'sonnet',
    skills: data.skills || '',
    color: data.color || null,
    prompt: prompt
  };
}

/**
 * Serialize an agent object to markdown format
 * @param {object} agent - The agent object
 * @returns {string} - Markdown content with frontmatter
 */
export function serializeAgentFile(agent) {
  const frontmatter = {
    description: agent.description,
    model: agent.model || 'sonnet',
    skills: agent.skills || null,
    color: agent.color || null
  };

  return serializeFrontmatter(frontmatter, agent.prompt || '');
}

/**
 * Parse a skill markdown file into a structured object
 * @param {string} content - Raw file content
 * @param {string} filename - The filename (without extension)
 * @returns {object} - Skill object with all properties
 */
export function parseSkillFile(content, filename) {
  const { data, content: prompt } = parseFrontmatter(content);

  return {
    name: filename,
    description: data.description || '',
    tools: data.tools || '',
    prompt: prompt
  };
}
