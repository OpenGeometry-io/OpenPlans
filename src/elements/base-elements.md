#### Base Elements

- Each Base Element is a Threejs Mesh. That way it becomes easier for us to manipulate a parent and everything inside that element has a local reference to that object.
- Each Element also has a shadow mesh, which represents the OpenGeometry Mesh, I am yet to find what's the best way to represent the Mesh but as of now we can computationally afford creation of two meshes.
- All The Meshes must have double side rendering on, I am yet to figure out how to keep rendering order consistent across all the elements

#### Rigid Elements and Soft Elements

Rigid
- Some Elements Like Door have predefined parts e.g. Hinges, Nobs.
- The elements with predefined parts shall be called Rigid Elements and they can be extended to create their own different types
- Every Rigid Body Element can be created as soft element
- Rigid Body Element saves the time and effort for customisations

Soft
- Soft Elements are created by combing different geometry
- They can be grouped to form a new element altogether
- To create a soft element, users would have to use perform geometry operations on their own and then group it to publish
