'use client';

import React from 'react';

export default function StoreRankingTable() {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-medium">전문점 순위</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전문점명</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매출</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">증감률</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="text-sm">
              <td className="px-6 py-4 whitespace-nowrap font-medium">1</td>
              <td className="px-6 py-4 whitespace-nowrap">아바에 성동</td>
              <td className="px-6 py-4 whitespace-nowrap">1,204만</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600">↑ 21%</td>
            </tr>
            <tr className="text-sm">
              <td className="px-6 py-4 whitespace-nowrap font-medium">2</td>
              <td className="px-6 py-4 whitespace-nowrap">아바에 강남</td>
              <td className="px-6 py-4 whitespace-nowrap">980만</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600">↑ 12%</td>
            </tr>
            <tr className="text-sm">
              <td className="px-6 py-4 whitespace-nowrap font-medium">3</td>
              <td className="px-6 py-4 whitespace-nowrap">아바에 송파</td>
              <td className="px-6 py-4 whitespace-nowrap">892만</td>
              <td className="px-6 py-4 whitespace-nowrap text-red-600">↓ 5%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 