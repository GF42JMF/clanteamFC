import React from 'react';
import { Player, UserAccount, UserRole } from '../types';
import { Shield, UserPlus } from 'lucide-react';

interface AdminAccessPanelProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  players: Player[];
}

const AdminAccessPanel: React.FC<AdminAccessPanelProps> = ({ users, setUsers, players }) => {
  const handleRoleChange = (id: string, nextRole: UserRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: nextRole } : user)));
  };

  const handlePlayerAssign = (id: string, playerId: string) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, playerId } : user)));
  };

  return (
    <section className="bg-[#070707] py-20 px-4" id="access-section">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-clan-magenta" size={32} />
          <h2 className="font-display text-5xl text-white uppercase">Accesos</h2>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Gestiona usuarios, roles y vincula cada cuenta con un jugador del plantel.
        </p>

        <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 bg-black/40">
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Jugador</span>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 items-center">
                <div className="text-white font-bold uppercase text-sm">{user.username}</div>
                <div className="text-gray-400 text-sm break-all">{user.email}</div>
                <div>
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="player">Jugador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <select
                    value={user.playerId || ''}
                    onChange={(event) => handlePlayerAssign(user.id, event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">Sin asignar</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">
                <UserPlus className="mx-auto mb-3 opacity-40" />
                No hay usuarios registrados todavía.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminAccessPanel;
