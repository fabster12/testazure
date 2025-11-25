# EU Modernisation Dashboard

A comprehensive React-based dashboard for tracking and visualizing EU migration and modernization data using DuckDB for in-browser data processing.

## Features

- **Real-time Data Processing**: In-browser SQL queries with DuckDB WASM
- **Interactive Visualizations**: Charts and maps using Recharts and Leaflet
- **Multiple Dashboards**:
  - Main Dashboard with migration statistics
  - Inventory Dashboard for tracking resources
  - Mainframe Dashboard for legacy system monitoring
  - Wave Planner for migration planning
  - Database Maintenance tools
- **AI Integration**: Google Gemini API for intelligent insights
- **Theme Support**: Light/Dark mode with custom theming
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Technology Stack

### Frontend
- **React 18.2** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

### Data Processing
- **DuckDB WASM 1.29** - In-browser SQL database
- **D3.js** - Data manipulation and calculations

### Visualization
- **Recharts 3.3** - Chart library
- **React Leaflet 4.2** - Interactive maps
- **Leaflet 1.9** - Map rendering

### Additional Libraries
- **Google Generative AI (Gemini)** - AI-powered insights
- **React Tooltip** - Interactive tooltips
- **Lodash** - Utility functions

## Project Structure

```
eu_dashboard/
├── src/                          # Source code (NEW - refactored structure)
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Main application component
│   ├── components/              # React components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── InventoryDashboard.tsx
│   │   ├── MainframeDashboard.tsx
│   │   ├── WavePlanner.tsx
│   │   ├── DatabaseMaintenance.tsx
│   │   ├── ApplicationForm.tsx
│   │   ├── FirstOrder.tsx
│   │   ├── CountryMapChart.tsx
│   │   ├── RevenueMapChart.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── icons.tsx
│   ├── contexts/                # React contexts
│   │   └── ThemeContext.tsx     # Theme management
│   ├── services/                # Business logic
│   │   ├── duckdbService.ts     # DuckDB integration
│   │   └── geminiService.ts     # Google Gemini AI
│   ├── types.ts                 # TypeScript type definitions
│   ├── themes.ts                # Theme configurations
│   ├── constants.ts             # Application constants
│   └── metadata.json            # Application metadata
│
├── public/                      # Static assets
│   └── data/                    # Data files
│       ├── *.json               # JSON data sources
│       ├── *.csv                # CSV data sources
│       ├── dashboard.duckdb     # Pre-built DuckDB database
│       └── europe.json          # Europe map GeoJSON
│
├── scripts/                     # Build scripts
│   └── buildDatabase.js         # DuckDB database builder
│
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── docker-compose.yml          # Docker setup (optional)
├── .env.local                  # Environment variables (create this)
└── .gitignore                  # Git ignore rules
```

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm 9+** or **yarn 1.22+**
- **Git** for version control
- **Google Gemini API Key** (optional, for AI features)

## Getting Started

### 1. Install Dependencies

Navigate to the project directory:

```bash
cd projects/eu_dashboard
```

Install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

### 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Create .env.local file
touch .env.local
```

Add your Google Gemini API key (optional):

```env
GEMINI_API_KEY=your_api_key_here
```

To get a Gemini API key:
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste it into `.env.local`

### 3. Build the Database

The project uses DuckDB for data processing. Build the database from CSV files:

```bash
npm run build:db
```

This script:
- Reads CSV files from `public/data/`
- Creates a DuckDB database
- Saves it as `public/data/dashboard.duckdb`

### 4. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

Open your browser and navigate to the URL to see the dashboard.

### 5. Build for Production

```bash
npm run build
```

This will:
1. Build the DuckDB database
2. Compile TypeScript
3. Bundle React app
4. Optimize assets
5. Create production build in `dist/` folder

### 6. Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start development server on port 3000 |
| **build** | `npm run build` | Build database and create production build |
| **build:db** | `npm run build:db` | Build DuckDB database from CSV files |
| **preview** | `npm run preview` | Preview production build locally |

## Using NVM (Node Version Manager)

If you use NVM to manage Node.js versions:

### Install Specific Node Version

```bash
# Install Node.js 18 (recommended)
nvm install 18

# Use Node.js 18
nvm use 18

# Verify version
node --version
```

### Set Default Node Version

```bash
nvm alias default 18
```

### Then Install and Build

```bash
# Install dependencies
npm install

# Build database
npm run build:db

# Start development
npm run dev
```

## Docker Support (Optional)

The project includes `docker-compose.yml` for containerized development.

### Build and Run with Docker

```bash
# Build Docker image
docker-compose build

