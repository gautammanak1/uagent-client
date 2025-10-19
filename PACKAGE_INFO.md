# Package Structure

## Files Included in NPM Package

When users install via `npm install uagent-client`, they get:

```
uagent-client/
├── index.js              # Main client code
├── index.d.ts            # TypeScript definitions
├── bridge_agent.py       # Internal bridge (auto-managed)
├── requirements.txt      # Python dependencies
├── README.md             # Documentation
└── LICENSE               # MIT License
```

## What Gets Published

The `files` field in package.json controls this:

```json
"files": [
  "index.js",
  "index.d.ts",
  "bridge_agent.py",
  "requirements.txt",
  "README.md",
  "LICENSE"
]
```

## What Gets Excluded

Via `.npmignore`:
- node_modules/
- Examples
- Test files
- Development files
- IDE configurations
- Log files

## Package Size

Total package size: ~30KB (very lightweight!)

- index.js: ~12KB
- index.d.ts: ~4KB
- bridge_agent.py: ~6KB
- README.md: ~11KB
- Others: ~2KB

## Dependencies

Only ONE runtime dependency:
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

## System Requirements

- Node.js 14+
- Python 3.8+ (for bridge agent)
- uagents Python package

## Installation

```bash
npm install uagent-client
```

Then ensure Python requirements:
```bash
pip install uagents uagents-core
```

## Usage After Installation

```javascript
const UAgentClient = require('uagent-client');
// or
import UAgentClient from 'uagent-client';

const client = new UAgentClient();
```

Everything works automatically!

