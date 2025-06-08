Elements extends one major Shape and has one or more ShapeBuilder.
Major shape is the base shape and commands the element's geometry.

# Element 
List of Elements
- Wall
- Door
- Window
- Column
- Slab
- Stairs
- Beam

# Calculated Properties vs User Defined Properties
- For some elements, the properties are calculated based on the geometry. 
E.g. When a door is created Door is created, coordinates are calculated based on the start and end points of the wall.
Here, **coordinates** are calculated properties.

E.g. When a wall is created start and end points are calculated based on coordinates of the wall.
Here, **start and end points** are calculated properties.
