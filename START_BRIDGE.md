# 🌉 Bridge Agent - Permanent Service

## ✅ Bridge Agent is Running!

The bridge agent is now running permanently in the background on port 8000.

### Check Status

```bash
# Check if bridge is running
curl http://localhost:8000/

# Check processes
ps aux | grep bridge_agent
```

### Start Bridge Manually (if needed)

```bash
cd /Users/engineer/uagent-nodejs-client
python bridge_agent.py
```

This will start the bridge and keep it running permanently.

### Stop Bridge

```bash
# Find process
ps aux | grep bridge_agent

# Kill process
pkill -f bridge_agent.py
```

### Bridge Info

- **Port**: 8000
- **Endpoint**: http://localhost:8000/query
- **Address**: agent1qw65wc6p4phr53llckjmcwyktzs3r9r9nxugl5v95q4s8682g7sx5x6la0j

### Your Next.js App

Now your app should work:

```bash
cd /Users/engineer/uagent-chat-app
npm run dev
```

No more errors! The bridge is running permanently in the background.

### Auto-Start on System Boot (Optional)

#### macOS (launchd)

Create file: `~/Library/LaunchAgents/com.uagent.bridge.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.uagent.bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/engineer/uagent-nodejs-client/bridge_agent.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/uagent-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/uagent-bridge-error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.uagent.bridge.plist
```

#### Linux (systemd)

Create file: `/etc/systemd/system/uagent-bridge.service`

```ini
[Unit]
Description=uAgent Bridge Service
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/uagent-nodejs-client
ExecStart=/usr/bin/python3 bridge_agent.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable uagent-bridge
sudo systemctl start uagent-bridge
```

### Logs

Bridge logs show:
- Incoming queries
- Target agents
- Responses received
- Errors (if any)

### Troubleshooting

**Bridge not responding?**
```bash
# Check if running
lsof -i :8000

# Restart
pkill -f bridge_agent.py
python /Users/engineer/uagent-nodejs-client/bridge_agent.py &
```

**Port 8000 in use?**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

## 🚀 Your App is Ready!

Bridge is running permanently. Your Next.js app will work now:

```bash
cd /Users/engineer/uagent-chat-app
npm run dev
```

Visit: http://localhost:3000

Query agents without any bridge errors! ✨

