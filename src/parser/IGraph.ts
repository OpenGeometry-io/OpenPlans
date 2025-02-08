type Coordinates = [number, number, number];

type OGType = 'OG_FLOOR' | 'OG_ROOM' | 'OG_WALL' | 'OG_WINDOW' | 'OG_DOOR';

interface BaseOGObject {
  OG_ID: string;
  OG_TYPE: OGType;
}

interface Floor extends BaseOGObject {
  OG_TYPE: 'OG_FLOOR';
  OG_DATA: string[]; // Array of room IDs
}

// New interface for room components
interface RoomComponent extends BaseOGObject {
  OG_ID: string;
  OG_TYPE: 'OG_WALL' | 'OG_WINDOW' | 'OG_DOOR';
}

interface Room extends BaseOGObject {
  OG_TYPE: 'OG_ROOM';
  type: 'Bedroom' | 'Living Room' | 'Kitchen';
  OG_DATA: RoomComponent[]; // Array of wall, window, and door objects
  coordinates: [Coordinates, Coordinates, Coordinates, Coordinates];
  connections: string[]; // Array of connected room IDs
  USER_DATA: string;
}

interface Wall extends BaseOGObject {
  OG_TYPE: 'OG_WALL';
  USER_DATA: string;
  type: 'internal';
  thickness: number;
  start: Coordinates;
  end: Coordinates;
}

interface Window extends BaseOGObject {
  OG_TYPE: 'OG_WINDOW';
  type: 'internal';
  thickness: number;
  start: Coordinates;
  end: Coordinates;
}

interface Door extends BaseOGObject {
  OG_TYPE: 'OG_DOOR';
  type: 'internal';
  thickness: number;
  hingeThickness: number;
  start: Coordinates;
  end: Coordinates;
}

interface BuildingData {
  building_id: string;
  building_name: string;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
  windows: Window[];
  doors: Door[];
}

export type { 
  BuildingData, 
  Floor, 
  Room, 
  Wall, 
  Window, 
  Door, 
  RoomComponent, 
  Coordinates, 
  OGType, 
  BaseOGObject 
};