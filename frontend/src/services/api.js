const API_BASE = '/api';

/**
 * Agent API endpoints
 */
export const agentApi = {
  /**
   * List all agents
   */
  async list() {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  }
};
