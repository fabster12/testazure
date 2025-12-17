---
title: EU Dashboard - Technical Documentation (Current State)
subtitle: Developer Onboarding Guide
author: GenAI Development Team
date: 2025-12-10
toc: true
toc-depth: 3
documentclass: article
geometry: margin=1in
---

# EU Dashboard - Technical Documentation

## Overview

The EU Dashboard is a React-based analytics platform for visualizing European operations data. Built with TypeScript, Vite, and modern React patterns, it demonstrates the capabilities of GenAI-assisted development while providing real business value.

### Technology Stack

#### Frontend

- **React 18.2.0** - UI library with hooks and modern patterns
- **TypeScript 5.2.2** - Type-safe JavaScript
- **Vite 5.0.8** - Lightning-fast build tool and dev server
- **React Router 6.21.1** - Client-side routing for multi-page app
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Recharts 2.10.3** - Composable charting library
- **React Leaflet 4.2.1** - Interactive map component
- **PapaParse 5.4.1** - CSV parsing library

#### AI Integration

- **Google Gemini API** - AI-powered country insights generation
- Session-based caching for API responses

#### Development Tools

- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing for Tailwind
- **Vite Plugin React** - Fast refresh and React support

---

## Project Structure

```
projects/demoGenAI/
├── public/                         # Static assets
│   ├── data/                       # CSV data files
│   │   ├── 01_Bookings_JK.csv      # Booking records
│   │   ├── 05_Exceptions_YH.csv    # Exception records
│   │   └── 81_TotalRevenue.csv     # Revenue records
│   └── help/                       # Help documentation
│       └── index.html              # Standalone help page
├── src/
│   ├── components/                 # React components
│   │   ├── Layout/                 # Layout components
│   │   │   ├── Navigation.tsx      # Main navigation bar
│   │   │   └── PageLayout.tsx      # Page wrapper with title/description
│   │   ├── charts/                 # Reusable chart components
│   │   │   ├── MonthlyTrendChart.tsx       # Line chart for time series
│   │   │   └── DistributionPieChart.tsx    # Pie chart for distributions
│   │   ├── map/                    # Map-related components
│   │   │   ├── EuropeMap.tsx               # Interactive Leaflet map
│   │   │   └── CountryInsightPanel.tsx     # AI insights slide-in panel
│   │   ├── BookingsChart.tsx       # Country bookings bar chart
│   │   ├── RevenueChart.tsx        # Monthly revenue line chart
│   │   ├── ExceptionTable.tsx      # Sortable exception table
│   │   ├── KPICards.tsx            # Dashboard KPI cards
│   │   └── ThemeToggle.tsx         # Theme switcher button
│   ├── contexts/                   # React contexts
│   │   └── ThemeContext.tsx        # Theme state management
│   ├── pages/                      # Page components
│   │   ├── Dashboard.tsx           # Overview page
│   │   ├── BookingsPage.tsx        # Bookings analysis
│   │   ├── ExceptionsPage.tsx      # Exceptions analysis
│   │   ├── RevenuePage.tsx         # Revenue analysis
│   │   ├── EuropeMapPage.tsx       # Interactive map page
│   │   └── HelpPage.tsx            # Help documentation
│   ├── services/                   # Business logic
│   │   ├── dataService.ts          # CSV loading and processing
│   │   ├── geminiService.ts        # AI insights generation
│   │   └── cacheService.ts         # Session storage caching
│   ├── types/                      # TypeScript types
│   │   └── index.ts                # All type definitions
│   ├── data/                       # Static data
│   │   └── europeBoundaries.json   # GeoJSON for Europe map
│   ├── App.tsx                     # Root component with routing
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles and Tailwind imports
│   └── vite-env.d.ts               # Vite type declarations
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── vite.config.ts                  # Vite build configuration
├── eslint.config.js                # ESLint configuration
├── postcss.config.js               # PostCSS configuration
├── .env.local                      # Environment variables (git-ignored)
├── FEATURES.md                     # Future features roadmap
├── TECHNICAL.md                    # This document
├── FUTURE_STATE.md                 # Future architecture docs
├── TIME_ESTIMATION.md              # Development time analysis
└── DATABASE_RECOMMENDATION.md      # Database strategy
```

---

## Architecture

### Component Hierarchy

