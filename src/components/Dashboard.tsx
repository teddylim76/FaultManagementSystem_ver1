import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Stats } from '../types';
import { AlertCircle, Clock, CheckCircle2, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadStats = () => {
    api.stats.get()
      .then(setStats)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();

    socketService.onRecordsUpdated(loadStats);
    return () => socketService.offRecordsUpdated(loadStats);
  }, []);

  if (loading) return <div className="flex justify-center p-12 text-slate-400">통계 데이터를 불러오는 중...</div>;

  const cards = [
    { title: '전체 접수', value: stats?.total || 0, icon: BarChart3, color: 'bg-blue-500', textColor: 'text-blue-600', status: undefined },
    { title: '접수 대기', value: stats?.received || 0, icon: AlertCircle, color: 'bg-amber-500', textColor: 'text-amber-600', status: '접수' },
    { title: '처리 중', value: stats?.in_progress || 0, icon: Clock, color: 'bg-indigo-500', textColor: 'text-indigo-600', status: '처리중' },
    { title: '처리 완료', value: stats?.completed || 0, icon: CheckCircle2, color: 'bg-emerald-500', textColor: 'text-emerald-600', status: '완료' },
  ];

  const handleCardClick = (status?: string) => {
    if (status) {
      navigate(`/records?status=${status}`);
    } else {
      navigate('/records');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">현장장비 장애 현황 대시보드</h2>
        <p className="text-slate-500">실시간 장애 접수 및 처리 현황을 확인하세요.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => handleCardClick(card.status)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all text-left w-full"
          >
            <div className={`${card.color} p-3 rounded-xl text-white`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p>상세 통계 그래프 영역</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex flex-col items-center justify-center text-slate-400">
          <Clock size={48} className="mb-4 opacity-20" />
          <p>최근 장애 발생 추이</p>
        </div>
      </div>
    </div>
  );
}
