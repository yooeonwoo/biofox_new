'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ICONS } from '@/constants/ui';

interface EmptyStateCardProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  icon?: React.ReactNode;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  icon
}) => {
  const DefaultIcon = ICONS.users;
  const defaultIcon = <DefaultIcon className="w-6 h-6 text-blue-600" />;

  return (
    <Card className="w-full">
      <CardContent className="py-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          {icon || defaultIcon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 mb-4">
          {description}
        </p>
        <Button 
          onClick={onButtonClick}
          className="inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}; 