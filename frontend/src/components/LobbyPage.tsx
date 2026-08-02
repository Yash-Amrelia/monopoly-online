import React, { useState, useEffect } from "react";
import { PlusCircle, LogOut, Users, Trophy, RefreshCw, Home, ShieldAlert } from "lucide-react";

interface Room {
  room_id: string;
  room_name: string;
  host: string;
  players: string[];
  game_started: boolean;
}

interface LeaderboardUser {
  id: number;
  username: string;
  games_played: number;
  wins: number;
}

interface LobbyPageProps {
  token: string;
  username: string;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
  apiBaseUrl: string;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({
  token,
  username,
  onJoinRoom,
  onLogout,
  apiBaseUrl,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rooms`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data || []);
      }
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchLeaderboard();
    const interval = setInterval(fetchRooms, 4000); // Polling rooms list
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_name: newRoomName.trim(),
          host: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.detail || "Failed to create room");
      }

      // Close popup
      setShowCreateModal(false);
      setNewRoomName("");

      onJoinRoom(data.room_id);
    } catch (err: any) {
      setError(err.message || "Failed to create lobby");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await response.json();

      console.log("Join response:", data);

      if (!response.ok) {
          throw new Error(data.detail || "Failed to join room");
      }

      console.log("Joining room:", roomId);

      onJoinRoom(roomId);
    } catch (err: any) {
      setError(err.message || "Lobby is full or already started");
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker text-white p-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary rounded-full filter blur-[180px] opacity-10 pointer-events-none"></div>

      {/* Top Header bar */}
      <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/20 p-2 rounded-xl border border-brand-primary/30 text-brand-accent">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Monopoly Lobbies</h1>
            <p className="text-slate-400 text-xs">Logged in as <span className="text-brand-accent font-semibold">{username}</span></p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-danger/10 border border-white/10 hover:border-brand-danger/20 rounded-xl text-slate-300 hover:text-brand-danger font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main content grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rooms list panel */}
        <section className="lg:col-span-2 glass rounded-2xl p-6 glow-purple border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-primary" />
              <span>Available Rooms ({rooms.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchRooms}
                className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all duration-200"
                title="Refresh List"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Lobby</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {rooms.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/5 rounded-xl">
                <p className="text-slate-500 text-sm">No lobbies are currently open.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-brand-primary hover:underline text-sm font-semibold"
                >
                  Create the first lobby
                </button>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.room_id}
                  className="p-4 border border-white/5 rounded-xl bg-brand-dark/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-brand-primary/30 transition-all duration-200"
                >
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-base">
                      {room.room_name}
                      <span className="text-xs font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        ID: {room.room_id}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Host: <span className="text-slate-300 font-semibold">{room.host}</span> • Joined: {room.players.length}/4 players
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                      room.game_started
                        ? "bg-brand-danger/10 border-brand-danger/25 text-brand-danger"
                        : "bg-brand-success/10 border-brand-success/25 text-brand-success"
                    }`}>
                      {room.game_started ? "In Progress" : "Lobby Open"}
                    </span>
                    
                    {!room.game_started && (
                      <button
                        onClick={() => handleJoinRoom(room.room_id)}
                        disabled={room.players.includes(username) || room.players.length >= 4}
                        className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 hover:border-brand-primary px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      >
                        Join Room
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Leaderboard Panel */}
        <section className="glass rounded-2xl p-6 border border-white/10 flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
            <Trophy className="w-5 h-5 text-brand-accent animate-pulse" />
            <span>Top Players</span>
          </h2>

          <div className="space-y-4 flex-1">
            {leaderboard.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No statistics recorded yet.</p>
            ) : (
              leaderboard.map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-brand-dark/30"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs border ${
                      idx === 0
                        ? "bg-brand-accent/20 border-brand-accent/40 text-brand-accent"
                        : idx === 1
                        ? "bg-slate-300/20 border-slate-300/40 text-slate-300"
                        : idx === 2
                        ? "bg-amber-600/20 border-amber-600/40 text-amber-600"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">{user.username}</h4>
                      <p className="text-[10px] text-slate-400">Games played: {user.games_played}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-brand-accent font-bold text-sm">{user.wins}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Wins</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand-darker/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-dark border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4">Create New Game Lobby</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase font-semibold mb-2">Lobby Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Yash's Boardroom"
                  className="w-full bg-brand-darker border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewRoomName(""); setError(""); }}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 rounded-xl font-semibold transition-all duration-200"
                >
                  {loading ? "Creating..." : "Create Lobby"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
