import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { nanoid } from "nanoid";

// Types
interface Player {
  id: string;
  username: string;
  ready: boolean;
  score: number;
  errors: number;
  isEliminated: boolean;
}

interface GameRoom {
  id: string;
  hostId: string;
  category: string;
  options: {
    timer: number;
    numQuestions: number;
    maxErrors: number;
    numPlayers: number;
  };
  players: Player[];
  status: 'lobby' | 'playing' | 'ended';
  currentQuestionIndex: number;
  currentTurnPlayerIndex: number;
  questions: any[];
  timer: number;
}

const rooms: Map<string, GameRoom> = new Map();
const roomIntervals: Map<string, NodeJS.Timeout> = new Map();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_lobby", ({ roomId, username }) => {
      let room = rooms.get(roomId);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Check if player already in room by username to handle re-joins/refreshes
      const existingPlayer = room.players.find(p => p.username === username);
      if (existingPlayer) {
        console.log(`[join_lobby] Player ${username} re-joining. Updating ID from ${existingPlayer.id} to ${socket.id}`);
        existingPlayer.id = socket.id; // Update to current socket ID
        socket.join(roomId);
        io.to(roomId).emit("room_update", room);
        return;
      }

      if (room.players.length >= room.options.numPlayers && room.status === 'lobby') {
        console.log(`[join_lobby] Room ${roomId} is full`);
        socket.emit("error", "Room is full");
        return;
      }

      console.log(`[join_lobby] New player ${username} joining room ${roomId} with ID ${socket.id}`);
      const player: Player = {
        id: socket.id,
        username,
        ready: false,
        score: 0,
        errors: 0,
        isEliminated: false,
      };

      room.players.push(player);
      socket.join(roomId);
      io.to(roomId).emit("room_update", room);
    });

    socket.on("create_room", ({ category, options, username }) => {
      const roomId = nanoid(6).toUpperCase();
      const room: GameRoom = {
        id: roomId,
        hostId: socket.id,
        category,
        options,
        players: [{
          id: socket.id,
          username,
          ready: true, // Host is ready by default
          score: 0,
          errors: 0,
          isEliminated: false,
        }],
        status: 'lobby',
        currentQuestionIndex: 0,
        currentTurnPlayerIndex: 0,
        questions: [],
        timer: options.timer,
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit("room_created", roomId);
    });

    socket.on("toggle_ready", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        // Host doesn't need to be ready
        if (socket.id === room.hostId) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.ready = !player.ready;
          io.to(roomId).emit("room_update", room);
        }
      }
    });

    socket.on("start_game", ({ roomId, questions }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        // Check if all OTHER players are ready
        const otherPlayers = room.players.filter(p => p.id !== room.hostId);
        const allOtherReady = otherPlayers.length > 0 && otherPlayers.every(p => p.ready);

        if (allOtherReady) {
          room.status = 'playing';
          room.questions = questions;
          room.currentQuestionIndex = 0;
          room.currentTurnPlayerIndex = 0;
          room.timer = room.options.timer;
          
          io.to(roomId).emit("game_started", room);
          startRoomTimer(roomId, io);
        }
      }
    });

    socket.on("submit_answer", ({ roomId, isCorrect }) => {
      console.log(`[submit_answer] Room: ${roomId}, isCorrect: ${isCorrect}, socket: ${socket.id}`);
      const room = rooms.get(roomId);
      if (room && room.status === 'playing') {
        const currentPlayer = room.players[room.currentTurnPlayerIndex];
        console.log(`[submit_answer] Current player: ${currentPlayer.username} (${currentPlayer.id})`);
        
        if (currentPlayer.id === socket.id) {
          // Clear timer while showing feedback
          const interval = roomIntervals.get(roomId);
          if (interval) clearInterval(interval);
          roomIntervals.delete(roomId);

          if (isCorrect) {
            currentPlayer.score += 1;
          } else {
            currentPlayer.errors += 1;
          }
          
          // Emit answer_submitted to show feedback to all players if desired, 
          // but mainly the active player needs it. 
          // We'll wait 2 seconds before moving to next turn.
          setTimeout(() => {
            nextTurn(roomId, io);
          }, 2000);
        } else {
          console.log(`[submit_answer] Unauthorized answer attempt by ${socket.id}`);
        }
      }
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
        const interval = roomIntervals.get(roomId);
        if (interval) clearInterval(interval);
        roomIntervals.delete(roomId);
        rooms.delete(roomId);
      } else {
            if (room.hostId === socket.id) {
              room.hostId = room.players[0].id;
            }
            io.to(roomId).emit("room_update", room);
          }
        }
      });
    });
  });

  function startRoomTimer(roomId: string, io: Server) {
    console.log(`[startRoomTimer] Starting timer for room: ${roomId}`);
    const room = rooms.get(roomId);
    if (!room) return;

    const existingInterval = roomIntervals.get(roomId);
    if (existingInterval) clearInterval(existingInterval);

    const interval = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || r.status !== 'playing') {
        console.log(`[startRoomTimer] Room ${roomId} not found or not playing, clearing interval`);
        const int = roomIntervals.get(roomId);
        if (int) clearInterval(int);
        roomIntervals.delete(roomId);
        return;
      }

      r.timer -= 1;
      if (r.timer <= 0) {
        console.log(`[startRoomTimer] Room ${roomId} timer timeout`);
        const currentPlayer = r.players[r.currentTurnPlayerIndex];
        currentPlayer.errors += 1;
        
        // Clear interval before moving to next turn
        if (interval) clearInterval(interval);
        roomIntervals.delete(roomId);

        nextTurn(roomId, io);
      } else {
        io.to(roomId).emit("timer_update", r.timer);
      }
    }, 1000);

    roomIntervals.set(roomId, interval);
  }

  function nextTurn(roomId: string, io: Server) {
    const room = rooms.get(roomId);
    if (!room) return;

    console.log(`[nextTurn] Room ${roomId}, current player index: ${room.currentTurnPlayerIndex}, question index: ${room.currentQuestionIndex}`);

    // Move to next player
    room.currentTurnPlayerIndex = (room.currentTurnPlayerIndex + 1) % room.players.length;
    
    // If we wrapped back to the first player, move to the next question
    if (room.currentTurnPlayerIndex === 0) {
      room.currentQuestionIndex += 1;
    }

    if (room.currentQuestionIndex >= room.questions.length) {
      console.log(`[nextTurn] No more questions for room ${roomId}`);
      endGame(roomId, io);
      return;
    }

    // Reset timer for next turn
    room.timer = room.options.timer;
    
    // Emit next_turn to all players
    io.to(roomId).emit("next_turn", {
      currentTurnPlayerIndex: room.currentTurnPlayerIndex,
      currentQuestionIndex: room.currentQuestionIndex,
      players: room.players,
      timer: room.timer
    });

    // Restart timer for the new turn
    startRoomTimer(roomId, io);
  }

  function endGame(roomId: string, io: Server) {
    console.log(`[endGame] Ending game for room: ${roomId}`);
    const room = rooms.get(roomId);
    if (room) {
      room.status = 'ended';
      const interval = roomIntervals.get(roomId);
      if (interval) clearInterval(interval);
      roomIntervals.delete(roomId);
      io.to(roomId).emit("game_ended", room.players);
    }
  }

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
