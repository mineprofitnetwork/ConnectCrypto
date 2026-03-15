@echo off
TITLE ConnectCrypto Protocol Initialization

:: Protocol Step 1: Configure Gateway Credentials
echo [SYSTEM] Establishing Protocol Identity with Global Gateway...
ngrok config add-authtoken 3AVOU63MVMCjw7FxHDF8zD42uLH_7Gwa21ugoMq4e3YkgZDuZ

:: Protocol Step 2: Spawn Services in Parallel Tabs
:: This command opens two new tabs in the CURRENT Windows Terminal window
:: Tab 1: Local Development Server (Port 9002)
:: Tab 2: Ngrok HTTP Tunnel (Port 9002)

echo [SYSTEM] Activating Network Nodes in Parallel Windows...
start cmd /k "TITLE ConnectCrypto: Local Server && echo Protocol: Local Server Initialization... && set HOST=127.0.0.1 && npm run dev"
start cmd /k "TITLE ConnectCrypto: External Tunnel && echo Protocol: External Tunnel Activation... && timeout /t 10 && ngrok http 127.0.0.1:9002"

echo [SYSTEM] Protocol Services have been dispatched to new tabs.
echo [SYSTEM] Monitor the newly opened tabs for live network status.
pause
