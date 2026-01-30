import { homedir } from 'os';
import { join } from 'path';

// User-level agents and skills (global)
export const USER_AGENTS_DIR = join(homedir(), '.claude', 'agents');
export const USER_SKILLS_DIR = join(homedir(), '.claude', 'skills');

// Project-level agents and skills (current working directory)
export const PROJECT_AGENTS_DIR = join(process.cwd(), '.claude', 'agents');
export const PROJECT_SKILLS_DIR = join(process.cwd(), '.claude', 'skills');

// Plugin directories
export const PLUGINS_DIR = join(homedir(), '.claude', 'plugins');

// Server configuration
export const PORT = process.env.PORT || 3001;
