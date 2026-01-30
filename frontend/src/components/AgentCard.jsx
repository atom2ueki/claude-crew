import { useState } from 'react';
import SkillChip from './SkillChip';
import './AgentCard.css';

export default function AgentCard({ agent }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Parse skills from the agent (preloaded skills injected at startup)
  const agentSkills = agent.skills
    ? agent.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className={`agent-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="card-inner">
        {/* FRONT FACE */}
        <div className="card-front">
          <div className="card-hole-container">
            <div className="card-hole"></div>
          </div>

          <div className="card-header">
            <span className="agent-name">{agent.displayName || agent.name}</span>
            {agent.scope === 'project' && (
              <span className="scope-badge">project</span>
            )}
          </div>

          <div className="card-body">
            <div className="card-body-content">
              {/* Avatar - uses existing .avatar class with grayscale filter */}
              {agent.avatarUrl && (
                <img
                  className="avatar"
                  src={agent.avatarUrl}
                  alt={agent.displayName || agent.name}
                />
              )}

              {/* Role title - the agent identifier */}
              <h3 className="role-title">{agent.name}</h3>

              {/* Tagline - witty job description */}
              {agent.tagline && (
                <p className="agent-tagline">{agent.tagline}</p>
              )}
            </div>

            <div className="card-footer-section">
              <div className="card-divider"></div>
              <div className="card-footer">
                <button className="role-btn" onClick={() => setIsFlipped(true)}>
                  Role Description
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="card-back">
          <div className="card-hole-container">
            <div className="card-hole"></div>
          </div>

          <div className="card-header">
            <span className="agent-name">{agent.displayName || agent.name}</span>
          </div>

          <div className="card-body-back">
            <div className="scrollable-content">
              {agentSkills.length > 0 && (
                <div className="detail-section">
                  <h4>Skills</h4>
                  <div className="skills-chips back-skills">
                    {agentSkills.map((skillName) => (
                      <SkillChip
                        key={skillName}
                        skill={{ name: skillName }}
                        isDraggable={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Description</h4>
                <p className="description-content">{agent.description || 'No description'}</p>
              </div>
            </div>

            <div className="card-footer-section">
              <div className="card-divider"></div>
              <div className="card-footer">
                <button className="role-btn" onClick={() => setIsFlipped(false)}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
