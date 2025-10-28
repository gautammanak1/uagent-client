/**
 * uAgent Client - Node.js Module
 * 
 * Provides an easy-to-use interface for Node.js applications
 * to communicate with uAgents. Automatically manages bridge agent lifecycle.
 */

const axios = require('axios');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Global bridge registry - stores user-specific bridges
const bridgeRegistry = new Map();

class UAgentClient {
    /**
     * Create a new uAgent client
     * @param {Object} config - Configuration object
     * @param {string} config.bridgeUrl - URL of the bridge agent (default: http://localhost:8000)
     * @param {number} config.timeout - Request timeout in milliseconds (default: 35000)
     * @param {boolean} config.autoStartBridge - Auto-start bridge agent (default: true)
     * @param {number} config.bridgePort - Port for bridge agent (default: 8000)
     * @param {string} config.userSeed - Unique seed for per-user bridge agent
     * @param {string} config.agentverseToken - Bearer token for Agentverse registration
     */
    constructor(config = {}) {
        this.bridgeUrl = config.bridgeUrl || 'http://localhost:8000';
        this.timeout = config.timeout || 35000;
        this.autoStartBridge = config.autoStartBridge !== false; // default true
        this.bridgePort = config.bridgePort || 8000;
        this.userSeed = config.userSeed;
        this.agentverseToken = config.agentverseToken;
        this.instanceId = crypto.randomBytes(4).toString('hex');
        this.isRegistered = false;
        this.userBridgeId = null;
        
        // If user provides seed and token, use per-user bridge
        if (this.userSeed && this.agentverseToken) {
            this.userBridgeId = this._getBridgeId(this.userSeed);
            // Don't auto-start, will be started when bridge is created
            this.autoStartBridge = false;
        }
        
        // Auto-start bridge agent if enabled (shared across all instances)
        if (this.autoStartBridge && !this.userBridgeId) {
            this._initBridgeAgent();
        }
    }

    /**
     * Generate a unique request ID
     * @returns {string} Unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Get or create a per-user bridge agent
     * @param {string} seed - Unique seed for the user
     * @param {string} agentverseToken - Bearer token for Agentverse
     * @param {number} port - Optional port number
     * @returns {Promise<Object>} Bridge agent info
     */
    async createUserBridge(seed, agentverseToken, port = null) {
        const bridgeId = this._getBridgeId(seed);
        
        // Check if bridge already exists
        if (bridgeRegistry.has(bridgeId)) {
            const bridgeInfo = bridgeRegistry.get(bridgeId);
            this.bridgeUrl = `http://localhost:${bridgeInfo.port}`;
            return bridgeInfo;
        }

        // Find bridge_agent.py
        const bridgePath = this._findBridgeAgent();
        if (!bridgePath) {
            throw new Error('Bridge agent not found');
        }

        // Create temporary Python script file
        const tempScript = path.join(__dirname, 'temp_create_bridge.py');
        
        // Properly escape the path for Python raw string
        const bridgeDir = path.dirname(bridgePath).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        
        const pythonScript = `#!/usr/bin/env python
import sys
import os
import json
import logging
import contextlib
import io
import signal
import time

# Suppress ALL logging and print statements
logging.basicConfig(level=logging.CRITICAL, format='')

# Redirect stdout temporarily to capture JSON output
output_capture = io.StringIO()

try:
    sys.path.insert(0, r'${bridgeDir}')
    
    # Also suppress print statements from bridge_agent
    original_print = print
    def silent_print(*args, **kwargs):
        pass
    
    import builtins
    builtins.print = silent_print
    
    from bridge_agent import create_bridge_agent
    
    # Capture stdout temporarily
    original_stdout = sys.stdout
    sys.stdout = output_capture
    
    # Create the bridge agent
    agent_info = create_bridge_agent(
        seed="${seed}",
        agentverse_token="${agentverseToken}",
        port=${port || 'None'},
        mailbox=True
    )
    
    # Get the captured output
    captured = output_capture.getvalue()
    
    # Restore stdout
    sys.stdout = original_stdout
    builtins.print = original_print
    
    # Output JSON to stderr (not stdout!) so the main process can read it
    json_output = json.dumps({
        "name": agent_info["name"],
        "address": agent_info.get("address", ""),
        "port": agent_info["port"],
        "seed": agent_info["seed"]
    })
    sys.stderr.write(json_output + "\\n")
    sys.stderr.flush()
    
    # Wait for the agent thread to be fully ready
    time.sleep(3)
    
    # Keep the process alive so the agent thread keeps running
    # The thread will be killed when this process exits
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
        
except Exception as e:
    sys.stderr.write(json.dumps({"error": str(e)}) + "\\n")
    sys.exit(1)
`;

        try {
            // Write script to temp file
            require('fs').writeFileSync(tempScript, pythonScript);
            
            // Spawn Python script as background process
            const { spawn } = require('child_process');
            const pythonProcess = spawn('python', [tempScript], {
                stdio: ['ignore', 'pipe', 'pipe'] // stdin, stdout, stderr
            });
            
            // Read JSON from stderr (we write it there to avoid stdout interference)
            let jsonOutput = '';
            
            // Wait for JSON output (bridge info will be on a single line)
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    pythonProcess.kill();
                    reject(new Error('Timeout waiting for bridge info'));
                }, 10000);
                
