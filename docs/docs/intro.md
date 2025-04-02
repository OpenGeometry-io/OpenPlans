---
sidebar_position: 1
---

# OpenPlans

A robust floorplanning sdk being developed using **[OpenGeometry Kernel](https://github.com/OpenGeometry-io/OpenGeometry)**. You can use OpenPlans as a library and import it into your web project. OpenPlans uses Three.js for rendering on web. 

More information on **[Three.js can be found here](https://threejs.org)**.

## Introduction

OpenPlans currently comes as a npm package, we have bundled all the basic elemenets and are working on more and more elements which can be directly imported into your project and rendered as geometries.

OpenPlans generates the needful Buffer Geometry for Three.js engine, you can read more about **[BufferGeometry here](https://threejs.org/docs/?q=buffer#api/en/core/BufferGeometry)**.
We are working on devising a way so that you can extend these elements to create your own.

### Purpose

We feel the current tools lacks creative freedom an Architect has, we want to shift the power into the user hands. We want to help Architects create beautiful and elegant buildings without worrying about the software limitations.

We are building Open Source alternatives to tools that an Building Designer uses day in day out.

### What you'll need

- Basic understanding about JS/TS
- Ability to Think Creatively
- Willigness to Embrace Change

## Create Simple Wall

We will start with the most basic steps and quickly go through the process of how to add a Wall and edit it.
Before going forward, make sure you have node installed, if you don't have it, you can find the setup instructions [<u>here</u>](https://nodejs.org/en/download)

### Create a new Directory
```bash
  mkdir OpenPlans-Wall
  cd OpenPlans-Wall
```

### Setup a npm project
```bash
  npm init -y
```
Accept the default conditions

### Create Project Files
- Create `index.html` - This will contain skeleton for your app
- Create `style.css` - This will contain various styles

Your directory would like this after you have the files added
```bash
 |-index.html
 |-node_modules/
 |-package.json
 |-styles.css
```

### Creating HTML Skeleton
Add the below code into your `index.html` file
```html
<!DOCTYPE html>
<html lang="en">
<head>
<title>OpenPlans</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="OpenPlans Wall">
</head>
  <body>
    <div id="app"></div>
    <script type="module"></script>
  </body>
</html>
```

### Adding Basic Styling
Add the below code to your `style.css` file
```css
body {
  margin: 0;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
}
```

### Setup OpenPlans
```js
async function init() {
  
  const container = document.getElementById('app');
  const openPlans = new OpenPlans(container);

}
```

### Adding OpenGeometry

OpenGeometry is a Kernel which makes it easier to perform graphical operations, so we need to setup the engine before we can start with OpenPlans.
It's a single API call.
```js
async function init() {
  // ..
  // Rest of the code

  await openPlans.setupOpenGeometry();
}
```

### Add Simple Wall
```js
async function init() {
  // ..
  // Rest of the code

  const basicWall = openPlans.wall();
}
```

### Edit Wall Position
```js
async function init() {
  // ..
  // Rest of the code

  basicWall.position.set(2, 0, 0);
}
```

Once you add all the code, your script tag would like this
```js
  <script type="module">
    import { OpenPlans } from './src/index.ts';
    import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

    async function init() {
      const container = document.getElementById('app');
      const openPlans = new OpenPlans(container);
      await openPlans.setupOpenGeometry();

      openPlans.pencil.mode = "view";

      const basicWall = openPlans.wall();
      basicWall.position.set(2, 0, 0);
    }

    await init();
  </script>
```

### Live Action
Let's see the code in action!

```html live
function Wall (props) {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);

    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  return (
    <div>
      <h2>It is {date.toLocaleTimeString()}.</h2>
    </div>
  );
}
```