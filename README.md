# serval

A simple browser UI built with Vite and React, featuring a Firefox-like interface with tab management and browseable internet capabilities.

## Features

- **Tab Management**: Create, switch, and close multiple tabs
- **Address Bar**: Navigate to URLs or search with automatic protocol handling
- **Navigation Controls**: Back, forward, and refresh buttons
- **Fast Development**: Vite's Hot Module Replacement (HMR) for instant updates
- **Firefox-like UI**: Dark theme with modern browser aesthetics

## Screenshots

### Initial Browser View
![Browser Initial State](https://github.com/user-attachments/assets/531a504d-0b1f-49d6-85a9-571be0428467)

### Browsing a Website
![Browser with URL](https://github.com/user-attachments/assets/37e88299-d6a1-49ab-a2c5-812b48bebf76)

### Multiple Tabs
![Browser Multiple Tabs](https://github.com/user-attachments/assets/c02461ea-a85c-4d31-8f67-8b7ed1a0c026)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev
```

The browser will be available at `http://localhost:5173/`. The development server includes a mock Servo backend, so you can test the UI without installing Servo.

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md).

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server with HMR
npm run dev
```

The browser will be available at `http://localhost:5173/`. Changes to the code will automatically update in the browser thanks to Vite's HMR.

### Build

```bash
# Build for production
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
serval/
├── src/
│   ├── components/
│   │   ├── TabBar.tsx          # Tab management component
│   │   ├── TabBar.css
│   │   ├── AddressBar.tsx      # URL/search input component
│   │   ├── AddressBar.css
│   │   ├── ServoView.tsx       # Servo content display component
│   │   └── ServoView.css
│   ├── backend/
│   │   └── ServoBackend.ts     # Servo backend communication
│   ├── Browser.tsx              # Main browser component
│   ├── Browser.css
│   ├── App.tsx                  # Application entry point
│   ├── main.tsx                 # React root
│   ├── config.ts                # Servo configuration
│   ├── initBackend.ts           # Backend initialization
│   └── index.css                # Global styles
├── public/                      # Static assets
├── index.html                   # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Component Overview

### Browser
The main component that orchestrates all sub-components and manages the browser state.

### TabBar
Manages multiple tabs with:
- Tab creation (+ button)
- Tab switching (click on tab)
- Tab closing (× button)
- Active tab highlighting

### AddressBar
Provides navigation functionality:
- URL input with auto-complete
- Search query support (redirects to Google)
- Navigation controls (back, forward, refresh)
- Automatic protocol handling (adds https:// if missing)

### ServoView
Displays web content using Servo engine:
- Communicates with Servo backend for rendering
- Handles page title updates
- Manages navigation events

## Browser Features

### URL Handling
- **Direct URLs**: Enter `example.com` → navigates to `https://example.com`
- **Full URLs**: Enter `https://github.com` → navigates directly
- **Search**: Enter `how to use React` → searches on Google

### Tab Management
- Create unlimited tabs with the + button
- Click on any tab to switch to it
- Close tabs with the × button (minimum 1 tab always remains)
- Tab titles automatically update based on page content

## Technology Stack

- **React 19**: Latest React with modern hooks
- **TypeScript**: Type-safe development
- **Vite 7**: Lightning-fast build tool with HMR
- **CSS**: Component-scoped styling
- **ESLint**: Code quality and consistency

## About Servo Integration

Serval is designed as a frontend UI for the [Servo browser engine](https://github.com/servo/servo), similar to how Firefox's UI sits on top of Gecko.

### How It Works

The integration consists of three layers:

1. **Frontend Layer** (React/TypeScript): The UI components you see (TabBar, AddressBar, etc.)
2. **Backend Bridge**: A native bridge that communicates between the React frontend and Servo
3. **Servo Engine**: The actual browser engine written in Rust that renders web content

### Key Components

- **ServoBackend** (`src/backend/ServoBackend.ts`): Manages communication with Servo through message passing
- **ServoView** (`src/components/ServoView.tsx`): React component that displays Servo-rendered content

### Getting Started with Servo

For detailed information about setting up and using Servo as the backend, see [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md).

**Quick Start (Development Mode)**:
```bash
npm install
npm run dev  # Runs with mock Servo backend for development
```

**Production Mode (with Servo)**:
Requires building Servo and setting up a backend bridge. See [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md) for complete instructions.

## Development Tips

### Hot Module Replacement (HMR)
Vite's HMR allows you to see changes instantly:
1. Start the dev server: `npm run dev`
2. Edit any `.tsx` or `.css` file
3. Save the file
4. The browser updates automatically without full reload

### Adding New Features
- New UI components go in `src/components/`
- Browser-level state is managed in `src/Browser.tsx`
- Styling follows component-scoped CSS pattern

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
