import type { GameState, Unit, Building, Resource, Vec2, Player } from './types'
import { UNIT_DEFS, BUILDING_DEFS, RACE_MAIN_BUILDING, RACE_WORKER, PRODUCTION_TIME, VIEWPORT_W, VIEWPORT_H } from './constants'
import { audioSystem } from './audio'

let idCounter = 1
function genId(prefix: string) { return `${prefix}_${idCounter++}` }

export function createInitialState(playerRace: import('./types').Race): GameState {
  const MAP_WIDTH = 60
  const MAP_HEIGHT = 45
  const TILE_SIZE = 32

  // Generate map
  const tiles: import('./types').MapTile[][] = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: import('./types').MapTile[] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const isBorder = x < 2 || x > MAP_WIDTH - 3 || y < 2 || y > MAP_HEIGHT - 3
      const noise = Math.random()
      let type: 'grass' | 'dirt' | 'water' | 'mountain' = 'grass'
      if (isBorder) type = 'mountain'
      else if (noise < 0.05) type = 'water'
      else if (noise < 0.15) type = 'dirt'
      row.push({ x, y, type, walkable: type !== 'mountain' && type !== 'water' })
    }
    tiles.push(row)
  }

  const aiRaces: import('./types').Race[] = ['terran', 'zerg', 'protoss']
  const aiRace = aiRaces.filter(r => r !== playerRace)[Math.floor(Math.random() * 2)]

  const players: Player[] = [
    { id: 0, race: playerRace, type: 'human', minerals: 200, gas: 0, supply: 0, maxSupply: 10 },
    { id: 1, race: aiRace, type: 'ai', minerals: 200, gas: 0, supply: 0, maxSupply: 10 }
  ]

  const playerStartX = 5 * TILE_SIZE
  const playerStartY = (MAP_HEIGHT - 8) * TILE_SIZE
  const aiStartX = (MAP_WIDTH - 8) * TILE_SIZE
  const aiStartY = 5 * TILE_SIZE

  const buildings: Building[] = []
  const units: Unit[] = []

  for (const [pidx, startX, startY] of [[0, playerStartX, playerStartY], [1, aiStartX, aiStartY]] as [number, number, number][]) {
    const race = players[pidx].race
    const mainBldType = RACE_MAIN_BUILDING[race]
    const def = BUILDING_DEFS[mainBldType]
    buildings.push({
      id: genId('b'),
      type: mainBldType,
      race,
      owner: pidx,
      pos: { x: startX, y: startY },
      hp: def.hp,
      maxHp: def.hp,
      isBuilt: true,
      buildProgress: 1,
      productionQueue: [],
      productionProgress: 0,
      rallyPoint: null,
      width: def.width,
      height: def.height,
      isSelected: false
    })

    if (def.supplyBonus) {
      players[pidx].maxSupply += def.supplyBonus
    }

    const secBld = race === 'terran' ? 'barracks' : race === 'zerg' ? 'spawning_pool' : 'gateway'
    const secDef = BUILDING_DEFS[secBld]
    buildings.push({
      id: genId('b'),
      type: secBld,
      race,
      owner: pidx,
      pos: { x: startX + 80, y: startY + 10 },
      hp: secDef.hp,
      maxHp: secDef.hp,
      isBuilt: true,
      buildProgress: 1,
      productionQueue: [],
      productionProgress: 0,
      rallyPoint: null,
      width: secDef.width,
      height: secDef.height,
      isSelected: false
    })

    const workerType = RACE_WORKER[race]
    const workerDef = UNIT_DEFS[workerType]
    for (let i = 0; i < 3; i++) {
      players[pidx].supply++
      units.push({
        id: genId('u'),
        type: workerType,
        race,
        owner: pidx,
        pos: { x: startX + 70 + i * 25, y: startY + 70 },
        hp: workerDef.hp,
        maxHp: workerDef.hp,
        attack: workerDef.attack,
        defense: workerDef.defense,
        speed: workerDef.speed,
        range: workerDef.range,
        cooldown: workerDef.cooldown,
        lastAttack: 0,
        target: null,
        state: 'idle',
        path: [],
        width: workerDef.width,
        height: workerDef.height,
        isSelected: false,
        carryingMinerals: 0
      })
    }
  }

  const resources: Resource[] = []
  const mineralPositions = [
    { x: playerStartX - 80, y: playerStartY - 40 },
    { x: playerStartX - 80, y: playerStartY },
    { x: playerStartX - 80, y: playerStartY + 40 },
    { x: playerStartX - 40, y: playerStartY - 60 },
    { x: playerStartX - 40, y: playerStartY + 60 },
    { x: aiStartX + 80, y: aiStartY - 40 },
    { x: aiStartX + 80, y: aiStartY },
    { x: aiStartX + 80, y: aiStartY + 40 },
    { x: aiStartX + 40, y: aiStartY - 60 },
    { x: aiStartX + 40, y: aiStartY + 60 },
  ]

  for (const pos of mineralPositions) {
    resources.push({
      id: genId('r'),
      type: 'mineral',
      pos,
      amount: 1500,
      maxAmount: 1500,
      width: 28,
      height: 20
    })
  }

  resources.push({ id: genId('r'), type: 'gas', pos: { x: playerStartX + 20, y: playerStartY - 100 }, amount: 5000, maxAmount: 5000, width: 32, height: 32 })
  resources.push({ id: genId('r'), type: 'gas', pos: { x: aiStartX + 20, y: aiStartY + 80 }, amount: 5000, maxAmount: 5000, width: 32, height: 32 })

  return {
    phase: 'playing',
    tick: 0,
    players,
    units,
    buildings,
    resources,
    map: { width: MAP_WIDTH, height: MAP_HEIGHT, tileSize: TILE_SIZE, tiles },
    selectedIds: [],
    cameraOffset: { x: playerStartX - 200, y: playerStartY - 150 },
    viewport: { x: 960, y: 600 }
  }
}

