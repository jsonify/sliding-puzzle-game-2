#!/bin/bash

# Create the post-push hook directory if it doesn't exist
mkdir -p .git/hooks

# Create the post-push hook file with terminal output handling
cat > .git/hooks/post-push << 'EOL'
#!/bin/bash

# Exit on any error
set -e

# Function to print with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Get the current branch name
BRANCH_NAME=$(git symbolic-ref --short HEAD)

log_message "Starting post-push hook on branch: $BRANCH_NAME"

# Run the ai-digest command with visible output
log_message "Running ai-digest..."
# Use 'exec' to ensure proper terminal output
exec npx ai-digest

# Note: The following lines will only execute if ai-digest fails
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
  "terminal.integrated.tabs.enabled": true
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

echo "Git hook setup completed successfully!"
echo "VS Code settings have been merged (existing settings preserved)."
echo "IMPORTANT: The terminal will now show ai-digest output after each push."
echo "To test: Make a change, commit, and watch the terminal for ai-digest output."