import { useEffect, useRef } from 'react'
import { Game } from '../game/Game'
import { GameLogger } from '../utils/logger'
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

    // sync input inversion to handler each frame
    const invInterval = window.setInterval(() => {
      try {
        const inv = (window as any).__INPUT_INVERT__ === true;
        // @ts-ignore - reach into game internals minimally
        (game as any).inputHandler?.setInverted?.(inv);
      } catch {}
    }, 50);

    ;(window as any).GameLoggerCls = GameLogger
    game.start()

    return () => {
      (window as any).__game__ = undefined
      try { window.clearInterval(invInterval) } catch {}
    }
  }, [])

  return (
    <div id="root" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <audio id="sfx-laser" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YYQAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA8f8AAPn/AAD9/wAA/f8AAPn/AADx/wAA/f8AAPn/AAD//wAA//8AAP//AAD//wAA" type="audio/wav" />
      </audio>
      <audio id="sfx-inferno" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YYQAAAAA////AP//AP///wD///8A//8AAP//AP///wD//wAA//8A" type="audio/wav" />
      </audio>
      <audio id="sfx-phase" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQwAAAAA8PDw8PDw8PDw8PDw" type="audio/wav" />
      </audio>
      <audio id="sfx-ice" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQgAAAAA////AAAA////AAAA" type="audio/wav" />
      </audio>
      <audio id="sfx-toxic" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQwAAAAA8AAA8AAA8AAA8AAA" type="audio/wav" />
      </audio>
      <audio id="sfx-blackhole" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQgAAAAA////AP///wD///8A" type="audio/wav" />
      </audio>
      <audio id="sfx-pickup" preload="auto">
        <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQcAAAAA////AAAAAP///w==" type="audio/wav" />
      </audio>
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

