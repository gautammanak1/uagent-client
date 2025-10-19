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

// Global shared bridge state for multiple clients
let sharedBridgeProcess = null;
let bridgeRefCount = 0;
let bridgeReadyState = false;
let bridgeStartingState = false;

class UAgentClient {
    /**
     * Create a new uAgent client
     * @param {Object} config - Configuration object
     * @param {string} config.bridgeUrl - URL of the bridge agent (default: http://localhost:8000)
     * @param {number} config.timeout - Request timeout in milliseconds (default: 35000)
     * @param {boolean} config.autoStartBridge - Auto-start bridge agent (default: true)
     * @param {number} config.bridgePort - Port for bridge agent (default: 8000)
     */
    constructor(config = {}) {
        this.bridgeUrl = config.bridgeUrl || 'http://localhost:8000';
        this.timeout = config.timeout || 35000;
        this.autoStartBridge = config.autoStartBridge !== false; // default true
        this.bridgePort = config.bridgePort || 8000;
        this.instanceId = crypto.randomBytes(4).toString('hex');
        this.isRegistered = false;
        
        // Auto-start bridge agent if enabled (shared across all instances)
        if (this.autoStartBridge) {
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
     * Initialize the bridge agent process (shared)
     * @private
     */
    _initBridgeAgent() {
        const bridgePath = path.join(__dirname, 'bridge_agent.py');
        
        // Check if bridge_agent.py exists
        if (!fs.existsSync(bridgePath)) {
            console.warn('⚠️  Bridge agent not found at:', bridgePath);
            console.warn('    Please ensure bridge_agent.py is in the module directory.');
            this.autoStartBridge = false;
            return;
        }

        // Increment reference count
        bridgeRefCount++;
        this.isRegistered = true;
        
        if (process.env.DEBUG_BRIDGE === 'verbose') {
            console.log(`[Client ${this.instanceId}] Registered. Total clients: ${bridgeRefCount}`);
        }

        // Start bridge only if not already started or starting
        if (!sharedBridgeProcess && !bridgeStartingState) {
            this._startBridgeAgent(bridgePath);
        } else if (bridgeReadyState) {
            if (process.env.DEBUG_BRIDGE !== 'silent') {
                console.log(`🔗 Using existing bridge at ${this.bridgeUrl}`);
            }
        }
    }

    /**
     * Start the shared bridge agent process
     * @private
     */
    _startBridgeAgent(bridgePath) {
        if (sharedBridgeProcess || bridgeStartingState) {
            return; // Already starting or started
        }

        bridgeStartingState = true;
        console.log('🌉 Starting shared bridge agent...');
        console.log(`   (Client ${this.instanceId}, Total clients: ${bridgeRefCount})`);
        
        // Spawn Python process
        sharedBridgeProcess = spawn('python', [bridgePath], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        // Handle stdout
        sharedBridgeProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Starting server on') || output.includes('Uvicorn running')) {
                bridgeReadyState = true;
                bridgeStartingState = false;
                if (process.env.DEBUG_BRIDGE !== 'silent') {
                    console.log('✅ Shared bridge ready at', this.bridgeUrl);
                    console.log(`   Available for ${bridgeRefCount} client(s)`);
                }
            }
            // Log bridge output in debug mode
            if (process.env.DEBUG_BRIDGE === 'verbose') {
                console.log('[Bridge]', output.trim());
            }
        });

        // Handle stderr
        sharedBridgeProcess.stderr.on('data', (data) => {
            const error = data.toString();
            // Only show important errors
            if (!error.includes('WARNING') && process.env.DEBUG_BRIDGE === 'verbose') {
                console.error('[Bridge]', error.trim());
            }
        });

        // Handle process exit
        sharedBridgeProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
                console.warn(`⚠️  Shared bridge agent exited with code ${code}`);
            }
            bridgeReadyState = false;
            bridgeStartingState = false;
            sharedBridgeProcess = null;
        });

        // Global cleanup handlers (only set once)
        if (!global.__bridgeCleanupRegistered) {
            global.__bridgeCleanupRegistered = true;
            
            process.on('exit', () => {
                if (sharedBridgeProcess && !sharedBridgeProcess.killed) {
                    sharedBridgeProcess.kill('SIGTERM');
                }
            });
            
            process.on('SIGINT', () => {
                if (sharedBridgeProcess && !sharedBridgeProcess.killed) {
                    console.log('\n🛑 Stopping shared bridge...');
                    sharedBridgeProcess.kill('SIGTERM');
                }
                process.exit(0);
            });
            
            process.on('SIGTERM', () => {
                if (sharedBridgeProcess && !sharedBridgeProcess.killed) {
                    sharedBridgeProcess.kill('SIGTERM');
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
        let lastLog = 0;
        const checkInterval = 1000;  // Check every second
        
        // If bridge just reported ready, give it a moment
        if (bridgeReadyState) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }
        
        while (Date.now() - startTime < maxWaitTime) {
            // Show progress every 4 seconds
            if (Date.now() - lastLog > 4000) {
                console.log('⏳ Waiting for shared bridge...');
                lastLog = Date.now();
            }
            
            if (await this.ping()) {
                bridgeReadyState = true;
                console.log('✅ Shared bridge is responsive');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        
        return false;
    }

    /**
     * Stop the shared bridge agent process (decrements ref count)
     * Only stops if this is the last client
     */
    stopBridge() {
        if (!this.isRegistered) {
            return; // Not registered
        }

        // Decrement reference count
        bridgeRefCount = Math.max(0, bridgeRefCount - 1);
        this.isRegistered = false;
        
        if (process.env.DEBUG_BRIDGE === 'verbose') {
            console.log(`[Client ${this.instanceId}] Unregistered. Remaining clients: ${bridgeRefCount}`);
        }

        // Only stop bridge if no more clients
        if (bridgeRefCount === 0 && sharedBridgeProcess && !sharedBridgeProcess.killed) {
            console.log('🛑 Stopping shared bridge (no more clients)...');
            sharedBridgeProcess.kill('SIGTERM');
            sharedBridgeProcess = null;
            bridgeReadyState = false;
            bridgeStartingState = false;
        } else if (bridgeRefCount > 0) {
            if (process.env.DEBUG_BRIDGE === 'verbose') {
                console.log(`🔗 Bridge still in use by ${bridgeRefCount} client(s)`);
            }
        }
    }

    /**
     * Ensure bridge is ready before making requests
     * @private
     */
    async _ensureBridgeReady() {
        if (!this.autoStartBridge) {
            return; // User manages bridge manually
        }

        if (bridgeReadyState) {
            return; // Shared bridge already ready
        }

        const isReady = await this.waitForBridge();
        
        if (!isReady) {
            throw new Error(
                'Shared bridge agent failed to start automatically.\n' +
                'Please start it manually: python bridge_agent.py\n' +
                'Or check if Python and required packages are installed.'
            );
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
                    request_id: reqId
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
                // Bridge returned an error response
                return {
                    success: false,
                    error: error.response.data.error || error.message,
                    requestId: reqId
                };
            } else if (error.request) {
                // No response received
                return {
                    success: false,
                    error: 'No response from bridge agent. Is it running?',
                    requestId: reqId
                };
            } else {
                // Error setting up request
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
            // Try to connect to the bridge - any response means it's alive
            const response = await axios.get(`${this.bridgeUrl}/`, { 
                timeout: 3000,
                validateStatus: () => true  // Accept any status code
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
