import { useState, useEffect } from 'react';
import { agentApi } from '../services/api';
import './CreateAgentModal.css';

export default function CreateAgentModal({ isOpen, onClose, onCreate }) {
  const [prompt, setPrompt] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setGeneratedAgent(null);
      setIsGenerating(false);
      setIsSaving(false);
      setError(null);
      setLogs([]);
    }
  }, [isOpen]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setLogs([]);

    addLog('Initializing Claude Code CLI...');

    try {
      addLog('Generating agent definition...');
      const result = await agentApi.generate(prompt);
      addLog('Agent definition generated successfully!');
      setGeneratedAgent(result.generated);
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedAgent) return;

    setIsSaving(true);
    setError(null);

    try {
      const savedAgent = await agentApi.create(generatedAgent, 'user');
      onCreate(savedAgent);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedAgent(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Subagent</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!generatedAgent && !isGenerating ? (
          <div className="prompt-step">
            <div className="form-group">
              <label>Describe the agent you want to create</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., I need an agent that reviews TypeScript code for best practices, security issues, and suggests improvements..."
                rows={5}
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={handleGenerate}
                className="create-submit-btn"
                disabled={!prompt.trim()}
              >
                <span className="icon">✨</span> Generate Agent
              </button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="generation-status">
            <div className="spinner"></div>
            <div className="log-console">
              {logs.map((log, i) => (
                <div key={i} className="log-entry">{'>'} {log}</div>
              ))}
              <div className="log-entry blink">_</div>
            </div>
          </div>
        ) : (
          <div className="preview-step">
            <h3>Preview Generated Agent</h3>

            <div className="agent-preview">
              <div className="preview-field">
                <label>Name</label>
                <div className="preview-value name-value">{generatedAgent.name}</div>
              </div>

              <div className="preview-field">
                <label>Description</label>
                <div className="preview-value">{generatedAgent.description}</div>
              </div>

              <div className="preview-row">
                <div className="preview-field">
                  <label>Model</label>
                  <div className="preview-value model-badge">{generatedAgent.model}</div>
                </div>
                <div className="preview-field">
                  <label>Color</label>
                  <div className="preview-value">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: generatedAgent.color || '#888' }}
                    ></span>
                    {generatedAgent.color || 'none'}
                  </div>
                </div>
              </div>

              <div className="preview-field">
                <label>Skills</label>
                <div className="preview-value tools-list">
                  {generatedAgent.skills
                    ? generatedAgent.skills.split(',').map((skill, i) => (
                        <span key={i} className="tool-tag">{skill.trim()}</span>
                      ))
                    : <span className="no-tools">No skills assigned</span>
                  }
                </div>
              </div>

              <div className="preview-field">
                <label>System Prompt</label>
                <div className="preview-value prompt-preview">
                  {generatedAgent.prompt}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleRegenerate} className="secondary-btn">
                Regenerate
              </button>
              <button
                onClick={handleSave}
                className="create-submit-btn"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Agent'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
