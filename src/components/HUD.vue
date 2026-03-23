<template>
  <div class="hud">
    <!-- Top resource bar -->
    <div class="resource-bar">
      <span class="res minerals">💎 {{ player?.minerals ?? 0 }}</span>
      <span class="res gas">☁️ {{ player?.gas ?? 0 }}</span>
      <span class="res supply">👥 {{ player?.supply ?? 0 }}/{{ player?.maxSupply ?? 0 }}</span>
      <button class="audio-btn" @click="toggleAudio">
        {{ audioOn ? '🔊' : '🔇' }}
      </button>
    </div>
    <!-- Selected unit info / Command panel -->
    <div class="command-panel">
      <div v-if="selectedUnits.length > 0" class="selected-info">
        <div class="unit-portrait">
          <span class="portrait-icon">{{ unitIcon }}</span>
          <div class="unit-stats" v-if="selectedUnits.length === 1">
            <div>{{ unitLabel }}</div>
            <div class="hp-text">HP: {{ selectedUnits[0].hp }}/{{ selectedUnits[0].maxHp }}</div>
          </div>
          <div v-else class="multi-select">已選 {{ selectedUnits.length }} 個單位</div>
        </div>
      </div>
      <div v-else-if="selectedBuildings.length === 1" class="selected-info">
        <div class="unit-portrait">
          <span class="portrait-icon">🏗️</span>
          <div class="unit-stats">
            <div>{{ bldLabel }}</div>
            <div class="hp-text">HP: {{ selectedBuildings[0].hp }}/{{ selectedBuildings[0].maxHp }}</div>
            <div v-if="selectedBuildings[0].productionQueue.length > 0" class="queue">
              生產中: {{ selectedBuildings[0].productionQueue[0] }}
            </div>
          </div>
        </div>
        <!-- Train buttons -->
        <div v-if="produces.length > 0" class="train-buttons">
          <button
            v-for="utype in produces"
            :key="utype"
            class="train-btn"
            :title="`訓練 ${utype}`"
            @click="emit('train', selectedBuildings[0].id, utype)"
          >
            <span>{{ UNIT_DEFS[utype]?.label ?? utype }}</span>
            <span class="cost">💎{{ UNIT_DEFS[utype]?.cost.minerals }}</span>
          </button>
        </div>
      </div>
      <div v-else class="no-select">點擊選取單位或建築</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameState } from '../game/types'
import type { GameEngine } from '../game/engine'
import { UNIT_DEFS, BUILDING_DEFS } from '../game/constants'
import { audioSystem } from '../game/audio'

const props = defineProps<{ state: GameState | null; engine: GameEngine | null }>()
const emit = defineEmits<{ train: [buildingId: string, unitType: string] }>()

const audioOn = ref(true)
function toggleAudio() {
  audioSystem.toggle()
  audioOn.value = audioSystem.isEnabled()
}

const player = computed(() => props.state?.players[0])
const selectedUnits = computed(() => props.state?.units.filter(u => u.isSelected) ?? [])
const selectedBuildings = computed(() => props.state?.buildings.filter(b => b.isSelected) ?? [])

const unitIcon = computed(() => {
  const u = selectedUnits.value[0]
  if (!u) return '❓'
  const icons: Record<string, string> = {
    marine: '🔫', firebat: '🔥', scv: '🔧',
    zergling: '🦂', hydralisk: '🐍', drone: '🐝',
    zealot: '⚡', dragoon: '🤖', probe: '🔹'
  }
  return icons[u.type] ?? '❓'
})

const unitLabel = computed(() => {
  const u = selectedUnits.value[0]
  return u ? (UNIT_DEFS[u.type]?.label ?? u.type) : ''
})

const bldLabel = computed(() => {
  const b = selectedBuildings.value[0]
  return b ? (BUILDING_DEFS[b.type]?.label ?? b.type) : ''
})

const produces = computed(() => {
  const b = selectedBuildings.value[0]
  if (!b) return []
  return BUILDING_DEFS[b.type]?.produces ?? []
})
</script>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.resource-bar {
  pointer-events: all;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: rgba(0,0,0,0.7);
  padding: 6px 16px;
  border-bottom: 1px solid #333;
}
.res {
  font-size: 1rem;
  font-weight: bold;
  font-family: monospace;
}
.minerals { color: #00ccff; }
.gas { color: #00ff88; }
.supply { color: #ffcc00; }
.audio-btn {
  margin-left: auto;
  background: none;
  border: 1px solid #555;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 1rem;
}
.command-panel {
  pointer-events: all;
  background: rgba(0,0,0,0.8);
  border-top: 1px solid #333;
  padding: 8px 12px;
  min-height: 100px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.selected-info { display: flex; gap: 12px; align-items: flex-start; width: 100%; }
.unit-portrait {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}
.portrait-icon { font-size: 2.5rem; }
.unit-stats { color: white; font-family: monospace; font-size: 0.85rem; }
.hp-text { color: #88ff88; }
.multi-select { color: #aaaaff; font-size: 0.9rem; }
.queue { color: #ffcc00; font-size: 0.8rem; margin-top: 4px; }
.train-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.train-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #1a3355;
  border: 1px solid #4488ff;
  color: white;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  transition: background 0.2s;
  min-width: 60px;
}
.train-btn:hover { background: #2244aa; }
.cost { color: #00ccff; font-size: 0.7rem; margin-top: 2px; }
.no-select { color: #555; font-style: italic; padding: 10px; }
</style>
