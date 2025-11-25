# Todo App - Stay Organized

A fully-featured, production-ready React todo application with local storage persistence.

## Features

- **Add, Edit, Delete Todos**: Full CRUD functionality
- **Mark as Complete**: Check off completed tasks
- **Filter Views**: View all, active, or completed todos
- **Statistics Dashboard**: Track total, active, completed, and progress percentage
- **Local Storage**: Todos persist across browser sessions
- **Responsive Design**: Works perfectly on desktop and mobile
- **Double-click to Edit**: Quick inline editing
- **Keyboard Shortcuts**: Enter to save, Escape to cancel editing
- **Clear Completed**: Remove all completed todos at once

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Usage

- **Add Todo**: Type in the input field and click "Add" or press Enter
- **Complete Todo**: Click the checkbox next to a todo
- **Edit Todo**: Double-click on the todo text or click the edit button
- **Delete Todo**: Click the delete button (trash icon)
- **Filter Todos**: Use All/Active/Completed buttons to filter your view
- **Clear Completed**: Remove all completed todos with one click

## Technologies Used

- React 18 with Hooks (useState, useEffect)
- Vite for fast development and building
- Local Storage API for data persistence
- Modern CSS with Flexbox and Grid
- Component-based architecture

## Project Structure

```
src/
├── components/
│   ├── TodoInput.jsx      # Input form for adding todos
│   ├── TodoList.jsx       # List container
│   ├── TodoItem.jsx       # Individual todo with edit/delete
│   ├── FilterButtons.jsx  # Filter and clear buttons
│   └── Stats.jsx          # Statistics dashboard
├── App.jsx                # Main app component
├── App.css                # App styles
├── main.jsx               # Entry point
└── index.css              # Global styles
```
