#!/bin/bash

# Create the post-push hook directory if it doesn't exist
mkdir -p .git/hooks

# Create the post-push hook file with enhanced terminal output
cat > .git/hooks/post-push << 'EOL'
#!/bin/bash

# Log file for debugging
LOG_FILE="${HOME}/post-push-hook.log"

# Function to log messages to both console and file
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Clear previous log
echo "" > "$LOG_FILE"

# Log start of execution
log_message "Post-push hook starting..."

# Get the current branch name
BRANCH_NAME=$(git symbolic-ref --short HEAD)
log_message "Current branch: $BRANCH_NAME"

# Ensure we're running in an interactive terminal
if [ -t 1 ]; then
    log_message "Running in interactive terminal"
else
    log_message "Not running in interactive terminal - attempting to force terminal output"
    # Force terminal output
    exec </dev/tty >/dev/tty 2>/dev/tty
fi

# Run ai-digest with full output capture
log_message "Running ai-digest command..."

# Create a temporary script to run in VS Code terminal
TEMP_SCRIPT="${HOME}/run-ai-digest.sh"
cat > "$TEMP_SCRIPT" << 'INNEREOF'
#!/bin/bash
echo "Starting ai-digest execution..."
npx ai-digest
echo "ai-digest execution completed"
INNEREOF

chmod +x "$TEMP_SCRIPT"

# If running in VS Code, use the integrated terminal
if [ -n "$VSCODE_PID" ]; then
    log_message "Running in VS Code environment"
    # Try to use VS Code's command to open terminal
    code --wait --reuse-window -e "$TEMP_SCRIPT"
else
    log_message "Running outside VS Code"
    # Run directly if not in VS Code
    "$TEMP_SCRIPT"
fi

# Cleanup
rm "$TEMP_SCRIPT"

log_message "Post-push hook completed"
EOL

# Make the hook executable
chmod +x .git/hooks/post-push

# Configure Git to use the hooks
git config core.hooksPath .git/hooks

# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# New settings to be added
NEW_SETTINGS='{
  "git.enableSmartCommit": true,
  "git.postCommitCommand": "push",
  "git.showPushSuccessNotification": true,
  "terminal.integrated.showExitAlert": true,
  "terminal.integrated.persistentSessionReviveProcess": "onExit",
  "git.terminalAuthentication": true,
  "terminal.integrated.defaultLocation": "view",
  "window.commandCenter": true,
  "terminal.integrated.enablePersistentSessions": true,
  "terminal.integrated.gpuAcceleration": "on",
  "terminal.integrated.tabs.enabled": true,
  "git.terminalGitEditor": true,
  "terminal.integrated.automationProfile.linux": {},
  "terminal.integrated.automationProfile.osx": {},
  "terminal.integrated.automationProfile.windows": {},
  "git.openRepositoryInParentFolders": "always",
  "git.allowNoVerifyCommit": true,
  "git.branchProtection": ["main", "master"],
  "git.followTagsWhenSync": true
}'

# Path to settings file
SETTINGS_FILE=".vscode/settings.json"

# Function to merge JSON objects
merge_json() {
    node -e "
        const fs = require('fs');
        
        // New settings from argument
        const newSettings = $1;
        
        // Read existing settings or create empty object
        let existingSettings = {};
        try {
            if (fs.existsSync('$SETTINGS_FILE')) {
                existingSettings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
            }
        } catch (err) {
            console.error('Error reading existing settings, starting fresh');
        }

        // Merge settings
        const mergedSettings = { ...existingSettings, ...newSettings };

        // Write back to file with proper formatting
        fs.writeFileSync(
            '$SETTINGS_FILE',
            JSON.stringify(mergedSettings, null, 2) + '\n'
        );
    "
}

# Merge the settings
merge_json "$NEW_SETTINGS"

# Create a post-commit hook to ensure terminal is ready
cat > .git/hooks/post-commit << 'EOL'
#!/bin/bash
# Ensure terminal is opened/ready
if [ -n "$VSCODE_PID" ]; then
    code --wait --reuse-window -e "${HOME}/post-commit-temp.txt" 2>/dev/null || true
fi
EOL

chmod +x .git/hooks/post-commit

echo "Git hook setup completed successfully!"
echo "VS Code settings have been merged (existing settings preserved)."
echo "IMPORTANT: The terminal will now show ai-digest output after each push."
echo "Debug log will be written to: $HOME/post-push-hook.log"
echo "To test: Make a change, commit, and watch the terminal for ai-digest output."