```
App
├── Navigation
└── Routes
    ├── Dashboard
    │   ├── PageLayout
    │   ├── KPICards
    │   ├── BookingsChart
    │   ├── RevenueChart
    │   └── ExceptionTable
    ├── BookingsPage
    │   ├── PageLayout
    │   ├── MonthlyTrendChart
    │   ├── DistributionPieChart
    │   └── BookingsChart
    ├── ExceptionsPage
    │   ├── PageLayout
    │   ├── MonthlyTrendChart
    │   ├── DistributionPieChart
    │   └── ExceptionTable
    ├── RevenuePage
    │   ├── PageLayout
    │   ├── MonthlyTrendChart
    │   ├── DistributionPieChart
    │   └── Revenue metrics sections
    ├── EuropeMapPage
    │   ├── PageLayout
    │   ├── EuropeMap
    │   └── CountryInsightPanel
    └── HelpPage
        └── PageLayout
            └── iframe (help/index.html)
```

### Data Flow

```
CSV Files (public/data/)
    ↓
dataService.loadDashboardData()
    ↓
Parse with PapaParse
    ↓
Process & aggregate data
    ↓
Return DashboardData object
    ↓
Pages consume via useState/useEffect
    ↓
Render charts and tables
```

### State Management

- **Theme**: Context API (`ThemeContext`) with localStorage persistence
- **Data Loading**: Component-level state (useState) in each page
- **AI Cache**: SessionStorage via `cacheService`
- **No Redux/Zustand**: Simple apps don't need complex state management

---

## Data Model

### TypeScript Interfaces

#### Core Data Types

```typescript
// Raw CSV record types
interface BookingRecord {
  YearVal: string;
  MonthVal: string;
  CountryCode: string;
  CountryName: string;
  RecordCount: string;
  BookingTypeCode: string;
}

interface ExceptionRecord {
  YearVal: string;
  MonthVal: string;
  CountryCode: string;
  CountryName: string;
  RecordCount: string;
  OpsSourceCode: string;
}

interface RevenueRecord {
  CountryCode: string;
  CountryName: string;
  TotalRevenue: string;
  Division: string;
}
```

#### Processed Data Types

```typescript
interface DashboardData {
  bookings: BookingRecord[];
  exceptions: ExceptionRecord[];
  revenue: RevenueRecord[];
  processedData: {
    countryBookings: CountryBooking[];
    countryExceptions: CountryException[];
    monthlyRevenue: MonthlyRevenue[];
  };
  metrics: {
    totalBookings: number;
    totalRevenue: number;
    averageExceptionRate: number;
    activeCountries: number;
  };
}
```

#### AI Insights

```typescript
interface CountryInsights {
  country: string;
  carriers: CarrierInfo[];
  fedexSentiment: string;
  salesTips: string[];
  emailTemplate: string;
  generatedAt: string;
}

interface CarrierInfo {
  name: string;
  marketShare: number;
  isFedEx: boolean;
}
```

---

## Key Features Implementation

### 1. Multi-Page Routing

**File**: `src/App.tsx`

```typescript
<BrowserRouter>
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 fedex:bg-[#1F083A]">
    <Navigation />
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/bookings" element={<BookingsPage />} />
      <Route path="/exceptions" element={<ExceptionsPage />} />
      <Route path="/revenue" element={<RevenuePage />} />
      <Route path="/map" element={<EuropeMapPage />} />
      <Route path="/help" element={<HelpPage />} />
    </Routes>
  </div>
</BrowserRouter>
```

**Benefits**:
- Clean URLs (e.g., `/bookings`, `/revenue`)
- Browser back/forward navigation works
- Deep linking support
- Each page can lazy load if needed

---

### 2. Theme System

**Implementation**: CSS class switching via Tailwind variants

**Files**:
- `src/contexts/ThemeContext.tsx` - State management
- `src/components/ThemeToggle.tsx` - UI control
- `src/index.css` - Theme-specific styles
- `tailwind.config.js` - FedEx color configuration

**How It Works**:

1. ThemeContext provides current theme and toggle function
2. Theme is stored in localStorage for persistence
3. HTML element gets class: `<html class="light">`, `<html class="dark">`, or `<html class="fedex">`
4. Tailwind variants style elements based on class:
   - `dark:bg-gray-800` - Dark theme background
   - `fedex:bg-white` - FedEx theme background
   - `fedex:border-fedex-purple` - FedEx theme border

**FedEx Theme Colors**:
```javascript
// tailwind.config.js
colors: {
  'fedex-purple': '#4D148C',
  'fedex-purple-dark': '#2D0A52',
  'fedex-orange': '#FF6600',
}
```

---

### 3. Data Processing Pipeline

**File**: `src/services/dataService.ts`

**Steps**:

1. **Load CSV Files**:
   ```typescript
   const loadCSV = async (path: string) => {
     const response = await fetch(path);
     const csvText = await response.text();
     return Papa.parse(csvText, { header: true }).data;
   };
   ```

