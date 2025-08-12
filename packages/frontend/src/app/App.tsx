import React, { useEffect, useRef } from 'react'
import { Game } from '../game/Game'
import { GameStatus } from '../game/GameState'

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<Game | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new Game(canvas)
    gameRef.current = game

    // Telegram MainButton sync
    const tg: any = (window as any).Telegram?.WebApp
    game.onStatusChange((status) => {
      if (!tg?.MainButton) return
      if (status === GameStatus.Intro) {
        tg.MainButton.setText('Start')
        tg.MainButton.show()
        tg.MainButton.onClick(() => {
          const btn = document.getElementById('btn-restart') as HTMLButtonElement | null
          btn?.click()
        })
      } else if (status === GameStatus.Running) {
        tg.MainButton.setText('Restart')
        tg.MainButton.onClick(() => {
          const btn = document.getElementById('btn-restart') as HTMLButtonElement | null
          btn?.click()
        })
        tg.MainButton.show()
      } else if (status === GameStatus.GameOver || status === GameStatus.Stopped) {
        tg.MainButton.setText('Restart')
        tg.MainButton.show()
      }
    })

    game.start()

    return () => {
      (window as any).__game__ = undefined
    }
  }, [])

  return (
    <div id="root" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas id="game-canvas" ref={canvasRef} />
      <div id="controls">
        <button id="btn-up" className="up">▲</button>
        <button id="btn-left" className="left">◀</button>
        <button id="btn-right" className="right">▶</button>
        <button id="btn-down" className="down">▼</button>
      </div>
      <div id="restart">
        <button id="btn-restart">Start ▶</button>
      </div>
    </div>
  )
}

