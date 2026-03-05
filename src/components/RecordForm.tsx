import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { FailureRecord, Status } from '../types';
import { Camera, Save, ArrowLeft, Upload } from 'lucide-react';

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<Partial<FailureRecord>>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    affiliation: '',
    name: '',
    contact: '',
    symptom: '',
    status: '접수',
    remarks: '',
    received_photo: '',
    completed_photo: '',
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.records.getAll().then(records => {
        const found = records.find(r => r.id === parseInt(id));
        if (found) setRecord(found);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'received' | 'completed') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecord(prev => ({
          ...prev,
          [type === 'received' ? 'received_photo' : 'completed_photo']: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.records.update(parseInt(id), record);
      } else {
        await api.records.create(record);
      }
      navigate('/records');
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{id ? '장애 이력 수정' : '신규 장애 등록'}</h2>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">날짜</label>
            <input
              type="date"
              required
              value={record.date}
              onChange={e => setRecord({ ...record, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">장소</label>
            <input
              type="text"
              required
              value={record.location}
              onChange={e => setRecord({ ...record, location: e.target.value })}
              placeholder="장비 위치 또는 현장명"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">소속</label>
            <input
              type="text"
              required
              value={record.affiliation}
              onChange={e => setRecord({ ...record, affiliation: e.target.value })}
              placeholder="부서 또는 업체명"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">이름</label>
            <input
              type="text"
              required
              value={record.name}
              onChange={e => setRecord({ ...record, name: e.target.value })}
              placeholder="담당자 이름"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">연락처</label>
            <input
              type="tel"
              required
              value={record.contact}
              onChange={e => setRecord({ ...record, contact: e.target.value })}
              placeholder="010-0000-0000"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">처리상태</label>
            <select
              value={record.status}
              onChange={e => setRecord({ ...record, status: e.target.value as Status })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            >
              <option value="접수">접수</option>
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">고장증상</label>
          <textarea
            required
            rows={4}
            value={record.symptom}
            onChange={e => setRecord({ ...record, symptom: e.target.value })}
            placeholder="현장장비 고장상태에 대한 상세 설명을 기입하세요."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">비고</label>
          <input
            type="text"
            value={record.remarks}
            onChange={e => setRecord({ ...record, remarks: e.target.value })}
            placeholder="추가 참고 사항"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Received Photo Upload */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Camera size={16} /> 접수 사진
            </label>
            <div className="relative group">
              <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
                {record.received_photo ? (
                  <img src={record.received_photo} alt="접수" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-1">
                    <Upload size={24} />
                    <span className="text-xs">사진 업로드</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'received')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Completed Photo Upload - Only if status is '완료' or '처리중' */}
          <div className={`space-y-3 transition-opacity ${record.status === '접수' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Camera size={16} /> 완료 사진
            </label>
            <div className="relative group">
              <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
                {record.completed_photo ? (
                  <img src={record.completed_photo} alt="완료" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-1">
                    <Upload size={24} />
                    <span className="text-xs">사진 업로드</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={record.status === '접수'}
                  onChange={e => handleFileChange(e, 'completed')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? '저장 중...' : '장애 정보 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
