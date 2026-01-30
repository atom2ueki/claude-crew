import { Router } from 'express';
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent
} from '../services/agentService.js';
import { generateAgentDefinition, generateAgentMetadata, checkClaudeCli } from '../services/claudeService.js';
import { getMetadata, setMetadata, deleteMetadata, getAllDisplayNames } from '../services/metadataService.js';
import { generateAvatar, buildAvatarUrl, validateGender } from 'claude-crew-shared/avatar';

const router = Router();

/**
 * Enrich an agent with metadata (displayName, avatarUrl)
 * Generates metadata via AI if not already cached
 * @param {object} agent - The agent object
 * @returns {Promise<object>} - Agent enriched with metadata
 */
async function enrichAgentWithMetadata(agent) {
  let metadata = await getMetadata(agent.name);

  // Backward compatibility: if metadata exists but missing avatar object, force regenerate
  if (metadata && !metadata.avatar) {
    console.log(`Regenerating metadata for ${agent.name} (upgrading to new avatar format)`);
    metadata = null;
  }

  if (!metadata) {
    try {
      // Get existing names to avoid duplicates
      const existingNames = await getAllDisplayNames();
      const generated = await generateAgentMetadata(agent.name, agent.description, existingNames);

      // Ensure uniqueness - if AI still returned a duplicate, append a number
      let displayName = generated.displayName;
      if (existingNames.includes(displayName)) {
        let suffix = 2;
        while (existingNames.includes(`${generated.displayName} ${suffix}`)) {
          suffix++;
        }
        displayName = `${generated.displayName} ${suffix}`;
      }

      // Validate gender from LLM
      const gender = validateGender(generated.gender);

      // Get probabilities from LLM (with defaults)
      const options = {
        glassesProbability: generated.glassesProbability ?? 0,
        beardProbability: gender === 'male' ? (generated.beardProbability ?? 0) : 0
      };

      // Generate avatar features based on gender and LLM probabilities
      const avatar = generateAvatar(gender, options);

      // Build comprehensive avatar URL with all parameters
      const avatarUrl = buildAvatarUrl(displayName, avatar);

      metadata = {
        displayName: displayName,
        gender: gender,
        tagline: generated.tagline || '',
        avatar: avatar,
        avatarUrl: avatarUrl
      };
      await setMetadata(agent.name, metadata);
    } catch (err) {
      console.error(`Failed to generate metadata for ${agent.name}:`, err.message);
      throw err;
    }
  }

  return { ...agent, ...metadata };
}

/**
 * GET /api/agents
 * List all agents from both user and project scopes
 * Each agent is enriched with displayName and avatarUrl
 */
router.get('/', async (req, res, next) => {
  try {
    const agents = await listAgents();
    // Enrich agents sequentially to avoid duplicate name race conditions
    const enrichedAgents = [];
    for (const agent of agents) {
      const enriched = await enrichAgentWithMetadata(agent);
      enrichedAgents.push(enriched);
    }
    res.json(enrichedAgents);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agents/:name
 * Get a single agent by name, enriched with displayName and avatarUrl
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const scope = req.query.scope || 'user';
    const agent = await getAgent(name, scope);

    if (!agent) {
      return res.status(404).json({ error: `Agent "${name}" not found` });
    }

    const enrichedAgent = await enrichAgentWithMetadata(agent);
    res.json(enrichedAgent);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/generate
 * Generate an agent definition from a natural language prompt
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if Claude CLI is available
    const cliAvailable = await checkClaudeCli();
    if (!cliAvailable) {
      return res.status(503).json({
        error: 'Claude CLI not available. Make sure Claude Code is installed and authenticated.'
      });
    }

    const generated = await generateAgentDefinition(prompt);

    res.json({
      generated,
      preview: true
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents
 * Create a new agent (save to filesystem) and generate metadata
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, model, skills, prompt, color, scope = 'user' } = req.body;

    if (!name || !description || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, and prompt are required'
      });
    }

    const agent = await createAgent({
      name,
      description,
      model: model || 'sonnet',
      skills: skills || '',
      prompt,
      color: color || null
    }, scope);

    // Enrich with metadata (displayName, avatarUrl)
    const enrichedAgent = await enrichAgentWithMetadata(agent);
    res.status(201).json(enrichedAgent);
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * PUT /api/agents/:name
 * Update an existing agent
 */
router.put('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const scope = req.query.scope || 'user';
    const updates = req.body;

    const agent = await updateAgent(name, updates, scope);
    const enrichedAgent = await enrichAgentWithMetadata(agent);
    res.json(enrichedAgent);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * DELETE /api/agents/:name
 * Delete an agent and its metadata
 */
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const scope = req.query.scope || 'user';

    const result = await deleteAgent(name, scope);
    // Also delete metadata (ignore if not found)
    await deleteMetadata(name);
    res.json(result);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
