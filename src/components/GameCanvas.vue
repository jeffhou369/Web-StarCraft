<template>
  <div class="game-container" @contextmenu.prevent>
    <!-- Main game canvas -->
    <canvas
      ref="mainCanvas"
      :width="VIEWPORT_W"
      :height="VIEWPORT_H"
      class="main-canvas"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
      @wheel="onWheel"
    />
    <!-- Selection box overlay -->
    <div
      v-if="selecting"
      class="selection-box"
      :style="selectionBoxStyle"
    />
    <!-- HUD overlay -->
    <HUD :state="gameState" :engine="engine" @train="onTrain" />
    <!-- Mini map -->
    <div class="minimap-container">
      <canvas ref="miniCanvas" :width="160" :height="120" class="mini-canvas" @click="onMiniMapClick" />
    </div>
    <!-- Victory/Defeat overlay -->
    <div v-if="gameState?.phase === 'victory'" class="overlay victory">
      <h2>🏆 勝利！</h2>
      <button @click="emit('end')">返回主選單</button>
    </div>
    <div v-if="gameState?.phase === 'defeat'" class="overlay defeat">
      <h2>💀 失敗！</h2>
      <button @click="emit('end')">返回主選單</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import type { GameState } from '../game/types'
import type { GameEngine } from '../game/engine'
import { Renderer } from '../game/renderer'
import HUD from './HUD.vue'
import { VIEWPORT_W, VIEWPORT_H } from '../game/constants'

const props = defineProps<{ gameState: GameState | null; engine: GameEngine | null }>()
const emit = defineEmits<{ end: [] }>()

const mainCanvas = ref<HTMLCanvasElement>()
const miniCanvas = ref<HTMLCanvasElement>()
let renderer: Renderer | null = null

// Selection box
const selecting = ref(false)
const selectStart = ref({ x: 0, y: 0 })
const selectEnd = ref({ x: 0, y: 0 })
const selectionBoxStyle = computed(() => {
  const x = Math.min(selectStart.value.x, selectEnd.value.x)
  const y = Math.min(selectStart.value.y, selectEnd.value.y)
  const w = Math.abs(selectEnd.value.x - selectStart.value.x)
  const h = Math.abs(selectEnd.value.y - selectStart.value.y)
  return { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }
})

// Camera scrolling
const keyState: Record<string, boolean> = {}
let scrollInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!mainCanvas.value) return
  const ctx = mainCanvas.value.getContext('2d')!
  renderer = new Renderer(ctx)
  if (miniCanvas.value) {
    renderer.setMiniMap(miniCanvas.value.getContext('2d')!)
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  scrollInterval = setInterval(handleScroll, 50)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (scrollInterval) clearInterval(scrollInterval)
})

watch(() => props.gameState, (state) => {
  if (state && renderer) renderer.render(state)
}, { deep: false })

