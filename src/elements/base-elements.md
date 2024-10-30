#### Base Elements

- Each Base Element is a Threejs Group. That way it becomes easier for us to manipulate a parent and everything inside that element has a local reference to that object.
- Each Element must Generate it's own GUID which is needed for OpenGeometry.
- Each Element also has a shadow mesh, which represents the OpenGeometry Mesh, I am yet to find what's the best way to represent the Mesh but as of now we can computationally afford creation of two meshes.
- All The Meshes must have double side rendering on, I am yet to figure out how to keep rendering order consistent across all the elements