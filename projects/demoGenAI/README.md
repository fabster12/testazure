# GenAI Dashboard Demo Project

**Live demo showing how Claude Code helped build an EU data dashboard from scratch**

This project is a demonstration of how Generative AI (specifically Claude Code) can accelerate development by helping you build a complete React dashboard in minutes, not days.

---

## What's This About?

This is a mini version of a production EU migration dashboard, built entirely with the help of Claude Code. The purpose is to demonstrate:

- How to analyze data with AI
- How to quickly prototype visualizations
- How to set up deployment pipelines
- How to automate git workflows

**Time to build manually:** ~2-3 days
**Time to build with Claude:** ~15 minutes

---

## Project Contents

```
demoGenAI/
├── data/                              # CSV data files
│   ├── 01_Bookings_JK.csv            # Booking records by country
│   ├── 05_Exceptions_YH.csv          # Exception tracking data
│   └── 81_TotalRevenue.csv           # Revenue by country/division
│
├── scripts/                           # Automation scripts
│   ├── create-repo.sh                # Create GitHub repo
│   └── commit-push.sh                # Commit and push changes
│
├── .github/workflows/                 # CI/CD configuration
│   └── azure-static-web-apps.yml     # Azure deployment workflow
│
├── DEMO_SCRIPT.md                     # 15-minute presentation guide
└── README.md                          # This file
```

---

## The Data

### 1. Bookings Data (01_Bookings_JK.csv)
- **Columns:** YearVal, MonthVal, Country, BookingType, RecordCount
- **Purpose:** Track booking volumes by country and type
- **Size:** ~87 KB, thousands of records
- **Use cases:** Trend analysis, country comparisons, booking type distribution

### 2. Exceptions Data (05_Exceptions_YH.csv)
- **Columns:** YearVal, MonthVal, Country, RecordCount, OpsSourceCode
- **Purpose:** Monitor operational exceptions by country
- **Size:** ~19 KB
- **Use cases:** Quality metrics, exception rate analysis, ops source tracking

### 3. Revenue Data (81_TotalRevenue.csv)
- **Columns:** YearVal, MonthVal, Country, RecordCount, Division, Revenue_EUR
- **Purpose:** Track revenue across countries and divisions
- **Size:** ~89 KB
- **Use cases:** Revenue maps, division performance, country profitability

---

## What Can You Build?

With these three datasets, you can create:

### Visualizations
- **Bar Charts:** Bookings by country, revenue by division
- **Line Charts:** Trends over time (monthly/yearly)
- **Heat Maps:** Exception rates by country
- **Geographic Maps:** Revenue distribution across Europe
- **Pie Charts:** Booking type distribution

### Analytics
- **Top Performers:** Countries with highest revenue/bookings
- **Exception Rates:** Calculate exception % per booking
- **Growth Trends:** Month-over-month or year-over-year growth
- **Division Analysis:** Compare performance across divisions
- **Seasonal Patterns:** Identify peak booking periods

### Interactive Features
- **Filters:** By date range, country, booking type, division
- **Drill-downs:** Click on charts to see detailed data
- **Export:** Download filtered data as CSV
- **Dark Mode:** Because it's 2025
- **Real-time Search:** Filter data on the fly

---

## How to Use This Demo

### For Presenters

1. **Read the demo script:**
   ```bash
   cat DEMO_SCRIPT.md
   ```

2. **Follow the 15-minute presentation flow:**
   - Act 1: Show the data (3 min)
   - Act 2: Analyze with Claude (4 min)
   - Act 3: Build the app (4 min)
   - Act 4: Add enhancements (2 min)
   - Act 5: Deploy to Azure (2 min)

3. **Use the provided prompts** in the demo script with Claude Code

4. **Show the live results** as Claude builds the app

### For Developers

1. **Explore the data:**
   ```bash
   head -20 data/01_Bookings_JK.csv
   head -20 data/05_Exceptions_YH.csv
   head -20 data/81_TotalRevenue.csv
   ```

