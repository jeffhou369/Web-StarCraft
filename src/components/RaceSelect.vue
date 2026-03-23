<template>
  <div class="race-select">
    <h1 class="title">⭐ Web StarCraft ⭐</h1>
    <p class="subtitle">選擇你的陣營</p>
    <div class="races">
      <div
        v-for="race in races"
        :key="race.id"
        class="race-card"
        :class="[race.id, { selected: selectedRace === race.id }]"
        @click="selectedRace = race.id as Race"
      >
        <div class="race-icon">{{ race.icon }}</div>
        <div class="race-name">{{ race.name }}</div>
        <div class="race-desc">{{ race.desc }}</div>
      </div>
    </div>
    <button
      class="start-btn"
      :disabled="!selectedRace"
      @click="emit('start', selectedRace!)"
    >
      開始遊戲
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Race } from '../game/types'

const emit = defineEmits<{ start: [race: Race] }>()
const selectedRace = ref<Race | null>(null)

const races = [
  { id: 'terran', name: '人類 Terran', icon: '🔫', desc: '強大的軍事力量，堅固的防禦工事' },
  { id: 'zerg', name: '蟲族 Zerg', icon: '🦂', desc: '數量眾多，快速繁殖，蜂群戰術' },
  { id: 'protoss', name: '神族 Protoss', icon: '⚡', desc: '先進科技，護盾系統，精英戰士' },
]
</script>

<style scoped>
.race-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a2a0a 100%);
  color: white;
  font-family: 'Courier New', monospace;
}
.title {
  font-size: 3rem;
  color: #ffcc00;
  text-shadow: 0 0 20px #ff8800;
  margin-bottom: 0.5rem;
}
.subtitle { color: #aaaaff; margin-bottom: 2rem; font-size: 1.2rem; }
.races { display: flex; gap: 2rem; margin-bottom: 2rem; }
.race-card {
  width: 180px;
  padding: 1.5rem;
  border: 2px solid #333;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  background: rgba(0,0,0,0.4);
}
.race-card:hover { transform: translateY(-4px); border-color: #888; }
.race-card.selected.terran { border-color: #4488ff; background: rgba(68,136,255,0.2); box-shadow: 0 0 20px #4488ff; }
.race-card.selected.zerg { border-color: #aa00aa; background: rgba(170,0,170,0.2); box-shadow: 0 0 20px #aa00aa; }
.race-card.selected.protoss { border-color: #00ccff; background: rgba(0,204,255,0.2); box-shadow: 0 0 20px #00ccff; }
.race-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.race-name { font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem; color: #ffcc00; }
.race-desc { font-size: 0.8rem; color: #aaaaaa; }
.start-btn {
  padding: 1rem 3rem;
  font-size: 1.2rem;
  background: linear-gradient(90deg, #ff8800, #ffcc00);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  color: #000;
  transition: all 0.2s;
}
.start-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 0 20px #ff8800; }
.start-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
