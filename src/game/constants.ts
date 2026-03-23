import type { Race } from './types'

export const TILE_SIZE = 32
export const MAP_WIDTH = 60
export const MAP_HEIGHT = 45
export const FPS = 30
export const VIEWPORT_W = 960
export const VIEWPORT_H = 600

export const UNIT_DEFS: Record<string, {
  race: Race
  hp: number
  attack: number
  defense: number
  speed: number
  range: number
  cooldown: number
  width: number
  height: number
  cost: { minerals: number; gas: number; supply: number }
  color: string
  label: string
}> = {
  // Terran
  marine: {
    race: 'terran', hp: 40, attack: 6, defense: 0, speed: 2, range: 5,
    cooldown: 800, width: 20, height: 20, cost: { minerals: 50, gas: 0, supply: 1 },
    color: '#4488ff', label: 'Marine'
  },
  firebat: {
    race: 'terran', hp: 50, attack: 16, defense: 1, speed: 2, range: 2,
    cooldown: 1000, width: 22, height: 22, cost: { minerals: 50, gas: 25, supply: 1 },
    color: '#ff6600', label: 'Firebat'
  },
  scv: {
    race: 'terran', hp: 60, attack: 5, defense: 0, speed: 2.5, range: 1,
    cooldown: 1000, width: 18, height: 18, cost: { minerals: 50, gas: 0, supply: 1 },
    color: '#aaaaff', label: 'SCV'
  },
  // Zerg
  zergling: {
    race: 'zerg', hp: 35, attack: 5, defense: 0, speed: 4, range: 1,
    cooldown: 600, width: 16, height: 16, cost: { minerals: 25, gas: 0, supply: 1 },
    color: '#aa00aa', label: 'Zergling'
  },
  hydralisk: {
    race: 'zerg', hp: 80, attack: 10, defense: 0, speed: 3, range: 4,
    cooldown: 900, width: 22, height: 22, cost: { minerals: 75, gas: 25, supply: 1 },
    color: '#660088', label: 'Hydralisk'
  },
  drone: {
    race: 'zerg', hp: 40, attack: 5, defense: 0, speed: 2.5, range: 1,
    cooldown: 1000, width: 18, height: 18, cost: { minerals: 50, gas: 0, supply: 1 },
    color: '#cc88cc', label: 'Drone'
  },
  // Protoss
  zealot: {
    race: 'protoss', hp: 100, attack: 8, defense: 1, speed: 2.5, range: 1,
    cooldown: 800, width: 22, height: 22, cost: { minerals: 100, gas: 0, supply: 2 },
    color: '#00ccff', label: 'Zealot'
  },
  dragoon: {
    race: 'protoss', hp: 100, attack: 20, defense: 1, speed: 2, range: 5,
    cooldown: 1500, width: 24, height: 24, cost: { minerals: 125, gas: 50, supply: 2 },
    color: '#0088cc', label: 'Dragoon'
  },
  probe: {
    race: 'protoss', hp: 20, attack: 5, defense: 0, speed: 2.5, range: 1,
    cooldown: 1000, width: 18, height: 18, cost: { minerals: 50, gas: 0, supply: 1 },
    color: '#88ddff', label: 'Probe'
  },
}

export const BUILDING_DEFS: Record<string, {
  race: Race
  hp: number
  width: number
  height: number
  cost: { minerals: number; gas: number }
  color: string
  label: string
  produces?: string[]
  supplyBonus?: number
}> = {
  // Terran
  command_center: {
    race: 'terran', hp: 1500, width: 64, height: 64,
    cost: { minerals: 400, gas: 0 }, color: '#334477', label: 'Command Center',
    produces: ['scv'], supplyBonus: 10
  },
  barracks: {
    race: 'terran', hp: 1000, width: 56, height: 56,
    cost: { minerals: 150, gas: 0 }, color: '#556699', label: 'Barracks',
    produces: ['marine', 'firebat']
  },
  supply_depot: {
    race: 'terran', hp: 500, width: 40, height: 40,
    cost: { minerals: 100, gas: 0 }, color: '#4466aa', label: 'Supply Depot',
    supplyBonus: 8
  },
  // Zerg
  hatchery: {
    race: 'zerg', hp: 1250, width: 64, height: 64,
    cost: { minerals: 300, gas: 0 }, color: '#552255', label: 'Hatchery',
    produces: ['zergling', 'hydralisk', 'drone'], supplyBonus: 4
  },
  spawning_pool: {
    race: 'zerg', hp: 750, width: 48, height: 48,
    cost: { minerals: 200, gas: 0 }, color: '#771177', label: 'Spawning Pool',
    produces: []
  },
  extractor: {
    race: 'zerg', hp: 500, width: 40, height: 40,
    cost: { minerals: 50, gas: 0 }, color: '#993399', label: 'Extractor',
    supplyBonus: 0
  },
  // Protoss
  nexus: {
    race: 'protoss', hp: 1000, width: 64, height: 64,
    cost: { minerals: 400, gas: 0 }, color: '#003355', label: 'Nexus',
    produces: ['probe'], supplyBonus: 9
  },
  gateway: {
    race: 'protoss', hp: 500, width: 56, height: 56,
    cost: { minerals: 150, gas: 0 }, color: '#004466', label: 'Gateway',
    produces: ['zealot', 'dragoon']
  },
  pylon: {
    race: 'protoss', hp: 300, width: 36, height: 36,
    cost: { minerals: 100, gas: 0 }, color: '#005577', label: 'Pylon',
    supplyBonus: 8
  },
}

export const RACE_MAIN_BUILDING: Record<Race, string> = {
  terran: 'command_center',
  zerg: 'hatchery',
  protoss: 'nexus'
}

export const RACE_WORKER: Record<Race, string> = {
  terran: 'scv',
  zerg: 'drone',
  protoss: 'probe'
}

export const RACE_COLORS: Record<Race, { primary: string; secondary: string }> = {
  terran: { primary: '#4488ff', secondary: '#334477' },
  zerg: { primary: '#aa00aa', secondary: '#550055' },
  protoss: { primary: '#00ccff', secondary: '#003355' }
}

export const PRODUCTION_TIME: Record<string, number> = {
  marine: 15000, firebat: 20000, scv: 17000,
  zergling: 12000, hydralisk: 22000, drone: 17000,
  zealot: 25000, dragoon: 30000, probe: 17000,
}
