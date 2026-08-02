import React, { useState, useEffect, useRef } from "react";
import { Send, Volume2, VolumeX, Award } from "lucide-react";
import confetti from "canvas-confetti";
import soundService from "./SoundService";

interface BoardTile {
  position: number;
  name: string;
  type: string;
  price?: number;
  rent?: number;
  owner?: string | null;
  amount?: number;
}

interface Player {
  username: string;
  money: number;
  position: number;
  properties: number[];
  in_jail: boolean;
  jail_turns: number;
  is_bankrupt: boolean;
}

interface GameState {
  current_turn: string;
  turn_number: number;
  phase: string;
  players: Player[];
  board: BoardTile[];
  events: string[];
  last_roll: [number, number] | null;
  winner: string | null;
}

interface ChatMsg {
  type: "system" | "chat";
  username?: string;
  message: string;
}

interface GameBoardProps {
  roomId: string;
  username: string;
  gameState: GameState;
  chatMessages: ChatMsg[];
  onSendMessage: (msg: string) => void;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onSkipProperty: () => void;
  onLeaveRoom: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  roomId,
  username,
  gameState,
  chatMessages,
  onSendMessage,
  onRollDice,
  onBuyProperty,
  onSkipProperty,
  onLeaveRoom,
}) => {
  const [typedMsg, setTypedMsg] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Track previous state triggers to play sound effects
  const prevRollRef = useRef<string | null>(null);
  const prevOwnersRef = useRef<Record<number, string | null>>({});

  useEffect(() => {
    if (!gameState) return;

    // Detect dice roll change
    const rollKey = gameState.last_roll ? gameState.last_roll.join(",") : null;
    if (rollKey && rollKey !== prevRollRef.current) {
      soundService.playDiceRoll();
      prevRollRef.current = rollKey;
    }

    // Detect property purchases
    gameState.board.forEach((tile) => {
      const prevOwner = prevOwnersRef.current[tile.position];
      if (tile.owner && tile.owner !== prevOwner) {
        soundService.playBuyChime();
      }
      prevOwnersRef.current[tile.position] = tile.owner || null;
    });

    // Detect Jail landings
    const currentPlayer = gameState.players.find(p => p.username === gameState.current_turn);
    if (currentPlayer && currentPlayer.in_jail) {
      // If player just went to jail, play jail sound
      // (simple check if they are in jail on position 10)
      if (currentPlayer.position === 10) {
        soundService.playJailSound();
      }
    }

    // Check for game finished (winner fireworks)
    if (gameState.phase === "finished" && gameState.winner) {
      soundService.playBuyChime();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [gameState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleSound = () => {
    soundService.toggle();
    setSoundEnabled(soundService.isEnabled());
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMsg.trim()) return;
    onSendMessage(typedMsg.trim());
    setTypedMsg("");
  };

  const getPlayerColor = (name: string) => {
    const colors = ["#ec4899", "#3b82f6", "#10b981", "#f59e0b"];
    const idx = gameState.players.findIndex((p) => p.username === name);
    return idx !== -1 ? colors[idx % 4] : "#64748b";
  };

  // Coords generator for 11x11 Grid
  const getGridCoords = (pos: number) => {
    if (pos >= 0 && pos <= 10) {
      return { gridRow: 11, gridColumn: 11 - pos };
    } else if (pos > 10 && pos <= 20) {
      return { gridRow: 11 - (pos - 10), gridColumn: 1 };
    } else if (pos > 20 && pos <= 30) {
      return { gridRow: 1, gridColumn: pos - 19 };
    } else {
      return { gridRow: pos - 29, gridColumn: 11 };
    }
  };

  // Group color mapping for property cards styling
  const getTileColor = (tile: BoardTile) => {
    if (tile.type !== "property") return null;
    const pos = tile.position;
    if (pos === 1 || pos === 3) return "bg-amber-800"; // Brown
    if (pos === 6 || pos === 8 || pos === 9) return "bg-sky-400"; // Light Blue
    if (pos === 11 || pos === 13 || pos === 14) return "bg-pink-500"; // Pink
    if (pos === 16 || pos === 18 || pos === 19) return "bg-orange-500"; // Orange
    if (pos === 21 || pos === 23 || pos === 24) return "bg-red-500"; // Red
    if (pos === 26 || pos === 27 || pos === 29) return "bg-yellow-400"; // Yellow
    if (pos === 31 || pos === 32 || pos === 34) return "bg-green-600"; // Green
    if (pos === 37 || pos === 39) return "bg-blue-700"; // Dark Blue
    return null;
  };

  const activePlayer = gameState.players.find((p) => p.username === gameState.current_turn);
  const isMyTurn = gameState.current_turn === username;

  return (
    <div className="min-h-screen bg-brand-darker text-white p-4 flex flex-col xl:flex-row gap-6 justify-center items-stretch max-w-7xl mx-auto">
      
      {/* LEFT: Players details and Stats */}
      <aside className="w-full xl:w-80 flex flex-col gap-4">
        {/* Room badge & control */}
        <div className="glass p-4 rounded-xl border border-white/10 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400">Lobby ID</h2>
            <span className="text-sm font-semibold text-brand-accent">{roomId}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSound}
              className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white"
              title="Toggle Sounds"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-accent" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 bg-white/5 hover:bg-brand-danger/15 border border-white/10 hover:border-brand-danger/20 rounded-lg text-xs font-semibold hover:text-brand-danger transition-colors duration-200"
            >
              Quit
            </button>
          </div>
        </div>

        {/* Players financial summary list */}
        <div className="glass p-4 rounded-xl border border-white/10 flex-1 flex flex-col gap-3">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Players Financials</h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
            {gameState.players.map((p) => {
              const borderCol = getPlayerColor(p.username);
              const isActive = p.username === gameState.current_turn;
              
              return (
                <div
                  key={p.username}
                  className={`p-3 border rounded-xl relative ${
                    isActive ? "border-brand-primary bg-brand-primary/5" : "border-white/5 bg-brand-dark/20"
                  } ${p.is_bankrupt ? "opacity-30" : ""}`}
                  style={{ borderLeftWidth: "6px", borderLeftColor: borderCol }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        {p.username}
                        {p.username.startsWith("AI_Bot_") && (
                          <span className="text-[9px] bg-slate-500/20 text-slate-400 px-1 py-0.5 rounded font-normal">BOT</span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Position: {p.position} {p.in_jail && "• (In Jail)"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-brand-success">${p.money}</span>
                    </div>
                  </div>
                  
                  {/* Property badges owned */}
                  {p.properties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-white/5">
                      {p.properties.map((pos) => {
                        const tile = gameState.board[pos];
                        const grpColor = getTileColor(tile);
                        return (
                          <span
                            key={pos}
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold text-white border border-white/10 shadow-sm ${
                              grpColor || "bg-slate-700"
                            }`}
                            title={tile.name}
                          >
                            {tile.name.slice(0, 4)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* CENTER: Main Game Board Area */}
      <section className="flex-1 flex flex-col items-center justify-center p-2 relative">
        <div className="grid grid-cols-11 grid-rows-11 gap-0.5 bg-slate-900/80 p-1 border-2 border-white/15 rounded-2xl w-full aspect-square max-w-[620px] relative overflow-hidden glow-purple">
          
          {/* Loop over tiles */}
          {gameState.board.map((tile) => {
            const coords = getGridCoords(tile.position);
            const grpColor = getTileColor(tile);
            const ownerCol = tile.owner ? getPlayerColor(tile.owner) : null;
            
            // Check which players are currently on this tile
            const playersOnTile = gameState.players.filter((p) => p.position === tile.position && !p.is_bankrupt);

            return (
              <div
                key={tile.position}
                style={coords}
                className="bg-brand-dark flex flex-col justify-between items-center p-1 relative border border-white/5 text-[9px] hover:bg-slate-800/40 select-none group transition-all"
              >
                {/* Colored property indicator strip */}
                {grpColor && <div className={`w-full h-1.5 rounded-sm ${grpColor}`} />}
                
                {/* Owned border bar */}
                {ownerCol && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: ownerCol }}
                  />
                )}

                {/* Name & price info */}
                <span className="font-semibold text-center text-[7px] leading-tight text-slate-300 mt-0.5 max-w-[45px] truncate">
                  {tile.name}
                </span>

                {tile.price && !tile.owner && (
                  <span className="text-[7px] text-brand-accent/80 font-semibold">${tile.price}</span>
                )}

                {tile.owner && (
                  <span className="text-[6px] text-slate-500 uppercase font-bold">{tile.owner.slice(0, 5)}</span>
                )}

                {/* Render player tokens present on this tile */}
                <div className="flex flex-wrap gap-0.5 absolute bottom-1.5 justify-center items-center pointer-events-none">
                  {playersOnTile.map((p) => (
                    <div
                      key={p.username}
                      className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-md animate-pulse"
                      style={{ backgroundColor: getPlayerColor(p.username) }}
                      title={p.username}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Central Grid Dashboard Area */}
          <div
            style={{ gridRow: "2 / 11", gridColumn: "2 / 11" }}
            className="bg-brand-darker/90 flex flex-col justify-center items-center p-4 text-center rounded-xl relative border border-brand-primary/10 overflow-hidden"
          >
            {/* Background design overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-primary/5 rounded-full filter blur-xl pointer-events-none"></div>

            {gameState.phase === "finished" ? (
              <div className="flex flex-col items-center gap-3 relative z-10 animate-fade-in">
                <div className="p-3 bg-brand-accent/20 border border-brand-accent/30 rounded-full text-brand-accent">
                  <Award className="w-12 h-12 animate-bounce" />
                </div>
                <h2 className="text-xl font-extrabold text-brand-accent tracking-wide uppercase">Game Completed</h2>
                <p className="text-slate-300 text-sm">
                  Winner: <span className="font-bold text-white text-base">{gameState.winner}</span>
                </p>
                <button
                  onClick={onLeaveRoom}
                  className="mt-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-6 py-2 rounded-xl text-xs transition-transform active:scale-95"
                >
                  Return to Lobby
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between h-full w-full py-4 relative z-10">
                {/* Turn Header indicator */}
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Turn {gameState.turn_number}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full animate-ping"
                      style={{ backgroundColor: getPlayerColor(gameState.current_turn) }}
                    />
                    <span className="font-extrabold text-sm text-white">
                      {isMyTurn ? "Your Turn!" : `${gameState.current_turn}'s Turn`}
                    </span>
                  </div>
                </div>

                {/* Main Action HUD Panel */}
                <div className="my-6">
                  {gameState.phase === "roll" && (
                    <div className="flex flex-col items-center gap-3">
                      {gameState.last_roll && (
                        <div className="flex gap-2.5 justify-center mb-1">
                          {gameState.last_roll.map((num, i) => (
                            <div
                              key={i}
                              className="w-10 h-10 bg-white text-brand-dark font-extrabold text-lg flex items-center justify-center rounded-lg border border-slate-300 shadow-md transform rotate-3"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isMyTurn ? (
                        <button
                          onClick={onRollDice}
                          className="bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold px-8 py-3 rounded-xl shadow-lg shadow-brand-primary/30 transition-all duration-200 active:scale-95 text-sm"
                        >
                          Roll Dice
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Waiting for roll...</p>
                      )}
                    </div>
                  )}

                  {gameState.phase === "purchase" && (
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      {(() => {
                        const tilePos = activePlayer ? activePlayer.position : 0;
                        const tile = gameState.board[tilePos];
                        return (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Option to purchase</p>
                            <h4 className="font-extrabold text-sm text-brand-accent mt-0.5">{tile.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Price: ${tile.price} • Rent: ${tile.rent}</p>
                          </div>
                        );
                      })()}

                      {isMyTurn ? (
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={onSkipProperty}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                          >
                            Skip
                          </button>
                          <button
                            onClick={onBuyProperty}
                            disabled={activePlayer ? activePlayer.money < (gameState.board[activePlayer.position].price || 0) : true}
                            className="bg-brand-success hover:bg-brand-success/90 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow-md shadow-brand-success/20 transition-all duration-200 disabled:opacity-30"
                          >
                            Buy Property
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Making choice...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtext info */}
                <div className="text-[10px] text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  WebSockets Sync Active
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT: Live Events Log & Chats */}
      <section className="w-full xl:w-96 flex flex-col gap-4">
        {/* Live log events */}
        <div className="glass p-4 rounded-xl border border-white/10 flex-1 flex flex-col min-h-[220px]">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 border-b border-white/5 pb-2">
            Game Event Logs
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1 scrollbar">
            {gameState.events.map((evt, i) => (
              <p
                key={i}
                className={`py-1 px-2.5 rounded-lg border leading-snug break-words ${
                  evt.includes("bankrupt")
                    ? "bg-brand-danger/10 border-brand-danger/20 text-brand-danger"
                    : evt.includes("bought")
                    ? "bg-brand-success/10 border-brand-success/20 text-brand-success"
                    : evt.includes("rent")
                    ? "bg-brand-primary/10 border-brand-primary/20 text-slate-300"
                    : "bg-white/5 border-white/5 text-slate-400"
                }`}
              >
                {evt}
              </p>
            ))}
          </div>
        </div>

        {/* Live chat */}
        <div className="glass p-4 rounded-xl border border-white/10 flex-1 flex flex-col min-h-[220px]">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 border-b border-white/5 pb-2">
            Room Chat
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1 scrollbar">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="break-all">
                {msg.type === "system" ? (
                  <p className="text-[10px] text-center text-brand-accent/70 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                    {msg.message}
                  </p>
                ) : (
                  <div>
                    <span className={`text-[10px] font-bold ${
                      msg.username === username ? "text-brand-accent" : "text-brand-primary"
                    }`}>
                      {msg.username}
                    </span>
                    <p className="text-slate-300 bg-brand-dark/40 border border-white/5 p-2 rounded-lg mt-0.5">
                      {msg.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
            <input
              type="text"
              value={typedMsg}
              onChange={(e) => setTypedMsg(e.target.value)}
              placeholder="Send message to lobby..."
              className="flex-1 bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/95 text-white p-2.5 rounded-xl transition-all duration-200 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default GameBoard;
