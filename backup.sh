#!/bin/bash

# Bash Backup Script for EU Dashboard
# Usage: ./backup.sh
# Works on Git Bash for Windows (no rsync required)

timestamp=$(date +%Y%m%d_%H%M%S)
sourceDir="projects/eu_dashboard"
backupDir="BACKUP/eu_dashboard_$timestamp"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create BACKUP directory if it doesn't exist
mkdir -p BACKUP

echo -e "${GREEN}Creating backup: $backupDir${NC}"
echo -e "${YELLOW}Copying files...${NC}"

# Create backup directory
mkdir -p "$backupDir"

# Function to copy files excluding patterns
copy_excluding() {
  # Save original directory
  originalDir=$(pwd)

  cd "$sourceDir" || exit 1

  # Find all files/directories excluding unwanted ones
  find . -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    ! -path "*/.git/*" \
    ! -name "*.log" \
    ! -name ".DS_Store" \
    ! -name "*.duckdb.wal" \
    -print0 | while IFS= read -r -d '' file; do

    # Remove leading ./ from file path
    cleanFile="${file#./}"

    # Create directory structure in backup location
    targetDir="$originalDir/$backupDir/$(dirname "$cleanFile")"
    mkdir -p "$targetDir"

    # Copy file to backup location
    cp "$file" "$originalDir/$backupDir/$cleanFile"
  done

  cd "$originalDir" > /dev/null
}

# Perform the copy
copy_excluding

# Check if backup directory has content
if [ -d "$backupDir" ] && [ "$(ls -A $backupDir 2>/dev/null)" ]; then
  echo -e "${GREEN}✓ Backup completed successfully!${NC}"
  echo -e "${CYAN}Location: $backupDir${NC}"

  # Show backup size (cross-platform)
  if command -v du &> /dev/null; then
    size=$(du -sh "$backupDir" 2>/dev/null | cut -f1)
    echo -e "${CYAN}Size: $size${NC}"
  fi

  # Count files
  fileCount=$(find "$backupDir" -type f | wc -l)
  echo -e "${CYAN}Files: $fileCount${NC}"
else
  echo -e "${RED}✗ Backup failed!${NC}"
  exit 1
fi