2. **Aggregate by Country**:
   ```typescript
   const countryMap = new Map<string, number>();
   bookings.forEach(record => {
     const country = record.CountryName;
     const count = parseInt(record.RecordCount) || 0;
     countryMap.set(country, (countryMap.get(country) || 0) + count);
   });
   ```

3. **Calculate Metrics**:
   ```typescript
   const totalBookings = bookings.reduce(
     (sum, r) => sum + (parseInt(r.RecordCount) || 0), 0
   );
   ```

4. **Sort and Return**:
   ```typescript
   return Array.from(countryMap.entries())
     .map(([country, total]) => ({ country, totalBookings: total }))
     .sort((a, b) => b.totalBookings - a.totalBookings);
   ```

**Processing Functions**:

- `processCountryBookings()` - Aggregate bookings by country
- `processMonthlyBookings()` - Time series aggregation
- `processBookingTypes()` - Group by booking type
- `processOpsSource()` - Exception source distribution
- `processRevenuByDivision()` - Revenue by division
- `processRevenueByCountry()` - Revenue by country

---

### 4. AI-Powered Insights

**File**: `src/services/geminiService.ts`

**Flow**:

1. User clicks country on map
2. Check cache: `cacheService.get('country_insights_Germany')`
3. If cached, return immediately
4. If not cached:
   - Build prompt with country data
   - Call Gemini API: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`
   - Parse JSON response
   - Store in cache
   - Return insights

**Prompt Structure**:

```
You are a logistics market analyst. Analyze {COUNTRY} market for FedEx.

Country: {COUNTRY}
Total Revenue: €{REVENUE}
Total Bookings: {BOOKINGS}

Provide:
1. List of 3-5 major logistics carriers operating in {COUNTRY} with market share estimates (always include FedEx)
2. FedEx sentiment analysis for this market (2-3 sentences)
3. 3-5 sales tips to increase market share and revenue

Return as JSON: { carriers: [...], fedexSentiment: "...", salesTips: [...] }
```

**Mock Fallback**:

If `VITE_GEMINI_API_KEY` is not set, return realistic mock data:

```typescript
return {
  country,
  carriers: [
    { name: 'DHL Express', marketShare: 35, isFedEx: false },
    { name: 'FedEx', marketShare: 25, isFedEx: true },
    { name: 'UPS', marketShare: 20, isFedEx: false },
    // ...
  ],
  fedexSentiment: `FedEx has a strong position in ${country}...`,
  salesTips: [
    'Expand last-mile delivery network...',
    'Target e-commerce growth...',
    // ...
  ]
};
```

---

### 5. Interactive Map

**File**: `src/components/map/EuropeMap.tsx`

**Implementation**:

- **Library**: React Leaflet (wrapper for Leaflet.js)
- **Base Map**: OpenStreetMap tiles
- **Overlays**: GeoJSON polygons for countries
- **Color Coding**: Green gradient based on revenue
- **Interactions**: Hover tooltips, click handlers

**Color Scale**:

```typescript
const getColor = (revenue: number): string => {
  const ratio = revenue / maxRevenue;
  if (ratio > 0.8) return '#065f46'; // Very dark green
  if (ratio > 0.6) return '#047857'; // Dark green
  if (ratio > 0.4) return '#059669'; // Medium green
  if (ratio > 0.2) return '#10b981'; // Light green
  return '#6ee7b7'; // Very light green
};
```

**Event Handlers**:

```typescript
layer.on({
  mouseover: (e) => {
    layer.setStyle({ weight: 3, color: '#4D148C', fillOpacity: 0.9 });
  },
  mouseout: (e) => {
    layer.setStyle(originalStyle);
  },
  click: () => {
    onCountryClick(countryCode, countryName, revenue);
  }
});
```

---

## Development Workflow

### Setup

```bash
# Clone repository
git clone <repo-url>
cd Dashboard/projects/demoGenAI

# Install dependencies
npm install

# Create environment file
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env.local

