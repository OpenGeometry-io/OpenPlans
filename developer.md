Openplans uses OpenGeometry Kernel for creating and managing geometry data.
More information about OpenGeometry Kernel can be found [here](https://docs.opengeometry.io/opengeometry/intro)

## Developer Guide

Clone the Openplans repository
```bash
git clone https://github.com/OpenGeometry-io/OpenPlans
```

### Setting up the development environment

OpenGeometry Kernel is needed to run OpenPlans locally as it provides the Kernel Code, we are planning to use the OpenGeometry Kernel as a dependancy. In the meantime, you can set up the OpenGeometry Kernel locally by following these steps.

### Prerequisites
1. Clone the OpenGeometry repository
```bash
git clone https://github.com/OpenGeometry-io/OpenGeometry
```

2. Install the required dependencies
```bash
cd OpenGeometry
npm install
```

3. Build the OpenGeometry Kernel locally and link it to the Openplans project
```bash
npm run build-local
```
This command will copy the build files inside the `openplans/kernel` directory.
You should now have the OpenGeometry Kernel set up locally, you can verify this by checking the `openplans/kernel` directory for the build files.

### Running OpenPlans locally
1. Navigate to the OpenPlans directory

2. Install the required dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

This will start the development server and you should be able to access OpenPlans at `http://localhost:5555`.

- Note: If you make changes to the OpenGeometry Kernel, you will need to rebuild it.
- We use vite as the build tool, so you can use the vite commands to build and run the project.
- Server port can be changed by modifying the `vite.config.js` file in the root directory of the OpenPlans project.


## Documentation

- Docusaurus is being used for documentation
- `cd docs`
- `npm run start` to make any changes