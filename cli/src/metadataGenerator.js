import { spawn } from 'child_process';
import { generateAvatar, validateGender, buildAvatarUrl } from 'claude-crew-shared/avatar';

/**
 * Check if Claude CLI is available
 * @returns {Promise<boolean>} - True if Claude CLI is available
 */
export async function checkClaudeCLI() {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000
    });

    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/**
 * Generate metadata for an agent using Claude Code CLI
 * Returns displayName, gender, tagline, and avatar configuration
 *
 * @param {object} agent - Agent object with name and description
 * @param {Set<string>} usedNames - Names already assigned to other agents
 * @returns {Promise<object>} - Agent with generated metadata
 */
export async function enrichAgent(agent, usedNames = new Set()) {
  const metadata = await generateMetadataWithClaude(agent, usedNames);

  // Validate and normalize gender
  const gender = validateGender(metadata.gender);

  // Generate avatar config
  const avatar = generateAvatar(gender, {
    glassesProbability: metadata.glassesProbability || 0,
    beardProbability: metadata.beardProbability || 0
  });

  // Build avatar URL
  const avatarUrl = buildAvatarUrl(metadata.displayName, avatar);

  return {
    ...agent,
    displayName: metadata.displayName,
    gender,
    tagline: metadata.tagline,
    avatar,
    avatarUrl
  };
}

/**
 * Call Claude Code CLI to generate agent metadata
 * Uses stdin to avoid shell escaping issues
 *
 * @param {object} agent - Agent with name and description
 * @param {Set<string>} usedNames - Names already assigned to other agents
 * @returns {Promise<object>} - Generated metadata
 */
async function generateMetadataWithClaude(agent, usedNames = new Set()) {
  // Truncate description to avoid overly long prompts
  const shortDesc = (agent.description || '').slice(0, 300);

  // Build exclusion list if we have used names
  const usedNamesArray = Array.from(usedNames);
  const exclusionClause = usedNamesArray.length > 0
    ? `\n\nIMPORTANT: Do NOT use any of these names as they are already taken: ${usedNamesArray.join(', ')}`
    : '';

  const prompt = `You are generating metadata for an AI agent persona. Based on the agent's role and description, create a human-like identity.

Agent Name: ${agent.name}
Description: ${shortDesc}${exclusionClause}

Generate the following in JSON format:
{
  "displayName": "A unique human first name that fits this agent's personality (e.g., Alex, Sam, Jordan)",
  "gender": "male or female based on what fits the persona",
  "tagline": "A short witty tagline (max 50 chars) that captures their specialty",
  "glassesProbability": 0-100 based on if they seem intellectual/technical,
  "beardProbability": 0-100 for males based on personality (set 0 for females)
}

Respond with ONLY the JSON object, no explanation.`;

  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['--print'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      // Parse JSON from response
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        reject(new Error('No JSON found in Claude response'));
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse JSON: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Claude CLI not found'));
      } else {
        reject(err);
      }
    });

    // Write prompt to stdin and close it
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Enrich multiple agents sequentially to ensure unique names
 * Names are tracked across all agents to prevent duplicates
 *
 * @param {Array} agents - Array of agent objects
 * @param {number} _concurrency - Ignored, kept for API compatibility
 * @returns {Promise<Array>} - Enriched agents
 */
export async function enrichAgents(agents, _concurrency = 3) {
  const results = [];
  const usedNames = new Set();

  // Process sequentially to ensure name uniqueness
  for (const agent of agents) {
    const enriched = await enrichAgent(agent, usedNames);
    usedNames.add(enriched.displayName);
    results.push(enriched);
  }

  return results;
}
