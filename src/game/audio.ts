export class AudioSystem {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled = true

  init() {
    if (this.ctx) return
    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.3
      this.masterGain.connect(this.ctx.destination)
    } catch (e) {
      console.warn('AudioContext not available')
    }
  }

  private playTone(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainVal = 0.3,
    freqEnd?: number
  ) {
    if (!this.ctx || !this.masterGain || !this.enabled) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration)
    }
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(this.ctx.currentTime)
    osc.stop(this.ctx.currentTime + duration)
  }

  private playNoise(duration: number, gainVal = 0.2) {
    if (!this.ctx || !this.masterGain || !this.enabled) return
    const bufSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    source.buffer = buffer
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    source.connect(gain)
    gain.connect(this.masterGain)
    source.start()
  }

  playUnitSelect(race: string) {
    switch (race) {
      case 'terran':
        this.playTone('square', 440, 0.1, 0.2)
        setTimeout(() => this.playTone('square', 520, 0.1, 0.2), 100)
        break
      case 'zerg':
        this.playTone('sawtooth', 200, 0.15, 0.3, 150)
        break
      case 'protoss':
        this.playTone('sine', 660, 0.2, 0.2, 880)
        setTimeout(() => this.playTone('sine', 880, 0.2, 0.15), 150)
        break
    }
  }

  playMoveCommand(race: string) {
    switch (race) {
      case 'terran':
        this.playTone('square', 350, 0.08, 0.2)
        setTimeout(() => this.playTone('square', 400, 0.08, 0.15), 80)
        break
      case 'zerg':
        this.playTone('sawtooth', 300, 0.1, 0.3, 200)
        break
      case 'protoss':
        this.playTone('sine', 500, 0.15, 0.2, 600)
        break
    }
  }

  playAttackCommand() {
    this.playTone('sawtooth', 300, 0.05, 0.3)
    setTimeout(() => this.playNoise(0.05, 0.3), 50)
  }

  playWeaponFire(unitType: string) {
    switch (unitType) {
      case 'marine':
        this.playNoise(0.08, 0.4)
        this.playTone('square', 200, 0.05, 0.2)
        break
      case 'firebat':
        this.playNoise(0.15, 0.3)
        this.playTone('sawtooth', 150, 0.1, 0.3, 80)
        break
      case 'hydralisk':
        this.playNoise(0.06, 0.35)
        this.playTone('sawtooth', 400, 0.04, 0.25)
        break
      case 'zealot':
        this.playTone('sine', 300, 0.08, 0.4, 200)
        this.playTone('square', 500, 0.05, 0.2)
        break
      case 'dragoon':
        this.playTone('sawtooth', 800, 0.06, 0.3, 400)
        this.playNoise(0.08, 0.2)
        break
      default:
        this.playNoise(0.06, 0.3)
        break
    }
  }

  playBuildComplete() {
    this.playTone('sine', 440, 0.1)
    setTimeout(() => this.playTone('sine', 550, 0.1), 100)
    setTimeout(() => this.playTone('sine', 660, 0.15), 200)
  }

  playUnitReady(race: string) {
    switch (race) {
      case 'terran':
        this.playTone('square', 440, 0.08)
        setTimeout(() => this.playTone('square', 660, 0.1), 90)
        break
      case 'zerg':
        this.playTone('sawtooth', 300, 0.12, 0.3, 200)
        break
      case 'protoss':
        this.playTone('sine', 660, 0.1)
        setTimeout(() => this.playTone('sine', 880, 0.1), 100)
        setTimeout(() => this.playTone('sine', 1100, 0.12), 200)
        break
    }
  }

  playExplosion(large = false) {
    this.playNoise(large ? 0.4 : 0.2, large ? 0.5 : 0.35)
    this.playTone('sawtooth', large ? 100 : 200, large ? 0.3 : 0.15, 0.4, 50)
  }

  playMineralGather() {
    this.playTone('sine', 880, 0.05, 0.15)
  }

  playAlert() {
    this.playTone('square', 880, 0.1, 0.3)
    setTimeout(() => this.playTone('square', 660, 0.1, 0.3), 150)
    setTimeout(() => this.playTone('square', 880, 0.12, 0.3), 300)
  }

  playVictory() {
    const notes = [440, 550, 660, 880, 1100]
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone('sine', freq, 0.3, 0.4), i * 200)
    })
  }

  toggle() { this.enabled = !this.enabled }
  isEnabled() { return this.enabled }
}

export const audioSystem = new AudioSystem()
