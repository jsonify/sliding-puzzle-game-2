#!/bin/bash

# Create the post-push hook directory if it doesn't exist
mkdir -p .git/hooks

# Create the post-push hook file
cat > .git/hooks/post-push << 'EOL'
#!/bin/bash

# Exit on any error
set -e

# Get the current branch name
BRANCH_NAME=$(git symbolic-ref --short HEAD)

echo "Running post-push hook on branch: $BRANCH_NAME"

# Run the ai-digest command
echo "Running ai-digest..."
npx ai-digest

# Print completion message
echo "Post-push hook completed successfully"
EOL

# Make the hook executable
chmod +x .git/hooks/post-push

# Create Git configuration to enable hooks
git config core.hooksPath .git/hooks

# Update VS Code settings to ensure Git integration
mkdir -p .vscode

# Create or update settings.json
cat > .vscode/settings.json << 'EOL'
{
  "git.enableSmartCommit": true,
  "git.postCommitCommand": "push"
}
EOL

echo "Git hook setup completed successfully!"
echo "VS Code settings updated for automatic push after commit."