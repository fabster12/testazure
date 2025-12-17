# FedEx Theme Implementation

## Overview

Added a third theme option to the dashboard: **FedEx Brand Theme** featuring FedEx's signature purple and orange colors.

## Theme Cycling

The dashboard now cycles through three themes:
1. **Light Mode** (default)
2. **Dark Mode** (gray/black palette)
3. **FedEx Mode** (purple #4D148C + orange #FF6600)

Click the theme toggle button to cycle: Light → Dark → FedEx → Light

## FedEx Brand Colors

### Purple Palette
- **Primary Purple**: `#4D148C` - Main brand color
- **Light Purple**: `#6B1FB3` - Hover states
- **Dark Purple**: `#3A0F68` - Active states
- **50-900 Scale**: Full range of purple shades for backgrounds, text, borders

### Orange Palette
- **Primary Orange**: `#FF6600` - Accent color
- **Light Orange**: `#FF8533` - Highlights
- **Dark Orange**: `#CC5200` - Pressed states
- **50-900 Scale**: Full range of orange shades

## Visual Changes in FedEx Theme

### Header
- Background: FedEx Purple (`#4D148C`)
- Text: White
- Bottom Border: 4px FedEx Orange stripe
- Logo text: White

### Body
- Background: Light purple (`#F5F0FA`)
- Text: Dark purple (`#120523`)

### KPI Cards
- Background: White
- Border: 2px FedEx Purple
- Headers: Purple-600
- Values: FedEx Purple (main)
- Subtext: Purple-500

### Charts & Components
- Background: White
- Border: 2px FedEx Purple
- Headers: FedEx Purple
- Text: Purple shades for hierarchy

### Exception Table
- Borders: Purple-300
- Headers: FedEx Purple
- Hover: Purple-50
- Text: Purple-600 to Purple-900

### Footer
- Background: FedEx Purple
- Border: 4px Orange top stripe
- Text: Purple-100

### Theme Toggle Button
- Background: FedEx Purple
- Text: White
- Hover: Darker Purple
- Shows truck/package icon
- Displays current theme name

### Scrollbars
- Track: Light purple (`#E8DCF2`)
- Thumb: Purple-400 (`#7F3BB3`)
- Hover: FedEx Purple (`#4D148C`)

## Implementation Details

### Files Modified

1. **src/contexts/ThemeContext.tsx**
   - Added 'fedex' as third theme option
   - Updated theme cycling logic
   - Manages .fedex class on document root

2. **src/components/ThemeToggle.tsx**
   - Added FedEx truck/package icon
   - Shows current theme name
   - Tooltips for next theme
   - FedEx-specific styling

3. **tailwind.config.js**
   - Added fedex-purple color palette (50-900)
   - Added fedex-orange color palette (50-900)
   - Added 'fedex' variant plugin
   - Updated darkMode config for multi-theme support

4. **src/index.css**
   - FedEx body background and text
   - FedEx scrollbar styles
   - Custom CSS for theme-specific elements

5. **src/App.tsx**
   - Added fedex: variants to all major sections
   - Header, footer, loading states
   - Error states with FedEx colors

6. **src/components/KPICards.tsx**
   - FedEx white backgrounds with purple borders
   - Purple text hierarchy
   - Maintained gradient icons

7. **src/components/BookingsChart.tsx**
   - White background, purple border
   - Purple headers and text

8. **src/components/RevenueChart.tsx**
   - White background, purple border
   - Purple headers and text

9. **src/components/ExceptionTable.tsx**
   - Purple borders and headers
   - Purple text hierarchy
   - Purple hover states

## Usage

### Switching Themes

**Via UI:**
- Click the theme toggle button in the top-right corner
- Button shows current theme name and icon
- Cycles through: Light → Dark → FedEx → Light

**Programmatically:**
```typescript
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  // Current theme: 'light' | 'dark' | 'fedex'
  console.log(theme);

  // Toggle to next theme
  toggleTheme();
}
```

### Using FedEx Colors in Components

```tsx
// Background colors
className="bg-white fedex:bg-fedex-purple"

// Text colors
className="text-gray-900 fedex:text-white"

// Borders
className="border-gray-200 fedex:border-fedex-orange"

// Hover states
className="hover:bg-gray-100 fedex:hover:bg-fedex-purple-50"
```

### Color Reference

```javascript
// In tailwind.config.js
colors: {
  'fedex-purple': {
    DEFAULT: '#4D148C',  // Main brand
    50: '#F5F0FA',       // Backgrounds
    100: '#E8DCF2',      // Light backgrounds
    200: '#D1B9E5',
    300: '#A87ACC',      // Borders
    400: '#7F3BB3',      // Scrollbars
    500: '#4D148C',      // Primary
    600: '#3A0F68',      // Dark text
    700: '#2D0C51',
    800: '#1F083A',
    900: '#120523',      // Darkest text
  },
  'fedex-orange': {
    DEFAULT: '#FF6600',  // Accent
    50: '#FFF4E6',
    100: '#FFE0B3',
    200: '#FFCC80',
    300: '#FFB84D',
    400: '#FF991A',
    500: '#FF6600',      // Primary orange
    600: '#CC5200',      // Darker
    700: '#993D00',
    800: '#662900',
    900: '#331400',
  }
}
```

## Design Principles

1. **Brand Consistency**: Uses official FedEx purple and orange
2. **Readability**: Maintains high contrast ratios
3. **Hierarchy**: Purple shades indicate importance
4. **Accents**: Orange used sparingly for emphasis (borders, stripes)
5. **White Space**: White backgrounds for content clarity

## Accessibility

- All text meets WCAG AA contrast requirements
- Purple-white combinations: 4.5:1+ contrast
- Orange used for decorative elements only
- Theme persists in localStorage
- Respects system preferences on first load

## Theme Persistence

Theme preference is saved to `localStorage`:
- Key: `'theme'`
- Values: `'light'` | `'dark'` | `'fedex'`
- Auto-loads on page refresh
- Falls back to system preference if not set

## Browser Support

- Modern browsers with CSS custom properties
- WebKit scrollbar styling (Chrome, Edge, Safari)
- Graceful degradation for older browsers

## Future Enhancements

Possible additions:
- [ ] FedEx logo in header
- [ ] Custom FedEx fonts (if available)
- [ ] Animated theme transitions
- [ ] FedEx-specific chart colors
- [ ] Orange accent highlights on hover
- [ ] More FedEx brand elements (arrows, shapes)

---

**Built with FedEx brand colors! 🟣🟠**
