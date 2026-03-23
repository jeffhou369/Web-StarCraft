# ⭐ Web StarCraft

Vue3 網頁版星海爭霸戰 — 以 Vue3 + Vite + TypeScript 打造的卡通風格即時戰略遊戲。

## 🎮 遊戲功能

- **3 個陣營**：人類（Terran）、蟲族（Zerg）、神族（Protoss）
- **每陣營 3 種單位 + 3 種建築**
- **資源系統**：礦物採集、瓦斯採集
- **單位生產**：選取建築後點擊訓練按鈕
- **AI 對手**：自動採礦、生產、進攻
- **基本戰鬥**：點選右鍵攻擊目標
- **音效系統**：Web Audio API 合成音效（還原星海爭霸風格，無需外部音效文件）
- **小地圖**：可點擊導航

## 🕹️ 操作說明

| 操作 | 功能 |
|------|------|
| 左鍵點擊 | 選取我方單位/建築 |
| Shift + 左鍵 | 加入選取 |
| 拖拉左鍵 | 框選多個單位 |
| 右鍵點擊空地 | 移動所選單位 |
| 右鍵點擊敵人 | 攻擊目標 |
| 右鍵點擊礦物 | 採集資源 |
| WASD / 方向鍵 | 移動鏡頭 |
| 滑鼠滾輪 | 鏡頭滾動 |
| 點擊小地圖 | 跳轉視角 |

## 🚀 快速開始

```bash
npm install
npm run dev
```

## 🐳 Docker

```bash
docker-compose up -d
# 瀏覽器開啟 http://localhost:8080
```

## ⚙️ GitHub Actions CI/CD

CI/CD 流程分三個階段，每階段完成後發送 Telegram 通知：

1. **Code Review & Build** — 安裝依賴、編譯 TypeScript、打包
2. **Security Scan** — `npm audit` 安全弱點掃描
3. **Docker Build & Push** — 推送 image 到 Docker Hub（僅 main/master 分支）

### 必要的 GitHub Secrets

| Secret | 說明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 帳號 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID |

## 📁 專案結構

```
src/
  main.ts                 # 應用程式入口
  App.vue                 # 主頁面（陣營選擇 ↔ 遊戲）
  game/
    types.ts              # TypeScript 型別定義
    constants.ts          # 陣營/單位/建築常數
    audio.ts              # Web Audio API 音效
    engine.ts             # 遊戲主引擎（AI/戰鬥/採礦）
    renderer.ts           # Canvas 2D 渲染器
  stores/
    gameStore.ts          # Pinia 狀態管理
  components/
    RaceSelect.vue        # 陣營選擇畫面
    GameCanvas.vue        # 主遊戲畫布
    HUD.vue               # 資源欄 + 指令面板
```
