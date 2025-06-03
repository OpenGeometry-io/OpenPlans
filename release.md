OpenPlans is bundled and released as a Node.js package.
The following steps outline the process for releasing a new version of the package:

### Release Process
- Build package using `npm run build`
- Copy `package.json` from root to `dist`
- Navigate to dist and run `npm publish`