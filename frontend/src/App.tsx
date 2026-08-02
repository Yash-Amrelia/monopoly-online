import { useState, useEffect, useRef } from "react";
import AuthPage from "./components/AuthPage";
import LobbyPage from "./components/LobbyPage";
import LobbyRoom from "./components/LobbyRoom";
import GameBoard from "./components/GameBoard";

type PageType = "auth" | "lobby" | "room" | "game";

interface ChatMsg {
  type: "system" | "chat";
  username?: string;
  message: string;
}

export default function App() {
  const [page, setPage] = useState<PageType>("auth");
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [room, setRoom] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const apiBaseUrl = "http://localhost:8000";

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("monopoly_token");
    const savedUser = localStorage.getItem("monopoly_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsername(savedUser);
      setPage("lobby");
    }
  }, []);

  // WebSocket Manager
  useEffect(() => {
    if (!roomId || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/api/ws/${roomId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to room", roomId);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Event Recieved:", data);

      if (data.type === "system" || data.type === "chat") {
        setChatMessages((prev) => [...prev, data]);
      } else if (data.type === "room_state") {
        setRoom(data.room);
        if (data.room.game_started) {
          if (data.room.game_state) {
            setGameState(data.room.game_state);
          }
          setPage("game");
        } else {
          setPage("room");
        }
      } else if (data.type === "game_state") {
        setGameState(data.state);
        setPage("game");
      }
    };

    ws.onerror = (err) => {
      console.error("WS error occurred:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, token]);

  const handleAuthSuccess = (newToken: string, newUsername: string) => {
    localStorage.setItem("monopoly_token", newToken);
    localStorage.setItem("monopoly_user", newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setPage("lobby");
  };

  const handleLogout = () => {
    localStorage.removeItem("monopoly_token");
    localStorage.removeItem("monopoly_user");
    setToken("");
    setUsername("");
    setRoomId("");
    setRoom(null);
    setGameState(null);
    setChatMessages([]);
    setPage("auth");
  };

  // REST API Actions
  const handleJoinRoom = (id: string) => {
      console.log("Joining:", id);

      setRoomId(id);
      setChatMessages([]);

      // Temporary loading page
      setPage("room");
  }

  const handleLeaveRoom = async () => {
    try {
      await fetch(`${apiBaseUrl}/rooms/${roomId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
    } catch (err) {
      console.error("Error leaving room:", err);
    } finally {
      // Disconnect WS and return to Lobby list
      setRoomId("");
      setRoom(null);
      setGameState(null);
      setChatMessages([]);
      setPage("lobby");
    }
  };

  const handleAddAI = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/add-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ host: username }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || "Failed to add AI");
      }
    } catch (err) {
      console.error("Error adding AI:", err);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ host: username }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || "Failed to start game");
      }
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  const handleRollDice = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/roll-dice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to roll:", data.detail);
      }
    } catch (err) {
      console.error("Error rolling dice:", err);
    }
  };

  const handleBuyProperty = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/buy-property`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to buy:", data.detail);
      }
    } catch (err) {
      console.error("Error buying property:", err);
    }
  };

  const handleSkipProperty = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/skip-property`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to skip:", data.detail);
      }
    } catch (err) {
      console.error("Error skipping property:", err);
    }
  };

  // WebSocket event publishers
  const handleSendMessage = (msgText: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        message: msgText,
      }));
    }
  };

  const handleToggleReady = (readyVal: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "ready_toggle",
        ready: readyVal,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker font-sans">
      {page === "auth" && (
        <AuthPage onAuthSuccess={handleAuthSuccess} apiBaseUrl={apiBaseUrl} />
      )}
      {page === "lobby" && (
        <LobbyPage
          token={token}
          username={username}
          onJoinRoom={handleJoinRoom}
          onLogout={handleLogout}
          apiBaseUrl={apiBaseUrl}
        />
      )}
      {page === "room" && room && (
        <LobbyRoom
          room={room}
          username={username}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onToggleReady={handleToggleReady}
          onAddAI={handleAddAI}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {page === "game" && gameState && (
        <GameBoard
          roomId={roomId}
          username={username}
          gameState={gameState}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onRollDice={handleRollDice}
          onBuyProperty={handleBuyProperty}
          onSkipProperty={handleSkipProperty}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
