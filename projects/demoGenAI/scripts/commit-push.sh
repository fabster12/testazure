#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "Git Commit & Push Script"
echo "========================================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}Error: Not a git repository!${NC}"
    echo "Run 'git init' first or use create-repo.sh"
    exit 1
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${RED}Error: No remote 'origin' configured!${NC}"
    echo "Run create-repo.sh first to set up the repository."
    exit 1
fi

# Show current status
echo -e "${BLUE}Current repository status:${NC}"
git status --short
echo ""

# Check if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}No changes to commit.${NC}"
    echo ""
    echo "Do you want to push anyway? (y/n)"
    read -r PUSH_ANYWAY

    if [ "$PUSH_ANYWAY" != "y" ] && [ "$PUSH_ANYWAY" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi

    SKIP_COMMIT=true
else
    SKIP_COMMIT=false
fi

if [ "$SKIP_COMMIT" = false ]; then
    # Stage all changes
    echo -e "${YELLOW}Staging all changes...${NC}"
    git add .

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes staged${NC}"
    else
        echo -e "${RED}✗ Failed to stage changes${NC}"
        exit 1
    fi

    # Show what will be committed
    echo ""
    echo -e "${BLUE}Files to be committed:${NC}"
    git status --short
    echo ""

    # Get commit message
    echo -e "${YELLOW}Enter commit message:${NC}"
    echo "(Press Enter for empty line, type 'END' on a new line when done)"
    echo ""

    COMMIT_MSG=""
    while IFS= read -r line; do
        if [ "$line" = "END" ]; then
            break
        fi
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="$line"
        else
            COMMIT_MSG="${COMMIT_MSG}"$'\n'"${line}"
        fi
    done

    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}Error: Commit message cannot be empty.${NC}"
        exit 1
    fi

    # Show commit message preview
    echo ""
    echo -e "${BLUE}Commit message preview:${NC}"
    echo "---"
    echo "$COMMIT_MSG"
    echo "---"
    echo ""

    # Confirm commit
    echo -e "${YELLOW}Proceed with commit? (y/n)${NC}"
    read -r CONFIRM

    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "Commit aborted."
        exit 0
    fi

    # Create commit
    echo -e "${YELLOW}Creating commit...${NC}"
    git commit -m "$COMMIT_MSG"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Commit created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create commit${NC}"
        exit 1
    fi
fi

# Ask if user wants to push
echo ""
echo -e "${YELLOW}Push to remote? (y/n)${NC}"
read -r PUSH_CONFIRM

if [ "$PUSH_CONFIRM" != "y" ] && [ "$PUSH_CONFIRM" != "Y" ]; then
    echo "Push cancelled. Your commit is saved locally."
    echo "To push later, run: git push"
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Push to remote
echo -e "${YELLOW}Pushing to origin/${CURRENT_BRANCH}...${NC}"
git push origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo -e "${GREEN}✓ SUCCESS!${NC}"
    echo "========================================="
    echo ""
    echo "Changes pushed to: origin/${CURRENT_BRANCH}"

    # Get remote URL
    REMOTE_URL=$(git remote get-url origin)
    echo "Repository: ${REMOTE_URL}"

    # Show commit hash
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "Latest commit: ${COMMIT_HASH}"
    echo ""

    # Check if GitHub Actions might run
    if [ -d .github/workflows ]; then
        echo -e "${BLUE}ℹ GitHub Actions workflows detected${NC}"
        echo "Check deployment status at: ${REMOTE_URL}/actions"
        echo ""
    fi

    echo "Happy coding! 🚀"
else
    echo ""
    echo "========================================="
    echo -e "${RED}✗ PUSH FAILED${NC}"
    echo "========================================="
    echo ""
    echo "Your commit is saved locally but not pushed."
    echo ""
    echo "Possible issues:"
    echo "  - Network connectivity"
    echo "  - Authentication problems"
    echo "  - Remote branch protection"
    echo "  - Merge conflicts"
    echo ""
    echo "Try:"
    echo "  1. Check your internet connection"
    echo "  2. Run: gh auth status"
    echo "  3. Pull latest changes: git pull"
    echo "  4. Try pushing again: git push"
    echo ""
    exit 1
fi
