import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { FailureRecord } from '../types';
import { Edit, Trash2, Search, Filter, Download, Eye, X } from 'lucide-react';

export default function RecordTable() {
  const [records, setRecords] = useState<FailureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get status filter from URL
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');

  useEffect(() => {
    loadRecords();

    socketService.onRecordsUpdated(loadRecords);
    return () => socketService.offRecordsUpdated(loadRecords);
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.records.getAll();
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await api.records.delete(id);
        loadRecords();
      } catch (error) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.symptom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수': return 'bg-amber-100 text-amber-700 border-amber-200';
      case '처리중': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case '완료': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const clearStatusFilter = () => {
    navigate('/records');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">장애 이력 목록</h2>
          <p className="text-slate-500">등록된 모든 장애 이력을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={18} /> 엑셀 다운로드
          </button>
          <button 
            onClick={() => navigate('/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            신규 등록
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="장소, 이름, 증상으로 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Filter size={20} />
            </button>
          </div>
          
          {statusFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">필터 적용됨:</span>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(statusFilter)}`}>
                상태: {statusFilter}
                <button onClick={clearStatusFilter} className="hover:text-slate-900 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">순번</th>
                <th className="px-6 py-4 font-semibold">날짜</th>
                <th className="px-6 py-4 font-semibold">장소</th>
                <th className="px-6 py-4 font-semibold">소속/이름</th>
                <th className="px-6 py-4 font-semibold">연락처</th>
                <th className="px-6 py-4 font-semibold">고장증상</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">비고</th>
                <th className="px-6 py-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">데이터를 불러오는 중...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">등록된 장애 이력이 없습니다.</td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500">{filteredRecords.length - index}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.location}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{record.name}</div>
                      <div className="text-xs text-slate-400">{record.affiliation}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{record.contact}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{record.symptom}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{record.remarks || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/edit/${record.id}`)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
