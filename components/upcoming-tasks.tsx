'use client';

import React, { useMemo } from 'react';
import { CalendarIcon, CheckCircleIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'order':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskTypeName = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'seminar':
        return '세미나';
      case 'training':
        return '교육';
      case 'order':
        return '주문';
      case 'meeting':
        return '미팅';
      default:
        return '기타';
    }
  };

  return (
    <div className="w-full space-y-4">
      {recentTasks.length > 0 ? (
        recentTasks.map((task) => (
          <Card key={task.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge variant="outline" className={`${getTaskTypeColor(task.type)}`}>
                      {getTaskTypeName(task.type)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
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
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            예정된 일정이 없습니다
          </CardContent>
        </Card>
      )}
    </div>
  );
}