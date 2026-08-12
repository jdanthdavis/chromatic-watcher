import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChromaticBuildList } from './ChromaticBuildList';
import type { ChromaticBuild } from '../types';

const meta = {
  title: 'Dashboard/ChromaticBuildList',
  component: ChromaticBuildList,
} satisfies Meta<typeof ChromaticBuildList>;

export default meta;
type Story = StoryObj<typeof meta>;

const builds: ChromaticBuild[] = [
  {
    receivedAt: '2026-08-12T01:29:00.000Z',
    number: 12,
    branch: 'main',
    commit: 'f6f223e',
    status: 'ACCEPTED',
    result: 'SUCCESS',
    changeCount: 0,
    componentCount: 8,
    specCount: 23,
    storybookUrl: 'https://6a7bb930-abc.chromatic.com',
    webUrl: 'https://www.chromatic.com/build?appId=6a7bb9300c0960c8b410b57a&number=12',
  },
  {
    receivedAt: '2026-08-11T21:05:00.000Z',
    number: 11,
    branch: 'fix/next-run-cron-schedule',
    commit: '4ed5861',
    status: 'DENIED',
    result: 'FAILURE',
    changeCount: 2,
    componentCount: 8,
    specCount: 23,
    storybookUrl: 'https://6a7bb930-def.chromatic.com',
    webUrl: 'https://www.chromatic.com/build?appId=6a7bb9300c0960c8b410b57a&number=11',
  },
];

export const RecentBuilds: Story = {
  args: { builds },
};

export const Empty: Story = {
  args: { builds: [] },
};
