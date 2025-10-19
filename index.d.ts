/**
 * TypeScript definitions for uAgent Node.js Client
 */

export interface UAgentClientConfig {
    /** URL of the bridge agent. Default: 'http://localhost:8000' */
    bridgeUrl?: string;
    /** Request timeout in milliseconds. Default: 35000 */
    timeout?: number;
    /** Automatically start bridge agent. Default: true */
    autoStartBridge?: boolean;
    /** Port for bridge agent. Default: 8000 */
    bridgePort?: number;
}

export interface QueryResponse {
    /** Whether the query was successful */
    success: boolean;
    /** Response from the agent (present if success is true) */
    response?: string;
    /** Error message (present if success is false) */
    error?: string;
    /** Unique request identifier */
    requestId: string;
}

/**
 * Client for communicating with uAgents from Node.js
 * 
 * The bridge agent is automatically started when the client is created.
 * No need to run `python bridge_agent.py` manually!
 * 
 * @example
 * ```typescript
 * // Bridge agent starts automatically!
 * const client = new UAgentClient();
 * 
 * // Query any agent address
 * const result = await client.query(
 *     'agent1q2g97humd4d6mgmcg783s2dsncu8hn37r3sgglu6eqa6es07wk3xqlmmy4v',
 *     'Search for AI news'
 * );
 * if (result.success) {
 *     console.log(result.response);
 * }
 * 
 * // Or use ask() for simpler usage
 * const response = await client.ask(agentAddress, 'Hello!');
 * console.log(response);
 * 
 * // Stop bridge when done (optional, auto-stops on exit)
 * client.stopBridge();
 * ```
 */
export default class UAgentClient {
    /**
     * Create a new uAgent client
     * Bridge agent starts automatically unless autoStartBridge is false
     * @param config - Configuration options
     */
    constructor(config?: UAgentClientConfig);

    /**
     * Send a query to a uAgent and get full response object
     * 
     * @param agentAddress - The address of the target uAgent
     * @param query - The message/query to send
     * @param requestId - Optional custom request ID
     * @returns Promise with response object
     * 
     * @example
     * ```typescript
     * const result = await client.query(
     *     'agent1q2n8a5gnyrywq95xntxf2v3xh4kufsj5gt8umzmfxkf7wn5l7kun7vys96q',
     *     'Hello from Node.js!'
     * );
     * ```
     */
    query(agentAddress: string, query: string, requestId?: string): Promise<QueryResponse>;

    /**
     * Send a query and get only the response string
     * Throws an error if the query fails
     * 
     * @param agentAddress - The address of the target uAgent
     * @param query - The message/query to send
     * @returns Promise with response string
     * @throws Error if the query fails
     * 
     * @example
     * ```typescript
     * try {
     *     const response = await client.ask(
     *         'agent1q2n8a5gnyrywq95xntxf2v3xh4kufsj5gt8umzmfxkf7wn5l7kun7vys96q',
     *         'What is 2 + 2?'
     *     );
     *     console.log(response); // "4"
     * } catch (error) {
     *     console.error('Query failed:', error.message);
     * }
     * ```
     */
    ask(agentAddress: string, query: string): Promise<string>;

    /**
     * Check if the bridge agent is available
     * 
     * @returns Promise with true if bridge is available, false otherwise
     * 
     * @example
     * ```typescript
     * const isAvailable = await client.ping();
     * console.log('Bridge available:', isAvailable);
     * ```
     */
    ping(): Promise<boolean>;

    /**
     * Wait for bridge agent to be ready
     * 
     * @param maxWaitTime - Maximum time to wait in milliseconds (default: 15000)
     * @returns Promise with true if bridge is ready
     */
    waitForBridge(maxWaitTime?: number): Promise<boolean>;

    /**
     * Stop the bridge agent process
     * Automatically called on process exit
     */
    stopBridge(): void;
}

