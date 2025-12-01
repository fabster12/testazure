# EU Dashboard Theme & Query Selector Demos

This folder contains standalone HTML demo files showcasing different theme and layout options with a focus on the **FedEx Purple theme** and various **query selector UI patterns**.

## 🎨 Original Theme Demos

### 1. fedex-purple-sidebar.html
**FedEx Purple Theme with Vertical Sidebar Navigation**
- FedEx brand colors (Purple #4D148C, Orange #FF6600)
- Collapsible sidebar navigation
- Modern card-based layout
- Prominent query selector and filter controls

### 2. corporate-blue-cards.html
**Corporate Blue Theme with Horizontal Navigation**
- Professional navy blue color scheme
- Horizontal tab navigation
- Clean card-based layout with hover effects

### 3. high-contrast-accessibility.html
**High Contrast Accessibility Theme**
- Black backgrounds with white text
- Vibrant accent colors (yellow, cyan, magenta, green)
- WCAG AAA compliant
- Maximum visibility for all controls

## 🔍 FedEx Purple Query Selector Options

All three options feature the **collapsible sidebar** (click the arrow button to collapse to icons only!)

### Option 1: fedex-option1-searchable-dropdown.html
**Searchable Dropdown with Live Filter**

**Features:**
- Type to search through all queries instantly
- Dropdown shows rich information (record count, last updated)
- Keyboard-friendly for power users
- Search by name or code (e.g., "JK", "Bookings", "Track")

**Best for:**
- Power users who know what they're looking for
- Quick keyboard navigation
- Users who prefer minimal UI chrome

**Key UI Elements:**
- Search input with icon
- Expandable dropdown with detailed query info
- Badges showing record counts
- "Last updated" timestamps

---

### Option 2: fedex-option2-card-tiles.html
**Visual Card/Tile Grid Selector**

**Features:**
- All queries visible at once as cards
- Visual icons for each query type
- Hover effects with elevation
- Selected state with checkmark
- Collapsible panel to save space

**Best for:**
- Visual learners
- Users who want to see all options at a glance
- Touch/mouse-friendly interaction
- Less frequent query switching

**Key UI Elements:**
- Grid of query cards with icons
- Large click targets
- Visual checkmark on selection
- Record count badges
- Collapse/expand toggle

---

### Option 3: fedex-option3-grouped-categories.html
**Grouped by Category with Tabs**

**Features:**
- Queries organized into logical groups:
  - 📦 **Operations** (5 queries)
  - 💰 **Financial** (2 queries)
  - 👥 **Customer** (2 queries)
- Tab-based navigation between categories
- Radio-button style selection
- Related queries grouped together

**Best for:**
- Users who think in categories
- Finding related queries
- Reducing cognitive load
- Structured navigation

**Key UI Elements:**
- Category tabs with counts
- List-style query items
- Radio button selection indicators
- Slide-in animation on hover

---

## 🎯 Common Features Across All Options

### Collapsible Sidebar
- **Expanded** (260px): Shows full navigation labels
- **Collapsed** (70px): Shows only icons
- Hover tooltips appear when collapsed
- Click the arrow button (◀/▶) to toggle
- Smooth animation transition

### FedEx Brand Colors
- Primary: Purple `#4D148C`
- Accent: Orange `#FF6600`
- Dark backgrounds for professional look
- High contrast for readability

### Date Range Filters
All options include start/end date inputs for filtering

### Apply Filters Button
Prominent FedEx orange button to execute the query

### Responsive KPI Cards
- Hover effects with elevation
- Trend indicators (↑↓)
- Clean typography

---

## 🚀 How to View

1. Navigate to `projects/eu_dashboard/demos/`
2. Open any `.html` file in your browser
3. **Try the collapsible sidebar** - click the arrow button!
4. **Compare query selectors** - which one feels most intuitive?

**Quick open from command line:**
```bash
cd projects/eu_dashboard/demos

# Windows
start fedex-option1-searchable-dropdown.html

# Mac
open fedex-option1-searchable-dropdown.html

# Linux
xdg-open fedex-option1-searchable-dropdown.html
```

---

## 💡 Recommendations

**Choose Option 1 (Searchable Dropdown) if:**
- Users know query names/codes
- Quick keyboard navigation is important
- Screen space is at a premium
- Users switch queries frequently

**Choose Option 2 (Card Tiles) if:**
- Visual representation helps users
- Users need to browse/explore queries
- Touch screen support is important
- Users prefer seeing all options

**Choose Option 3 (Grouped Categories) if:**
- Queries naturally fall into categories
- Users work within specific domains (Operations, Financial, etc.)
- Reducing information overload is important
- Users prefer structured navigation

**Mix & Match:**
You can also combine approaches:
- Searchable dropdown + category filter
- Card tiles with category tabs
- List view with search filtering

---

## 🔨 Implementation Notes

These are static HTML demos with inline CSS and vanilla JavaScript. The actual implementation will use:

- **React components** for query selector
- **Tailwind CSS** for styling
- **CSS variables** for theming
- **TypeScript** for type safety
- **Context API** for state management
- **DuckDB integration** for actual data

---

## 📊 Query Selector Comparison

| Feature | Option 1: Searchable | Option 2: Card Tiles | Option 3: Categories |
|---------|---------------------|---------------------|---------------------|
| **Space Efficient** | ✅ Excellent | ⚠️ Moderate | ✅ Good |
| **Visual Appeal** | ⚠️ Minimal | ✅ Excellent | ✅ Good |
| **Power User Friendly** | ✅ Excellent | ⚠️ Basic | ✅ Good |
| **Discoverability** | ⚠️ Requires search | ✅ Excellent | ✅ Good |
| **Mobile Friendly** | ✅ Good | ✅ Excellent | ✅ Good |
| **Categorization** | ❌ None | ❌ None | ✅ Built-in |
| **Information Density** | ✅ High | ⚠️ Lower | ✅ Medium |

---

## 📝 Next Steps

After reviewing, we can:
1. Choose your preferred query selector pattern
2. Implement it in the React application
3. Add keyboard shortcuts (e.g., Ctrl+K to open search)
4. Add query history/favorites
5. Implement the collapsible sidebar functionality
6. Add smooth transitions and animations

**Which option do you prefer?** Let's implement it!
