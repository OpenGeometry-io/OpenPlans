import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const packagePath = path.join(rootDir, "package.json");
const readmePath = path.join(rootDir, "readme.md");
const distPackagePath = path.join(distDir, "package.json");
const distReadmePath = path.join(distDir, "README.md");

const rootPackage = JSON.parse(await readFile(packagePath, "utf8"));

const distPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  author: rootPackage.author,
  description: rootPackage.description,
  type: rootPackage.type,
  main: "./index.js",
  types: "./types/src/index.d.ts",
  exports: {
    ".": {
      import: "./index.js",
      types: "./types/src/index.d.ts",
    },
  },
  keywords: rootPackage.keywords,
  license: rootPackage.license,
  dependencies: {
    ...rootPackage.dependencies,
    opengeometry: rootPackage.opengeometryDependencyVersion,
  },
  peerDependencies: rootPackage.peerDependencies,
};

await mkdir(distDir, { recursive: true });
await writeFile(distPackagePath, `${JSON.stringify(distPackage, null, 2)}\n`, "utf8");
await cp(readmePath, distReadmePath);
