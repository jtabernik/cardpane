# Typography Guide

This guide explains the standardized typography system used across all dashboard widgets.

## Font Stack

All widgets use a consistent, system-native font stack for optimal readability and performance:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Why this stack?**
- `-apple-system`: San Francisco font on macOS and iOS
- `BlinkMacSystemFont`: System font on Chrome/Blink
- `"Segoe UI"`: Windows system font
- `Roboto`: Android system font
- Fallbacks: Helvetica Neue → Arial → Generic sans-serif

**Monospace variant** (for code, numbers, technical data):
```css
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
```

---

## Typography Hierarchy

### Display Sizes (Main Widget Values)

Use for the primary data point in a widget (price, temperature, time).

**`.text-large-bold`** - 48px (3rem)
- **Use for**: Main widget value with emphasis
- **Font weight**: 700 (Bold)
- **Color**: var(--primary-color)
- **Example**: Bitcoin price, current temperature

```tsx
<div className="text-large-bold">$42,350.00</div>
```

**`.text-xlarge`** - 48px (3rem)
- **Use for**: Main widget value without color emphasis
- **Font weight**: 700 (Bold)
- **Example**: Clock time display

```tsx
<div className="text-xlarge">14:35:22</div>
```

**`.text-large`** - 32px (2rem)
- **Use for**: Secondary important values
- **Font weight**: 700 (Bold)
- **Example**: Secondary metric in a two-value widget

```tsx
<div className="text-large">72%</div>
```

---

### Titles (Widget Headers & Sections)

Use for widget titles, section headers, and category labels.

**`.text-medium-title`** - 18px (1.125rem)
- **Use for**: Widget main title
- **Font weight**: 600 (Semibold)
- **Opacity**: 0.9
- **Example**: Widget name at top

```tsx
<h2 className="text-medium-title">Server Status</h2>
```

**`.text-small-title`** - 16px (1rem)
- **Use for**: Widget subtitle or section header
- **Font weight**: 500 (Medium)
- **Example**: City name in weather widget

```tsx
<div className="text-small-title">San Francisco</div>
```

---

### Body Text (Content & Labels)

Use for descriptive content, form labels, and general text.

**`.text-label`** - 14px (0.875rem)
- **Use for**: Field labels and descriptive text
- **Font weight**: 400 (Regular)
- **Opacity**: 0.7
- **Example**: "Humidity", "Last updated"

```tsx
<div className="text-label">Humidity: 65%</div>
```

**`.text-secondary`** - 14px (0.875rem)
- **Use for**: Secondary information, descriptions
- **Font weight**: 400 (Regular)
- **Opacity**: 0.8
- **Example**: Quote text, widget descriptions

```tsx
<div className="text-secondary">This is a description</div>
```

---

### Small Text (Metadata & Timestamps)

Use for timestamps, metadata, footnotes, and auxiliary information.

**`.text-small`** - 12px (0.75rem)
- **Use for**: Timestamps, small metadata
- **Font weight**: 400 (Regular)
- **Opacity**: 0.7
- **Example**: "Updated 2 minutes ago"

```tsx
<div className="text-small">Updated: 14:35:22</div>
```

**`.text-tiny`** - 11px (0.7rem)
- **Use for**: Very small labels and indicators
- **Font weight**: 400 (Regular)
- **Example**: "24h" label next to crypto change

```tsx
<span className="text-tiny">24h</span>
```

**`.text-micro`** - 10px (0.65rem)
- **Use for**: Extremely small text (use sparingly)
- **Font weight**: 400 (Regular)
- **Example**: Copyright notices, fine print

```tsx
<span className="text-micro">v1.0.0</span>
```

---

## Font Weight Utilities

Add these classes to adjust font weight independently of size:

| Class | Weight | Value | Use Case |
|-------|--------|-------|----------|
| `.font-light` | Light | 300 | Subtle, decorative text |
| `.font-normal` | Regular | 400 | Default body text |
| `.font-medium` | Medium | 500 | Slight emphasis |
| `.font-semibold` | Semibold | 600 | Section headers, emphasis |
| `.font-bold` | Bold | 700 | Strong emphasis, titles |

