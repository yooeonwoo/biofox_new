"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart3, Calendar, Search, Edit, Save, X } from 'lucide-react';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
};

type KolMetric = {
  id: number;
  kol_id: number;
  year_month: string;
  monthly_sales: number;
  monthly_commission: number;
  active_shops_count: number;
  total_shops_count: number;
};

// KOL 월별 지표 관리 페이지
export default function KolMetricsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const [kols, setKols] = useState<KOL[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [yearMonth, setYearMonth] = useState<string>('');
  const [metrics, setMetrics] = useState<KolMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    monthly_sales: 0,
    monthly_commission: 0,
    active_shops_count: 0,
    total_shops_count: 0,
  });

  // 현재 년월 설정 (기본값)
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setYearMonth(`${year}-${month}`);
  }, []);

  // KOL 목록 조회
  const fetchKols = async () => {
    const { data } = await supabase
      .from('kols')
      .select('id, name, shop_name')
      .order('id');
    
    if (data) {
      setKols(data);
      if (data.length > 0 && !selectedKolId) {
        setSelectedKolId(data[0].id);
      }
    }
  };

  // KOL 월별 지표 조회
  const fetchMetrics = async () => {
    setIsLoading(true);
    let query = supabase
      .from('kol_dashboard_metrics')
      .select('*');
    
    if (selectedKolId) {
      query = query.eq('kol_id', selectedKolId);
    }
    
    if (yearMonth) {
      query = query.eq('year_month', yearMonth);
    }
    
    const { data } = await query.order('kol_id').order('year_month');
    
    if (data) {
      setMetrics(data);
    }
    
    setIsLoading(false);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchKols();
  }, []);

  // 선택된 KOL 또는 년월이 바뀔 때 지표 다시 조회
  useEffect(() => {
    if (selectedKolId || yearMonth) {
      fetchMetrics();
    }
  }, [selectedKolId, yearMonth]);

  // 지표 추가 함수
  const addMetric = async () => {
    if (!selectedKolId || !yearMonth) {
      alert('KOL과 년월을 선택해주세요.');
      return;
    }

    // 이미 존재하는지 확인
    const { data: existingData } = await supabase
      .from('kol_dashboard_metrics')
      .select('id')
      .eq('kol_id', selectedKolId)
      .eq('year_month', yearMonth)
      .maybeSingle();
    
    if (existingData) {
      alert('해당 KOL과 년월의 데이터가 이미 존재합니다.');
      return;
    }

    const { error } = await supabase
      .from('kol_dashboard_metrics')
      .insert([
        {
          kol_id: selectedKolId,
          year_month: yearMonth,
          monthly_sales: 0,
          monthly_commission: 0,
          active_shops_count: 0,
          total_shops_count: 0,
        },
      ]);

    if (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } else {
      fetchMetrics();
    }
  };

  // 지표 수정 시작
  const startEdit = (metric: KolMetric) => {
    setEditingId(metric.id);
    setEditForm({
      monthly_sales: metric.monthly_sales,
      monthly_commission: metric.monthly_commission,
      active_shops_count: metric.active_shops_count,
      total_shops_count: metric.total_shops_count,
    });
  };

  // 지표 수정 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      monthly_sales: 0,
      monthly_commission: 0,
      active_shops_count: 0,
      total_shops_count: 0,
    });
  };

  // 지표 수정 저장
  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('kol_dashboard_metrics')
      .update({
        monthly_sales: editForm.monthly_sales,
        monthly_commission: editForm.monthly_commission,
        active_shops_count: editForm.active_shops_count,
        total_shops_count: editForm.total_shops_count,
      })
      .eq('id', editingId);

    if (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } else {
      setEditingId(null);
      setEditForm({
        monthly_sales: 0,
        monthly_commission: 0,
        active_shops_count: 0,
        total_shops_count: 0,
      });
      fetchMetrics();
    }
  };

  // KOL 이름으로 검색 필터링
  const filteredKols = kols.filter(
    (kol) =>
      kol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kol.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // KOL 이름 찾기 함수
  const getKolName = (kolId: number) => {
    const kol = kols.find(k => k.id === kolId);
    return kol ? kol.name : `KOL #${kolId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">KOL 월별 지표 관리</h1>
        <button
          onClick={addMetric}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <BarChart3 size={16} className="mr-2" />
          지표 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KOL 선택 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">KOL 선택</h3>
          
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="KOL 이름 검색..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredKols.map((kol) => (
                <li key={kol.id}>
                  <button
                    onClick={() => setSelectedKolId(kol.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none ${
                      selectedKolId === kol.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium">{kol.name}</div>
                    <div className="text-sm text-gray-500">{kol.shop_name}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 년월 선택 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">년월 선택</h3>
          
          <div className="flex items-center">
            <Calendar size={20} className="text-gray-400 mr-2" />
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* 지표 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                KOL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                년월
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                월 매출 (원)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                월 수수료 (원)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                활성 전문점 수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                전체 전문점 수
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : metrics.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getKolName(metric.kol_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.year_month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === metric.id ? (
                      <input
                        type="number"
                        value={editForm.monthly_sales}
                        onChange={(e) => setEditForm({ ...editForm, monthly_sales: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    ) : (
                      new Intl.NumberFormat('ko-KR').format(metric.monthly_sales)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === metric.id ? (
                      <input
                        type="number"
                        value={editForm.monthly_commission}
                        onChange={(e) => setEditForm({ ...editForm, monthly_commission: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    ) : (
                      new Intl.NumberFormat('ko-KR').format(metric.monthly_commission)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === metric.id ? (
                      <input
                        type="number"
                        value={editForm.active_shops_count}
                        onChange={(e) => setEditForm({ ...editForm, active_shops_count: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    ) : (
                      metric.active_shops_count
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === metric.id ? (
                      <input
                        type="number"
                        value={editForm.total_shops_count}
                        onChange={(e) => setEditForm({ ...editForm, total_shops_count: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    ) : (
                      metric.total_shops_count
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === metric.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-900">
                          <Save size={16} />
                        </button>
                        <button onClick={cancelEdit} className="text-red-600 hover:text-red-900">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(metric)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 