function getCanvasPos(e: MouseEvent) {
  const rect = mainCanvas.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function getWorldPos(canvasPos: { x: number; y: number }) {
  const cam = props.gameState!.cameraOffset
  return { x: canvasPos.x + cam.x, y: canvasPos.y + cam.y }
}

function onMouseDown(e: MouseEvent) {
  if (!props.gameState || !props.engine) return
  const cpos = getCanvasPos(e)
  const wpos = getWorldPos(cpos)

  if (e.button === 2) {
    const state = props.gameState
    // Check if clicking on resource
    const res = state.resources.find(r =>
      wpos.x >= r.pos.x && wpos.x <= r.pos.x + r.width &&
      wpos.y >= r.pos.y && wpos.y <= r.pos.y + r.height
    )
    if (res) { props.engine.commandGather(res.id); return }
    // Check if clicking on enemy unit
    const enemy = state.units.find(u =>
      u.owner !== 0 &&
      wpos.x >= u.pos.x && wpos.x <= u.pos.x + u.width &&
      wpos.y >= u.pos.y && wpos.y <= u.pos.y + u.height
    )
    if (enemy) { props.engine.commandAttack(enemy.id); return }
    // Check enemy building
    const eBld = state.buildings.find(b =>
      b.owner !== 0 &&
      wpos.x >= b.pos.x && wpos.x <= b.pos.x + b.width &&
      wpos.y >= b.pos.y && wpos.y <= b.pos.y + b.height
    )
    if (eBld) { props.engine.commandAttack(eBld.id); return }
    // Move command
    props.engine.moveSelectedTo(wpos)
    return
  }

  // Left click = select
  selectStart.value = cpos
  selectEnd.value = cpos
  selecting.value = true
}

function onMouseUp(e: MouseEvent) {
  if (!props.gameState || !props.engine || e.button !== 0) return
  selecting.value = false
  const cpos = getCanvasPos(e)
  const wpos = getWorldPos(cpos)
  const dx = Math.abs(cpos.x - selectStart.value.x)
  const dy = Math.abs(cpos.y - selectStart.value.y)

  if (dx < 4 && dy < 4) {
    // Single click
    const state = props.gameState
    const unit = state.units.find(u =>
      u.owner === 0 &&
      wpos.x >= u.pos.x && wpos.x <= u.pos.x + u.width &&
      wpos.y >= u.pos.y && wpos.y <= u.pos.y + u.height
    )
    if (unit) { props.engine.selectUnit(unit.id, e.shiftKey); return }
    // Check building
    const bld = state.buildings.find(b =>
      b.owner === 0 &&
      wpos.x >= b.pos.x && wpos.x <= b.pos.x + b.width &&
      wpos.y >= b.pos.y && wpos.y <= b.pos.y + b.height
    )
    if (bld) { props.engine.selectUnit(bld.id); return }
    // Deselect all
    props.engine.selectUnits([])
  } else {
    // Box select
    const x1 = Math.min(selectStart.value.x, cpos.x) + (props.gameState.cameraOffset.x)
    const y1 = Math.min(selectStart.value.y, cpos.y) + (props.gameState.cameraOffset.y)
    const x2 = Math.max(selectStart.value.x, cpos.x) + (props.gameState.cameraOffset.x)
    const y2 = Math.max(selectStart.value.y, cpos.y) + (props.gameState.cameraOffset.y)
    const selected = props.gameState.units.filter(u =>
      u.owner === 0 &&
      u.pos.x + u.width / 2 >= x1 &&
      u.pos.x + u.width / 2 <= x2 &&
      u.pos.y + u.height / 2 >= y1 &&
      u.pos.y + u.height / 2 <= y2
    ).map(u => u.id)
    props.engine.selectUnits(selected)
  }
}

function onMouseMove(e: MouseEvent) {
  if (selecting.value) {
    selectEnd.value = getCanvasPos(e)
  }
}

function onWheel(e: WheelEvent) {
  if (!props.engine) return
  props.engine.scrollCamera(e.deltaX * 0.5, e.deltaY * 0.5)
}

function onKeyDown(e: KeyboardEvent) {
  keyState[e.code] = true
}
function onKeyUp(e: KeyboardEvent) {
  keyState[e.code] = false
}

function handleScroll() {
  if (!props.engine) return
  const spd = 8
  let dx = 0, dy = 0
  if (keyState['ArrowLeft'] || keyState['KeyA']) dx = -spd
  if (keyState['ArrowRight'] || keyState['KeyD']) dx = spd
  if (keyState['ArrowUp'] || keyState['KeyW']) dy = -spd
  if (keyState['ArrowDown'] || keyState['KeyS']) dy = spd
  if (dx !== 0 || dy !== 0) props.engine.scrollCamera(dx, dy)
}

function onMiniMapClick(e: MouseEvent) {
  if (!props.gameState || !props.engine) return
  const rect = miniCanvas.value!.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const mapW = props.gameState.map.width * props.gameState.map.tileSize
  const mapH = props.gameState.map.height * props.gameState.map.tileSize
  const wx = (mx / 160) * mapW - VIEWPORT_W / 2
  const wy = (my / 120) * mapH - VIEWPORT_H / 2
  const cur = props.gameState.cameraOffset
  props.engine.scrollCamera(wx - cur.x, wy - cur.y)
}

function onTrain(buildingId: string, unitType: string) {
  props.engine?.trainUnit(buildingId, unitType)
}
</script>

<style scoped>
.game-container {
  position: relative;
  width: 960px;
  height: 600px;
  overflow: hidden;
  border: 2px solid #333;
}
.main-canvas { display: block; cursor: crosshair; }
.selection-box {
  position: absolute;
  border: 1px solid #00ff88;
  background: rgba(0,255,136,0.1);
  pointer-events: none;
}
.minimap-container {
  position: absolute;
  bottom: 100px;
  right: 0;
  border: 2px solid #444;
}
.mini-canvas { display: block; cursor: pointer; }
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}
.overlay.victory { background: rgba(0,100,0,0.8); color: #ffcc00; }
.overlay.defeat { background: rgba(100,0,0,0.8); color: #ff4444; }
.overlay button {
  margin-top: 1rem;
  padding: 0.5rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  background: #ffcc00;
  border: none;
  border-radius: 6px;
  color: #000;
}
</style>
