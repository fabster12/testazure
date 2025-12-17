# Quick Reference: Demo Prompts

**For easy copy-paste during the presentation**

---

## 1️⃣ ANALYZE THE DATA (3 min)

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

---

## 2️⃣ BUILD THE REACT APP (4 min)

```
Perfect! Now let's build it. Create a React + TypeScript + Vite app right here in /projects/demoGenAI with:

1. A clean dashboard showing:
   - Total bookings by country (bar chart)
   - Revenue over time (line chart)
   - Exception rate by country (heat map or table)

2. Use Recharts for visualizations
3. Make it look decent with Tailwind CSS
4. Add a dark mode toggle (because why not)

Keep the code simple and well-commented. Set this up so I can run it immediately with npm install && npm run dev.

Don't overthink it - this is a demo app, not production code.
```

---

## 3️⃣ RUN THE APP (1 min)

```
Great! Now:
1. Install all dependencies
2. Start the dev server
3. If there are any errors, fix them
```

---

## 4️⃣ ENHANCEMENT OPTIONS (2 min)

### Option A: Add Interactive Map
```
Add an interactive map of Europe showing revenue by country. Use react-leaflet.
Color-code countries based on their total revenue. Add tooltips showing exact numbers.
```

### Option B: Add Filters
```
Add filter controls at the top to filter data by:
- Date range (year/month)
- Country (multi-select)
- Booking type

Update all charts when filters change. Make the UI clean and intuitive.
```

### Option C: Add Export
```
Add a "Export to CSV" button that lets users download the filtered data.
Also add a "Print Dashboard" button for PDF export.
```

### Option D: Add AI Insights
```
Integrate a simple AI-powered insights panel that:
1. Analyzes the current data shown on the dashboard
2. Identifies trends (increasing/decreasing patterns)
3. Highlights anomalies (unusual spikes or drops)
4. Suggests which countries to focus on

Use the OpenAI API or Google Gemini API. Add a "Generate Insights" button.
Keep the implementation simple - just call the API with the data summary.
```

---

## 5️⃣ AZURE DEPLOYMENT (2 min)

```
We need to deploy this to Azure Static Web Apps. Create:

1. A GitHub Actions workflow file (.github/workflows/azure-static-web-apps.yml)
   - Build the React app
   - Deploy to Azure Static Web Apps
   - Use Azure deployment token from secrets

2. Update the build config to ensure static assets are properly handled

Make sure the workflow is production-ready with proper error handling.
```

---

## 6️⃣ GIT AUTOMATION (2 min)

```
Create 2 shell scripts in /scripts:

1. create-repo.sh
   - Ask for repository name
   - Check if repo already exists on GitHub
   - If not, create it using gh CLI
   - Initialize git and add remote
   - Do initial commit with all files

2. commit-push.sh
   - Run git add .
   - Ask for commit message
   - Commit changes
   - Push to remote
   - Show success/failure status clearly

Make them bulletproof with good error messages.
```

---

## 7️⃣ DOCUMENTATION (if time allows)

```
Create a comprehensive README.md explaining:
- What this dashboard does
- How to run it locally
- How to deploy it to Azure
- How to add new data sources
- Sample screenshots (mention where to add them)

Make it beginner-friendly with lots of examples.
Use emoji where appropriate to make it engaging.
```

---

## BONUS PROMPTS

### Add Testing
```
Add basic unit tests for the data parsing logic using Vitest.
Create tests for edge cases like empty CSV files, missing columns, etc.
Set up npm test script.
```

### Performance Optimization
```
Optimize the dashboard for large datasets:
- Add virtualization for long lists
- Implement data caching with localStorage
- Add loading states and skeletons
- Make charts lazy-load

Show loading indicators while data is being processed.
```

### Accessibility
```
Improve accessibility of the dashboard:
- Add ARIA labels to all interactive elements
- Ensure keyboard navigation works
- Add alt text to charts
- Test with screen reader guidelines

Make sure color contrast ratios meet WCAG AA standards.
```

### Mobile Responsiveness
```
Make the dashboard fully responsive:
- Stack charts vertically on mobile
- Add a hamburger menu for navigation
- Ensure touch-friendly buttons (min 44x44px)
- Test on various screen sizes

Add breakpoints for tablet and mobile views.
```

---

## TROUBLESHOOTING PROMPTS

### If npm install fails:
```
The npm install failed with this error: [paste error]

Please diagnose the issue and fix it. Common causes:
- Version conflicts
- Missing dependencies
- Platform-specific issues

Provide the solution and update package.json if needed.
```

### If the app won't start:
```
The dev server won't start. Here's the error: [paste error]

Please fix this. Check:
- Port conflicts
- Configuration issues
- Missing files
- Import errors
```

### If charts don't render:
```
The charts are not showing up. The console shows: [paste error]

Debug this issue. Check:
- Data loading
- Component imports
- Recharts configuration
- CSS/styling issues
```

---

## PRESENTER TIPS

1. **Keep prompts ready** - Copy these before the demo starts
2. **Read them out loud** - Let the audience hear what you're asking
3. **Explain why** - Tell the audience why you're prompting this way
4. **Show the results** - Open browser immediately after build completes
5. **Narrate Claude's actions** - Don't just stare silently at the screen

---

## TIME MANAGEMENT

| Time | Activity | Prompt # |
|------|----------|----------|
| 0-3 min | Introduction + Data exploration | - |
| 3-7 min | Analyze data with Claude | 1 |
| 7-11 min | Build the app | 2, 3 |
| 11-13 min | Add enhancement | 4 (pick one) |
| 13-15 min | Show deployment setup | 5, 6 |
| 15 min | Q&A | - |

---

## SAFETY NET

If something breaks:
- **Don't panic** - It's a demo, stuff happens
- **Show the error** - More authentic
- **Ask Claude to fix it** - Great teaching moment
- **Have fun with it** - "And this is why we test in production!"

---

**Good luck! You've got this! 🚀**
