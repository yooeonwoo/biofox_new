'use client';

import React, { useMemo } from 'react';
import { CalendarIcon, CheckCircleIcon } from 'lucide-react';

// Task 데이터 타입 정의
interface TaskData {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  completed: boolean;
  dueDate: string | null;
  type: string;
}

// Props 타입 정의
interface UpcomingTasksProps {
  tasks: TaskData[];
}

export default function UpcomingTasks({ tasks = [] }: UpcomingTasksProps) {
  // 최신 5개 태스크 필터링
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tasks]);

  // 태스크 타입에 따른 배경색 반환
  const getTaskTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'seminar':
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-6">
        <h2 className="text-lg font-medium">예정된 일정</h2>
        <div className="mt-4 space-y-4">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div key={task.id} className="flex items-start rounded-md border p-3">
                <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{task.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs ${getTaskTypeColor(task.type)}`}>
                      {task.type === 'seminar' ? '세미나' : 
                       task.type === 'training' ? '교육' : 
                       task.type === 'order' ? '주문' : 
                       task.type === 'meeting' ? '미팅' : '기타'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{task.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {task.completed && (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircleIcon className="mr-1 h-3 w-3" />
                        <span>완료됨</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border p-4 text-center text-gray-500">
              예정된 일정이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 