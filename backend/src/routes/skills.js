import { Router } from 'express';
import { listSkills, getSkill } from '../services/skillService.js';

const router = Router();

/**
 * GET /api/skills
 * List all skills from both user and project scopes
 */
router.get('/', async (req, res, next) => {
  try {
    const skills = await listSkills();
    res.json(skills);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/skills/:name
 * Get a single skill by name
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const scope = req.query.scope || 'user';
    const skill = await getSkill(name, scope);

    if (!skill) {
      return res.status(404).json({ error: `Skill "${name}" not found` });
    }

    res.json(skill);
  } catch (err) {
    next(err);
  }
});

export default router;
