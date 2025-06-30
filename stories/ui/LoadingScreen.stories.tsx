import type { Meta, StoryObj } from '@storybook/nextjs';
import { LoadingScreen } from '@/components/clinical/LoadingScreen';
import { LOADING_MESSAGES } from '@/constants/ui';
import { Camera } from 'lucide-react';

const meta: Meta<typeof LoadingScreen> = {
  title: 'Clinical/LoadingScreen',
  component: LoadingScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {
  args: {
    title: LOADING_MESSAGES.personal.title,
    description: LOADING_MESSAGES.personal.description,
  },
};

export const Customer: Story = {
  args: {
    title: LOADING_MESSAGES.customer.title,
    description: LOADING_MESSAGES.customer.description,
  },
};

export const General: Story = {
  args: {
    title: LOADING_MESSAGES.general.title,
    description: LOADING_MESSAGES.general.description,
  },
};

export const WithCustomIcon: Story = {
  args: {
    title: '사진을 처리하는 중입니다',
    description: '잠시만 기다려 주세요...',
    icon: <Camera className="w-8 h-8 text-blue-600" />,
  },
}; 