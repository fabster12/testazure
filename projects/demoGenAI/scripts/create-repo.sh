#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "GitHub Repository Creation Script"
echo "========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository name
echo -e "${YELLOW}Enter repository name:${NC}"
read -r REPO_NAME

if [ -z "$REPO_NAME" ]; then
    echo -e "${RED}Error: Repository name cannot be empty.${NC}"
    exit 1
fi

# Get GitHub username
GH_USERNAME=$(gh api user -q .login)

echo ""
echo -e "${YELLOW}Checking if repository '${REPO_NAME}' already exists...${NC}"

# Check if repository exists
if gh repo view "${GH_USERNAME}/${REPO_NAME}" &> /dev/null; then
    echo -e "${RED}Error: Repository '${REPO_NAME}' already exists!${NC}"
    echo "Choose a different name or delete the existing repository."
    exit 1
fi

echo -e "${GREEN}Repository name is available!${NC}"
echo ""

# Ask for repository visibility
echo -e "${YELLOW}Should this be a public or private repository? (public/private)${NC}"
read -r VISIBILITY

if [ "$VISIBILITY" != "public" ] && [ "$VISIBILITY" != "private" ]; then
    echo -e "${YELLOW}Invalid choice. Defaulting to public.${NC}"
    VISIBILITY="public"
fi

# Ask for description
echo -e "${YELLOW}Enter repository description (optional):${NC}"
read -r DESCRIPTION

echo ""
echo "========================================="
echo "Creating repository with:"
echo "  Name: ${REPO_NAME}"
echo "  Visibility: ${VISIBILITY}"
echo "  Description: ${DESCRIPTION:-None}"
echo "========================================="
echo ""

# Create the repository
echo -e "${YELLOW}Creating GitHub repository...${NC}"

CREATE_CMD="gh repo create ${REPO_NAME} --${VISIBILITY}"

if [ -n "$DESCRIPTION" ]; then
    CREATE_CMD="${CREATE_CMD} --description \"${DESCRIPTION}\""
fi

if eval "$CREATE_CMD"; then
    echo -e "${GREEN}✓ Repository created successfully!${NC}"
else
    echo -e "${RED}✗ Failed to create repository.${NC}"
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi

# Add remote
echo -e "${YELLOW}Adding remote origin...${NC}"
REMOTE_URL="https://github.com/${GH_USERNAME}/${REPO_NAME}.git"

if git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}Remote 'origin' already exists. Updating...${NC}"
    git remote set-url origin "$REMOTE_URL"
else
    git remote add origin "$REMOTE_URL"
fi

echo -e "${GREEN}✓ Remote added: ${REMOTE_URL}${NC}"

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo -e "${YELLOW}Creating .gitignore...${NC}"
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
.cache/
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
fi

# Create README if it doesn't exist
if [ ! -f README.md ]; then
    echo -e "${YELLOW}Creating README.md...${NC}"
    cat > README.md << EOF
# ${REPO_NAME}

${DESCRIPTION}

## Setup

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Deploy

This project is configured to deploy to Azure Static Web Apps via GitHub Actions.

Add your \`AZURE_STATIC_WEB_APPS_API_TOKEN\` to GitHub Secrets.
EOF
    echo -e "${GREEN}✓ README.md created${NC}"
fi

# Initial commit
echo -e "${YELLOW}Creating initial commit...${NC}"
git add .
git commit -m "Initial commit: Project setup

- Created repository structure
- Added configuration files
- Set up basic documentation"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Initial commit created${NC}"
else
    echo -e "${RED}✗ Failed to create initial commit${NC}"
    exit 1
fi

# Ask if user wants to push
echo ""
echo -e "${YELLOW}Do you want to push to GitHub now? (y/n)${NC}"
read -r PUSH_NOW

if [ "$PUSH_NOW" = "y" ] || [ "$PUSH_NOW" = "Y" ]; then
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git branch -M main
    git push -u origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo -e "${GREEN}✓ SUCCESS!${NC}"
        echo "========================================="
        echo ""
        echo "Repository URL: https://github.com/${GH_USERNAME}/${REPO_NAME}"
        echo ""
        echo "Next steps:"
        echo "  1. Add AZURE_STATIC_WEB_APPS_API_TOKEN to repository secrets"
        echo "  2. Push changes to trigger deployment"
        echo "  3. Check Actions tab for deployment status"
        echo ""
    else
        echo -e "${RED}✗ Failed to push to GitHub${NC}"
        echo "You can push manually later with: git push -u origin main"
        exit 1
    fi
else
    echo ""
    echo "========================================="
    echo -e "${GREEN}✓ Repository created but not pushed${NC}"
    echo "========================================="
    echo ""
    echo "To push later, run:"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
fi

echo "Happy coding! 🚀"
