"use client";

import { AlertCircle, Mail } from 'lucide-react';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
  email?: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number;
  region: string;
  status: string;
  email?: string;
};

interface KolModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKol: KOL | null;
  kolForm: {
    name: string;
    shop_name: string;
    region: string;
    email: string;
  };
  setKolForm: (form: { name: string; shop_name: string; region: string; email: string }) => void;
  onSubmit: () => void;
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShop: Shop | null;
  shopForm: {
    shop_name: string;
    owner_name: string;
    kol_id: string;
    region: string;
    email: string;
  };
  setShopForm: (form: { shop_name: string; owner_name: string; kol_id: string; region: string; email: string }) => void;
  onSubmit: () => void;
  kols: KOL[];
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  deleteType: 'kol' | 'shop' | null;
  confirmDelete: () => void;
  relatedShopsCount: number;
}

export function KolModal({
  isOpen,
  onClose,
  selectedKol,
  kolForm,
  setKolForm,
  onSubmit
}: KolModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedKol ? 'KOL 정보 수정' : 'KOL 추가'}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="kol-name" className="block text-sm font-medium text-gray-700">
              이름 *
            </label>
            <input
              type="text"
              id="kol-name"
              value={kolForm.name}
              onChange={(e) => setKolForm({ ...kolForm, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="kol-shop" className="block text-sm font-medium text-gray-700">
              샵명 *
            </label>
            <input
              type="text"
              id="kol-shop"
              value={kolForm.shop_name}
              onChange={(e) => setKolForm({ ...kolForm, shop_name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="kol-region" className="block text-sm font-medium text-gray-700">
              지역
            </label>
            <input
              type="text"
              id="kol-region"
              value={kolForm.region}
              onChange={(e) => setKolForm({ ...kolForm, region: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="kol-email" className="block text-sm font-medium text-gray-700 flex items-center">
              <Mail size={16} className="mr-1" /> 이메일 {selectedKol ? '(읽기 전용)' : '*'}
            </label>
            <input
              type="email"
              id="kol-email"
              value={kolForm.email}
              onChange={(e) => setKolForm({ ...kolForm, email: e.target.value })}
              readOnly={selectedKol !== null}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${selectedKol ? 'bg-gray-50 text-gray-500' : ''}`}
              placeholder={selectedKol ? undefined : '연결할 사용자 이메일 주소'}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {selectedKol ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShopModal({
  isOpen,
  onClose,
  selectedShop,
  shopForm,
  setShopForm,
  onSubmit,
  kols
}: ShopModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedShop ? '전문점 정보 수정' : '전문점 추가'}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="shop-name" className="block text-sm font-medium text-gray-700">
              전문점명 *
            </label>
            <input
              type="text"
              id="shop-name"
              value={shopForm.shop_name}
              onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="shop-owner" className="block text-sm font-medium text-gray-700">
              담당자 *
            </label>
            <input
              type="text"
              id="shop-owner"
              value={shopForm.owner_name}
              onChange={(e) => setShopForm({ ...shopForm, owner_name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="shop-kol" className="block text-sm font-medium text-gray-700">
              KOL ID *
            </label>
            <select
              id="shop-kol"
              value={shopForm.kol_id}
              onChange={(e) => setShopForm({ ...shopForm, kol_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">KOL 선택</option>
              {kols.map((kol) => (
                <option key={kol.id} value={kol.id}>
                  {kol.id} - {kol.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="shop-region" className="block text-sm font-medium text-gray-700">
              지역
            </label>
            <input
              type="text"
              id="shop-region"
              value={shopForm.region}
              onChange={(e) => setShopForm({ ...shopForm, region: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="shop-email" className="block text-sm font-medium text-gray-700 flex items-center">
              <Mail size={16} className="mr-1" /> 이메일 (선택)
            </label>
            <input
              type="email"
              id="shop-email"
              value={shopForm.email}
              onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="전문점 이메일 주소 (선택사항)"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {selectedShop ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteModal({
  isOpen,
  onClose,
  deleteType,
  confirmDelete,
  relatedShopsCount
}: DeleteModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle size={24} className="mr-2" />
          <h3 className="text-lg font-medium">삭제 확인</h3>
        </div>
        <p className="mb-4 text-gray-700">
          {deleteType === 'kol' 
            ? relatedShopsCount > 0 
              ? `이 KOL을 삭제하시겠습니까? ${relatedShopsCount}개의 전문점도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
              : '이 KOL을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
            : '이 전문점을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            onClick={confirmDelete}
            className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
} 