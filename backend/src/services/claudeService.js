import { spawn } from 'child_process';

const GENERATION_PROMPT = `You are an expert at creating Claude Code agent definitions.
Given a user's description, generate a complete agent definition.

IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks, no explanation.

The JSON object must have these exact fields:
- "name": lowercase, letters and hyphens only (e.g., "code-reviewer", "pr-helper")
- "description": When Claude should use this agent (1-2 sentences, starts with action verb)
- "model": One of "sonnet" (default, balanced), "opus" (complex tasks), or "haiku" (fast, simple tasks)
- "skills": Comma-separated list of skill names the agent should use (e.g., "readme, langchain-docs")
- "prompt": The full system prompt for the agent (detailed instructions, best practices, example workflows)
- "color": A color name for UI display (blue, green, purple, orange, red, cyan, pink, yellow)

Example output format:
{"name":"pr-reviewer","description":"Use this agent for pull request code reviews and feedback.","model":"sonnet","skills":"","prompt":"You are an expert code reviewer...","color":"blue"}`;

/**
 * Generate an agent definition using Claude Code CLI
 * @param {string} userPrompt - The user's description of the agent they want
 * @returns {Promise<object>} - The generated agent definition
 */
export function generateAgentDefinition(userPrompt) {
  return new Promise((resolve, reject) => {
    const fullPrompt = `${GENERATION_PROMPT}\n\nCreate an agent definition for: ${userPrompt}`;

    // Spawn Claude Code CLI (already authenticated with user's subscription)
    // Note: shell: false to avoid prompt being interpreted as shell commands
    const claude = spawn('claude', ['-p', fullPrompt, '--output-format', 'json'], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('error', (err) => {
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
    });

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse the JSON response from Claude
        // The response might be wrapped in the CLI output format
        const parsed = JSON.parse(stdout);

        // If the output is the CLI format with a 'result' field, extract it
        let agentData;
        if (parsed.result) {
          // Try to parse the result as JSON (it might be a string)
          try {
            agentData = typeof parsed.result === 'string'
              ? JSON.parse(parsed.result)
              : parsed.result;
          } catch {
            // If result isn't JSON, try to extract JSON from it
            const jsonMatch = parsed.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              agentData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not extract agent definition from response');
            }
          }
        } else if (parsed.name && parsed.description) {
          // Direct agent definition
          agentData = parsed;
        } else {
          throw new Error('Unexpected response format');
        }

        // Validate required fields
        const required = ['name', 'description', 'prompt'];
        for (const field of required) {
          if (!agentData[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Normalize the name (lowercase, hyphens only)
        agentData.name = agentData.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        resolve(agentData);
      } catch (parseError) {
        // Try to extract JSON from the raw output
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const agentData = JSON.parse(jsonMatch[0]);
            resolve(agentData);
          } else {
            reject(new Error(`Failed to parse Claude output: ${parseError.message}\nRaw output: ${stdout.substring(0, 500)}`));
          }
        } catch {
          reject(new Error(`Failed to parse Claude output: ${parseError.message}\nRaw output: ${stdout.substring(0, 500)}`));
        }
      }
    });
  });
}

/**
 * Generate metadata (display name & avatar) for an agent using Claude CLI
 * @param {string} agentName - The agent's identifier (e.g., "doc-rewriter")
 * @param {string} description - The agent's description
 * @param {string[]} existingNames - Names already in use (to avoid duplicates)
 * @returns {Promise<object>} - Object with displayName and avatarSeed
 */
export function generateAgentMetadata(agentName, description, existingNames = []) {
  return new Promise((resolve, reject) => {
    // Use random number to encourage diverse names
    const rand = Math.floor(Math.random() * 1000);

    // Build the avoid list if there are existing names
    const avoidClause = existingNames.length > 0
      ? `\n- MUST NOT use these names (already taken): ${existingNames.join(', ')}`
      : '';

    const prompt = `Generate metadata for AI agent #${rand}.
Role: ${agentName}
Description: ${description}

Create a persona:
- Pick a unique FIRST NAME only (no surname)
- Gender is determined by the name you choose (male name = male, female name = female)
- Be creative with the name choice${avoidClause}

Return ONLY valid JSON:
{"displayName":"[first name]","gender":"male|female","glassesProbability":[0-100],"beardProbability":[0-100],"tagline":"[witty 4-6 word motto]"}

Probability guidelines:
- glassesProbability: 50-80 for technical/analytical roles, 0-30 for others
- beardProbability: 0-30 for males only, always 0 for females`;


    // Uses sonnet model for better quality
    // Note: shell: false to avoid prompt being interpreted as shell commands
    const claude = spawn('claude', ['-p', prompt, '--model', 'sonnet', '--output-format', 'json'], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('error', (err) => {
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
    });

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse the JSON response from Claude
        const parsed = JSON.parse(stdout);

        // Extract the result if wrapped in CLI format
        let metadata;
        if (parsed.result) {
          try {
            metadata = typeof parsed.result === 'string'
              ? JSON.parse(parsed.result)
              : parsed.result;
          } catch {
            // Try to extract JSON from the result string
            const jsonMatch = parsed.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              metadata = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not extract metadata from response');
            }
          }
        } else if (parsed.displayName && parsed.gender) {
          metadata = parsed;
        } else {
          throw new Error('Unexpected response format');
        }

        // Validate required fields
        if (!metadata.displayName || !metadata.gender) {
          throw new Error('Missing required fields: displayName and gender');
        }

        resolve(metadata);
      } catch (parseError) {
        // Try to extract JSON from raw output
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const metadata = JSON.parse(jsonMatch[0]);
            resolve(metadata);
          } else {
            reject(new Error(`Failed to parse Claude output: ${parseError.message}`));
          }
        } catch {
          reject(new Error(`Failed to parse Claude output: ${parseError.message}`));
        }
      }
    });
  });
}

/**
 * Check if Claude CLI is available and authenticated
 * @returns {Promise<boolean>}
 */
export function checkClaudeCli() {
  return new Promise((resolve) => {
    const claude = spawn('claude', ['--version'], { shell: true });

    claude.on('error', () => resolve(false));
    claude.on('close', (code) => resolve(code === 0));
  });
}
