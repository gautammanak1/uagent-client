# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Primary Method
1. **Email**: Send details to [your-email@example.com] (or create a security email)
2. **Subject**: `[SECURITY] uAgent Client Vulnerability Report`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Alternative Method
- Use [GitHub Security Advisories](https://github.com/gautammanak1/uagent-client/security/advisories/new)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (critical issues get priority)

### What We Expect

- Allow us time to fix the issue before public disclosure
- Provide clear, detailed reports
- Act in good faith

### What You Can Expect

- Confirmation of receipt
- Regular updates on fix progress
- Credit for responsible disclosure (if desired)
- Notification when fix is released

## Security Best Practices

When using uAgent Client:

1. **Never expose tokens in client-side code**
   ```javascript
   // ❌ DON'T
   const token = 'bearer-token'; // In frontend
   
   // ✅ DO
   // Keep tokens in server-side only
   ```

2. **Use environment variables**
   ```bash
   AGENTVERSE_TOKEN=your-token-here
   ```

3. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Validate all inputs**
   - Validate agent addresses
   - Sanitize user queries
   - Check response data

5. **Use HTTPS in production**
   - Always use encrypted connections
   - Verify SSL certificates

## Known Security Considerations

- **Python Bridge Agent**: Runs as a local process; ensure proper network isolation
- **Token Management**: Store tokens securely; never commit to version control
- **User Isolation**: Use per-user bridges for multi-tenant applications

## Reporting Other Issues

For non-security bugs:
- Use [GitHub Issues](https://github.com/gautammanak1/uagent-client/issues)
- Follow the bug report template

Thank you for helping keep uAgent Client secure! 🔒

