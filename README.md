# VisualGit

Terminal-style git diff viewer with AI-powered explanations.

## Install

```bash
npm install -g @jxtools/visualgit
```

If your environment requires an explicit npm registry:

```bash
npm install -g @jxtools/visualgit --registry https://registry.npmjs.org/
```

## Usage

Navigate to any git repository and run:

```bash
visualgit
```

This opens a browser window with a visual diff between your current branch and its base branch.

## Features

- Colored diff viewer with file tree navigation
- Collapsible file sections with viewed tracking
- AI analysis of your changes on demand (Claude or OpenAI)
- Resizable panels and dark terminal-style UI

## Update

```bash
visualgit update
```

## Requirements

- Node.js 18+
- Must be run inside a git repository
- For AI features: Claude CLI or OpenAI CLI installed

## License

ISC