# Start container
docker-compose up

# Stop container
docker-compose down
```

Access the application at `http://localhost:3000`

## Data Sources

The dashboard uses multiple data sources located in `public/data/`:

### CSV Files (Primary Sources)
- `01_Bookings_JK.csv` - Booking information
- `02_TrackTraceConsignments_YL.csv` - Consignment tracking
- `03_InvoicedConsignments_YI.csv` - Invoice data
- `04_InvoiceCorrections_JI.csv` - Invoice corrections
- `05_Exceptions_YH.csv` - Exception handling

### JSON Files (Processed Data)
- `mainframeData.json` - Mainframe system data
- `revenue_by_customer.json` - Revenue analytics
- `wave_customers.json` - Wave migration data
- `country_list.json` - Country information
- `europe.json` - Europe map GeoJSON

### Database
- `dashboard.duckdb` - DuckDB database (auto-generated from CSV files)

## Configuration

### Vite Configuration (`vite.config.ts`)

```typescript
{
  server: {
    port: 3000,           // Development server port
    host: '0.0.0.0'       // Allow external access
  },
  resolve: {
    alias: {
      '@': './src'        // Import alias (@/components/...)
    }
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

The project uses TypeScript for type safety. Configuration is optimized for React and Vite.

## Component Overview

### Main Components

- **Dashboard.tsx** - Main migration dashboard with statistics
- **InventoryDashboard.tsx** - Resource inventory management
- **MainframeDashboard.tsx** - Legacy system monitoring
- **WavePlanner.tsx** - Migration wave planning tool
- **DatabaseMaintenance.tsx** - Database management interface

### Map Components

- **CountryMapChart.tsx** - Country-based data visualization
- **RevenueMapChart.tsx** - Revenue distribution map

### Utility Components

- **ThemeSwitcher.tsx** - Light/Dark theme toggle
- **ApplicationForm.tsx** - Data entry forms
- **icons.tsx** - Icon library

## Services

### DuckDB Service (`services/duckdbService.ts`)

Handles in-browser SQL queries and data processing:
- Initializes DuckDB WASM
- Loads CSV and JSON data
- Executes SQL queries
- Returns processed results

### Gemini Service (`services/geminiService.ts`)

Integrates Google Gemini AI:
- Generates insights from data
- Provides natural language queries
- Offers recommendations

## Troubleshooting

### Issue: "Cannot find module '@/...'"

**Solution**: The `@` alias points to `src/`. Ensure imports use the correct path:

```typescript
// Correct
import Dashboard from '@/components/Dashboard';

// Incorrect
import Dashboard from './components/Dashboard';
```

### Issue: DuckDB WASM not loading

**Solution**: Ensure WASM files are accessible:
1. Check network tab for 404 errors
2. Verify `public/` folder structure
3. Rebuild with `npm run build:db`

### Issue: Port 3000 already in use

**Solution**: Change port in `vite.config.ts` or kill the process:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Issue: API Key not working

**Solution**:
1. Verify `.env.local` exists in project root
2. Restart dev server after adding API key
3. Check API key is valid at https://makersuite.google.com

### Issue: Build fails

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Performance Optimization

### DuckDB Performance
- Pre-build database with `npm run build:db`
- Use indexed queries when possible
- Limit result sets with SQL `LIMIT`

### React Performance
- Components use React.memo where appropriate
- Lazy loading for large datasets
- Virtual scrolling for long lists

## Browser Compatibility

### Supported Browsers
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### Requirements
- WebAssembly support (required for DuckDB)
- ES6+ JavaScript support
- LocalStorage enabled

## Security

### API Keys
- Never commit `.env.local` to git
- Use environment variables for sensitive data
- Rotate API keys regularly

### Data
- All data processing happens client-side
- No data is sent to external servers (except Gemini API)
- CSV/JSON files are static assets

## Contributing

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Build production to verify
5. Submit pull request

### Code Style

- Use TypeScript for all new files
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused

## License

This project is proprietary. All rights reserved.

## Support

For issues or questions:
1. Check this README
2. Review `BUILD_INSTRUCTIONS.md`
3. Check `AZURE_DEPLOYMENT_GUIDE.md` for deployment
4. Contact the development team

## Changelog

### Version 1.0.0 (Latest)
- ✅ Refactored to standard `src/` folder structure
- ✅ Updated Vite configuration for proper aliasing
- ✅ Removed `node_modules` from `public/` folder
- ✅ Added comprehensive documentation
- ✅ Improved build process
- ✅ Added GitHub Actions workflow support

---

**Made with** ❤️ **for EU Modernisation Project**
