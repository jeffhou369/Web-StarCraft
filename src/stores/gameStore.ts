import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { GameState, Race } from '../game/types'
import { GameEngine, createInitialState } from '../game/engine'
import { audioSystem } from '../game/audio'

export const useGameStore = defineStore('game', () => {
  const state = shallowRef<GameState | null>(null)
  const engine = ref<GameEngine | null>(null)

  function startGame(race: Race) {
    audioSystem.init()
    const initial = createInitialState(race)
    const eng = new GameEngine(initial, (newState) => {
      state.value = newState
    })
    engine.value = eng as unknown as GameEngine
    state.value = initial
    eng.start()
  }

  function stopGame() {
    (engine.value as GameEngine | null)?.stop()
    engine.value = null
    state.value = null
  }

  function getEngine(): GameEngine | null {
    return engine.value as GameEngine | null
  }

  return { state, startGame, stopGame, getEngine }
})
