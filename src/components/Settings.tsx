import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { UserPlus, Trash2, Shield, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Account Form State
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await api.auth.getUsers();
      setUsers(u);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.signup(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      setShowUserForm(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.auth.updateUser(editingUser.id, {
        username: newUsername,
        password: newPassword || undefined,
        role: newRole
      });
      setEditingUser(null);
      setNewUsername('');
      setNewPassword('');
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('계정을 삭제하시겠습니까?')) {
      try {
        await api.auth.deleteUser(id);
        loadData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNewUsername(u.username);
    setNewPassword('');
    setNewRole(u.role as any);
  };

  if (loading) return <div className="flex justify-center p-12 text-slate-400">설정 데이터를 불러오는 중...</div>;

  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">사용자 설정</h2>
        <p className="text-slate-500">시스템 계정을 관리합니다.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Account Management */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Shield className="text-emerald-500" size={20} />
              계정 관리
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setNewUsername('');
                  setNewPassword('');
                  setNewRole('user');
                  setShowUserForm(true);
                }}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <UserPlus size={18} />
              </button>
            )}
          </div>
          
          <div className="p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                  <th className="pb-3">아이디</th>
                  <th className="pb-3 text-center">권한</th>
                  <th className="pb-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="group">
                    <td className="py-4 text-sm font-medium text-slate-900">{u.username}</td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-md"
                        >
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            className={`p-1.5 rounded-md ${u.id === user.id ? 'text-slate-100 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {(showUserForm || editingUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{editingUser ? '계정 정보 수정' : '새 계정 등록'}</h3>
                <button 
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                  }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">아이디</label>
                  <input 
                    type="text" 
                    required 
                    disabled={editingUser && !isAdmin}
                    value={newUsername} 
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    비밀번호 {editingUser && '(변경 시에만 입력)'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingUser}
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">권한</label>
                  <select 
                    value={newRole} 
                    disabled={!isAdmin || (editingUser && editingUser.id === user.id)}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="user">사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-4">
                  {editingUser ? '정보 수정' : '계정 생성'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