                pythonProcess.stderr.on('data', (data) => {
                    const output = data.toString();
                    jsonOutput += output;
                    
                    // Look for JSON line (starts with {)
                    const lines = output.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('{')) {
                            jsonOutput = line.trim();
                            clearTimeout(timeout);
                            resolve();
                            return;
                        }
                    }
                });
                
                pythonProcess.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
            // Parse JSON from stderr output
            const bridgeInfo = JSON.parse(jsonOutput);
            
            // Store process reference
            bridgeInfo.pid = pythonProcess.pid;
            bridgeInfo.process = pythonProcess; // Keep reference to keep it alive
            
            // Clean up temp file
            try {
                require('fs').unlinkSync(tempScript);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            // Handle process cleanup on exit
            pythonProcess.on('exit', () => {
                bridgeRegistry.delete(bridgeId);
            });
            
            // Store in registry
            bridgeRegistry.set(bridgeId, bridgeInfo);
            
            // Update client's bridge URL
            this.bridgeUrl = `http://localhost:${bridgeInfo.port}`;
            this.userSeed = seed;
            this.agentverseToken = agentverseToken;
            
            // Wait a moment for bridge to be fully ready
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            return bridgeInfo;
        } catch (error) {
            // Clean up on error
            try {
                // Kill any running Python process
                if (typeof pythonProcess !== 'undefined' && !pythonProcess.killed) {
                    pythonProcess.kill();
                }
            } catch (e) {
                // Ignore
            }
            
            try {
                // Clean up temp file
                require('fs').unlinkSync(tempScript);
            } catch (e) {
                // Ignore
            }
            
            throw new Error(`Failed to create user bridge: ${error.message}`);
        }
    }

    /**
     * Get bridge ID from seed
     * @private
     */
    _getBridgeId(seed) {
        return crypto.createHash('sha256').update(seed).digest('hex').substring(0, 16);
    }

    /**
     * Initialize the bridge agent process (shared)
     * @private
     */
    _initBridgeAgent() {
        const bridgePath = this._findBridgeAgent();
        
        if (!bridgePath) {
            this.autoStartBridge = false;
            return;
        }

        this.isRegistered = true;
        this._startBridgeAgent(bridgePath);
    }

    /**
     * Find bridge_agent.py file
     * @private
     */
    _findBridgeAgent() {
        const possiblePaths = [
            path.join(__dirname, 'bridge_agent.py'),
            path.join(__dirname, '..', 'uagent-nodejs-client', 'bridge_agent.py'),
            path.join(process.cwd(), 'node_modules', 'uagent-client', 'bridge_agent.py'),
            path.join(process.cwd(), 'bridge_agent.py')
        ];
        
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        
        return null;
    }

    /**
     * Start the shared bridge agent process
     * @private
     */
    _startBridgeAgent(bridgePath) {
        // Spawn Python process
        const bridgeProcess = spawn('python', [bridgePath], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        this.bridgeProcess = bridgeProcess;

        // Handle stdout
        bridgeProcess.stdout.on('data', (data) => {
            // Output suppressed
        });

        // Handle stderr
        bridgeProcess.stderr.on('data', (data) => {
            // Output suppressed
        });

        // Handle process exit
        bridgeProcess.on('close', (code) => {
            this.bridgeProcess = null;
        });

        // Global cleanup handlers
        if (!global.__bridgeCleanupRegistered) {
            global.__bridgeCleanupRegistered = true;
            
            process.on('exit', () => {
                if (bridgeProcess && !bridgeProcess.killed) {
                    bridgeProcess.kill('SIGTERM');
                }
            });
            
            process.on('SIGINT', () => {
                if (bridgeProcess && !bridgeProcess.killed) {
                    bridgeProcess.kill('SIGTERM');
                }
                process.exit(0);
            });
            
            process.on('SIGTERM', () => {
                if (bridgeProcess && !bridgeProcess.killed) {
                    bridgeProcess.kill('SIGTERM');
                }
                process.exit(0);
            });
        }
    }

    /**
     * Wait for shared bridge agent to be ready
     * @param {number} maxWaitTime - Maximum time to wait in milliseconds
     * @returns {Promise<boolean>} True if bridge is ready
     */
    async waitForBridge(maxWaitTime = 20000) {
        const startTime = Date.now();
        const checkInterval = 1000;
        
        while (Date.now() - startTime < maxWaitTime) {
            if (await this.ping()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        
        return false;
    }

    /**
     * Stop the bridge agent process
     */
    stopBridge() {
        if (this.bridgeProcess && !this.bridgeProcess.killed) {
            this.bridgeProcess.kill('SIGTERM');
            this.bridgeProcess = null;
        }
        
        // Clean up user bridge from registry and kill its process
        if (this.userBridgeId && bridgeRegistry.has(this.userBridgeId)) {
            const bridgeInfo = bridgeRegistry.get(this.userBridgeId);
            if (bridgeInfo && bridgeInfo.process && !bridgeInfo.process.killed) {
                bridgeInfo.process.kill('SIGTERM');
            }
            bridgeRegistry.delete(this.userBridgeId);
        }
    }

    /**
     * Ensure bridge is ready before making requests
     * @private
     */
    async _ensureBridgeReady() {
        if (!this.autoStartBridge && !this.userSeed) {
            return;
        }

        // If using user bridge, create it first
        if (this.userSeed && this.agentverseToken && !this.isRegistered) {
            await this.createUserBridge(this.userSeed, this.agentverseToken, this.bridgePort);
            this.isRegistered = true;
        }

        // Check if bridge is responding
        if (!(await this.ping())) {
            const isReady = await this.waitForBridge();
            
            if (!isReady) {
                throw new Error(
                    'Bridge agent failed to start automatically.\n' +
                    'Please start it manually: python bridge_agent.py\n' +
                    'Or check if Python and required packages are installed.'
                );
            }
        }
    }

    /**
     * Send a query to a uAgent
     * @param {string} agentAddress - The address of the target uAgent
     * @param {string} query - The query/message to send
     * @param {string} [requestId] - Optional request ID (auto-generated if not provided)
     * @returns {Promise<Object>} Response from the agent
     */
    async query(agentAddress, query, requestId = null) {
        if (!agentAddress) {
            throw new Error('Agent address is required');
        }

        if (!query) {
            throw new Error('Query is required');
        }

        // Ensure bridge is ready
        await this._ensureBridgeReady();

        const reqId = requestId || this.generateRequestId();

        try {
            const response = await axios.post(
                `${this.bridgeUrl}/query`,
                {
                    target_agent: agentAddress,
                    query: query,
                    request_id: reqId,
                    seed: this.userSeed || 'default'
                },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = response.data;

            if (!data.success) {
                throw new Error(data.error || 'Query failed');
            }

            return {
                success: true,
                response: data.response,
                requestId: data.request_id
            };

        } catch (error) {
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data.error || error.message,
                    requestId: reqId
                };
            } else if (error.request) {
                return {
                    success: false,
                    error: 'No response from bridge agent. Is it running?',
                    requestId: reqId
                };
            } else {
                return {
                    success: false,
                    error: error.message,
                    requestId: reqId
                };
            }
        }
    }

    /**
     * Send a query and return only the response string (throws on error)
     * @param {string} agentAddress - The address of the target uAgent
     * @param {string} query - The query/message to send
     * @returns {Promise<string>} Response from the agent
     */
    async ask(agentAddress, query) {
        const result = await this.query(agentAddress, query);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        return result.response;
    }

    /**
     * Check if the bridge agent is available
     * @returns {Promise<boolean>} True if bridge is available
     */
    async ping() {
        try {
            const response = await axios.get(`${this.bridgeUrl}/`, { 
                timeout: 3000,
                validateStatus: () => true
            });
            return response.status !== undefined;
        } catch {
            return false;
        }
    }
}

// Export the class
module.exports = UAgentClient;

// Also export a convenience function
module.exports.createClient = (config) => new UAgentClient(config);
