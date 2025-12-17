# 15-Minute GenAI Dashboard Demo Script
## "From Zero to Hero: How Claude Built My EU Dashboard"

**Duration:** 15 minutes
**Audience:** Technical folks who want to see GenAI in action
**Vibe:** Informal, fun, maybe a few laughs along the way

---

## Pre-Demo Setup (Do this BEFORE presenting)

- [ ] Open terminal in `/projects/demoGenAI`
- [ ] Have Claude Code ready
- [ ] Have your Azure portal open (for deployment part)
- [ ] Maybe grab coffee. You'll need it for the live coding parts.

---

## ACT 1: "The Setup" (0-3 minutes)

### What You Say:

> "Alright folks, so here's the deal. I had a bunch of boring CSV files with EU migration data, and management wanted a 'dashboard.' You know, the usual. Charts, maps, real-time data, the works.
>
> Now, I could've spent weeks doing this manually, OR... I could ask Claude to do it. Guess which one I chose?
>
> Today I'm going to rebuild a mini version of this dashboard LIVE, using only GenAI. No templates. No copy-paste from Stack Overflow. Just me, Claude, and some CSV files. What could go wrong?"

### What You Do:

1. Show the 3 CSV files in the `/data` folder:
   ```bash
   ls -lh data/
   ```

2. Quick peek at what's inside:
   ```bash
   head data/01_Bookings_JK.csv
   ```

3. Casually mention:
   > "So we've got bookings data, exceptions, and revenue. Classic business stuff. Let's see what Claude thinks we should do with this..."

---

## ACT 2: "The First Prompt" (3-7 minutes)

### What You Say:

> "Now, here's where it gets interesting. I'm going to ask Claude what we can even DO with this data. Because honestly? I have no idea what makes a good dashboard."

### 🎯 DEMO PROMPT #1: Initial Analysis

Copy this into Claude Code:

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

### What You Do:

- Let Claude analyze the data
- **React to Claude's suggestions** (this is where you can be fun):
  - "Ooh, a revenue map! Fancy!"
  - "Bookings over time... yeah, we can do that"
  - "Exception rate by country... sounds important"

### What You Say Next:

> "See? Claude just gave us a whole roadmap. Now let's actually BUILD this thing."

---

## ACT 3: "Building the App" (7-11 minutes)

### 🎯 DEMO PROMPT #2: Create the React App

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

### What You Do While Claude Works:

- **Narrate what Claude is doing:**
  - "Okay, it's creating the package.json..."
  - "Now it's setting up the components..."
  - "Oh nice, it's adding TypeScript types..."

- **Show excitement when cool stuff happens:**
  - "Wait, it's even adding error handling!"
  - "It created a data loader service. Smart!"

### What You Say:

> "And just like that, we've got a full React app. Let's see if it actually works..."

### 🎯 DEMO PROMPT #3: Run the App

```
Great! Now:
1. Install all dependencies
2. Start the dev server
3. If there are any errors, fix them
```

### What You Do:

- Let Claude run `npm install` and `npm run dev`
- When the server starts, **open the browser** and show the dashboard
- Point out the cool features Claude built:
  - "Check out this chart!"
  - "Dark mode toggle works!"
  - "The data is actually loading from our CSVs!"

---

## ACT 4: "Make It Better" (11-13 minutes)

### What You Say:

> "Okay, it works. But let's make it COOLER. Let's add something extra that'll make management go 'wow.'"

### 🎯 DEMO PROMPT #4: Add Enhancement

Pick ONE of these (based on time):

**Option A - Add a Map:**
```
Add an interactive map of Europe showing revenue by country. Use react-leaflet.
Color-code countries based on their total revenue. Add tooltips showing exact numbers.
```

**Option B - Add Filtering:**
```
Add filter controls at the top to filter data by:
- Date range (year/month)
- Country (multi-select)
- Booking type

Update all charts when filters change. Make the UI clean and intuitive.
```

**Option C - Add Export:**
```
Add a "Export to CSV" button that lets users download the filtered data.
Also add a "Print Dashboard" button for PDF export.
```

### What You Do:

- Let Claude implement the enhancement
- Show the result in the browser
- **Celebrate the wins:**
  - "That was like, 30 seconds of work!"
  - "This would've taken me HOURS manually!"

---

