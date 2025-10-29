# Contributing to uAgent Client

First off, thank you for considering contributing to uAgent Client! 🎉

We welcome contributions from everyone, and we appreciate your help in making this project better.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **Actual behavior**
- **Environment details** (Node.js version, OS, etc.)
- **Error messages or logs** (if applicable)

### Suggesting Enhancements

Have an idea? We'd love to hear it! Please:

1. Check existing issues to avoid duplicates
2. Open an issue with a clear description
3. Explain the use case and benefits
4. Wait for discussion before implementing

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/gautammanak1/uagent-client.git
   cd uagent-client
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

3. **Make your changes**
   - Write clear, readable code
   - Follow existing code style
   - Add comments where needed
   - Update documentation

4. **Test your changes**
   ```bash
   npm install
   # Test your changes thoroughly
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # Use conventional commits:
   # feat: new feature
   # fix: bug fix
   # docs: documentation changes
   # style: formatting
   # refactor: code restructuring
   # test: adding tests
   # chore: maintenance
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a PR on GitHub with:
   - Clear description
   - Reference to related issues
   - Screenshots (if UI changes)

## 📋 Development Setup

### Prerequisites

- **Node.js** >= 14.0.0
- **Python** >= 3.8 (for bridge agent)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/gautammanak1/uagent-client.git
cd uagent-client

# Install dependencies
npm install

# Install Python dependencies (for testing)
pip install uagents uagents-core requests
```

### Project Structure

```
uagent-nodejs-client/
├── index.js              # Main client implementation
├── index.d.ts           # TypeScript definitions
├── bridge_agent.py      # Python bridge agent
├── package.json         # Package configuration
├── README.md           # Documentation
├── CONTRIBUTING.md     # This file
└── .github/
    └── workflows/      # CI/CD workflows
```

## 🎨 Code Style

- Use **2 spaces** for indentation
- Follow **JavaScript Standard Style**
- Use **TypeScript** for type definitions
- Keep functions **small and focused**
- Add **JSDoc comments** for public APIs
- Use **descriptive variable names**

### Example

```javascript
/**
 * Sends a query to the target uAgent
 * @param {string} agentAddress - The address of the target agent
 * @param {string} query - The query message
 * @returns {Promise<QueryResponse>} Response from the agent
 */
async function query(agentAddress, query) {
  // Implementation
}
```

## ✅ Testing

Before submitting:

1. **Test your changes locally**
2. **Ensure existing functionality still works**
3. **Test edge cases**
4. **Check for linting errors**

```bash
# Check for linting errors
npm run lint  # if available

# Test installation
npm install

# Test basic functionality
node -e "const Client = require('.'); console.log(Client)"
```

## 📝 Documentation

- Update **README.md** if adding features
- Add **code comments** for complex logic
- Update **TypeScript definitions** in `index.d.ts`
- Include **usage examples**

## 🔍 Pull Request Process

1. **Update CHANGELOG.md** (if exists)
2. **Update version** in package.json (maintainer does this)
3. **Ensure all tests pass**
4. **Get approval** from maintainers
5. **Merge** by maintainers

## 🐛 Bug Fix Checklist

- [ ] Issue exists and is reproducible
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tested locally
- [ ] No regressions introduced
- [ ] Documentation updated (if needed)

## ✨ Feature Checklist

- [ ] Issue created and discussed
- [ ] Implementation completed
- [ ] Tests added
- [ ] Documentation updated
- [ ] README examples updated
- [ ] Backward compatibility maintained

## 📞 Getting Help

- **Documentation**: Check [README.md](./README.md)
- **Issues**: Search [existing issues](https://github.com/gautammanak1/uagent-client/issues)
- **Discussions**: Use GitHub Discussions
- **Contact**: Open an issue for questions

## 🙏 Recognition

Contributors will be:
- Listed in README.md (if they want)
- Credited in release notes
- Thanked in PR comments
- Part of making Fetch.ai ecosystem better!

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🚀

