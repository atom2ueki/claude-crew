import './SkillChip.css';

export default function SkillChip({ skill, onRemove, isDraggable = true }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'skill',
      name: skill.name,
      scope: skill.scope
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`skill-chip ${isDraggable ? 'draggable' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      title={skill.description || skill.name}
    >
      <span className="skill-name">{skill.name}</span>
      {skill.scope === 'project' && (
        <span className="skill-scope">project</span>
      )}
      {onRemove && (
        <button
          className="skill-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(skill.name);
          }}
          title="Remove skill"
        >
          &times;
        </button>
      )}
    </div>
  );
}
