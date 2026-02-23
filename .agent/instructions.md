# General Instructions for Antigravity

When working on the **OpenPlans** project, please adhere to these persistent guidelines:

### 1. Codebase Standards
- **TypeScript Strictness**: Always use explicit types when adding code in `src/`. Avoid using `any`.
- **Three.js Best Practices**: You will frequently use Three.js. Be careful with resource management (disposing materials, geometries if necessary), coordinate math, and scene management. Consider whether an element should be a `Mesh`, `Line`, or `Sprite`.
- **Exporting Components**: Every time you create a new class/component in `src/`, export it within `src/index.ts` so it can be consumed correctly by developers.

### 2. Development & Testing Workflow
- **Vite Dev Server**: Prefer `npm run dev` to get real-time feedback. Modifications to `src/` will hot-reload or trigger a fast refresh in the `examples/` HTML files.
- **Creating Examples**: For any new visual feature, proactively suggest or build an `examples/your-feature.html` file with `lil-gui/dat.gui` controls so testing can be visually verified.
- **Mixpanel Tracking Comments**: Do not remove `<!-- MIXPANEL_TRACKING -->` from the `<head>` of HTML examples. This is used by the continuous integration build step.

### 3. Agent Tool Best Practices
- **Paths**: Always use absolute paths (e.g., `/Users/gangsta/Work/OpenGeometry/OpenPlans/...`) when reading or modifying files.
- **Refactoring & Modifying**: When adjusting properties (like changing a marker from `CSS2DObject` to `THREE.Sprite`), use `multi_replace_file_content` accurately. Ensure that associated examples are tested or validated.
- **Review Prior KIs**: If you perform a task that sounds similar to "Add an element" or "Setup Mixpanel," search for previous Knowledge Items (KIs) or task history first.

### 4. Communication
- When a visual change or math fix is applied (e.g. Gizmo Clipping Bug, PDF logic fixing), clearly explain the math or the exact Three.js property you've manipulated. 
- Ask the user to confirm browser state visually if you cannot do it yourself.
