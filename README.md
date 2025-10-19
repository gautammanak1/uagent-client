# uAgent Client

A lightweight Node.js/TypeScript client for communicating with [Fetch.ai](https://fetch.ai) uAgents. Query any uAgent in the Fetch.ai ecosystem directly from your JavaScript/TypeScript application.

[![npm version](https://img.shields.io/npm/v/uagent-client.svg)](https://www.npmjs.com/package/uagent-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/gautammanak1/uagent-client?style=social)](https://github.com/gautammanak1/uagent-client)

**Repository**: [github.com/gautammanak1/uagent-client](https://github.com/gautammanak1/uagent-client)

## Features

- ✅ **Zero Configuration** - Works out of the box
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Parallel Queries** - Query multiple agents simultaneously
- ✅ **Automatic Management** - Handles all lifecycle automatically
- ✅ **Promise-based API** - Modern async/await support

## Installation

```bash
npm install uagent-client
```

### Prerequisites

- Node.js 14 or higher
- Python 3.8+ with `uagents` package installed:

```bash
pip install uagents uagents-core
```

## Quick Start

```javascript
const UAgentClient = require('uagent-client');

// Create client
const client = new UAgentClient();

// Query an agent
const result = await client.query(
    'agent1q2g97humd4d6mgmcg783s2dsncu8hn37r3sgglu6eqa6es07wk3xqlmmy4v',
    'Search for pizza restaurants in New York'
);

if (result.success) {
    console.log(result.response);
}
```

## Usage

### Basic Query

```javascript
const UAgentClient = require('uagent-client');

async function queryAgent() {
    const client = new UAgentClient();
    
    const result = await client.query(agentAddress, 'Your query here');
    
    if (result.success) {
        console.log(result.response);
    } else {
        console.error(result.error);
    }
}
```

### TypeScript

```typescript
import UAgentClient, { QueryResponse } from 'uagent-client';

async function queryAgent(): Promise<void> {
    const client = new UAgentClient();
    
    const result: QueryResponse = await client.query(
        agentAddress,
        'Your query'
    );
    
    if (result.success) {
        console.log(result.response);
    }
}
```

### Configuration

```javascript
const client = new UAgentClient({
    timeout: 60000,  // Request timeout in milliseconds (default: 35000)
    bridgeUrl: 'http://localhost:8000',  // Bridge URL (default)
    autoStartBridge: true  // Auto-start bridge (default: true)
});
```

## API Reference

### `UAgentClient`

#### Constructor

```typescript
new UAgentClient(config?: {
    timeout?: number;
    bridgeUrl?: string;
    autoStartBridge?: boolean;
})
```

**Parameters:**
- `timeout` - Request timeout in milliseconds (default: 35000)
- `bridgeUrl` - Bridge server URL (default: 'http://localhost:8000')
- `autoStartBridge` - Automatically start bridge (default: true)

#### Methods

##### `query(agentAddress: string, query: string, requestId?: string): Promise<QueryResponse>`

Send a query to a uAgent.

**Parameters:**
- `agentAddress` - The address of the target uAgent
- `query` - The query/message to send
- `requestId` - Optional request ID (auto-generated if not provided)

**Returns:**
```typescript
{
    success: boolean;
    response?: string;  // Present if success is true
    error?: string;     // Present if success is false
    requestId: string;
}
```

**Example:**
```javascript
const result = await client.query(agentAddress, 'What is AI?');
```

##### `ask(agentAddress: string, query: string): Promise<string>`

Send a query and get only the response string. Throws error if query fails.

**Parameters:**
- `agentAddress` - The address of the target uAgent
- `query` - The query/message to send

**Returns:** `Promise<string>` - The response from the agent

**Throws:** Error if the query fails

**Example:**
```javascript
const response = await client.ask(agentAddress, 'What is AI?');
console.log(response);
```

##### `ping(): Promise<boolean>`

Check if the client is ready to send queries.

**Returns:** `Promise<boolean>` - true if ready

**Example:**
```javascript
const isReady = await client.ping();
```

##### `stopBridge(): void`

Stop the client. Call this when you're done to cleanup resources.

**Example:**
```javascript
client.stopBridge();
```

## Advanced Usage

### Parallel Queries

Query multiple agents simultaneously:

```javascript
const client = new UAgentClient();

const results = await Promise.all([
    client.query(agent1, 'Query 1'),
    client.query(agent2, 'Query 2'),
    client.query(agent3, 'Query 3')
]);

results.forEach((result, i) => {
    if (result.success) {
        console.log(`Agent ${i + 1}:`, result.response);
    }
});
```

### Error Handling

```javascript
try {
    const result = await client.query(agentAddress, query);
    
    if (result.success) {
        // Handle success
        console.log(result.response);
    } else {
        // Handle failure
        console.error(result.error);
    }
} catch (error) {
    // Handle exception
    console.error('Request failed:', error.message);
}
```

### Express.js Integration

```javascript
const express = require('express');
const UAgentClient = require('uagent-client');

const app = express();
const client = new UAgentClient();

app.use(express.json());

app.post('/api/query', async (req, res) => {
    try {
        const { agentAddress, query } = req.body;
        
        const result = await client.query(agentAddress, query);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
```

### React Example

```javascript
import { useState } from 'react';

function AgentQuery() {
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleQuery = async () => {
        setLoading(true);
        
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentAddress: 'agent1q2g97...',
                    query: 'Your query'
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                setResponse(data.response);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleQuery} disabled={loading}>
                Query Agent
            </button>
            {response && <div>{response}</div>}
        </div>
    );
}
```

## TypeScript Support

Full TypeScript definitions are included. Import types:

```typescript
import UAgentClient, { 
    QueryResponse, 
    UAgentClientConfig 
} from 'uagent-client';

const config: UAgentClientConfig = {
    timeout: 60000
};

const client = new UAgentClient(config);

const result: QueryResponse = await client.query(
    agentAddress,
    query
);
```

## Multiple Client Instances

Multiple client instances automatically share resources:

```javascript
const client1 = new UAgentClient();
const client2 = new UAgentClient();
const client3 = new UAgentClient();

// All clients share the same connection
// No conflicts, automatic management
```

## Performance Tips

### 1. Reuse Client Instance

```javascript
// Good - Reuse client
const client = new UAgentClient();
app.use((req, res, next) => {
    req.client = client;
    next();
});

// Avoid - Creating new client per request
app.post('/api/query', async (req, res) => {
    const client = new UAgentClient(); // ❌ Don't do this
    // ...
});
```

### 2. Set Appropriate Timeout

```javascript
// For fast agents
const client = new UAgentClient({ timeout: 10000 });

// For slow/complex agents
const client = new UAgentClient({ timeout: 120000 });
```

### 3. Parallel Processing

```javascript
// Query multiple agents in parallel
const results = await Promise.all(
    agentAddresses.map(addr => client.query(addr, query))
);
```

## Troubleshooting

### "Failed to start"

**Solution:** Ensure Python 3.8+ is installed with uagents package:
```bash
python3 --version
pip install uagents uagents-core
```

### "No response"

**Possible causes:**
- Agent is offline or not responding
- Incorrect agent address
- Network connectivity issues
- Timeout too short

**Solution:** Increase timeout or verify agent status:
```javascript
const client = new UAgentClient({ timeout: 120000 });
```

### "Port already in use"

**Solution:** Only create one client instance per application, or specify different port:
```javascript
const client = new UAgentClient({ 
    bridgeUrl: 'http://localhost:8001' 
});
```

## Examples

### Simple Query

```javascript
const UAgentClient = require('uagent-client');

const client = new UAgentClient();

const result = await client.query(
    'agent1q2g97humd4d6mgmcg783s2dsncu8hn37r3sgglu6eqa6es07wk3xqlmmy4v',
    'Search for restaurants'
);

console.log(result.response);
```

### Batch Processing

```javascript
const agents = [
    { address: 'agent1...', query: 'Query 1' },
    { address: 'agent2...', query: 'Query 2' },
    { address: 'agent3...', query: 'Query 3' }
];

const results = await Promise.all(
    agents.map(a => client.query(a.address, a.query))
);

const successful = results.filter(r => r.success);
console.log(`${successful.length}/${results.length} queries succeeded`);
```

### With Retry Logic

```javascript
async function queryWithRetry(client, address, query, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const result = await client.query(address, query);
        
        if (result.success) {
            return result;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Max retries exceeded');
}
```

## Best Practices

1. **Create one client instance** per application
2. **Set appropriate timeouts** based on expected response times
3. **Handle errors gracefully** - agents may be offline
4. **Use TypeScript** for better type safety
5. **Implement retry logic** for critical operations
6. **Close client** when done: `client.stopBridge()`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- **GitHub Repository**: [gautammanak1/uagent-client](https://github.com/gautammanak1/uagent-client)
- [Fetch.ai](https://fetch.ai)
- [uAgents Framework](https://github.com/fetchai/uAgents)
- [Documentation](https://docs.fetch.ai)

## Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/gautammanak1/uagent-client/issues)
- **Repository**: [github.com/gautammanak1/uagent-client](https://github.com/gautammanak1/uagent-client)
- **NPM Package**: [npmjs.com/package/uagent-client](https://www.npmjs.com/package/uagent-client)

## Author

**Gautam Manak**
- GitHub: [@gautammanak1](https://github.com/gautammanak1)
- Repository: [uagent-client](https://github.com/gautammanak1/uagent-client)

---

Made with ❤️ for the Fetch.ai ecosystem
