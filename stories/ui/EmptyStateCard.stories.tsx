import type { Meta, StoryObj } from '@storybook/nextjs';
import { EmptyStateCard } from '@/components/clinical/EmptyStateCard';
import { EMPTY_STATE, BUTTON_TEXTS } from '@/constants/ui';

const meta: Meta<typeof EmptyStateCard> = {
  title: 'Clinical/EmptyStateCard',
  component: EmptyStateCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onButtonClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PersonalCases: Story = {
  args: {
    title: EMPTY_STATE.noPersonalCases.title,
    description: EMPTY_STATE.noPersonalCases.description,
    buttonText: BUTTON_TEXTS.addPersonalCase,
    onButtonClick: () => console.log('Add personal case clicked'),
  },
};

export const CustomerCases: Story = {
  args: {
    title: EMPTY_STATE.noCustomerCases.title,
    description: EMPTY_STATE.noCustomerCases.description,
    buttonText: BUTTON_TEXTS.addCustomerCase,
    onButtonClick: () => console.log('Add customer case clicked'),
  },
};

export const GenericCases: Story = {
  args: {
    title: EMPTY_STATE.noCases.title,
    description: EMPTY_STATE.noCases.description,
    buttonText: BUTTON_TEXTS.addCase,
    onButtonClick: () => console.log('Add case clicked'),
  },
};

export const CustomContent: Story = {
  args: {
    title: '사용자 정의 제목',
    description: '사용자 정의 설명 메시지입니다.',
    buttonText: '사용자 정의 버튼',
    onButtonClick: () => console.log('Custom button clicked'),
  },
}; 