# Claude Crew

Generate beautiful social images of your Claude Code agents. Turn your agent team into shareable artwork.

## Why Claude Crew?

I love the personalized way we can create agents and subagents - each one with its own personality and purpose. I wanted to bring that same feeling to Claude Code and make it look cool while doing it.

The visual design is inspired by [Kimi 2.5's agent swarm visualization](https://kimi.ai), which showcases agents as a cohesive team rather than just a list of tools.

## Installation

```bash
npm install -g claude-crew
```

Requires Node.js >= 18.0.0

## Usage

### Generate a crew image

```bash
claude-crew generate
```

This will:
1. Scan your agents from `~/.claude/agents/`
2. Include installed plugins from `~/.claude/plugins/`
3. Generate unique names, taglines, and avatars for each agent using AI
4. Output a shareable PNG image

**Options:**
```bash
claude-crew generate -o ./my-crew.png    # Custom output path
claude-crew generate --no-plugins         # Exclude plugins
claude-crew generate -a ~/custom/agents   # Custom agents directory
```

### List your agents

```bash
claude-crew list
```

Shows all agents and plugins with their descriptions.

## Example Output

Your generated image will feature your agents as stylized cards, each with:
- A unique display name (AI-generated)
- A personalized tagline
- A distinctive avatar
- The original agent identifier

## How It Works

1. **Agent Discovery**: Scans markdown files in `~/.claude/agents/` with YAML frontmatter
2. **Plugin Discovery**: Finds installed plugins in `~/.claude/plugins/`
3. **AI Enrichment**: Generates creative names and taglines for each agent
4. **Avatar Generation**: Creates unique [DiceBear Notionists](https://www.dicebear.com/styles/notionists/) avatars
5. **Image Rendering**: Composes everything into a polished PNG

---

## Web Interface (Development)

Claude Crew also includes a web interface for browsing and managing agents visually.

### Project Structure

```
claude-crew/
├── cli/          # CLI tool (npm package)
├── frontend/     # React 19 + Vite 7 web interface
├── backend/      # Express API for agent management
└── shared/       # Shared utilities (avatar, frontmatter, card rendering)
```

### Running Locally

```bash
# Install dependencies
cd shared && npm install
cd ../backend && npm install
cd ../frontend && npm install

# Start backend (from backend/)
npm run dev

# Start frontend (from frontend/)
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

### Features

- **Agent Cards**: Interactive 3D flip cards with summaries and specs
- **Skills Panel**: View and manage Claude Code skills
- **Real-time Sync**: Agents sync from your local directory

---

## Credits

- **Avatar Style**: [DiceBear Notionists](https://www.dicebear.com/styles/notionists/)
- **UI Inspiration**: [Kimi 2.5](https://kimi.ai) agent swarm design

## License

MIT
