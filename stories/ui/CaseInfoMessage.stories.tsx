import type { Meta, StoryObj } from '@storybook/nextjs';
import { CaseInfoMessage } from '@/components/clinical/CaseInfoMessage';

const meta: Meta<typeof CaseInfoMessage> = {
  title: 'Clinical/CaseInfoMessage',
  component: CaseInfoMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['info', 'warning', 'success', 'error'],
    },
    showIcon: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    message: '정보 메시지입니다',
    type: 'info',
    showIcon: false,
  },
};

export const InfoWithIcon: Story = {
  args: {
    message: '정보 메시지입니다',
    type: 'info',
    showIcon: true,
  },
};

export const Warning: Story = {
  args: {
    message: '경고 메시지입니다',
    type: 'warning',
    showIcon: true,
  },
};

export const Success: Story = {
  args: {
    message: '성공 메시지입니다',
    type: 'success',
    showIcon: true,
  },
};

export const Error: Story = {
  args: {
    message: '에러 메시지입니다',
    type: 'error',
    showIcon: true,
  },
};

export const PersonalCaseLimit: Story = {
  args: {
    message: '본인 케이스는 1개만 생성할 수 있습니다',
    type: 'info',
    showIcon: false,
  },
}; 