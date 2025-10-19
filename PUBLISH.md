# Publishing to NPM

## Prerequisites

1. **NPM Account**
   - Create account at: https://www.npmjs.com/signup
   - Verify your email

2. **Login to NPM**
   ```bash
   npm login
   ```
   Enter your username, password, and email

## Pre-Publish Checklist

- [x] Clean codebase (no examples/demos)
- [x] Professional README
- [x] LICENSE file (MIT)
- [x] .npmignore configured
- [x] .gitignore configured
- [x] package.json updated with:
  - [x] Correct name
  - [x] Version (1.0.0)
  - [x] Description
  - [x] Keywords
  - [x] License
  - [x] Repository URL (update this!)
  - [x] Files to include

## Steps to Publish

### 1. Update Package Name (if needed)

If "uagent-client" is taken, choose a unique name:

```bash
npm search uagent-client
```

If taken, update in `package.json`:
```json
{
  "name": "@yourusername/uagent-client"
}
```

### 2. Update Repository URL

In `package.json`, replace:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/gautammanak1/uagent-client"
}
```

With your actual GitHub repository URL.

### 3. Test Package Locally

```bash
# Install dependencies
npm install

# Test if package works
node -e "const client = require('./index.js'); console.log('OK')"
```

### 4. Check What Will Be Published

```bash
npm pack --dry-run
```

This shows what files will be included. Should include:
- index.js
- index.d.ts
- bridge_agent.py
- requirements.txt
- README.md
- LICENSE

### 5. Publish to NPM

```bash
npm publish
```

For scoped packages:
```bash
npm publish --access public
```

### 6. Verify Publication

Visit: `https://www.npmjs.com/package/uagent-client`

## After Publishing

### Install and Test

```bash
npm install uagent-client
```

Test it:
```javascript
const UAgentClient = require('uagent-client');
const client = new UAgentClient();
console.log('Package installed successfully!');
```

### Update Version for Next Release

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

## Troubleshooting

### "Package name already exists"

Choose a different name or use scoped package:
```json
{
  "name": "@yourusername/uagent-client"
}
```

### "You must be logged in"

```bash
npm logout
npm login
```

### "Missing required fields"

Ensure package.json has:
- name
- version
- description
- license
- main
- author (can be empty string)

## Best Practices

1. **Semantic Versioning**
   - 1.0.0 = Major.Minor.Patch
   - Update major for breaking changes
   - Update minor for new features
   - Update patch for bug fixes

2. **README**
   - Keep it comprehensive
   - Include examples
   - Add badges
   - Update after each release

3. **Testing**
   - Test before publishing
   - Use `npm pack` to verify package

4. **GitHub**
   - Push code to GitHub first
   - Update repository URL in package.json
   - Add GitHub badges to README

## Adding Badges to README

```markdown
[![npm version](https://img.shields.io/npm/v/uagent-client.svg)](https://www.npmjs.com/package/uagent-client)
[![npm downloads](https://img.shields.io/npm/dm/uagent-client.svg)](https://www.npmjs.com/package/uagent-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Package Statistics

After publishing, monitor:
- Download stats: https://npm-stat.com/charts.html?package=uagent-client
- npm trends: https://www.npmtrends.com/uagent-client

## Done!

Your package is now live on NPM! 🎉

Users can install it:
```bash
npm install uagent-client
```

