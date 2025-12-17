

https://myfedex.sharepoint.com/:v:/t/FabsPlace/IQBoat4tBrNtRLIn-wxKhJNIAU92j6wnu9aX7WkGzQ9DOFs?e=nxzxpd
https://myfedex.sharepoint.com/:v:/t/FabsPlace/IQDfnZ-mSfN-TaGr9yCbqaIiAREhtqRElCYfXHQ7xtZQczo?e=GtItLs


# EU Dashboard - Build Instructions

Comprehensive guide for building, installing, and deploying the EU Modernisation Dashboard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Building the Project](#building-the-project)
4. [Running Locally](#running-locally)
5. [Using NVM](#using-nvm)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Download Link |
|----------|----------------|-------------|---------------|
| **Node.js** | 18.0.0 | 18.20.0+ | https://nodejs.org/ |
| **npm** | 9.0.0 | 10.0.0+ | Included with Node.js |
| **Git** | 2.30.0 | Latest | https://git-scm.com/ |

### Optional Software

| Software | Purpose | Download Link |
|----------|---------|---------------|
| **NVM** | Node version management | https://github.com/nvm-sh/nvm |
| **Docker** | Containerized deployment | https://www.docker.com/ |
| **VS Code** | Recommended IDE | https://code.visualstudio.com/ |

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 500MB for dependencies
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

---

## Installation

### Step 1: Navigate to Project Directory

```bash
# From the root of the repository
cd projects/eu_dashboard
```

### Step 2: Verify Node.js Version

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher
```

If Node.js is not installed or version is too old, see [Using NVM](#using-nvm) section.

### Step 3: Install Dependencies

```bash
# Clean install (recommended for first time)
npm ci

# Or standard install
npm install
```

**What this installs:**
- React and React DOM
- TypeScript and type definitions
- Vite build tool
- DuckDB WASM for in-browser database
- Recharts for data visualization
- React Leaflet for maps
- Google Generative AI SDK
- All development dependencies

**Expected output:**
```
added 234 packages, and audited 235 packages in 45s

62 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Installation Time
- **Fast Connection**: 2-3 minutes
- **Slow Connection**: 5-10 minutes

---

## Building the Project

The build process has two main steps:

### Step 1: Build the Database

```bash
npm run build:db
```

**What this does:**
- Reads CSV files from `public/data/`
- Creates DuckDB tables
- Imports data from CSV files
- Saves database as `public/data/dashboard.duckdb`

**Expected output:**
```
> eu_modernisationdashboard@0.0.0 build:db
> node scripts/buildDatabase.js

Building DuckDB database...
✓ Created database
✓ Loaded 01_Bookings_JK.csv
✓ Loaded 02_TrackTraceConsignments_YL.csv
✓ Loaded 03_InvoicedConsignments_YI.csv
✓ Loaded 04_InvoiceCorrections_JI.csv
✓ Loaded 05_Exceptions_YH.csv
Database built successfully!
```

**Build time**: 10-30 seconds (depends on data size)

### Step 2: Build the Application

```bash
npm run build
```

**What this does:**
1. Runs `npm run build:db` (database build)
2. Compiles TypeScript to JavaScript
3. Bundles React components
4. Optimizes assets (minification, tree-shaking)
5. Generates production files in `dist/` folder

**Expected output:**
```
> eu_modernisationdashboard@0.0.0 build
> npm run build:db && vite build

Building DuckDB database...
Database built successfully!

vite v6.2.0 building for production...
✓ 1234 modules transformed.
dist/index.html                  2.34 kB │ gzip: 1.12 kB
dist/assets/index-abc123.css    45.67 kB │ gzip: 12.34 kB
dist/assets/index-def456.js    234.56 kB │ gzip: 78.90 kB
✓ built in 23.45s
```

**Build time**: 20-60 seconds

### Output Structure

```
dist/
├── index.html              # Entry HTML file
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript
│   ├── index-[hash].css    # Bundled CSS
│   └── [other assets]      # Images, fonts, etc.
└── data/                   # Copied from public/data/
    ├── dashboard.duckdb
    ├── *.json
    └── *.csv
```

---

## Running Locally

### Development Mode

```bash
npm run dev
```

**Features:**
- Hot Module Replacement (HMR) - instant updates
- Source maps for debugging
- Fast refresh for React components
- Development error overlay

**Access the app:**
- Local: http://localhost:3000
- Network: http://[your-ip]:3000 (accessible from other devices)

**Expected output:**
```
> eu_modernisationdashboard@0.0.0 dev
> vite

  VITE v6.2.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  press h + enter to show help
```

**Stopping the server:**
- Press `Ctrl + C` (Windows/Linux)
- Press `Cmd + C` (macOS)

### Production Preview

After building, preview the production build:

```bash
npm run preview
```

This serves the `dist/` folder locally to test the production build.

**Expected output:**
```
  ➜  Local:   http://localhost:4173/
  ➜  Network: http://192.168.1.100:4173/
```

---

## Using NVM

NVM (Node Version Manager) allows you to install and switch between multiple Node.js versions.

### Install NVM

**Windows:**
Download and install nvm-windows from:
https://github.com/coreybutler/nvm-windows/releases

**macOS/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh
```

### Install Node.js with NVM

```bash
# List available Node.js versions
nvm list available

# Install Node.js 18 (recommended)
nvm install 18

# Install specific version
nvm install 18.20.0

# List installed versions
nvm list
```

### Switch Node.js Versions

```bash
# Use Node.js 18
nvm use 18

# Verify active version
node --version

# Set default version
nvm alias default 18
```

### Install and Build with NVM

```bash
# Use Node.js 18
nvm use 18

# Install dependencies
npm install

# Build database
npm run build:db

# Start development
npm run dev
```

---

## Building from Root Folder

You **cannot** run `npm install` from the root folder for this specific project. Each project must be built independently.

### Correct Approach:

```bash
# From root folder
cd projects/eu_dashboard

# Then install and build
npm install
npm run build:db
npm run dev
```

### Why?

- Each project has its own `package.json`
- Dependencies are project-specific
- No workspace or monorepo setup at root level

---

## Environment Variables

Create `.env.local` file in `projects/eu_dashboard/`:

```env
# Google Gemini API Key (optional)
GEMINI_API_KEY=your_api_key_here
```

**Getting a Gemini API Key:**

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Paste into `.env.local`

**Note**: The app works without an API key, but AI features will be disabled.

---

## Troubleshooting

### Issue: `npm: command not found`

**Cause**: Node.js/npm not installed

**Solution**:
```bash
# Install Node.js from nodejs.org
# Or use NVM
nvm install 18
nvm use 18
```

---

### Issue: `Error: Cannot find module`

**Cause**: Dependencies not installed

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: `Port 3000 already in use`

**Cause**: Another process using port 3000

**Solution (Windows)**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Solution (macOS/Linux)**:
```bash
# Find process
lsof -i :3000

# Kill process (replace PID)
kill -9 <PID>
```

**Or change port** in `vite.config.ts`:
```typescript
server: {
  port: 3001  // Changed from 3000
}
```

---

### Issue: `Build fails with TypeScript errors`

**Cause**: Type errors in code

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Run type check
npx tsc --noEmit

# Fix reported errors
```

---

### Issue: `DuckDB WASM not loading`

**Cause**: WASM files not accessible

**Solution**:
```bash
# Rebuild database
npm run build:db

# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

---

### Issue: `Module not found: Can't resolve '@/...'`

**Cause**: Import alias not configured

**Solution**: This should be fixed in the refactored version. Ensure `vite.config.ts` has:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

---

### Issue: `Out of memory during build`

**Cause**: Insufficient memory

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Then build
npm run build
```

---

## Production Deployment

### Build for Production

```bash
# Full production build
npm run build

# Output in dist/ folder
```

### Test Production Build Locally

```bash
npm run preview
```

### Deploy to Azure Static Web Apps

See `AZURE_DEPLOYMENT_GUIDE.md` in the root folder for detailed instructions.

**Quick steps:**
1. Create Azure Static Web App
2. Configure GitHub secrets
3. Push to GitHub
4. Workflow auto-deploys

### Deploy to Other Platforms

**Netlify:**
```bash
# Build command
npm run build

# Publish directory
dist
```

**Vercel:**
```bash
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist
```

**AWS S3 + CloudFront:**
```bash
# Build
npm run build

# Upload dist/ to S3 bucket
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Performance Optimization

### Build Size Optimization

**Current build size**: ~250 KB (gzipped)

**Tips to reduce:**
- Remove unused dependencies
- Use dynamic imports for large components
- Optimize images
- Enable compression on server

### Build Speed Optimization

**Slow build?** Try:

```bash
# Clear cache
rm -rf node_modules/.vite

# Disable source maps (production only)
# In vite.config.ts:
build: {
  sourcemap: false
}
```

---

## Continuous Integration

### GitHub Actions Workflow

The workflow file (`.github/workflows/deploy-eu-dashboard.yml`) will:
1. Check out code
2. Set up Node.js
3. Install dependencies
4. Build database
5. Build application
6. Deploy to Azure

**Trigger**: Push to `main` branch with changes in `projects/eu_dashboard/`

---

## Summary of Commands

```bash
# Installation
npm install              # Install dependencies
npm ci                  # Clean install (CI/CD)

# Development
npm run dev             # Start dev server
npm run build:db        # Build DuckDB database

# Production
npm run build           # Full production build
npm run preview         # Preview production build

# Troubleshooting
rm -rf node_modules package-lock.json  # Clean dependencies
rm -rf node_modules/.vite              # Clear Vite cache
```

---

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Build database (`npm run build:db`)
3. ✅ Start development (`npm run dev`)
4. ✅ Test the application
5. ✅ Build for production (`npm run build`)
6. ✅ Deploy to Azure (see `AZURE_DEPLOYMENT_GUIDE.md`)

---

**Questions?** Check `README.md` or contact the development team.
