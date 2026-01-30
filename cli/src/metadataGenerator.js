import { spawn } from 'child_process';
import { generateAvatar, validateGender, buildAvatarUrl } from 'claude-crew-shared/avatar';

/**
 * Generate metadata for an agent using Claude Code CLI
 * Returns displayName, gender, tagline, and avatar configuration
 *
 * @param {object} agent - Agent object with name and description
 * @returns {Promise<object>} - Agent with generated metadata
 */
export async function enrichAgent(agent) {
  try {
    const metadata = await generateMetadataWithClaude(agent);

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
  } catch (err) {
    console.warn(`Failed to generate metadata for ${agent.name}:`, err.message);

    // Fallback: use agent name as display name, random gender
    const fallback = generateFallbackMetadata(agent);
    const gender = validateGender(fallback.gender);
    const avatar = generateAvatar(gender, {
      glassesProbability: fallback.glassesProbability,
      beardProbability: fallback.beardProbability
    });
    const avatarUrl = buildAvatarUrl(fallback.displayName, avatar);

    return {
      ...agent,
      displayName: fallback.displayName,
      gender,
      tagline: fallback.tagline,
      avatar,
      avatarUrl
    };
  }
}

/**
 * Call Claude Code CLI to generate agent metadata
 * Uses stdin to avoid shell escaping issues
 *
 * @param {object} agent - Agent with name and description
 * @returns {Promise<object>} - Generated metadata
 */
async function generateMetadataWithClaude(agent) {
  // Truncate description to avoid overly long prompts
  const shortDesc = (agent.description || '').slice(0, 300);

  const prompt = `You are generating metadata for an AI agent persona. Based on the agent's role and description, create a human-like identity.

Agent Name: ${agent.name}
Description: ${shortDesc}

Generate the following in JSON format:
{
  "displayName": "A human first name that fits this agent's personality (e.g., Alex, Sam, Jordan)",
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
 * Generate fallback metadata when Claude CLI is unavailable
 * Uses simple heuristics based on agent name
 *
 * @param {object} agent - Agent with name and description
 * @returns {object} - Fallback metadata
 */
function generateFallbackMetadata(agent) {
  // Simple name generation based on first letter of agent name
  const firstLetter = agent.name.charAt(0).toUpperCase();
  const names = {
    male: ['Alex', 'Ben', 'Chris', 'Dan', 'Eli', 'Felix', 'George', 'Henry', 'Ivan', 'Jack',
           'Kevin', 'Leo', 'Max', 'Nate', 'Oscar', 'Pete', 'Quinn', 'Ryan', 'Sam', 'Tom',
           'Uri', 'Vic', 'Will', 'Xavier', 'Yuri', 'Zach'],
    female: ['Ana', 'Beth', 'Clara', 'Diana', 'Emma', 'Fiona', 'Grace', 'Holly', 'Iris', 'Julia',
             'Kate', 'Luna', 'Maya', 'Nina', 'Olive', 'Penny', 'Quinn', 'Rose', 'Sara', 'Tina',
             'Uma', 'Vera', 'Wendy', 'Xena', 'Yara', 'Zoe']
  };

  // Randomly pick gender
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const nameIndex = firstLetter.charCodeAt(0) - 65;
  const validIndex = Math.max(0, Math.min(25, nameIndex));
  const displayName = names[gender][validIndex];

  // Generate tagline from description
  const desc = agent.description || '';
  let tagline = 'AI Assistant';
  if (desc) {
    // Extract a short phrase from description
    const firstSentence = desc.split(/[.!?]/)[0] || desc;
    tagline = firstSentence.slice(0, 47) + (firstSentence.length > 47 ? '...' : '');
  }

  return {
    displayName,
    gender,
    tagline,
    glassesProbability: agent.name.toLowerCase().includes('code') ||
                        agent.name.toLowerCase().includes('dev') ? 60 : 30,
    beardProbability: gender === 'male' ? 20 : 0
  };
}

/**
 * Enrich multiple agents in parallel (with concurrency limit)
 *
 * @param {Array} agents - Array of agent objects
 * @param {number} concurrency - Max concurrent enrichments
 * @returns {Promise<Array>} - Enriched agents
 */
export async function enrichAgents(agents, concurrency = 3) {
  const results = [];

  for (let i = 0; i < agents.length; i += concurrency) {
    const batch = agents.slice(i, i + concurrency);
    const enriched = await Promise.all(batch.map(enrichAgent));
    results.push(...enriched);
  }

  return results;
}