# Start dev server
npm run dev
```

Server starts at http://localhost:3000 with hot module replacement (HMR).

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

Output: `dist/` folder with static assets ready for deployment.

### Linting

```bash
# Check code quality
npm run lint
```

---

## Configuration Files

### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Tailwind Configuration (`tailwind.config.js`)

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'fedex-purple': '#4D148C',
        'fedex-orange': '#FF6600',
      },
    },
  },
  plugins: [],
  variants: {
    extend: {
      backgroundColor: ['fedex'],
      textColor: ['fedex'],
      borderColor: ['fedex'],
    },
  },
};
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Deployment

### Azure Static Web Apps (Recommended)

1. **Build Configuration**:
   - Build command: `npm run build`
   - Output directory: `dist`
   - App location: `/projects/demoGenAI`

2. **Environment Variables**:
   - Add `VITE_GEMINI_API_KEY` in Azure portal under Configuration

3. **Custom Domain** (optional):
   - Configure in Azure portal
   - Add DNS CNAME record

4. **CI/CD**:
   - Auto-deploys on push to main branch
   - GitHub Actions workflow auto-generated

### Alternative: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Alternative: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## Performance Optimization

### Current Optimizations

1. **Code Splitting**: Each page loads only needed components
2. **Asset Optimization**: Vite automatically optimizes images and bundles
3. **Lazy Loading**: Charts render on-demand as pages load
4. **Caching**: AI insights cached in sessionStorage (no redundant API calls)
5. **Tree Shaking**: Unused code eliminated in production build

### Potential Improvements

1. **React.lazy()**: Code-split pages for faster initial load
2. **Image Optimization**: Convert PNGs to WebP
3. **Service Worker**: Offline support and asset caching
4. **Virtual Scrolling**: For long exception tables
5. **API Pagination**: Load data in chunks instead of all at once

---

## Testing Strategy

### Current State

No automated tests (MVP built for speed).

### Recommended Testing Approach

1. **Unit Tests** (Jest + React Testing Library):
   - Data processing functions in `dataService.ts`
   - Utility functions in `cacheService.ts`

2. **Component Tests** (React Testing Library):
   - Chart components render with correct data
   - Theme toggle switches classes
   - Navigation links work

3. **Integration Tests** (Playwright):
   - End-to-end user flows
   - Map interaction and AI panel opening
   - CSV data loading and chart rendering

4. **Visual Regression Tests** (Percy/Chromatic):
   - Catch unintended UI changes
   - Test all three themes

---

## Troubleshooting

### Common Issues

#### 1. Charts Not Rendering

**Symptoms**: Empty white space where charts should be

**Causes**:
- Data not loaded yet
- Invalid data format
- Recharts version incompatibility

**Solutions**:
```typescript
// Add loading state check
if (!data) return <div>Loading...</div>;

// Validate data before passing to chart
const validData = data.filter(item => item.value != null);
```

#### 2. Map Not Loading

**Symptoms**: Gray box or console errors

**Causes**:
- Leaflet CSS not imported
- GeoJSON format error
- Map container has no height

**Solutions**:
```typescript
// Ensure CSS is imported in EuropeMap.tsx
import 'leaflet/dist/leaflet.css';

// Set explicit height on map container
<div style={{ height: '600px' }}>
  <MapContainer>...</MapContainer>
</div>
```

#### 3. Theme Not Persisting

**Symptoms**: Theme resets to light on refresh

**Causes**:
- localStorage not available (private browsing)
- ThemeContext not wrapping App

**Solutions**:
```typescript
// Check localStorage availability
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.warn('localStorage not available, theme will not persist');
}
```

#### 4. CSV Files Not Loading

**Symptoms**: "Failed to load data" error

**Causes**:
- Files not in `public/data/` directory
- Incorrect file path
- CORS issues (rare with Vite)

**Solutions**:
```bash
# Verify files exist
ls public/data/*.csv

# Check file paths in dataService.ts
const BOOKINGS_PATH = '/data/01_Bookings_JK.csv'; // ✓ Correct
const BOOKINGS_PATH = '/public/data/01_Bookings_JK.csv'; // ✗ Wrong
```

---

## Security Considerations

### Current Implementation

1. **API Key Security**:
   - Stored in `.env.local` (not committed to git)
   - Exposed to client (acceptable for this use case)

2. **Data Sensitivity**:
   - CSV files are public (served from `/public`)
   - No authentication required

### Production Recommendations

1. **Move API to Backend**:
   - Create Azure Function to call Gemini API
   - Keep API key server-side only
   - Client calls Azure Function instead

2. **Add Authentication**:
   - Implement Azure AD login
   - Restrict data access based on user role

3. **Rate Limiting**:
   - Prevent API abuse
   - Track per-user quotas

4. **Data Encryption**:
   - HTTPS for all traffic (default with Azure/Netlify/Vercel)
   - Encrypt sensitive data at rest

---

## Conclusion

The EU Dashboard demonstrates modern React development with TypeScript, Tailwind, and AI integration. Built in ~10 hours with GenAI assistance, it provides a solid foundation for future enhancements while showcasing best practices in component architecture, state management, and user experience.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-10
**Maintained By**: Development Team