2. **Try the prompts yourself** with Claude Code (see DEMO_SCRIPT.md)

3. **Build your own dashboard** using the sample prompts as a starting point

4. **Experiment** with different visualizations and features

---

## Automation Scripts

### Create GitHub Repository

**Script:** `scripts/create-repo.sh`

**What it does:**
- Checks if `gh` CLI is installed and authenticated
- Prompts for repository name
- Checks if repo already exists
- Creates new public/private repo on GitHub
- Initializes git repository
- Adds remote origin
- Creates .gitignore and README
- Makes initial commit
- Optionally pushes to GitHub

**Usage:**
```bash
bash scripts/create-repo.sh
```

**Example:**
```
Enter repository name: my-awesome-dashboard
Should this be a public or private repository? public
Enter repository description: GenAI-powered EU dashboard
```

### Commit and Push Changes

**Script:** `scripts/commit-push.sh`

**What it does:**
- Shows current git status
- Stages all changes (`git add .`)
- Prompts for commit message (multi-line supported)
- Shows preview of commit
- Creates commit
- Asks if you want to push
- Pushes to remote
- Shows success/failure status clearly

**Usage:**
```bash
bash scripts/commit-push.sh
```

**Example:**
```
Enter commit message:
Added new revenue chart

- Implemented line chart for revenue trends
- Added filtering by division
- Improved mobile responsiveness
END
```

---

## Azure Deployment

### GitHub Actions Workflow

The project includes a production-ready Azure Static Web Apps deployment workflow.

**File:** `.github/workflows/azure-static-web-apps.yml`

**Features:**
- Triggers on push to `main` branch
- Builds the React app
- Deploys to Azure Static Web Apps
- Handles PR deployments
- Cleans up closed PRs

### Setup Steps

1. **Create Azure Static Web App:**
   - Go to Azure Portal
   - Create new Static Web App resource
   - Copy the deployment token

2. **Add GitHub Secret:**
   ```
   Repository → Settings → Secrets and variables → Actions
   Name: AZURE_STATIC_WEB_APPS_API_TOKEN
   Value: [paste your token]
   ```

3. **Push to trigger deployment:**
   ```bash
   bash scripts/commit-push.sh
   ```

4. **Check deployment status:**
   - Go to GitHub → Actions tab
   - Watch the workflow run
   - Get the Azure URL when complete

---

## Sample Prompts to Use with Claude Code

### Prompt 1: Initial Analysis
```
I'm in /projects/demoGenAI and I have 3 CSV files in the /data folder:
- 01_Bookings_JK.csv (booking records by year, month, country, booking type)
- 05_Exceptions_YH.csv (exception tracking by country and ops source)
- 81_TotalRevenue.csv (revenue by country, division, and month)

Analyze these files and tell me:
1. What interesting insights could we visualize?
2. What would make a cool React dashboard?
3. Give me 3-5 specific chart/visualization ideas

Keep it practical - this is for a 15-minute demo.
```

### Prompt 2: Build the App
```
Perfect! Now let's build it. Create a React + TypeScript + Vite app right here with:

1. A clean dashboard showing:
   - Total bookings by country (bar chart)
   - Revenue over time (line chart)
   - Exception rate by country (heat map or table)

2. Use Recharts for visualizations
3. Make it look decent with Tailwind CSS
4. Add a dark mode toggle

Keep the code simple and well-commented. Set this up so I can run it with
npm install && npm run dev.
```

### Prompt 3: Add a Map
```
Add an interactive map of Europe showing revenue by country.
Use react-leaflet. Color-code countries based on their total revenue.
Add tooltips showing exact numbers.
```

### Prompt 4: Add Filtering
```
Add filter controls at the top to filter data by:
- Date range (year/month)
- Country (multi-select)
- Booking type

Update all charts when filters change. Make the UI clean and intuitive.
```

