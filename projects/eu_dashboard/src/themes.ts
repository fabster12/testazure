export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  'text-primary': string;
  'text-secondary': string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  'chart-pie': string[];
  'chart-product': { [key: string]: string };
  'chart-categorical': string[];
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export const themes: { [key: string]: Theme } = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '30 64 175', // blue-800
      secondary: '30 58 138', // blue-900
      accent: '59 130 246', // blue-500
      background: '17 24 39', // gray-900
      surface: '31 41 55', // gray-800
      'text-primary': '249 250 251', // gray-50
      'text-secondary': '209 213 219', // gray-300
      danger: '220 38 38', // red-600
      warning: '245 158 11', // amber-500
      success: '22 163 74', // green-600
      info: '59 130 246', // blue-500
      'chart-pie': ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'],
      'chart-product': { 'Domestic': '#8884d8', 'International': '#82ca9d', 'Special': '#ffc658' },
      'chart-categorical': ['#2563eb', '#4f46e5', '#db2777', '#f59e0b', '#16a34a', '#0ea5e9', '#6d28d9'],
    },
  },
  light: {
    name: 'Light',
    colors: {
      primary: '23 162 184', // info/cyan from bootstrap-like colors
      secondary: '108 117 125', // gray
      accent: '0 123 255', // primary blue
      background: '244 246 249', // Light gray bg
      surface: '255 255 255', // white
      'text-primary': '33 37 41', // near black
      'text-secondary': '108 117 125', // gray
      danger: '220 53 69', // red
      warning: '255 193 7', // orange/yellow
      success: '40 167 69', // green
      info: '23 162 184', // cyan
      'chart-pie': ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'],
      'chart-product': { 'Domestic': '#0088FE', 'International': '#00C49F', 'Special': '#FFBB28' },
      'chart-categorical': ['#3b82f6', '#6366f1', '#ec4899', '#f97316', '#22c55e', '#38bdf8', '#8b5cf6'],
    },
  },
};