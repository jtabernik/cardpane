# Widget Styling Guide

This guide explains how to use the centralized widget stylesheet system for consistent, maintainable widget styling.

## Overview

All widget styles are centralized in [src/styles/widgets.css](src/styles/widgets.css). This global stylesheet provides reusable CSS classes that:

- Ensure visual consistency across all widgets
- Reduce code duplication
- Make global theme changes easy
- Follow established design patterns
- Integrate with CSS variables from the theme system

## Quick Start

### Basic Widget Structure

```typescript
import React from 'react';
import type { WidgetProps } from '../../core/types';

export const MyWidgetComponent: React.FC<WidgetProps> = ({ size }) => {
  return (
    <div className="widget-card flex-center-column">
      <h3 className="text-small-title mb-small">My Widget</h3>
      <div className="text-large-bold">42</div>
      <p className="text-label">Some details</p>
    </div>
  );
};
```

### Common Patterns

**Centered card layout:**
```tsx
<div className="widget-card flex-center-column">
  {/* content */}
</div>
```

**Form with inputs:**
```tsx
<div className="flex-column p-large gap-medium">
  <input type="text" className="input-text" placeholder="Enter text..." />
  <button className="btn-primary">Submit</button>
</div>
```

**Status indicator:**
```tsx
<div className="flex-space-between">
  <h3>Title</h3>
  <div className="badge-status connected">ONLINE</div>
</div>
```

## Available CSS Classes

### Layout Classes

| Class | Purpose | Example |
|-------|---------|---------|
| `widget-card` | Standard widget container with padding, border, shadow | Main wrapper |
| `flex-center-column` | Vertically centered column layout | Clock, weather |
| `flex-center-row` | Horizontally centered row layout | Button groups |
| `flex-space-between` | Space items apart horizontally | Headers with badges |
| `flex-column` | Column layout (no centering) | Forms, lists |
| `flex-row` | Row layout (no centering) | Horizontal items |
| `scrollable-container` | Scrollable area with styling | Log viewers, lists |
| `full-height` | 100% height | Main containers |
| `full-width` | 100% width | Inputs, containers |

### Typography Classes

