import type { 
  BuildingData, 
  Floor, 
  Room, 
  Wall, 
  Window, 
  Door, 
  RoomComponent, 
  Coordinates 
} from './IGraph';

// Types for the source JSON
interface SourcePanel {
    panel_type: string;
    start_point: number[];
    end_point: number[];
    height: number;
    thickness: number;
    room?: string;
    apartment?: string;
}

interface SourceSpace {
    room_type: string;
    apartment?: string;
    coordinates: {
        x: number;
        y: number;
        z: number;
    }[];
}

interface SourceJSON {
    panels: {
        attributes: Record<string, any>;
        items: Record<string, SourcePanel>;
        max_key: number;
    };
    spaces: Record<string, SourceSpace>;
}

// Helper function to convert coordinates
function convertCoordinates(point: number[]): Coordinates {
  return [point[0], point[2], point[1]];
}

// Helper function to check if two sets of coordinates share points
function doComponentsShare(start1: Coordinates, end1: Coordinates, start2: Coordinates, end2: Coordinates): boolean {
    const pointsMatch = (p1: Coordinates, p2: Coordinates) => 
        Math.abs(p1[0] - p2[0]) < 0.01 && 
        Math.abs(p1[1] - p2[1]) < 0.01 && 
        Math.abs(p1[2] - p2[2]) < 0.01;

    return pointsMatch(start1, start2) || 
           pointsMatch(start1, end2) ||
           pointsMatch(end1, start2) ||
           pointsMatch(end1, end2);
}

function convertToOGFormat(sourceJson: SourceJSON): BuildingData {
    const processedElements = new Set<string>();
    console.log(processedElements);

    const rooms: Room[] = [];
    const walls: Wall[] = [];
    const windows: Window[] = [];
    const doors: Door[] = [];
    const componentsByRoom = new Map<string, Set<string>>();

    // First pass: Create all components (walls, windows, doors)
    Object.entries(sourceJson.panels.items).forEach(([panelId, panel]) => {
        const id = (parseInt(panelId) + 1).toString().padStart(3, '0');
        const start = convertCoordinates(panel.start_point);
        const end = convertCoordinates(panel.end_point);
        
        // Determine component type based on panel_type
        if (panel.panel_type.includes('WINDOW')) {
            const window: Window = {
                OG_ID: `WINDOW_${id}`,
                OG_TYPE: 'OG_WINDOW',
                type: 'internal',
                thickness: panel.thickness,
                start,
                end
            };
            windows.push(window);
            
            if (panel.room) {
                if (!componentsByRoom.has(panel.room)) {
                    componentsByRoom.set(panel.room, new Set());
                }
                componentsByRoom.get(panel.room)!.add(window.OG_ID);
            }
        } else if (panel.panel_type.includes('DOOR')) {
            const door: Door = {
                OG_ID: `DOOR_${id}`,
                OG_TYPE: 'OG_DOOR',
                type: 'internal',
                thickness: panel.thickness,
                hingeThickness: panel.thickness * 0.5, // Assuming hinge thickness is half of door thickness
                start,
                end
            };
            doors.push(door);
            
            if (panel.room) {
                if (!componentsByRoom.has(panel.room)) {
                    componentsByRoom.set(panel.room, new Set());
                }
                componentsByRoom.get(panel.room)!.add(door.OG_ID);
            }
        } else {          
            const wall: Wall = {
                OG_ID: `WALL_${id}`,
                OG_TYPE: 'OG_WALL',
                USER_DATA: JSON.stringify(panel.panel_type),
                type: 'internal',
                thickness: panel.thickness,
                start,
                end
            };
            walls.push(wall);
            
            if (panel.room) {
                if (!componentsByRoom.has(panel.room)) {
                    componentsByRoom.set(panel.room, new Set());
                }
                componentsByRoom.get(panel.room)!.add(wall.OG_ID);
            }
        }
    });

    // Second pass: Create rooms
    Object.entries(sourceJson.spaces).forEach(([spaceId, space]) => {
        const roomId = `ROOM_${(parseInt(spaceId) + 1).toString().padStart(3, '0')}`;
        
        // Convert coordinates
        const spaceCoords = space.coordinates.map(coord => 
            [coord.x, coord.z, coord.y] as Coordinates
        );

        // Ensure we have exactly 4 coordinates
        // while (spaceCoords.length < 4) {
            spaceCoords.push([...spaceCoords[spaceCoords.length - 1]]);
        // }
        // if (spaceCoords.length > 4) {
            // spaceCoords.length = 4;
        // }

        // Get components for this room
        const roomComponents: RoomComponent[] = [];
        const roomComponentIds = componentsByRoom.get(space.room_type) || new Set();

        roomComponentIds.forEach(componentId => {
            if (componentId.startsWith('WALL_')) {
                if (processedElements.has(componentId)) return;

                const wall = walls.find(w => w.OG_ID === componentId);
                if (wall) roomComponents.push({ OG_ID: wall.OG_ID, OG_TYPE: 'OG_WALL' });

                processedElements.add(componentId);
            } else if (componentId.startsWith('WINDOW_')) {
                const window = windows.find(w => w.OG_ID === componentId);
                if (window) roomComponents.push({ OG_ID: window.OG_ID, OG_TYPE: 'OG_WINDOW' });
            } else if (componentId.startsWith('DOOR_')) {
                const door = doors.find(d => d.OG_ID === componentId);
                if (door) roomComponents.push({ OG_ID: door.OG_ID, OG_TYPE: 'OG_DOOR' });
            }
        });

        // Create room
        const room: Room = {
            OG_ID: roomId,
            OG_TYPE: 'OG_ROOM',
            type: space.room_type.charAt(0).toUpperCase() + space.room_type.slice(1) as Room['type'],
            OG_DATA: roomComponents,
            coordinates: spaceCoords as [Coordinates, Coordinates, Coordinates, Coordinates],
            connections: [],
            USER_DATA: JSON.stringify(space.room_type)
        };

        rooms.push(room);
    });

    // Final pass: Create room connections
    const processedConnections = new Set<string>();

    rooms.forEach((room1) => {
        rooms.forEach((room2) => {
            if (room1.OG_ID === room2.OG_ID) return;
            
            const connectionKey = [room1.OG_ID, room2.OG_ID].sort().join('-');
            if (processedConnections.has(connectionKey)) return;
            
            // Check if rooms share any components
            const hasSharedComponent = room1.OG_DATA.some(comp1 => {
                const component1 = [...walls, ...windows, ...doors].find(c => c.OG_ID === comp1.OG_ID);
                if (!component1) return false;

                return room2.OG_DATA.some(comp2 => {
                    const component2 = [...walls, ...windows, ...doors].find(c => c.OG_ID === comp2.OG_ID);
                    if (!component2) return false;

                    return doComponentsShare(component1.start, component1.end, component2.start, component2.end);
                });
            });

            if (hasSharedComponent) {
                room1.connections.push(room2.OG_ID);
                room2.connections.push(room1.OG_ID);
            }

            processedConnections.add(connectionKey);
        });
    });

    // Create floor
    const floor: Floor = {
        OG_ID: "FLOOR_001",
        OG_TYPE: "OG_FLOOR",
        OG_DATA: rooms.map(room => room.OG_ID)
    };

    return {
        building_id: "BLDG_001",
        building_name: "Apartment Building 1",
        floors: [floor],
        rooms,
        walls,
        windows,
        doors
    };
}

export default convertToOGFormat;