"""
Test Responder Agent - Responds to chat messages for testing the bridge
"""
from datetime import datetime
from uuid import uuid4
from uagents import Agent, Protocol, Context
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

# Create test agent
test_agent = Agent(
    name="test-responder",
    seed="test-responder-seed",
    port=8002,
    mailbox=True
)

# Initialize chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

@test_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Test Responder Agent started")
    ctx.logger.info(f"Address: {ctx.agent.address}")
    ctx.logger.info(f"Ready to respond to chat messages!")

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and send responses"""
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"📥 Received from {sender}: {item.text}")
            
            # Send acknowledgement
            ack = ChatAcknowledgement(
                timestamp=datetime.utcnow(),
                acknowledged_msg_id=msg.msg_id
            )
            await ctx.send(sender, ack)
            ctx.logger.info(f"✅ Sent acknowledgement")
            
            # Send response message
            response_text = f"Echo: {item.text} (received at {datetime.utcnow().isoformat()})"
            response = ChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=response_text)]
            )
            await ctx.send(sender, response)
            ctx.logger.info(f"📤 Sent response: {response_text}")

@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle acknowledgements"""
    ctx.logger.info(f"✅ Received acknowledgement from {sender}")

# Include chat protocol
test_agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    test_agent.run()