function dist(a: Vec2, b: Vec2) {
  const dx = b.x - a.x, dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

function moveToward(pos: Vec2, target: Vec2, speed: number): Vec2 {
  const d = dist(pos, target)
  if (d <= speed) return { ...target }
  return {
    x: pos.x + (target.x - pos.x) / d * speed,
    y: pos.y + (target.y - pos.y) / d * speed
  }
}

function unitCenter(u: { pos: Vec2; width: number; height: number }): Vec2 {
  return { x: u.pos.x + u.width / 2, y: u.pos.y + u.height / 2 }
}

export class GameEngine {
  private state: GameState
  private lastTime = 0
  private running = false
  private frameId = 0
  private onUpdate: (state: GameState) => void
  private lastAiAction = 0

  constructor(state: GameState, onUpdate: (state: GameState) => void) {
    this.state = state
    this.onUpdate = onUpdate
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop() {
    this.running = false
    if (this.frameId) cancelAnimationFrame(this.frameId)
  }

  private loop(now: number) {
    if (!this.running) return
    const dt = Math.min(now - this.lastTime, 50)
    this.lastTime = now
    this.update(dt)
    this.onUpdate({ ...this.state })
    this.frameId = requestAnimationFrame((t) => this.loop(t))
  }

  private update(dt: number) {
    this.state.tick++
    this.updateProduction(dt)
    this.updateUnits(dt)
    this.updateAI(dt)
    this.checkVictory()
  }

  private updateProduction(dt: number) {
    for (const bld of this.state.buildings) {
      if (!bld.isBuilt || bld.productionQueue.length === 0) continue
      const player = this.state.players[bld.owner]
      const utype = bld.productionQueue[0]
      bld.productionProgress += dt
      const timeNeeded = PRODUCTION_TIME[utype] || 15000
      if (bld.productionProgress >= timeNeeded) {
        bld.productionProgress = 0
        bld.productionQueue.shift()
        const def = UNIT_DEFS[utype]
        if (!def) continue
        player.supply++
        const spawnPos = bld.rallyPoint
          ? { ...bld.rallyPoint }
          : { x: bld.pos.x + bld.width + 10, y: bld.pos.y + bld.height / 2 }
        this.state.units.push({
          id: genId('u'),
          type: utype,
          race: bld.race,
          owner: bld.owner,
          pos: spawnPos,
          hp: def.hp,
          maxHp: def.hp,
          attack: def.attack,
          defense: def.defense,
          speed: def.speed,
          range: def.range,
          cooldown: def.cooldown,
          lastAttack: 0,
          target: null,
          state: 'idle',
          path: [],
          width: def.width,
          height: def.height,
          isSelected: false,
          carryingMinerals: 0
        })
        audioSystem.playUnitReady(bld.race)
      }
    }
  }

  private updateUnits(_dt: number) {
    const now = performance.now()
    for (const unit of this.state.units) {
      if (unit.state === 'gathering') {
        this.updateGathering(unit, now)
      } else if (unit.state === 'returning') {
        this.updateReturning(unit, now)
      } else if (unit.state === 'moving' && unit.path.length > 0) {
        const target = unit.path[0]
        const newPos = moveToward(unit.pos, target, unit.speed)
        unit.pos = newPos
        if (dist(unit.pos, target) < 2) {
          unit.path.shift()
          if (unit.path.length === 0) {
            unit.state = 'idle'
          }
        }
      } else if (unit.state === 'attacking' && unit.target) {
        this.updateAttacking(unit, now)
      } else if (unit.state === 'idle') {
        this.autoAttack(unit, now)
      }
    }

    const deadIds = new Set(this.state.units.filter(u => u.hp <= 0).map(u => u.id))
    if (deadIds.size > 0) {
      deadIds.forEach(() => audioSystem.playExplosion())
      this.state.units = this.state.units.filter(u => u.hp > 0)
      this.state.selectedIds = this.state.selectedIds.filter(id => !deadIds.has(id))
      for (const u of this.state.units) {
        if (u.target && deadIds.has(u.target)) { u.target = null; u.state = 'idle' }
      }
    }

    const deadBIds = new Set(this.state.buildings.filter(b => b.hp <= 0).map(b => b.id))
    if (deadBIds.size > 0) {
      deadBIds.forEach(() => audioSystem.playExplosion(true))
      this.state.buildings = this.state.buildings.filter(b => b.hp > 0)
    }
  }

  private autoAttack(unit: Unit, _now: number) {
    const enemies = this.state.units.filter(u => u.owner !== unit.owner && u.hp > 0)
    const enemyBuildings = this.state.buildings.filter(b => b.owner !== unit.owner && b.hp > 0)
    const center = unitCenter(unit)
    let closest: Unit | Building | null = null
    let minD = unit.range * 32 * 1.5
    for (const e of enemies) {
      const d = dist(center, unitCenter(e))
      if (d < minD) { minD = d; closest = e }
    }
    for (const b of enemyBuildings) {
      const bc = { x: b.pos.x + b.width / 2, y: b.pos.y + b.height / 2 }
      const d = dist(center, bc)
      if (d < minD) { minD = d; closest = b }
    }
    if (closest) {
      unit.target = closest.id
      unit.state = 'attacking'
    }
  }

  private updateAttacking(unit: Unit, now: number) {
    const targetUnit = this.state.units.find(u => u.id === unit.target)
    const targetBld = this.state.buildings.find(b => b.id === unit.target)
    const target = targetUnit || targetBld
    if (!target || target.hp <= 0) {
      unit.target = null
      unit.state = 'idle'
      return
    }
    const tCenter = targetUnit
      ? unitCenter(targetUnit)
      : { x: targetBld!.pos.x + targetBld!.width / 2, y: targetBld!.pos.y + targetBld!.height / 2 }
    const d = dist(unitCenter(unit), tCenter)
    const attackRange = unit.range * 32

    if (d > attackRange) {
      unit.pos = moveToward(unit.pos, tCenter, unit.speed)
    } else {
      if (now - unit.lastAttack >= unit.cooldown) {
        const defVal = targetUnit ? targetUnit.defense : 0
        const dmg = Math.max(1, unit.attack - defVal)
        target.hp -= dmg
        unit.lastAttack = now
        audioSystem.playWeaponFire(unit.type)
      }
    }
  }

  private updateGathering(unit: Unit, now: number) {
    const res = this.state.resources.find(r => r.id === unit.target)
    if (!res || res.amount <= 0) {
      unit.state = 'idle'
      unit.target = null
      return
    }
    const center = unitCenter(unit)
    const resCenter = { x: res.pos.x + res.width / 2, y: res.pos.y + res.height / 2 }
    const d = dist(center, resCenter)
    if (d > 30) {
      unit.pos = moveToward(unit.pos, resCenter, unit.speed)
    } else {
      if (now - unit.lastAttack >= 2000) {
        const gather = Math.min(8, res.amount)
        res.amount -= gather
        unit.carryingMinerals += gather
        unit.lastAttack = now
        audioSystem.playMineralGather()
        if (unit.carryingMinerals >= 8) {
          unit.state = 'returning'
        }
      }
    }
  }

  private updateReturning(unit: Unit, _now: number) {
    const base = this.state.buildings.find(
      b => b.owner === unit.owner && ['command_center', 'hatchery', 'nexus'].includes(b.type) && b.isBuilt
    )
    if (!base) { unit.state = 'idle'; return }
    const baseCenter = { x: base.pos.x + base.width / 2, y: base.pos.y + base.height / 2 }
    const d = dist(unitCenter(unit), baseCenter)
    if (d > 40) {
      unit.pos = moveToward(unit.pos, baseCenter, unit.speed)
    } else {
      this.state.players[unit.owner].minerals += unit.carryingMinerals
      unit.carryingMinerals = 0
      const res = this.state.resources.find(r => r.type === 'mineral' && r.amount > 0)
      if (res) {
        unit.target = res.id
        unit.state = 'gathering'
      } else {
        unit.state = 'idle'
      }
    }
  }

  private updateAI(_dt: number) {
    const now = performance.now()
    if (now - this.lastAiAction < 3000) return
    this.lastAiAction = now

    const ai = this.state.players[1]
    const aiUnits = this.state.units.filter(u => u.owner === 1)
    const aiBuildings = this.state.buildings.filter(b => b.owner === 1)
    const playerUnits = this.state.units.filter(u => u.owner === 0)
    const playerBuildings = this.state.buildings.filter(b => b.owner === 0)

    const workers = aiUnits.filter(u => ['scv', 'drone', 'probe'].includes(u.type) && u.state === 'idle')
    const minerals = this.state.resources.filter(r => r.type === 'mineral' && r.amount > 0)
    for (const w of workers) {
      if (minerals.length > 0) {
        w.target = minerals[Math.floor(Math.random() * minerals.length)].id
        w.state = 'gathering'
        w.lastAttack = 0
      }
    }

    const mainBuilding = aiBuildings.find(b => ['command_center', 'hatchery', 'nexus'].includes(b.type) && b.isBuilt)
    const barracks = aiBuildings.find(b => ['barracks', 'spawning_pool', 'gateway'].includes(b.type) && b.isBuilt)

    if (mainBuilding && mainBuilding.productionQueue.length < 2) {
      const wType = RACE_WORKER[ai.race]
      const wCost = UNIT_DEFS[wType].cost
      if (ai.minerals >= wCost.minerals && ai.gas >= wCost.gas && ai.supply < ai.maxSupply) {
        ai.minerals -= wCost.minerals
        ai.gas -= wCost.gas
        mainBuilding.productionQueue.push(wType)
      }
    }

    if (barracks && barracks.productionQueue.length < 3) {
      const combatTypes: Record<string, string[]> = {
        terran: ['marine', 'firebat'],
        zerg: ['zergling', 'hydralisk'],
        protoss: ['zealot', 'dragoon']
      }
      const choices = combatTypes[ai.race]
      const uType = choices[Math.floor(Math.random() * choices.length)]
      const uCost = UNIT_DEFS[uType].cost
      if (ai.minerals >= uCost.minerals && ai.gas >= uCost.gas && ai.supply < ai.maxSupply) {
        ai.minerals -= uCost.minerals
        ai.gas -= uCost.gas
        barracks.productionQueue.push(uType)
      }
    }

    const combatUnits = aiUnits.filter(u => !['scv', 'drone', 'probe'].includes(u.type) && u.state === 'idle')
    if (combatUnits.length >= 3 && (playerUnits.length > 0 || playerBuildings.length > 0)) {
      const target = playerUnits[0] || playerBuildings[0]
      for (const u of combatUnits) {
        u.target = target.id
        u.state = 'attacking'
      }
    }
  }

  private checkVictory() {
    const playerBuildings = this.state.buildings.filter(b => b.owner === 0)
    const aiBuildings = this.state.buildings.filter(b => b.owner === 1)
    if (playerBuildings.length === 0) this.state.phase = 'defeat'
    if (aiBuildings.length === 0) this.state.phase = 'victory'
  }

  selectUnits(ids: string[]) {
    for (const u of this.state.units) u.isSelected = ids.includes(u.id)
    for (const b of this.state.buildings) b.isSelected = ids.includes(b.id)
    this.state.selectedIds = ids
  }

  moveSelectedTo(pos: Vec2) {
    const selected = this.state.units.filter(u => u.isSelected && u.owner === 0)
    if (selected.length === 0) return
    const race = selected[0].race
    audioSystem.playMoveCommand(race)
    for (let i = 0; i < selected.length; i++) {
      const offsetX = (i % 4) * 24 - 48
      const offsetY = Math.floor(i / 4) * 24
      selected[i].path = [{ x: pos.x + offsetX, y: pos.y + offsetY }]
      selected[i].state = 'moving'
      selected[i].target = null
    }
  }

  attackMove(pos: Vec2) {
    const selected = this.state.units.filter(u => u.isSelected && u.owner === 0)
    audioSystem.playAttackCommand()
    for (let i = 0; i < selected.length; i++) {
      const offsetX = (i % 4) * 24 - 48
      const offsetY = Math.floor(i / 4) * 24
      selected[i].path = [{ x: pos.x + offsetX, y: pos.y + offsetY }]
      selected[i].state = 'moving'
    }
  }

  commandGather(resourceId: string) {
    const selected = this.state.units.filter(u => u.isSelected && u.owner === 0 && ['scv', 'drone', 'probe'].includes(u.type))
    for (const u of selected) {
      u.target = resourceId
      u.state = 'gathering'
      u.lastAttack = 0
    }
    if (selected.length > 0) audioSystem.playMoveCommand(selected[0].race)
  }

  commandAttack(targetId: string) {
    const selected = this.state.units.filter(u => u.isSelected && u.owner === 0)
    for (const u of selected) {
      u.target = targetId
      u.state = 'attacking'
    }
    audioSystem.playAttackCommand()
  }

  trainUnit(buildingId: string, unitType: string) {
    const bld = this.state.buildings.find(b => b.id === buildingId && b.owner === 0)
    if (!bld) return
    const player = this.state.players[0]
    const def = UNIT_DEFS[unitType]
    if (!def) return
    if (player.minerals < def.cost.minerals) return
    if (player.gas < def.cost.gas) return
    if (player.supply >= player.maxSupply) return
    if (bld.productionQueue.length >= 5) return
    player.minerals -= def.cost.minerals
    player.gas -= def.cost.gas
    bld.productionQueue.push(unitType)
  }

  selectUnit(id: string, additive = false) {
    if (!additive) {
      for (const u of this.state.units) u.isSelected = u.id === id
      for (const b of this.state.buildings) b.isSelected = b.id === id
      this.state.selectedIds = [id]
    } else {
      const u = this.state.units.find(u => u.id === id)
      const b = this.state.buildings.find(b => b.id === id)
      if (u) { u.isSelected = true; if (!this.state.selectedIds.includes(id)) this.state.selectedIds.push(id) }
      if (b) { b.isSelected = true; if (!this.state.selectedIds.includes(id)) this.state.selectedIds.push(id) }
    }
    const race = this.state.units.find(u => u.id === id)?.race
      || this.state.buildings.find(b => b.id === id)?.race
    if (race) audioSystem.playUnitSelect(race)
  }

  getState() { return this.state }

  scrollCamera(dx: number, dy: number) {
    const maxX = this.state.map.width * this.state.map.tileSize - VIEWPORT_W
    const maxY = this.state.map.height * this.state.map.tileSize - VIEWPORT_H
    this.state.cameraOffset.x = Math.max(0, Math.min(maxX, this.state.cameraOffset.x + dx))
    this.state.cameraOffset.y = Math.max(0, Math.min(maxY, this.state.cameraOffset.y + dy))
  }
}
