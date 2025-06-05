import React, { useRef, useEffect, useState } from "react"
import {
  LOGO_ICON,
  OBSTACLE_ICON,
  POWERUP_ICON,
  BACKGROUND_IMAGE,
  PLAYER_SPRITE,
} from "./assets"

type Obstacle = {
  x: number
  y: number
  width: number
  height: number
  type: "obstacle" | "powerup"
}

const GAME_WIDTH = 480
const GAME_HEIGHT = 720
const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 48
const GRAVITY = 0.7
const JUMP_VELOCITY = -12
const OBSTACLE_SPEED = 6
const OBSTACLE_INTERVAL = 1200 // ms

function randomY() {
  // Only for powerups, obstacles are always on the ground
  return Math.random() * (GAME_HEIGHT - 200) + 100
}

export default function GameEngine({
  onGameOver,
  onScore,
  running,
}: {
  onGameOver: (score: number) => void
  onScore: (score: number) => void
  running: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("dinovox_highscore") || 0)
  )
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - PLAYER_HEIGHT - 32)
  const [playerVY, setPlayerVY] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [lastObstacle, setLastObstacle] = useState(Date.now())
  const [gameOver, setGameOver] = useState(false)
  const [playerImg, setPlayerImg] = useState<HTMLImageElement | null>(null)
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null)

  // Load images
  useEffect(() => {
    const img = new window.Image()
    img.src = PLAYER_SPRITE
    img.onload = () => setPlayerImg(img)
    const bg = new window.Image()
    bg.src = BACKGROUND_IMAGE
    bg.onload = () => setBgImg(bg)
  }, [])

  // Game loop
  useEffect(() => {
    if (!running) return
    let animation: number
    let lastTime = performance.now()

    function loop(now: number) {
      const dt = now - lastTime
      lastTime = now

      // Player physics
      setPlayerY((prev) => {
        let next = prev + playerVY
        if (next > GAME_HEIGHT - PLAYER_HEIGHT - 32) {
          next = GAME_HEIGHT - PLAYER_HEIGHT - 32
          setPlayerVY(0)
          setIsJumping(false)
        }
        return next
      })
      setPlayerVY((vy) => (isJumping ? vy + GRAVITY : 0))

      // Obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, x: o.x - OBSTACLE_SPEED }))
          .filter((o) => o.x + o.width > 0)
      )

      // Add new obstacles
      if (Date.now() - lastObstacle > OBSTACLE_INTERVAL) {
        setLastObstacle(Date.now())
        setObstacles((prev) => [
          ...prev,
          {
            x: GAME_WIDTH,
            y: GAME_HEIGHT - 64,
            width: 48,
            height: 48,
            type: Math.random() < 0.8 ? "obstacle" : "powerup",
          },
        ])
      }

      // Collision detection
      obstacles.forEach((o) => {
        if (
          o.x < 64 &&
          o.x + o.width > 16 &&
          playerY + PLAYER_HEIGHT > o.y &&
          playerY < o.y + o.height
        ) {
          if (o.type === "obstacle") {
            setGameOver(true)
            onGameOver(score)
            if (score > highScore) {
              setHighScore(score)
              localStorage.setItem("dinovox_highscore", String(score))
            }
          } else if (o.type === "powerup") {
            setScore((s) => s + 10)
            onScore(score + 10)
            setObstacles((prev) => prev.filter((p) => p !== o))
          }
        }
      })

      // Score
      setScore((s) => {
        if (!gameOver) {
          onScore(s + 1)
          return s + 1
        }
        return s
      })

      draw()
      if (!gameOver) animation = requestAnimationFrame(loop)
    }

    function draw() {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return
      // Background
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, GAME_WIDTH, GAME_HEIGHT)
      } else {
        ctx.fillStyle = "#222"
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      }
      // Ground
      ctx.fillStyle = "#3b3b3b"
      ctx.fillRect(0, GAME_HEIGHT - 32, GAME_WIDTH, 32)
      // Player
      if (playerImg) {
        ctx.drawImage(
          playerImg,
          16,
          playerY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        )
      } else {
        ctx.fillStyle = "#fff"
        ctx.fillRect(16, playerY, PLAYER_WIDTH, PLAYER_HEIGHT)
      }
      // Obstacles & Powerups
      obstacles.forEach((o) => {
        if (o.type === "obstacle") {
          ctx.fillStyle = "#e11d48"
          ctx.fillRect(o.x, o.y, o.width, o.height)
        } else {
          ctx.fillStyle = "#22d3ee"
          ctx.beginPath()
          ctx.arc(
            o.x + o.width / 2,
            o.y + o.height / 2,
            o.width / 2,
            0,
            2 * Math.PI
          )
          ctx.fill()
        }
      })
      // Score
      ctx.font = "bold 32px sans-serif"
      ctx.fillStyle = "#fff"
      ctx.fillText(`Score: ${score}`, 16, 48)
      ctx.font = "bold 18px sans-serif"
      ctx.fillText(`High: ${highScore}`, 16, 72)
    }

    animation = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animation)
    // eslint-disable-next-line
  }, [running, playerImg, bgImg, isJumping, obstacles, gameOver])

  // Controls
  useEffect(() => {
    if (!running) return
    function onKey(e: KeyboardEvent) {
      if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping) {
        setPlayerVY(JUMP_VELOCITY)
        setIsJumping(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isJumping, running])

  // Reset on new game
  useEffect(() => {
    if (running) {
      setScore(0)
      setPlayerY(GAME_HEIGHT - PLAYER_HEIGHT - 32)
      setPlayerVY(0)
      setIsJumping(false)
      setObstacles([])
      setGameOver(false)
    }
  }, [running])

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="rounded-xl shadow-2xl border-4 border-gray-800 bg-black"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT, background: "#222" }}
      />
    </div>
  )
}