**Examples:**
```tsx
<div className="text-secondary font-bold">Important Note</div>
<div className="text-small-title font-light">Subtitle</div>
```

---

## Text Style Utilities

### Alignment
- `.text-center` - Center align text
- `.text-left` - Left align text
- `.text-right` - Right align text

### Style
- `.italic` - Italic text (e.g., quotes)

### Color
- `.text-primary` - Theme primary color
- `.text-accent` - Theme accent color
- `.text-muted` - 50% opacity (subtle text)
- `.text-error` - Red error text (#ef4444)

### Special
- `.text-break` - Break long words (for URLs, hashes)
- `.font-mono` - Use monospace font

---

## Complete Widget Example

```tsx
export const MyWidget: React.FC<WidgetProps> = ({ id }) => {
  return (
    <div className="widget-card flex-center-column text-center">
      {/* Widget title */}
      <div className="text-small-title mb-small opacity-primary">
        San Francisco
      </div>

      {/* Main value */}
      <div className="text-large-bold mb-small">
        72°F
      </div>

      {/* Secondary info */}
      <div className="text-secondary mb-medium">
        Partly Cloudy
      </div>

      {/* Metadata */}
      <div className="text-label mt-small">
        Humidity: 65%
      </div>

      {/* Timestamp */}
      <div className="text-small mt-large">
        Updated: 2:45 PM
      </div>
    </div>
  );
};
```

---

## Best Practices

### ✅ DO
- Use CSS classes instead of inline font styles
- Let text inherit font-family from `.widget-card`
- Use the hierarchy consistently (Display → Title → Body → Small)
- Use `.font-mono` for numbers, code, timestamps
- Combine classes: `text-small font-bold text-right`

### ❌ DON'T
- Don't use inline `fontSize` styles
- Don't mix rem and px units in inline styles
- Don't override font-family except for monospace
- Don't use font sizes outside the defined hierarchy
- Don't use `fontWeight` inline - use `.font-*` classes

---

## Migration Checklist

When updating existing widgets to use the standard typography:

- [ ] Remove all inline `fontSize` styles
- [ ] Remove all inline `fontWeight` styles
- [ ] Remove all inline `fontFamily` styles
- [ ] Replace with appropriate `.text-*` classes
- [ ] Use `.font-*` utilities for weight adjustments
- [ ] Use `.font-mono` for technical/numeric data
- [ ] Test widget in all themes (default, monochrome, neon)
- [ ] Verify text is readable at different widget sizes

---

## Typography Classes Reference

| Class | Size | Weight | Use Case |
|-------|------|--------|----------|
| `.text-large-bold` | 48px (3rem) | 700 | Main value with color |
| `.text-xlarge` | 48px (3rem) | 700 | Main value neutral |
| `.text-large` | 32px (2rem) | 700 | Secondary value |
| `.text-medium-title` | 18px (1.125rem) | 600 | Main title |
| `.text-small-title` | 16px (1rem) | 500 | Subtitle/section |
| `.text-label` | 14px (0.875rem) | 400 | Labels |
| `.text-secondary` | 14px (0.875rem) | 400 | Descriptions |
| `.text-small` | 12px (0.75rem) | 400 | Metadata |
| `.text-tiny` | 11px (0.7rem) | 400 | Indicators |
| `.text-micro` | 10px (0.65rem) | 400 | Fine print |

---

## Need Help?

If you're unsure which class to use:

1. **Is it the main data point?** → `.text-large-bold` or `.text-xlarge`
2. **Is it a widget title?** → `.text-medium-title` or `.text-small-title`
3. **Is it a label or description?** → `.text-label` or `.text-secondary`
4. **Is it a timestamp or metadata?** → `.text-small` or `.text-tiny`
5. **Is it numbers or code?** → Add `.font-mono`

When in doubt, check existing widgets for examples!
