#!/usr/bin/env node
/**
 * Quick Test Script for uAgent Client
 * 
 * Usage:
 *   node quick_test.js <agent_address> <message>
 * 
 * Example:
 *   node quick_test.js agent1q2qcvkkzq6ntzl5gjj0f7lw5wsn3upfp3nh8dlpmkn6fhyccuja8gp8fysv "Hello!"
 */

const UAgentClient = require('./index.js');

async function test() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node quick_test.js <agent_address> <message>');
        console.log('');
        console.log('Example:');
        console.log('  node quick_test.js agent1q2qcv... "Hello, Agent!"');
        process.exit(1);
    }
    
    const [agentAddress, message] = args;
    
    console.log('🧪 Testing uAgent Client');
    console.log('========================\n');
    console.log('Target Agent:', agentAddress);
    console.log('Message:', message);
    console.log('');
    
    try {
        console.log('🔧 Initializing client...');
        const client = new UAgentClient({
            timeout: 60000
        });
        
        console.log('📤 Sending query...');
        const result = await client.query(agentAddress, message);
        
        console.log('\n📥 Result:');
        console.log('─────────────────────────');
        
        if (result.success) {
            console.log('✅ Success!');
            console.log('\nResponse:', result.response);
            console.log('Request ID:', result.requestId);
        } else {
            console.log('❌ Failed');
            console.log('\nError:', result.error);
            console.log('Request ID:', result.requestId);
            
            console.log('\n💡 Common issues:');
            console.log('   - Agent might only send acknowledgements (not responses)');
            console.log('   - Agent might not be registered/reachable');
            console.log('   - Mailbox might not be configured');
            console.log('\n   See TEST_GUIDE.md for solutions');
        }
        
        console.log('\n🛑 Stopping bridge...');
        client.stopBridge();
        
        // Give it time to cleanup
        setTimeout(() => {
            console.log('✅ Test complete!');
            process.exit(result.success ? 0 : 1);
        }, 1000);
        
    } catch (error) {
        console.error('\n💥 Exception:', error.message);
        console.error('\n   Check that Python and uagents are installed:');
        console.error('   pip install uagents>=0.22.7 uagents-core>=0.3.10');
        process.exit(1);
    }
}

test();