| Class | Purpose | Font Size | Color |
|-------|---------|-----------|-------|
| `text-xlarge` | Extra large bold text | 48px | Primary |
| `text-large-bold` | Large bold text | 48px | Primary |
| `text-large` | Large bold text | 32px | Inherit |
| `text-medium-title` | Medium title | 18px | Inherit (80% opacity) |
| `text-small-title` | Small title | 16px | Inherit |
| `text-label` | Labels and metadata | 14px | Inherit (60% opacity) |
| `text-secondary` | Secondary text | 14px | Inherit (80% opacity) |
| `text-small` | Small details | 12px | Inherit (60% opacity) |
| `text-tiny` | Tiny text | 0.7rem | Inherit |
| `text-micro` | Micro text | 0.75rem | Inherit |
| `text-error` | Error messages | 14px | Red (#ef4444) |
| `text-primary` | Primary colored text | Inherit | `var(--primary-color)` |
| `text-accent` | Accent colored text | Inherit | `var(--accent-color)` |
| `text-muted` | Muted text | Inherit | Inherit (50% opacity) |
| `font-mono` | Monospace font | Inherit | Code, logs |
| `text-center` | Center aligned text | - | - |
| `text-break` | Break long words | - | For URLs, data |

### Spacing Classes

**Padding:**
- `p-small` - 5px padding
- `p-medium` - 10px padding
- `p-large` - 20px padding

**Margin:**
- `m-none` - No margin
- `mt-small` - 5px top margin
- `mt-medium` - 10px top margin
- `mt-large` - 15px top margin
- `mt-xlarge` - 20px top margin
- `mb-small` - 5px bottom margin
- `mb-medium` - 8px bottom margin
- `mb-large` - 10px bottom margin

**Gap (for flex containers):**
- `gap-small` - 4px gap
- `gap-medium` - 8px gap
- `gap-large` - 10px gap

### Interactive Elements

**Buttons:**

```tsx
// Primary button
<button className="btn-primary">Save</button>

// Secondary button
<button className="btn-secondary">Cancel</button>
```

**Inputs:**

```tsx
// Text input
<input type="text" className="input-text" />

// Select dropdown
<select className="input-select">
  <option>Option 1</option>
</select>

// Checkbox
<input type="checkbox" className="input-checkbox" />
```

### Status Indicators

**Pulse indicator:**

```tsx
<div className="status-pulse active" />      // Green pulsing
<div className="status-pulse inactive" />    // Gray static
<div className="status-pulse error" />       // Red pulsing
```

**Badge:**

```tsx
<div className="badge-status connected">ONLINE</div>
<div className="badge-status disconnected">OFFLINE</div>
<div className="badge-status pending">PENDING</div>
```

**Border indicator:**

```tsx
<div className="indicator-left">          // Blue left border
<div className="indicator-left inactive"> // No border
```

### Cards & Containers

**Log entry:**

```tsx
<div className="log-entry">
  <div className="log-entry-header">
    <span className="text-accent">Event Type</span>
    <span>12:34:56</span>
  </div>
  <div className="text-break">Event data...</div>
</div>
```

**Modal:**

```tsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2 className="modal-title">Title</h2>
      <p className="modal-subtitle">Subtitle</p>
    </div>
    {/* content */}
  </div>
</div>
```

**Form group:**

```tsx
<div className="form-group">
  <label className="form-label">Field Name</label>
  <input type="text" className="input-text" />
  <div className="form-hint">Helpful hint text</div>
  <div className="form-error">Error message</div>
</div>
```

### Utility Classes

| Class | Purpose |
|-------|---------|
| `opacity-primary` | 80% opacity |
| `opacity-secondary` | 60% opacity |
| `opacity-tertiary` | 50% opacity |
| `rounded` | 8px border radius |
| `rounded-small` | 4px border radius |
| `rounded-large` | 12px border radius |
| `shadow-widget` | Widget shadow effect |
| `bg-subtle` | Subtle background (5% black) |
| `bg-transparent` | Transparent background |
| `border-widget` | Widget border styling |
| `transition-opacity` | Smooth opacity transition |
| `transition-all` | Smooth all properties transition |
| `cursor-pointer` | Pointer cursor |

## Responsive Design

### Size-Aware Styling

Use the `size` prop to adapt widget appearance based on dimensions:

```typescript
export const MyWidget: React.FC<WidgetProps> = ({ size }) => {
  // Conditional class selection
  const titleClass = size.w >= 4 ? 'text-large' : 'text-medium-title';
  const showDetails = size.h >= 3;

  return (
    <div className="widget-card flex-center-column">
      <h3 className={titleClass}>Title</h3>
      {showDetails && <p className="text-label">Additional details</p>}
    </div>
  );
};
```

### Responsive Classes

The stylesheet includes responsive utility classes:

```tsx
<div className="responsive-text-large">  // 48px on desktop, 32px on mobile
<div className="responsive-text-medium"> // 32px on desktop, 24px on mobile
```

## Theming with CSS Variables

The stylesheet uses CSS variables from the theme system. Always use variables for colors:

| Variable | Purpose |
|----------|---------|
| `--dashboard-bg` | Dashboard background |
| `--dashboard-text` | Text color |
| `--widget-bg` | Widget background |
| `--widget-border` | Border color |
| `--widget-shadow` | Shadow effect |
| `--primary-color` | Primary accent |
| `--accent-color` | Secondary accent |

**Example:**

```tsx
// Good - uses CSS variable
<div className="text-primary">Text</div>

// Avoid - hardcoded color
<div style={{ color: '#3498db' }}>Text</div>
```

## Combining Classes with Inline Styles

When you need widget-specific styles, combine classes with minimal inline styles:

```tsx
// Good - use classes for common patterns, inline for specifics
<div className="widget-card flex-center-column">
  <h3 className="text-large" style={{ fontWeight: 300 }}>Title</h3>
</div>

// Avoid - all inline styles
<div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  // ... many more lines
}}>
```

## Animation Classes

The stylesheet includes the `status-pulse` class with built-in animation:

```tsx
<div className="status-pulse active" />
```

For custom animations, add a `<style>` tag in your component:

```tsx
export const MyWidget: React.FC<WidgetProps> = () => {
  return (
    <div className="widget-card">
      <div className="custom-animation">Content</div>

      <style>{`
        @keyframes custom-animation {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .custom-animation {
          animation: custom-animation 2s infinite;
        }
      `}</style>
    </div>
  );
};
```

## Complete Examples

### Simple Display Widget

```tsx
import React from 'react';
import type { WidgetProps } from '../../core/types';

export const SimpleWidget: React.FC<WidgetProps> = ({ size }) => {
  return (
    <div className="widget-card flex-center-column">
      <h3 className="text-small-title mb-small">Metric Name</h3>
      <div className="text-large-bold">1,234</div>
      <p className="text-label mt-small">Updated just now</p>
    </div>
  );
};
```

### Interactive Widget with Form

```tsx
import React, { useState } from 'react';
import type { WidgetProps } from '../../core/types';

export const FormWidget: React.FC<WidgetProps> = () => {
  const [value, setValue] = useState('');

  return (
    <div className="widget-card flex-column p-large">
      <h3 className="text-small-title mb-medium">Settings</h3>

      <div className="form-group">
        <label className="form-label">Enter Value</label>
        <input
          type="text"
          className="input-text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="form-hint">This will update the widget</div>
      </div>

      <button className="btn-primary mt-medium">
        Save Changes
      </button>
    </div>
  );
};
```

### Status Widget with Indicator

```tsx
import React from 'react';
import type { WidgetProps } from '../../core/types';

export const StatusWidget: React.FC<WidgetProps> = () => {
  const isActive = true;

  return (
    <div className="widget-card flex-center-column">
      <div className={`status-pulse ${isActive ? 'active' : 'inactive'}`} />

      <h3 className="text-small-title mt-medium">System Status</h3>

      <div className={`badge-status ${isActive ? 'connected' : 'disconnected'} mt-small`}>
        {isActive ? 'ONLINE' : 'OFFLINE'}
      </div>
    </div>
  );
};
```

### Data List Widget

```tsx
import React from 'react';
import type { WidgetProps } from '../../core/types';

export const ListWidget: React.FC<WidgetProps> = () => {
  const items = [
    { id: 1, name: 'Item 1', value: '123' },
    { id: 2, name: 'Item 2', value: '456' },
  ];

  return (
    <div className="flex-column full-height p-medium">
      <div className="flex-space-between mb-medium">
        <h3 className="m-none text-small-title">Data List</h3>
        <div className="badge-status connected">LIVE</div>
      </div>

      <div className="scrollable-container flex-column gap-small">
        {items.map((item) => (
          <div key={item.id} className="log-entry indicator-left">
            <div className="log-entry-header">
              <span className="text-accent">{item.name}</span>
              <span className="text-small">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Best Practices

### ✅ Do

- Use class names for all common styling patterns
- Combine multiple classes for complex layouts
- Use CSS variables for colors
- Keep inline styles minimal and widget-specific
- Use responsive classes or conditional rendering for size variations
- Follow established naming conventions

### ❌ Don't

- Write large inline style objects
- Hardcode colors instead of using CSS variables
- Duplicate common patterns with inline styles
- Create custom classes when global classes exist
- Override global classes with `!important`
- Use pixel values when CSS variables exist

## Adding New Global Styles

If you find yourself repeating the same styles across multiple widgets, add them to the global stylesheet:

1. Open [src/styles/widgets.css](src/styles/widgets.css)
2. Add your class to the appropriate section (Layout, Typography, etc.)
3. Document the new class in this guide
4. Update existing widgets to use the new class

## Debugging Tips

**Styles not applying?**
- Verify the stylesheet is imported in [src/main.tsx](src/main.tsx)
- Check for typos in class names
- Inspect element in browser DevTools to see which styles are applied
- Ensure inline styles aren't overriding classes

**Layout issues?**
- Check parent container has proper flex classes
- Verify `full-height` and `full-width` are applied where needed
- Use browser DevTools to inspect flex container properties

**Color issues?**
- Confirm CSS variables are defined in [src/index.css](src/index.css)
- Use DevTools to check computed color values
- Test in both light and dark modes if applicable

## Migration Guide

To migrate an existing widget to use the global stylesheet:

1. Identify inline styles that match global classes
2. Replace inline style objects with class names
3. Keep widget-specific inline styles (e.g., fontWeight: 300)
4. Test the widget in different sizes
5. Verify colors work with theme variables

**Example migration:**

```tsx
// Before
<div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  padding: '20px'
}}>
  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
    Title
  </h3>
</div>

// After
<div className="flex-center-column full-height p-large">
  <h3 className="text-small-title mb-small">Title</h3>
</div>
```

## Resources

- **Stylesheet**: [src/styles/widgets.css](src/styles/widgets.css)
- **Theme Variables**: [src/index.css](src/index.css)
- **Widget Template**: [WIDGET_TEMPLATE.md](WIDGET_TEMPLATE.md)
- **Example Widgets**: [src/widgets-external/](src/widgets-external/)

## Questions?

If you have questions about widget styling or need new global classes added, please consult the existing widgets for patterns and examples.
