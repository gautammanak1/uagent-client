"""
uAgent Bridge - REST API with Chat Protocol
Allows Node.js/frontend to send messages to any uAgent using chat protocol
"""
from datetime import datetime
from uuid import uuid4
from uagents import Agent, Protocol, Context, Model
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)
import asyncio


# REST API Models
class BridgeRequest(Model):
    """Request format from Node.js/frontend client"""
    target_agent: str  # Dynamic agent address from frontend
    query: str
    request_id: str


class BridgeResponse(Model):
    """Response format to Node.js/frontend client"""
    success: bool
    response: str
    request_id: str
    error: str = ""


# Create the bridge agent
bridge_agent = Agent(
    name="chat-bridge",
    seed="chat-bridge-seed",
    port=8000,
    mailbox=True
)

# Initialize chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Store pending requests (request_id -> response data)
pending_requests = {}


@bridge_agent.on_event("startup")
async def startup(ctx: Context):
    """Startup handler"""
    ctx.logger.info("=" * 60)
    ctx.logger.info("🌉 uAgent Bridge Server with Chat Protocol")
    ctx.logger.info("=" * 60)
    ctx.logger.info(f"Bridge Agent Address: {ctx.agent.address}")
    ctx.logger.info(f"REST Endpoint: http://localhost:8000/query")
    ctx.logger.info("Ready to receive queries from Node.js/Frontend...")
    ctx.logger.info("Frontend can send queries to ANY agent address!")
    ctx.logger.info("=" * 60)

# REST endpoint to receive requests from Node.js/Frontend
@bridge_agent.on_rest_post("/query", BridgeRequest, BridgeResponse)
async def handle_query(ctx: Context, req: BridgeRequest) -> BridgeResponse:
    """
    Receives query from frontend and forwards to target uAgent using chat protocol
    Accepts DYNAMIC agent address from frontend
    """
    try:
        ctx.logger.info(f"📥 Received query from frontend:")
        ctx.logger.info(f"  - Query: {req.query}")
        ctx.logger.info(f"  - Target Agent: {req.target_agent}")
        ctx.logger.info(f"  - Request ID: {req.request_id}")
        
        # Create chat message
        message_id = uuid4()
        chat_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=message_id,
            content=[TextContent(type="text", text=req.query)]
        )
        
        # Store request for response tracking
        pending_requests[str(message_id)] = {
            'request_id': req.request_id,
            'response': None,
            'received': False
        }
        
        # Send message to target agent and wait for response
        ctx.logger.info(f"📤 Sending message to {req.target_agent}...")
        
        # Send message and wait for response
        await ctx.send(req.target_agent, chat_msg)
        ctx.logger.info(f"📤 Message sent, waiting for response...")
        
        # Wait for response using interval message
        response_text = None
        max_wait = 60  # 60 seconds max wait
        check_interval = 0.5  # Check every 500ms
        elapsed = 0
        
        # Store request ID for message handler to find
        pending_requests[str(message_id)] = {
            'request_id': req.request_id,
            'response': None,
            'received': False,
            'sender': None
        }
        
        # Wait for response
        while elapsed < max_wait:
            await asyncio.sleep(check_interval)
            elapsed += check_interval
            
            # Check if we received response
            if pending_requests[str(message_id)]['received']:
                response_text = pending_requests[str(message_id)]['response']
                sender = pending_requests[str(message_id)]['sender']
                
                ctx.logger.info(f"📥 Received response: {response_text[:100]}...")
                
                # Clean up
                del pending_requests[str(message_id)]
                
                return BridgeResponse(
                    success=True,
                    response=response_text,
                    request_id=req.request_id
                )
        
        # Timeout - no response received
        ctx.logger.error(f"⏰ Timeout waiting for response from {req.target_agent}")
        del pending_requests[str(message_id)]
        
        return BridgeResponse(
            success=False,
            response="",
            request_id=req.request_id,
            error=f"Timeout waiting for response from target agent"
        )
            
    except Exception as e:
        ctx.logger.error(f"❌ Error handling query: {str(e)}")
        return BridgeResponse(
            success=False,
            response="",
            request_id=req.request_id,
            error=str(e)
        )


# Handle incoming chat messages (responses from target agents)
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages (responses)"""
    ctx.logger.info(f"💬 Received message from {sender}")
    
    # Extract text
    message_text = ""
    for item in msg.content:
        if isinstance(item, TextContent):
            message_text += item.text
            ctx.logger.info(f"  Message: {item.text[:100]}...")
    
    # Find matching pending request
    for msg_id, data in pending_requests.items():
        if not data['received']:
            # Store response
            data['response'] = message_text
            data['received'] = True
            data['sender'] = sender
            ctx.logger.info(f"✅ Matched response to pending request {msg_id}")
            break
    
    # Send acknowledgement
    ack = ChatAcknowledgement(
        acknowledged_msg_id=msg.msg_id,
        timestamp=datetime.utcnow()
    )
    await ctx.send(sender, ack)


# Handle acknowledgements
@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle message acknowledgements"""
    ctx.logger.info(f"✅ Received acknowledgement from {sender}")


# Include chat protocol
bridge_agent.include(chat_proto, publish_manifest=True)


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🌉 uAgent Bridge Server with Chat Protocol")
    print("=" * 60)
    print(f"Bridge Agent Address: {bridge_agent.address}")
    print(f"REST Endpoint: http://localhost:8000/query")
    print("Ready to receive queries from Node.js/Frontend...")
    print("Frontend can send queries to ANY agent address!")
    print("=" * 60 + "\n")
    print("Press Ctrl+C to stop")
    print("=" * 60 + "\n")
    
    bridge_agent.run()
