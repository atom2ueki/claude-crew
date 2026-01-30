import SkillChip from './SkillChip';
import './SkillsPanel.css';

export default function SkillsPanel({ skills }) {
  if (!skills || skills.length === 0) {
    return (
      <aside className="skills-panel">
        <h3>Available Skills</h3>
        <p className="no-skills">No skills found. Skills are read from ~/.claude/skills/</p>
      </aside>
    );
  }

  return (
    <aside className="skills-panel">
      <h3>Available Skills</h3>
      <p className="skills-hint">Drag skills onto agent cards to assign them</p>
      <div className="skills-list">
        {skills.map((skill) => (
          <SkillChip
            key={`${skill.scope}-${skill.name}`}
            skill={skill}
          />
        ))}
      </div>
    </aside>
  );
}
