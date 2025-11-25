# Azure Static Web Apps Deployment Guide

This guide explains how to deploy each project to Azure Static Web Apps using GitHub Actions workflows.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure Setup](#azure-setup)
4. [GitHub Configuration](#github-configuration)
5. [How Workflows Are Triggered](#how-workflows-are-triggered)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Each project has its own workflow file that deploys to a separate Azure Static Web App:

- **Project 1 (HTML Site)**: `.github/workflows/deploy-project1-html-site.yml`
- **Project 2 (React Counter App)**: `.github/workflows/deploy-project2-react-app.yml`
- **Project 3 (Todo App)**: `.github/workflows/deploy-project3-todo-app.yml`

### How Workflows Work

Each workflow is configured with **path filters**, meaning:
- It **automatically runs** only when files in its specific project folder change
- It can be **manually triggered** from the GitHub Actions tab
- Multiple workflows can run simultaneously without interfering with each other

---

## Prerequisites

Before you begin, ensure you have:

- [x] Azure account (free tier available)
- [x] GitHub account with your repository created
- [x] Code pushed to GitHub
- [x] Azure CLI installed (optional, for command-line setup)

---

## Azure Setup

You need to create **3 separate Azure Static Web Apps** (one for each project).

### Option A: Using Azure Portal (Recommended for Beginners)

#### For Each Project (Repeat 3 Times):

1. **Go to Azure Portal**
   - Navigate to https://portal.azure.com
   - Sign in to your account

2. **Create Static Web App**
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

3. **Configure Basic Settings**
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing (e.g., "rg-static-web-apps")
   - **Name**: Enter a unique name:
     - `project1-html-site`
     - `project2-react-app`
     - `project3-todo-app`
   - **Plan type**: Free (or choose Standard if needed)
   - **Region**: Choose closest region to your users
   - **Deployment source**: Select "Other" (we'll configure GitHub Actions manually)

4. **Review and Create**
   - Click "Review + create"
   - Click "Create"
   - Wait for deployment to complete

5. **Get the Deployment Token**
   - Go to the newly created Static Web App
   - In the left menu, click "Overview"
   - Click "Manage deployment token"
   - Copy the token (you'll need this for GitHub secrets)

6. **Repeat for Each Project**
   - Create 3 separate Static Web Apps
   - Copy each deployment token
   - Keep tokens secure

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group (once)
az group create --name rg-static-web-apps --location eastus2

# Create Static Web App for Project 1
az staticwebapp create \
  --name project1-html-site \
  --resource-group rg-static-web-apps \
  --location eastus2 \
  --sku Free

# Create Static Web App for Project 2
az staticwebapp create \
  --name project2-react-app \
  --resource-group rg-static-web-apps \
  --location eastus2 \
  --sku Free

# Create Static Web App for Project 3
az staticwebapp create \
  --name project3-todo-app \
  --resource-group rg-static-web-apps \
  --location eastus2 \
  --sku Free

# Get deployment tokens
az staticwebapp secrets list --name project1-html-site --resource-group rg-static-web-apps
az staticwebapp secrets list --name project2-react-app --resource-group rg-static-web-apps
az staticwebapp secrets list --name project3-todo-app --resource-group rg-static-web-apps
```

---

## GitHub Configuration

Now you need to add the Azure deployment tokens as GitHub secrets.

### Step 1: Add GitHub Secrets

1. **Go to Your GitHub Repository**
   - Navigate to your repository on GitHub
   - Click "Settings" tab

2. **Navigate to Secrets**
   - In the left sidebar, click "Secrets and variables"
   - Click "Actions"

3. **Add Secrets for Each Project**
   - Click "New repository secret"
   - Add the following 3 secrets:

   | Secret Name | Value |
   |-------------|-------|
   | `AZURE_STATIC_WEB_APPS_API_TOKEN_PROJECT1` | Deployment token from Project 1 Static Web App |
   | `AZURE_STATIC_WEB_APPS_API_TOKEN_PROJECT2` | Deployment token from Project 2 Static Web App |
   | `AZURE_STATIC_WEB_APPS_API_TOKEN_PROJECT3` | Deployment token from Project 3 Static Web App |

4. **Verify Secrets**
   - You should see all 3 secrets listed
   - Secrets are encrypted and cannot be viewed after creation

### Step 2: Push Workflow Files to GitHub

```bash
# Make sure you're in the root directory
cd C:\Sources\PYTHON\EU_Migration\AZURE\Dashboard

# Add all workflow files
git add .github/workflows/

# Commit the workflows
git commit -m "Add Azure Static Web Apps deployment workflows"

# Push to GitHub
git push origin main
```

---

## How Workflows Are Triggered

### Automatic Triggers (Path-Based)

Each workflow has **path filters** that determine when it runs:

```yaml
on:
  push:
    branches:
      - main
      - project1-html-site  # Also triggers from project-specific branch
    paths:
      - 'projects/project1-html-site/**'  # Only triggers if files in this path change
      - '.github/workflows/deploy-project1-html-site.yml'
```

**What This Means:**

- **Project 1 workflow** only runs when:
  - Files in `projects/project1-html-site/` are modified
  - The workflow file itself is modified
  - Changes are pushed to `main` or `project1-html-site` branch

- **Project 2 workflow** only runs when:
  - Files in `projects/project2-react-app/` are modified
  - Changes are pushed to `main` or `project2-react-app` branch

- **Project 3 workflow** only runs when:
  - Files in `projects/project3-todo-app/` are modified
  - Changes are pushed to `main` or `project3-todo-app` branch

### Examples

```bash
# This will ONLY trigger Project 1 workflow
git add projects/project1-html-site/index.html
git commit -m "Update HTML site homepage"
git push origin main

# This will ONLY trigger Project 2 workflow
git add projects/project2-react-app/src/App.jsx
git commit -m "Update React counter"
git push origin main

# This will NOT trigger any workflow
git add README.md
git commit -m "Update README"
git push origin main

# This will trigger ALL workflows (if you modify multiple projects)
git add projects/project1-html-site/
git add projects/project2-react-app/
git add projects/project3-todo-app/
git commit -m "Update all projects"
git push origin main
```

---

## Manual Deployment

You can manually trigger any workflow without making code changes.

### Method 1: Using GitHub Web Interface

1. **Go to GitHub Repository**
   - Navigate to your repository
   - Click the "Actions" tab

2. **Select Workflow**
   - In the left sidebar, you'll see all workflows:
     - Deploy Project 1 - HTML Site to Azure Static Web Apps
     - Deploy Project 2 - React Counter App to Azure Static Web Apps
     - Deploy Project 3 - Todo App to Azure Static Web Apps

3. **Run Workflow Manually**
   - Click on the workflow you want to run
   - Click the "Run workflow" dropdown button (top right)
   - Select the branch (usually `main`)
   - Click "Run workflow" button

4. **Monitor Progress**
   - The workflow will appear in the list
   - Click on it to see real-time logs
   - Green checkmark = success
   - Red X = failure (check logs)

### Method 2: Using GitHub CLI

```bash
# Install GitHub CLI first (if not installed)
# https://cli.github.com/

# Trigger Project 1 deployment
gh workflow run deploy-project1-html-site.yml

# Trigger Project 2 deployment
gh workflow run deploy-project2-react-app.yml

# Trigger Project 3 deployment
gh workflow run deploy-project3-todo-app.yml

# View workflow runs
gh run list

# Watch a specific run
gh run watch
```

### Method 3: Using curl (REST API)

```bash
# Set your variables
OWNER="your-github-username"
REPO="your-repo-name"
WORKFLOW_ID="deploy-project1-html-site.yml"
TOKEN="your-github-personal-access-token"

# Trigger workflow
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/actions/workflows/$WORKFLOW_ID/dispatches \
  -d '{"ref":"main"}'
```

---

## Deployment Process

### What Happens During Deployment

1. **Workflow Triggered** (automatic or manual)
2. **GitHub Actions Runner** starts
3. **Checkout Code** from repository
4. **Build Application** (for React apps)
   - Installs npm dependencies
   - Runs `npm run build`
   - Creates optimized production build
5. **Deploy to Azure**
   - Uploads files to Azure Static Web Apps
   - Configures routing and headers
   - Updates live site
6. **Completion**
   - Workflow shows success or failure
   - Site is live at Azure URL

### Build Configuration

Each workflow is configured differently based on project type:

**Project 1 (HTML Site):**
```yaml
app_location: "projects/project1-html-site"
output_location: ""
skip_app_build: true  # No build needed for static HTML
```

**Project 2 & 3 (React Apps):**
```yaml
app_location: "projects/project2-react-app"
output_location: "dist"  # Vite builds to 'dist' folder
app_build_command: "npm run build"
```

---

## Accessing Your Deployed Sites

After successful deployment, find your site URLs:

### Option 1: Azure Portal

1. Go to Azure Portal
2. Navigate to your Static Web App
3. Click "Overview"
4. Copy the "URL" (e.g., `https://project1-html-site.azurestaticapps.net`)

### Option 2: GitHub Actions Log

1. Go to GitHub Actions tab
2. Click on the completed workflow run
3. Look for the deployment URL in the logs

### Option 3: Azure CLI

```bash
az staticwebapp show \
  --name project1-html-site \
  --resource-group rg-static-web-apps \
  --query "defaultHostname" \
  --output tsv
```

---

## Custom Domains (Optional)

To add custom domains to your Static Web Apps:

1. **In Azure Portal**
   - Go to your Static Web App
   - Click "Custom domains"
   - Click "+ Add"
   - Follow the wizard to add your domain

2. **Update DNS Records**
   - Add CNAME record pointing to your Azure Static Web App URL
   - Or add TXT record for verification

3. **SSL Certificate**
   - Azure automatically provisions free SSL certificates
   - HTTPS is enabled by default

---

## Monitoring and Logs

### View Deployment Logs

**GitHub Actions:**
- Actions tab → Select workflow run → View logs

**Azure Portal:**
- Static Web App → Deployment History
- Application Insights (if configured)

### Check Workflow Status

```bash
# List recent workflow runs
gh run list --workflow=deploy-project1-html-site.yml

# View specific run details
gh run view RUN_ID

# View logs
gh run view RUN_ID --log
```

---

## Troubleshooting

### Workflow Not Triggering

**Problem:** Push to repository but workflow doesn't run

**Solutions:**
1. Check if files modified are in the correct path
   ```bash
   # View changed files
   git diff --name-only HEAD~1
   ```
2. Verify path filters in workflow file match your directory structure
3. Check if workflows are enabled in repository settings
4. Ensure `.github/workflows/` folder exists in root

### Deployment Token Invalid

**Problem:** Workflow fails with authentication error

**Solutions:**
1. Regenerate deployment token in Azure Portal
2. Update GitHub secret with new token
3. Verify secret name matches workflow file exactly

### Build Fails

**Problem:** React app fails to build

**Solutions:**
1. Check Node.js version compatibility
2. Verify `package.json` dependencies
3. Test build locally first:
   ```bash
   cd projects/project2-react-app
   npm install
   npm run build
   ```
4. Check workflow logs for specific error messages

### Site Not Updating

**Problem:** Deployment succeeds but site shows old content

**Solutions:**
1. Clear browser cache (Ctrl+F5)
2. Check Azure Portal deployment history
3. Verify correct branch was deployed
4. Wait a few minutes for CDN propagation

### Path Filter Not Working

**Problem:** Workflow triggers when it shouldn't

**Solutions:**
1. Verify path syntax in workflow file:
   ```yaml
   paths:
     - 'projects/project1-html-site/**'  # Correct
     - 'projects/project1-html-site/*'   # Only matches direct children
   ```
2. Test path matching locally
3. Check for wildcard character issues

---

## Cost Management

### Free Tier Limits

Azure Static Web Apps Free tier includes:
- 100 GB bandwidth per month
- 0.5 GB storage
- No custom domain limits
- Free SSL certificates

### Monitor Usage

```bash
# Check Static Web App details
az staticwebapp show \
  --name project1-html-site \
  --resource-group rg-static-web-apps

# List all Static Web Apps
az staticwebapp list --output table
```

---

## Cleanup

To delete resources when no longer needed:

### Azure Portal
1. Navigate to Resource Group
2. Select Static Web Apps to delete
3. Click "Delete" → Confirm

### Azure CLI
```bash
# Delete specific Static Web App
az staticwebapp delete \
  --name project1-html-site \
  --resource-group rg-static-web-apps \
  --yes

# Delete entire resource group (deletes all resources)
az group delete \
  --name rg-static-web-apps \
  --yes
```

---

## Summary

**Key Points:**

1. ✅ Each project deploys to its own Azure Static Web App
2. ✅ Workflows automatically trigger based on path filters
3. ✅ Manual deployment available from GitHub Actions tab
4. ✅ Multiple workflows can run simultaneously
5. ✅ Each workflow uses separate GitHub secrets
6. ✅ No interference between projects

**To Deploy a Specific Project:**

- **Automatic**: Just push changes to that project's folder
- **Manual**: Go to GitHub Actions → Select workflow → Run workflow

**Next Steps:**

1. Create Azure Static Web Apps (3 total)
2. Add deployment tokens to GitHub Secrets
3. Push workflow files to GitHub
4. Test deployment by updating a project file
5. Verify site is live at Azure URL

Your projects are now ready for continuous deployment to Azure!