### Prompt 5: Add Export
```
Add a "Export to CSV" button that lets users download the filtered data.
Also add a "Print Dashboard" button for PDF export.
```

### Prompt 6: Add Tests
```
Add basic unit tests for the data parsing logic using Vitest.
Create tests for edge cases like empty CSV files, missing columns, etc.
```

---

## Tech Stack Recommendations

When you ask Claude to build the dashboard, it will likely suggest:

### Core
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (faster than webpack)

### Visualization
- **Recharts** - Easy, React-native charts
- **React Leaflet** - Interactive maps
- **D3.js** - For custom visualizations

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Shadcn/ui** - Beautiful components

### Data Processing
- **PapaParse** - CSV parsing
- **date-fns** or **Luxon** - Date handling

### State Management
- **React Context** - Simple state (probably enough)
- **Zustand** - If you need more power

---

## Expected Output

After running the prompts, you should have:

```
demoGenAI/
├── src/
│   ├── App.tsx                    # Main app component
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── BookingsChart.tsx      # Bookings bar chart
│   │   ├── RevenueChart.tsx       # Revenue line chart
│   │   ├── ExceptionsTable.tsx    # Exceptions data
│   │   ├── RevenueMap.tsx         # Geographic map
│   │   ├── Filters.tsx            # Filter controls
│   │   └── ThemeToggle.tsx        # Dark mode switcher
│   ├── services/
│   │   └── dataService.ts         # CSV loading/parsing
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── main.tsx                   # Entry point
├── public/
│   └── data/                      # (symlink to ../data/)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## Tips for Success

### Do's
- ✅ Be specific in your prompts
- ✅ Ask Claude to explain the code
- ✅ Iterate quickly - don't like something? Ask Claude to change it
- ✅ Test frequently - run the app after each major change
- ✅ Show the audience what Claude is doing

### Don'ts
- ❌ Don't ask vague questions like "make it better"
- ❌ Don't skip the testing step
- ❌ Don't panic when things break (they will)
- ❌ Don't forget to commit your progress

---

## Troubleshooting

### "gh: command not found"
Install GitHub CLI: https://cli.github.com/

### "Permission denied" when running scripts
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Scripts have Windows line endings
Convert to Unix format:
```bash
dos2unix scripts/*.sh
# or
sed -i 's/\r$//' scripts/*.sh
```

### Can't authenticate with GitHub
```bash
gh auth login
```

### Repository already exists
Either:
- Choose a different name
- Delete the existing repo: `gh repo delete owner/repo`

---

## Learning Resources

### Claude Code
- [Claude Code Documentation](https://github.com/anthropics/claude-code)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

### React + Vite
- [Vite Guide](https://vitejs.dev/guide/)
- [React Docs](https://react.dev/)

### Data Visualization
- [Recharts Examples](https://recharts.org/en-US/examples)
- [React Leaflet Tutorial](https://react-leaflet.js.org/)

### Azure Static Web Apps
- [Azure SWA Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions for Azure](https://github.com/Azure/static-web-apps-deploy)

---

## Next Steps

After the demo, you can:

1. **Extend the dashboard:**
   - Add more charts
   - Implement advanced filtering
   - Add user authentication
   - Connect to a real API

2. **Improve the deployment:**
   - Add environment variables
   - Set up custom domains
   - Configure CDN
   - Add monitoring

3. **Share your work:**
   - Write a blog post about your experience
   - Create a YouTube tutorial
   - Share prompts that worked well
   - Contribute back to the community

---

## Credits

**Built with:** Claude Code by Anthropic
**Data source:** EU Migration Dashboard project
**Demo created:** 2025

---

## License

This is a demo project for educational purposes. Feel free to use, modify, and share!

---

## Questions?

If someone asks "Can Claude do X?", the answer is probably "Yes, but you have to ask it nicely."

Try it yourself and find out! 🚀

---

**Happy coding! May your prompts be specific and your deployments successful!**
