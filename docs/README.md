# OpenPlans Documentation

This documentation website is built using [Docusaurus](https://docusaurus.io/)

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Writing Documentation](#writing-documentation)
- [Building and Deployment](#building-and-deployment)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js version 18.0 or higher
- Yarn package manager

### Installation

Navigate to the `docs` directory and install dependencies:

```bash
cd docs
yarn install
```

### Local Development

Start the local development server:

```bash
yarn start
```

This command starts a local development server at `http://localhost:3000` and opens up a browser window. Most changes are reflected live without having to restart the server (hot reloading).

## Project Structure

The Docusaurus site follows this structure:

```
docs/
├── docs/                    # Documentation pages (Markdown/MDX files)
│   ├── intro.md            # Introduction page
│   └── tutorial-create-elements/
├── src/
│   ├── components/         # Custom React components
│   ├── css/               # Custom CSS files
│   └── pages/             # Custom pages (not documentation)
├── static/
│   └── img/               # Static assets (images, files)
├── docusaurus.config.ts   # Site configuration
├── sidebars.ts            # Sidebar navigation structure
└── package.json           # Dependencies and scripts
```

## Development Guide

### Available Commands

| Command | Description |
|---------|-------------|
| `yarn start` | Start local development server |
| `yarn build` | Build production-ready static site |
| `yarn serve` | Serve the built website locally |
| `yarn clear` | Clear Docusaurus cache |
| `yarn swizzle` | Eject and customize Docusaurus components |
| `yarn deploy` | Deploy to GitHub Pages |
| `yarn typecheck` | Run TypeScript type checking |

### Configuration Files

#### `docusaurus.config.ts`

The main configuration file for your Docusaurus site. Key settings include:

- **Site metadata**: title, tagline, URL, favicon
- **GitHub Pages deployment**: organizationName, projectName, baseUrl
- **Theme configuration**: navbar, footer, color mode
- **Plugin configuration**: docs, blog, theme settings
- **Internationalization (i18n)**: supported locales

#### `sidebars.ts`

Defines the structure of your documentation sidebar. OpenPlans uses auto-generated sidebars based on the file structure, but you can also manually define sidebar items.

## Writing Documentation

### Creating a New Document

1. **Create a Markdown or MDX file** in the `docs/` directory:

```bash
# Example: Create a new guide
touch docs/wall-implementation.md
```

2. **Add front matter** at the top of the file:

```markdown
---
id: wall-implementation
title: Wall Implementation Guide
sidebar_label: Wall Implementation
sidebar_position: 2
description: Learn how to implement walls in OpenPlans
tags: [elements, walls, implementation]
---

# Wall Implementation Guide

Your content here...
```

### Front Matter Fields

Key front matter fields for documentation:

- `id`: Unique identifier for the document (optional, defaults to filename)
- `title`: Page title shown in browser and content
- `sidebar_label`: Label shown in sidebar navigation
- `sidebar_position`: Order in the sidebar (lower numbers appear first)
- `description`: Meta description for SEO
- `tags`: Array of tags for categorization
- `slug`: Custom URL path for the document

### Markdown Features

Docusaurus supports standard Markdown plus enhanced features:

#### Code Blocks with Syntax Highlighting

````markdown
```typescript title="src/elements/base-wall.ts"
export class BaseWall extends BaseElement {
  constructor() {
    super();
    this.type = 'wall';
  }
}
```
````

#### Admonitions (Callouts)

```markdown
:::note
This is a note with useful information.
:::

:::tip
Helpful tips appear in green.
:::

:::info
Informational messages appear in blue.
:::

:::warning
Warnings appear in yellow.
:::

:::danger
Critical warnings appear in red.
:::
```

#### Interactive Code with Live Codeblocks

Since OpenPlans uses the `@docusaurus/theme-live-codeblock` theme, you can create interactive code examples:

````markdown
```jsx live
function WallExample() {
  const [height, setHeight] = React.useState(3);
  return (
    <div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        value={height} 
        onChange={(e) => setHeight(e.target.value)} 
      />
      <p>Wall height: {height}m</p>
    </div>
  );
}
```
````

#### Importing Code from Files

```markdown
import CodeBlock from '@theme/CodeBlock';
import MyComponentSource from '!!raw-loader!../src/components/MyComponent';

<CodeBlock language="jsx">{MyComponentSource}</CodeBlock>
```

#### Tabs

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install openplans
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn add openplans
    ```
  </TabItem>
</Tabs>
```

#### Images

```markdown
![OpenPlans Architecture](./img/architecture.png)

<!-- Or with more control -->
<img src="/img/architecture.png" alt="Architecture" width="500" />
```

### MDX and React Components

Docusaurus uses [MDX](https://mdxjs.com/), allowing you to use React components directly in Markdown:

```markdown
import CustomButton from '@site/src/components/CustomButton';

# My Documentation

Here's some text with a **custom component**:

<CustomButton color="primary">Click Me</CustomButton>
```

### Organizing Documentation

#### File Structure Best Practices

1. **Mirror sidebar structure**: Organize files to match your desired sidebar hierarchy
2. **Use folders for categories**: Group related docs in folders
3. **Index files**: Use `index.md` or `README.md` for category landing pages
4. **Consistent naming**: Use kebab-case for filenames (e.g., `base-wall-implementation.md`)

Example structure:
```
docs/
├── intro.md
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
├── elements/
│   ├── index.md
│   ├── walls.md
│   ├── doors.md
│   └── windows.md
└── api-reference/
    └── index.md
```

#### Sidebar Configuration

Auto-generated sidebar (current setup):
```typescript
const sidebars: SidebarsConfig = {
  tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],
};
```

Manual sidebar example:
```typescript
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Elements',
      items: [
        'elements/walls',
        'elements/doors',
        'elements/windows',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'generated-index',
        title: 'API Reference',
        description: 'Complete API reference for OpenPlans',
      },
      items: ['api-reference/core', 'api-reference/elements'],
    },
  ],
};
```

## Building and Deployment

### Local Production Build

Test the production build locally:

```bash
yarn build
yarn serve
```

The `build` command generates static content into the `build` directory, which can be served using any static hosting service.

### Deployment to GitHub Pages

#### Using SSH:

```bash
USE_SSH=true yarn deploy
```

#### Using HTTPS:

```bash
GIT_USER=<Your-GitHub-Username> yarn deploy
```

This command builds the website and pushes to the `gh-pages` branch.

### Continuous Deployment

For automated deployments, configure GitHub Actions:

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
          cache-dependency-path: docs/yarn.lock
      
      - name: Install dependencies
        working-directory: docs
        run: yarn install --frozen-lockfile
      
      - name: Build website
        working-directory: docs
        run: yarn build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/build
```

## Customization

### Theming

Customize colors and fonts in `src/css/custom.css`:

```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-code-font-size: 95%;
  --ifm-font-family-base: 'Inter', system-ui, -apple-system, sans-serif;
}

[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
}
```

### Custom Components

Create reusable components in `src/components/`:

```typescript
// src/components/FeatureCard.tsx
import React from 'react';
import styles from './FeatureCard.module.css';

export default function FeatureCard({title, description, icon}) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

Use in documentation:
```markdown
import FeatureCard from '@site/src/components/FeatureCard';

<FeatureCard 
  title="Fast" 
  description="Blazing fast rendering" 
  icon="⚡" 
/>
```

### Navbar and Footer

Customize navigation in `docusaurus.config.ts`:

```typescript
navbar: {
  title: 'OpenPlans',
  logo: {
    alt: 'OpenPlans Logo',
    src: 'img/logo.svg',
  },
  items: [
    {
      type: 'docSidebar',
      sidebarId: 'tutorialSidebar',
      position: 'left',
      label: 'Documentation',
    },
    {
      to: '/blog',
      label: 'Blog',
      position: 'left'
    },
    {
      href: 'https://github.com/opengeometry-io/openplans',
      label: 'GitHub',
      position: 'right',
    },
  ],
}
```

## Troubleshooting

### Common Issues

#### Port 3000 Already in Use

```bash
# Use a different port
yarn start --port 3001
```

#### Build Errors

1. **Clear cache**: `yarn clear`
2. **Delete node_modules**: `rm -rf node_modules && yarn install`
3. **Check for broken links**: Docusaurus will warn about broken internal links

#### Slow Build Times

- Use `yarn start --no-minify` for faster dev builds
- Check for large images and optimize them
- Consider using [Faster Build Configuration](https://docusaurus.io/docs/advanced/faster)

### Getting Help

- 📚 [Official Documentation](https://docusaurus.io/)
- 💬 [Discord Community](https://discord.gg/docusaurus)
- 🐛 [GitHub Issues](https://github.com/facebook/docusaurus/issues)
- 📖 [OpenPlans Repository](https://github.com/opengeometry-io/openplans)

## Best Practices for OpenPlans Documentation

1. **Keep it current**: Update docs alongside code changes
2. **Use examples**: Include code examples and live demos where possible
3. **Add diagrams**: Use diagrams to explain complex concepts
4. **Link related docs**: Cross-reference related documentation
5. **Test instructions**: Verify that tutorials and guides work as documented
6. **Use consistent terminology**: Maintain a glossary of terms
7. **Include API references**: Document all public APIs
8. **Add search tags**: Use relevant tags for better discoverability

## Next Steps

- ✏️ Start by reading `docs/intro.md` to understand the current documentation
- 📝 Create new documentation following the structure in this guide
- 🎨 Customize the theme to match OpenPlans branding
- 🔍 Add search functionality (Algolia DocSearch or local search)
- 🌍 Consider adding internationalization for multiple languages
- 📊 Set up analytics to track documentation usage

---

For more information about OpenPlans, visit the [main repository](https://github.com/opengeometry-io/openplans).
