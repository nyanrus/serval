# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173 to see the browser.

## Development Workflow

### Hot Module Replacement (HMR)

Vite provides instant updates when you modify files:

1. Start the dev server: `npm run dev`
2. Edit any `.tsx` or `.css` file
3. Save the file
4. Changes appear instantly in the browser without reload

**Example**: Try editing `src/components/BrowserView.tsx` and changing the welcome message. You'll see the update immediately!

### Project Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## Architecture

### Component Structure

```
Browser (Main Component)
├── TabBar
│   └── Manages tab state and rendering
├── AddressBar
│   └── Handles URL input and navigation
└── BrowserView
    └── Renders web content
```

### State Management

All browser state is managed in `Browser.tsx`:
- `tabs`: Array of tab objects with id, title, and url
- `activeTabId`: Currently selected tab

State flows down as props, events bubble up as callbacks.

### Adding New Features

1. **New UI Component**
   - Create in `src/components/`
   - Add TypeScript interface for props
   - Include component-scoped CSS file
   - Import and use in parent component

2. **New Browser Feature**
   - Add state to `Browser.tsx`
   - Create handler functions
   - Pass as props to child components

3. **Styling**
   - Use component-scoped CSS files
   - Follow existing dark theme colors
   - Maintain Firefox-like aesthetics

## Testing Changes

### Manual Testing Checklist

- [ ] Create new tabs
- [ ] Switch between tabs
- [ ] Close tabs
- [ ] Navigate to URLs
- [ ] Use search functionality
- [ ] Test navigation buttons
- [ ] Verify tab titles update

### Build Verification

Always verify before committing:

```bash
npm run lint    # Check for code issues
npm run build   # Ensure production build works
```

## Code Style

- Use TypeScript for type safety
- Follow React hooks patterns
- Use functional components
- Keep components focused and single-purpose
- Add JSDoc comments for complex logic

## Common Tasks

### Adding a New Browser Control

1. Add UI to `AddressBar.tsx`
2. Add handler in `Browser.tsx`
3. Wire up with props
4. Test the feature

### Modifying Tab Behavior

1. Update logic in `Browser.tsx`
2. Pass new props to `TabBar.tsx`
3. Update `TabBar` component

### Changing Styles

1. Edit the component's `.css` file
2. Save and see instant HMR update
3. No build needed during development

## Performance Tips

- Keep component renders minimal
- Use React DevTools to debug renders
- Vite automatically optimizes bundles
- Production builds are minified

## Troubleshooting

### HMR Not Working
- Restart dev server
- Clear browser cache
- Check browser console for errors

### Build Errors
- Run `npm run lint` to find issues
- Check TypeScript errors
- Verify all imports are correct

### Styling Issues
- Check CSS specificity
- Verify class names match
- Use browser DevTools to inspect

## Next Steps

### Servo Integration

To integrate with Servo browser engine:

1. Replace iframe in `BrowserView.tsx` with Servo WebView
2. Update navigation handlers to use Servo APIs
3. Adapt event handling for Servo
4. Test with actual Servo rendering

**Current Implementation**: 
The application now includes a complete Servo backend integration layer:
- **ServoBackend** (`src/backend/ServoBackend.ts`): Manages communication with Servo
- **ServoView** (`src/components/ServoView.tsx`): React component for Servo rendering
- **UnifiedBrowserView** (`src/components/UnifiedBrowserView.tsx`): Automatically switches between Servo and iframe modes
- **Mock Backend** (`src/initBackend.ts`): Development mode simulation of Servo

In development mode (`npm run dev`), a mock Servo backend is automatically initialized, allowing you to test the integration without requiring an actual Servo installation.

For detailed information about Servo integration, see [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md).

### Potential Features

- History management (back/forward stack)
- Bookmarks
- Download manager
- Developer tools integration
- Extensions support
- Custom themes

## Resources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Servo Project](https://github.com/servo/servo)
