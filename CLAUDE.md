# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Claude Crew is a GUI frontend for creating and managing Claude Code subagents. The goal is to replace CLI-based agent creation with a visual interface where:
- **Claude Code agents are the source of truth** for agent definitions
- **Skills map to Claude Code skills** and can be assigned to individual agents
- **Agent descriptions summarize the instruction** from Claude Code agents

## Commands

```bash
# Development
npm run dev          # Start Vite dev server with HMR

# Build
npm run build        # Production build

# Linting
npm run lint         # Run ESLint
```

## Architecture

**Stack:** React 19 + Vite 7 (frontend-only, no backend yet)

### Component Structure

```
frontend/src/
├── App.jsx                  # Root component, manages agent state
├── components/
│   ├── AgentCard.jsx        # Flip card displaying agent info (front: summary, back: specs)
│   └── CreateAgentModal.jsx # Modal form for creating new agents
```

### Key Patterns

- **3D Flip Cards**: AgentCard uses CSS `transform: rotateY(180deg)` with `transform-style: preserve-3d` for interactive card flips
- **CSS Variables**: Global theming via `--color-*` and `--radius-*` in `index.css`
- **Local State Only**: No state management library; React hooks handle all state
- **Grid Layout**: Responsive agent grid using `grid-template-columns: repeat(auto-fill, 280px)`

### Static Assets

- `/public/avatars/` - Pre-sliced avatar images (32x32 pixel art style)
- `slice_avatars.py` - Python utility to slice sprite sheet into individual avatars

## Integration Points

When connecting to Claude Code:
- Agent definitions should sync from Claude Code agent configurations
- Skills should map to Claude Code skill definitions
- The frontend should display agents retrieved from Claude Code, not just local state
