# Testing Guide for uAgent-Client

## Overview

This guide explains how to test the uAgent client and verify that it's working correctly with the Fetch.ai Agent Chat Protocol.

## Prerequisites

1. **Python 3.8+** with the following packages:
   ```bash
   pip install uagents>=0.22.7 uagents-core>=0.3.10
   ```

2. **Node.js 14+**

## Component Overview

### 1. bridge_agent.py

The bridge agent acts as a REST API gateway that:
- Receives queries from Node.js via HTTP
- Forwards them to target uAgents using the Chat Protocol
- Returns responses back to Node.js

**Key Features:**
- Uses the standard Agent Chat Protocol
- Supports dynamic agent addressing (any agent can be queried)
- Handles ChatMessage sending and receiving
- Processes ChatAcknowledgement messages
- Automatic mailbox integration

### 2. index.js

The Node.js client that:
- Automatically starts/stops the Python bridge agent
- Provides a simple async/await API
- Manages bridge process lifecycle
- Handles multiple client instances

## Testing the Bridge Agent

### Step 1: Start the Bridge Agent

```bash
cd /Users/engineer/uagent-nodejs-client
python bridge_agent.py
```

Expected output:
```
INFO: [chat-bridge]: Starting agent with address: agent1qw65wc6p4phr53llckjmcwyktzs3r9r9nxugl5v95q4s8682g7sx5x6la0j
INFO: [chat-bridge]: Starting server on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO: [chat-bridge]: Mailbox access token acquired
```

### Step 2: Create a Test Responder Agent

Use the provided `test_responder_agent.py`:

```bash
python test_responder_agent.py
```

This creates an agent that:
- Listens for ChatMessage 
- Sends ChatAcknowledgement
- Responds with echo messages
- Demonstrates proper Chat Protocol usage

**Important:** Copy the agent address from the startup logs!

### Step 3: Test with curl

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "target_agent": "YOUR_AGENT_ADDRESS_HERE",
    "query": "Hello!",
    "request_id": "test_123"
  }'
```

Expected response:
```json
{
  "success": true,
  "response": "Echo: Hello! (received at 2025-10-19T...)",
  "request_id": "test_123"
}
```

## Testing the Node.js Client

### Step 1: Install the Package

```bash
npm install /Users/engineer/uagent-nodejs-client
```

### Step 2: Create a Test Script

```javascript
const UAgentClient = require('uagent-client');

async function test() {
    const client = new UAgentClient();
    
    // Replace with your test agent address
    const agentAddress = 'agent1q2qcvkkzq6ntzl5gjj0f7lw5wsn3upfp3nh8dlpmkn6fhyccuja8gp8fysv';
    
    const result = await client.query(agentAddress, 'Hello from Node.js!');
    
    if (result.success) {
        console.log('Response:', result.response);
    } else {
        console.error('Error:', result.error);
    }
}

test();
```

### Step 3: Run the Test

```bash
node test.js
```

The client will:
1. Automatically start the bridge agent
2. Wait for it to be ready
3. Send your query
4. Return the response

## Common Issues and Solutions

### Issue 1: "ChatMessage.__init__() got an unexpected keyword argument"

**Cause:** Incorrect parameter order or missing `type` field in TextContent

**Solution:** Ensure you're using the correct format:
```python
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text="your message")]
)
```

### Issue 2: "Received unexpected response type" or "Only acknowledgement received"

**Cause:** The target agent only sends ChatAcknowledgement, not ChatMessage responses

**Solution:** The target agent must implement a handler that sends ChatMessage:
```python
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    # Send acknowledgement
    ack = ChatAcknowledgement(
        timestamp=datetime.utcnow(),
        acknowledged_msg_id=msg.msg_id
    )
    await ctx.send(sender, ack)
    
    # Send response message
    response = ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=[TextContent(type="text", text="Your response here")]
    )
    await ctx.send(sender, response)
```

### Issue 3: "Unable to resolve destination endpoint"

**Cause:** Agent not registered or mailbox not configured

**Solution:**
1. Ensure the agent has `mailbox=True`
2. Wait for "Mailbox access token acquired" message
3. For hosted agents, set up mailbox on Agentverse

### Issue 4: "Bridge agent not found"

**Cause:** The bridge_agent.py file is not in the correct location

**Solution:** Ensure bridge_agent.py is in the same directory as index.js

## Understanding the Chat Protocol

The Agent Chat Protocol follows this flow:

1. **Client → Bridge**: HTTP POST request
2. **Bridge → Target Agent**: ChatMessage
3. **Target Agent → Bridge**: ChatAcknowledgement (confirms receipt)
4. **Target Agent → Bridge**: ChatMessage (actual response)
5. **Bridge → Target Agent**: ChatAcknowledgement (confirms receipt)
6. **Bridge → Client**: HTTP response with content

### Message Structure

**ChatMessage:**
```python
{
    "timestamp": "2025-10-19T20:00:00.000000",
    "msg_id": "uuid4-string",
    "content": [
        {
            "type": "text",
            "text": "Your message content"
        }
    ]
}
```

**ChatAcknowledgement:**
```python
{
    "timestamp": "2025-10-19T20:00:00.000000",
    "acknowledged_msg_id": "uuid4-of-original-message",
    "metadata": null
}
```

## Agent Requirements

For an agent to work with the bridge, it must:

1. Include the chat protocol:
```python
from uagents_core.contrib.protocols.chat import chat_protocol_spec
chat_proto = Protocol(spec=chat_protocol_spec)
agent.include(chat_proto, publish_manifest=True)
```

2. Handle ChatMessage and send responses:
```python
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    # Process message and send response
```

3. Use mailbox for communication:
```python
agent = Agent(mailbox=True)
```

## Production Deployment

For production use:

1. **Create dedicated agents** on Agentverse with proper mailbox configuration
2. **Use environment variables** for agent addresses
3. **Implement error handling** and retries
4. **Monitor bridge health** using the ping() method
5. **Set appropriate timeouts** based on expected response times

## Additional Resources

- [Fetch.ai Documentation](https://fetch.ai/docs)
- [uAgents Framework](https://github.com/fetchai/uAgents)
- [Agent Chat Protocol Spec](https://fetch.ai/docs/guides/agents/chat-protocol)

