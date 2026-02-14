# VisualGit

Terminal-style git diff viewer with AI-powered explanations.

Run it from any git repo to visualize changes between your current branch and its base branch.

## Quick Start

```bash
npx visualgit
```

Or install globally:

```bash
npm install -g visualgit
visualgit
```

## What It Does

- Detects your current branch and compares it against the base branch (upstream, develop, main, or master)
- Displays a colored diff with additions/deletions in a dark terminal-style UI
- Shows ahead/behind commit counts
- Provides on-demand AI analysis of your changes using Claude CLI or OpenAI

## AI Analysis

The AI panel lets you get explanations of your diff on demand. Click **"Get AI Analysis"** to trigger it - it does not run automatically.

**Supported providers:**

- **Claude** - Uses your existing `claude` CLI login (no API key needed)
- **OpenAI** - Uses your existing `openai` CLI login

Toggle between providers using the dropdown in the AI panel.

## Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run backend dev server (separate terminal)
npm run dev:server

# Run tests
npm test
```

## Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 5 + simple-git
- **AI:** Claude CLI (`claude -p`) / OpenAI CLI
- **Testing:** Vitest

## Requirements

- Node.js 18+
- Git repository (must be run from inside a repo)
- Claude CLI or OpenAI CLI installed for AI features

## License

ISC