## ACT 5: "Deploy to Azure" (13-15 minutes)

### What You Say:

> "Cool app, but it's on my laptop. Let's put it on the cloud. Because that's what the cloud is for, right?"

### 🎯 DEMO PROMPT #5: Azure Deployment

```
We need to deploy this to Azure Static Web Apps. Create:

1. A GitHub Actions workflow file (.github/workflows/azure-static-web-apps.yml)
   - Build the React app
   - Deploy to Azure Static Web Apps
   - Use Azure deployment token from secrets

2. Update the build config to ensure static assets are properly handled

Make sure the workflow is production-ready with proper error handling.
```

### 🎯 DEMO PROMPT #6: Git Automation Scripts

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

### What You Do:

- Show the generated workflow file
- **If time permits**, run the scripts:
  ```bash
  bash scripts/create-repo.sh
  # Enter repo name when prompted
  ```

### What You Say:

> "And boom! In like 2 minutes, we've got CI/CD set up. The app will auto-deploy to Azure every time we push to main. That's the power of GenAI, folks."

---

## ACT 6: "The Big Reveal" (15 minutes - Closing)

### What You Say:

> "So let me recap what we just did in 15 minutes:
>
> ✅ Analyzed 3 CSV files
> ✅ Built a full React dashboard with charts
> ✅ Added dark mode
> ✅ Added [whatever enhancement you did]
> ✅ Set up Azure deployment
> ✅ Created git automation scripts
>
> How long would this take manually? Probably 2-3 days, maybe a week if you count all the Googling and debugging.
>
> With Claude? **15 minutes.**
>
> Now, is it production-ready? Probably not. Would I trust it with your bank account? Definitely not. But as a starting point? As a proof-of-concept? As a way to quickly validate an idea?
>
> **It's absolutely game-changing.**"

### Final Thoughts to Share:

> "A few things I learned using GenAI for this:
>
> 1. **Be specific in your prompts.** Don't just say 'make a dashboard.' Say what you want to see.
>
> 2. **Iterate quickly.** If you don't like something, just ask Claude to change it. No need to dig through code.
>
> 3. **It's not magic.** You still need to understand what's happening. But it's like having a senior dev sitting next to you.
>
> 4. **The real value?** It handles the boring stuff (setup, config, boilerplate) so you can focus on the interesting problems.
>
> Anyway, that's my demo. Questions?"

---

## Backup Prompts (If You Have Extra Time)

### Add Testing:
```
Add basic unit tests for the data parsing logic using Vitest.
Create tests for edge cases like empty CSV files, missing columns, etc.
```

### Add Documentation:
```
Create a comprehensive README.md explaining:
- What this dashboard does
- How to run it locally
- How to deploy it
- How to add new data sources

Make it beginner-friendly with lots of examples.
```

### Add Performance:
```
Optimize the dashboard for large datasets:
- Add virtualization for long lists
- Implement data caching
- Add loading states and error boundaries
- Make charts responsive and performant
```

---

## Tips for a Great Demo:

1. **Don't panic if something breaks.** That's the best part! Show how Claude fixes errors.

2. **Talk through what Claude is doing.** Don't just stare at the screen silently.

3. **Be honest about limitations.** GenAI is powerful but not perfect.

4. **Show your prompts.** That's what people really want to learn.

5. **Have fun!** This is supposed to be impressive AND entertaining.

---

## Emergency Plan (If Demo Gods Hate You):

If something goes horribly wrong:

- **Network issues?** → Switch to explaining what WOULD happen (you're a great storyteller, right?)
- **npm install fails?** → "This is actually a great example of why we need Claude to fix dependency issues"
- **App won't start?** → Show the code instead and walk through what Claude built
- **Total meltdown?** → "And THIS is why we test in production, folks!"

Remember: Bugs make the demo more authentic. Nobody trusts a perfect demo anyway.

---

## Post-Demo:

Share the GitHub repo URL with the audience so they can:
- Clone the project
- Try the prompts themselves
- See the code Claude generated

Maybe add a note:
> "All of this code was generated using Claude Code in a single session. Feel free to steal the prompts and try it yourself!"

---

**Good luck! You've got this! 🚀**

---

*P.S. - If anyone asks "But can Claude do [insert complex thing]?" the answer is probably "Yes, but you have to ask it nicely."*
