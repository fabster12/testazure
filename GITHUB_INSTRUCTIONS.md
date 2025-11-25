# GitHub Setup Instructions

This guide will help you connect your root directory to GitHub and push each project to a separate branch.

## Prerequisites

- Git installed on your system
- GitHub account created
- GitHub repository created (or you'll create one)

## Step 1: Initialize Git Repository (if not already done)

```bash
# Navigate to your root directory
cd C:\Sources\PYTHON\EU_Migration\AZURE\Dashboard

# Initialize git repository
git init

# Configure your git user (if not already configured)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 2: Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., "my-projects")
4. Choose public or private
5. **DO NOT** initialize with README, .gitignore, or license (we already have files)
6. Click "Create repository"

## Step 3: Connect Your Local Repository to GitHub

```bash
# Add the remote repository (replace with your GitHub username and repository name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# Verify the remote was added
git remote -v
```

## Step 4: Create .gitignore for Root Directory

Create a `.gitignore` file in the root directory to avoid pushing unnecessary files:

```bash
# Create .gitignore
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore
echo "build/" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "*.log" >> .gitignore
```

## Step 5: Push Each Project to a Separate Branch

### Method A: Push All Projects to Separate Branches (Recommended)

This method creates a main branch with the root structure, then separate branches for each project.

#### 1. Create and Push Main Branch

```bash
# Add all files to staging
git add .

# Commit the initial state
git commit -m "Initial commit with all three projects"

# Push to main branch
git branch -M main
git push -u origin main
```

#### 2. Create Branch for Project 1 (HTML Site)

```bash
# Create and switch to new branch
git checkout -b project1-html-site

# Remove other projects from this branch (keep only project1)
git rm -r projects/project2-react-app projects/project3-todo-app
git commit -m "Project 1: Simple HTML Site"

# Push this branch to GitHub
git push -u origin project1-html-site

# Return to main branch
git checkout main
```

#### 3. Create Branch for Project 2 (React Counter App)

```bash
# Create and switch to new branch
git checkout -b project2-react-app

# Remove other projects from this branch (keep only project2)
git rm -r projects/project1-html-site projects/project3-todo-app
git commit -m "Project 2: Simple React Counter App"

# Push this branch to GitHub
git push -u origin project2-react-app

# Return to main branch
git checkout main
```

#### 4. Create Branch for Project 3 (Todo App)

```bash
# Create and switch to new branch
git checkout -b project3-todo-app

# Remove other projects from this branch (keep only project3)
git rm -r projects/project1-html-site projects/project2-react-app
git commit -m "Project 3: React Todo App"

# Push this branch to GitHub
git push -u origin project3-todo-app

# Return to main branch
git checkout main
```

### Method B: Individual Project Branches from Scratch

If you want each branch to contain ONLY its project (starting fresh):

#### For Project 1 (HTML Site)

```bash
# Create new orphan branch (no history)
git checkout --orphan project1-html-site

# Remove all files from staging
git rm -rf .

# Add only project1 files
git add projects/project1-html-site/
git add GITHUB_INSTRUCTIONS.md

# Commit
git commit -m "Project 1: Simple HTML Site"

# Push to GitHub
git push -u origin project1-html-site

# Return to main
git checkout main
```

#### For Project 2 (React Counter App)

```bash
# Create new orphan branch
git checkout --orphan project2-react-app

# Remove all files from staging
git rm -rf .

# Add only project2 files
git add projects/project2-react-app/
git add GITHUB_INSTRUCTIONS.md

# Commit
git commit -m "Project 2: Simple React Counter App"

# Push to GitHub
git push -u origin project2-react-app

# Return to main
git checkout main
```

#### For Project 3 (Todo App)

```bash
# Create new orphan branch
git checkout --orphan project3-todo-app

# Remove all files from staging
git rm -rf .

# Add only project3 files
git add projects/project3-todo-app/
git add GITHUB_INSTRUCTIONS.md

# Commit
git commit -m "Project 3: React Todo App"

# Push to GitHub
git push -u origin project3-todo-app

# Return to main
git checkout main
```

## Step 6: Verify Your Branches on GitHub

1. Go to your repository on GitHub
2. Click the "branches" dropdown (should show "main")
3. You should see all your branches listed
4. Click on each branch to view its contents

## Working with Branches Later

### Switch Between Branches

```bash
# Switch to a specific project branch
git checkout project1-html-site

# Switch back to main
git checkout main

# List all branches
git branch -a
```

### Update a Specific Project Branch

```bash
# Switch to the project branch
git checkout project2-react-app

# Make your changes to the project files

# Stage and commit changes
git add .
git commit -m "Update: Description of your changes"

# Push to GitHub
git push origin project2-react-app

# Switch back to main
git checkout main
```

### Pull Changes from GitHub

```bash
# Fetch all branches
git fetch origin

# Pull changes for current branch
git pull origin BRANCH_NAME
```

## Useful Git Commands

```bash
# Check current branch and status
git status

# View all branches
git branch -a

# View remote repositories
git remote -v

# View commit history
git log --oneline

# Delete a branch locally
git branch -d BRANCH_NAME

# Delete a branch on GitHub
git push origin --delete BRANCH_NAME
```

## Troubleshooting

### If you get "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

### If you need to change the remote URL
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

### If push is rejected
```bash
# Force push (use carefully!)
git push -f origin BRANCH_NAME
```

## Branch Strategy Summary

- **main**: Contains all three projects in the projects folder
- **project1-html-site**: Contains only the HTML site project
- **project2-react-app**: Contains only the React counter app project
- **project3-todo-app**: Contains only the React todo app project

Each project branch can be developed, deployed, and managed independently while the main branch maintains the complete structure.
