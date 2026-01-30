import { useState, useEffect, useRef } from 'react'
import AgentCard from './components/AgentCard'
import { agentApi } from './services/api'
import { generateCrewImage } from './utils/imageGenerator'
import './App.css'

// Card dimensions (must match AgentCard.css)
const CARD_WIDTH = 280;
const CARD_HEIGHT = 420;

/**
 * Calculate optimal columns to make grid as square as possible
 * Cards are 280x420 (ratio 1:1.5), so we need ~1.5x more columns than rows
 */
function calculateOptimalColumns(count) {
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 3) return 3;
  if (count <= 4) return 2;  // 2x2
  if (count <= 6) return 3;  // 3x2
  if (count <= 9) return 3;  // 3x3
  if (count <= 12) return 4; // 4x3
  if (count <= 16) return 4; // 4x4
  if (count <= 20) return 5; // 5x4
  return Math.ceil(Math.sqrt(count * (CARD_HEIGHT / CARD_WIDTH)));
}

function App() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const gridRef = useRef(null);

  // Fetch agents on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const agentsData = await agentApi.list();
        setAgents(agentsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerateImage = async () => {
    if (agents.length === 0 || generating) return;

    setGenerating(true);
    try {
      await generateCrewImage(agents);
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate grid columns for square-ish layout
  const columns = calculateOptimalColumns(agents.length);
  const CARD_GAP = 30;
  const gridWidth = columns * CARD_WIDTH + (columns - 1) * CARD_GAP;

  const containerStyle = {
    width: agents.length > 0 ? `${gridWidth}px` : 'auto',
    maxWidth: '100%'
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, ${CARD_WIDTH}px)`
  };

  return (
    <div className="app-container" style={containerStyle}>
      <header className="crew-header">
        <div className="header-left">
          <h1>Claude Crew</h1>
          <p className="header-subtitle">Your personalized AI squad</p>
        </div>
        <button
          className="generate-btn"
          onClick={handleGenerateImage}
          disabled={generating || agents.length === 0}
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          Error loading data: {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="main-content">
        <main className="crew-grid" ref={gridRef} style={gridStyle}>
          {loading ? (
            <div className="loading">Loading your crew...</div>
          ) : agents.length === 0 ? (
            <div className="empty-state">
              <p>No crew members found. Add agents to ~/.claude/agents/ to see them here!</p>
            </div>
          ) : (
            agents.map((agent) => (
              <AgentCard
                key={`${agent.scope}-${agent.name}`}
                agent={agent}
              />
            ))
          )}
        </main>
      </div>
    </div>
  )
}

export default App
