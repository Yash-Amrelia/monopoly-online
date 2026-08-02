import React, { useState } from "react";
import { ArrowLeft, UserPlus, CheckCircle, Send, Play, Bot } from "lucide-react";

interface Room {
  room_id: string;
  room_name: string;
  host: string;
  players: string[];
  ready_players: string[];
  game_started: boolean;
}

interface ChatMsg {
  type: "system" | "chat";
  username?: string;
  message: string;
}

interface LobbyRoomProps {
  room: Room;
  username: string;
  chatMessages: ChatMsg[];
  onSendMessage: (msg: string) => void;
  onToggleReady: (ready: boolean) => void;
  onAddAI: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  room,
  username,
  chatMessages,
  onSendMessage,
  onToggleReady,
  onAddAI,
  onStartGame,
  onLeaveRoom,
}) => {
  const [typedMessage, setTypedMessage] = useState("");
  const isHost = room.host === username;
  const isUserReady = room.ready_players.includes(username);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    onSendMessage(typedMessage.trim());
    setTypedMessage("");
  };

  const handleReadyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleReady(e.target.checked);
  };

  // Determine starting eligibility
  const nonReadyCount = room.players.filter(p => !room.ready_players.includes(p)).length;
  const canStart = room.players.length >= 2 && nonReadyCount === 0;

  return (
    <div className="min-h-screen bg-brand-darker text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background neon visual glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-primary rounded-full filter blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Lobby Information Panel */}
        <section className="md:col-span-2 glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={onLeaveRoom}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition-all duration-200"
                title="Leave Room"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{room.room_name}</h1>
                <p className="text-xs text-slate-400">Lobby ID: <span className="font-semibold">{room.room_id}</span></p>
              </div>
            </div>

            {/* Players in Room List */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Players ({room.players.length}/4)</h2>
              {room.players.map((player) => {
                const isPlayerReady = room.ready_players.includes(player);
                const isPlayerHost = room.host === player;
                const isAI = player.startsWith("AI_Bot_");

                return (
                  <div
                    key={player}
                    className={`flex items-center justify-between p-4 border rounded-xl bg-brand-dark/40 ${
                      isPlayerReady ? "border-brand-success/35 bg-brand-success/5" : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-accent">
                          {isAI ? <Bot className="w-5 h-5" /> : player.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-sm">{player}</span>
                        {isPlayerHost && (
                          <span className="ml-2 text-[10px] bg-brand-accent/20 border border-brand-accent/40 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                            Host
                          </span>
                        )}
                        {isAI && (
                          <span className="ml-2 text-[10px] bg-slate-500/20 border border-slate-500/40 text-slate-300 px-2 py-0.5 rounded-full font-bold flex-inline items-center gap-1">
                            Bot
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPlayerReady ? (
                        <span className="text-xs text-brand-success font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Ready
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not Ready</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player controls */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Ready Toggle Checkbox */}
            {!room.players.includes(username) || username.startsWith("AI_Bot_") ? null : (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUserReady}
                  disabled={isHost} // Host is ready by default
                  onChange={handleReadyChange}
                  className="w-5 h-5 rounded border-white/10 text-brand-primary focus:ring-brand-primary bg-brand-dark/50"
                />
                <span className="text-sm font-semibold text-slate-300">I am ready to play</span>
              </label>
            )}

            {/* Host Game Launch Controls */}
            {isHost && (
              <div className="flex gap-3 w-full sm:w-auto">
                {room.players.length < 4 && (
                  <button
                    onClick={onAddAI}
                    className="flex items-center gap-2 border border-white/10 hover:bg-white/5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add AI Bot</span>
                  </button>
                )}
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-brand-primary disabled:opacity-30 hover:bg-brand-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Game</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Chat Panel */}
        <section className="glass rounded-2xl p-4 border border-white/10 flex flex-col h-[500px]">
          <h2 className="font-bold text-sm text-slate-300 border-b border-white/5 pb-3 mb-3">Room Chat</h2>
          
          {/* Messages feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm scrollbar">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="break-all">
                {msg.type === "system" ? (
                  <p className="text-[11px] text-center text-brand-accent/70 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                    {msg.message}
                  </p>
                ) : (
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold ${
                      msg.username === username ? "text-brand-accent" : "text-brand-primary"
                    }`}>
                      {msg.username}
                    </span>
                    <span className="text-slate-200 bg-brand-dark/40 border border-white/5 p-2 rounded-lg mt-0.5">
                      {msg.message}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type chat message..."
              className="flex-1 bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/95 text-white p-2.5 rounded-xl transition-all duration-200 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

      </div>
    </div>
  );
};

export default LobbyRoom;
