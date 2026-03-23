export type Race = 'terran' | 'zerg' | 'protoss'
export type PlayerType = 'human' | 'ai'
export type UnitType = string
export type BuildingType = string
export type GamePhase = 'menu' | 'race_select' | 'playing' | 'victory' | 'defeat'

export interface Vec2 {
  x: number
  y: number
}

export interface Unit {
  id: string
  type: UnitType
  race: Race
  owner: number // 0 = player, 1 = ai
  pos: Vec2
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  range: number
  cooldown: number
  lastAttack: number
  target: string | null  // target unit/building id
  state: 'idle' | 'moving' | 'attacking' | 'gathering' | 'returning'
  path: Vec2[]
  width: number
  height: number
  isSelected: boolean
  carryingMinerals: number
}

export interface Building {
  id: string
  type: BuildingType
  race: Race
  owner: number
  pos: Vec2
  hp: number
  maxHp: number
  isBuilt: boolean
  buildProgress: number
  productionQueue: UnitType[]
  productionProgress: number
  rallyPoint: Vec2 | null
  width: number
  height: number
  isSelected: boolean
}

export interface Resource {
  id: string
  type: 'mineral' | 'gas'
  pos: Vec2
  amount: number
  maxAmount: number
  width: number
  height: number
}

export interface Player {
  id: number
  race: Race
  type: PlayerType
  minerals: number
  gas: number
  supply: number
  maxSupply: number
}

export interface MapTile {
  x: number
  y: number
  type: 'grass' | 'dirt' | 'water' | 'mountain'
  walkable: boolean
}

export interface GameMap {
  width: number   // in tiles
  height: number  // in tiles
  tileSize: number
  tiles: MapTile[][]
}

export interface GameState {
  phase: GamePhase
  tick: number
  players: Player[]
  units: Unit[]
  buildings: Building[]
  resources: Resource[]
  map: GameMap
  selectedIds: string[]
  cameraOffset: Vec2
  viewport: Vec2
}
