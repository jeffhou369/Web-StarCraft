import type { GameState, Resource, Building, Unit } from './types'
import { BUILDING_DEFS, RACE_COLORS } from './constants'

const TILE_COLORS: Record<string, string> = {
  grass: '#4a7c3f',
  dirt: '#8b7355',
  water: '#2266aa',
  mountain: '#666666'
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private miniCtx: CanvasRenderingContext2D | null = null

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  setMiniMap(ctx: CanvasRenderingContext2D) {
    this.miniCtx = ctx
  }

  render(state: GameState) {
    const { ctx } = this
    const { cameraOffset: cam } = state
    ctx.clearRect(0, 0, 960, 600)

    this.drawMap(state, cam)
    for (const res of state.resources) this.drawResource(res, cam)
    for (const bld of state.buildings) this.drawBuilding(bld, cam)
    for (const unit of state.units) this.drawUnit(unit, cam)
    if (this.miniCtx) this.drawMiniMap(state)
  }

  private drawMap(state: GameState, cam: { x: number; y: number }) {
    const { ctx } = this
    const { map } = state
    const ts = map.tileSize
    const startTileX = Math.floor(cam.x / ts)
    const startTileY = Math.floor(cam.y / ts)
    const endTileX = Math.min(map.width, startTileX + Math.ceil(960 / ts) + 1)
    const endTileY = Math.min(map.height, startTileY + Math.ceil(600 / ts) + 1)

    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        const tile = map.tiles[ty]?.[tx]
        if (!tile) continue
        const sx = tx * ts - cam.x
        const sy = ty * ts - cam.y
        ctx.fillStyle = TILE_COLORS[tile.type]
        ctx.fillRect(sx, sy, ts, ts)
        ctx.strokeStyle = 'rgba(0,0,0,0.05)'
        ctx.strokeRect(sx, sy, ts, ts)
      }
    }
  }

  private drawResource(res: Resource, cam: { x: number; y: number }) {
    const { ctx } = this
    const sx = res.pos.x - cam.x
    const sy = res.pos.y - cam.y
    if (sx < -50 || sy < -50 || sx > 1010 || sy > 650) return

    if (res.type === 'mineral') {
      ctx.fillStyle = res.amount > 0 ? '#00ccff' : '#336677'
      ctx.fillRect(sx, sy, res.width, res.height)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(sx + 3, sy + 2, res.width - 8, 4)
      ctx.strokeStyle = '#0088bb'
      ctx.strokeRect(sx, sy, res.width, res.height)
      ctx.fillStyle = '#fff'
      ctx.font = '9px monospace'
      ctx.fillText(String(Math.floor(res.amount)), sx + 2, sy + res.height - 2)
    } else {
      const color = res.amount > 0 ? '#00ff88' : '#336655'
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(sx + res.width / 2, sy + res.height / 2, res.width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#00aa55'
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '9px monospace'
      ctx.fillText('Gas', sx + 2, sy + res.height)
    }
  }

  private drawBuilding(bld: Building, cam: { x: number; y: number }) {
    const { ctx } = this
    const sx = bld.pos.x - cam.x
    const sy = bld.pos.y - cam.y
    if (sx < -100 || sy < -100 || sx > 1060 || sy > 700) return

    const def = BUILDING_DEFS[bld.type]
    const rc = RACE_COLORS[bld.race]
    const ownerColor = bld.owner === 0 ? rc.primary : '#ff4444'

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(sx + 4, sy + 4, bld.width, bld.height)

    ctx.fillStyle = bld.owner === 0 ? rc.secondary : '#441111'
    ctx.fillRect(sx, sy, bld.width, bld.height)

    ctx.fillStyle = ownerColor
    ctx.fillRect(sx, sy, bld.width, 8)
    ctx.fillRect(sx, sy + bld.height - 8, bld.width, 8)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(def?.label?.substring(0, 8) || bld.type, sx + bld.width / 2, sy + bld.height / 2 + 4)
    ctx.textAlign = 'left'

    const hpRatio = bld.hp / bld.maxHp
    ctx.fillStyle = '#222'
    ctx.fillRect(sx, sy - 6, bld.width, 4)
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff44' : hpRatio > 0.25 ? '#ffaa00' : '#ff2200'
    ctx.fillRect(sx, sy - 6, bld.width * hpRatio, 4)

    if (bld.isSelected) {
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.strokeRect(sx - 2, sy - 2, bld.width + 4, bld.height + 4)
      ctx.lineWidth = 1
    }

    if (bld.productionQueue.length > 0) {
      const timeNeeded = 20000
      const progress = bld.productionProgress / timeNeeded
      ctx.fillStyle = '#333'
      ctx.fillRect(sx, sy + bld.height + 2, bld.width, 4)
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(sx, sy + bld.height + 2, bld.width * Math.min(progress, 1), 4)
    }
  }

  private drawUnit(unit: Unit, cam: { x: number; y: number }) {
    const { ctx } = this
    const sx = unit.pos.x - cam.x
    const sy = unit.pos.y - cam.y
    if (sx < -30 || sy < -30 || sx > 990 || sy > 630) return

    const rc = RACE_COLORS[unit.race]
    const ownerColor = unit.owner === 0 ? rc.primary : '#ff4444'
    const bodyColor = unit.owner === 0 ? rc.secondary : '#551111'

    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(sx + unit.width / 2, sy + unit.height + 2, unit.width / 2, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = bodyColor
    ctx.beginPath()
    const r = unit.width / 2
    ctx.arc(sx + r, sy + r, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = ownerColor
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(sx + r, sy + r, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 1

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.max(8, unit.width / 2)}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(unit.type[0].toUpperCase(), sx + r, sy + r + 4)
    ctx.textAlign = 'left'

    const hpRatio = unit.hp / unit.maxHp
    ctx.fillStyle = '#222'
    ctx.fillRect(sx, sy - 5, unit.width, 3)
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff44' : hpRatio > 0.25 ? '#ffaa00' : '#ff2200'
    ctx.fillRect(sx, sy - 5, unit.width * hpRatio, 3)

    if (unit.isSelected) {
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sx + r, sy + r, r + 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = 1
    }

    if (unit.carryingMinerals > 0) {
      ctx.fillStyle = '#00ccff'
      ctx.beginPath()
      ctx.arc(sx + unit.width, sy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawMiniMap(state: GameState) {
    if (!this.miniCtx) return
    const mc = this.miniCtx
    const mw = 160, mh = 120
    const mapW = state.map.width * state.map.tileSize
    const mapH = state.map.height * state.map.tileSize
    const scaleX = mw / mapW
    const scaleY = mh / mapH

    mc.fillStyle = '#1a2a1a'
    mc.fillRect(0, 0, mw, mh)

    for (let ty = 0; ty < state.map.height; ty += 2) {
      for (let tx = 0; tx < state.map.width; tx += 2) {
        const tile = state.map.tiles[ty]?.[tx]
        if (!tile) continue
        mc.fillStyle = TILE_COLORS[tile.type]
        mc.fillRect(tx * state.map.tileSize * scaleX, ty * state.map.tileSize * scaleY, 2, 2)
      }
    }

    for (const res of state.resources) {
      mc.fillStyle = res.type === 'mineral' ? '#00ccff' : '#00ff88'
      mc.fillRect(res.pos.x * scaleX - 1, res.pos.y * scaleY - 1, 3, 3)
    }

    for (const bld of state.buildings) {
      mc.fillStyle = bld.owner === 0 ? '#4488ff' : '#ff4444'
      mc.fillRect(bld.pos.x * scaleX, bld.pos.y * scaleY, bld.width * scaleX * 1.5, bld.height * scaleY * 1.5)
    }

    for (const unit of state.units) {
      mc.fillStyle = unit.owner === 0 ? '#88ccff' : '#ff8888'
      mc.fillRect(unit.pos.x * scaleX - 0.5, unit.pos.y * scaleY - 0.5, 2, 2)
    }

    const { cameraOffset: cam } = state
    mc.strokeStyle = '#ffffff'
    mc.strokeRect(cam.x * scaleX, cam.y * scaleY, 960 * scaleX, 600 * scaleY)
  }
}
