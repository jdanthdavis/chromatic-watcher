import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChromaticBuildRow } from './ChromaticBuildRow';
import type { ChromaticBuild } from '../types';

const meta = {
  title: 'Dashboard/ChromaticBuildRow',
  component: ChromaticBuildRow,
} satisfies Meta<typeof ChromaticBuildRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseBuild: ChromaticBuild = {
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
};

export const PassedNoChanges: Story = {
  args: { build: baseBuild },
};

export const PassedWithChanges: Story = {
  args: { build: { ...baseBuild, changeCount: 3, status: 'PENDING' } },
};

export const Failed: Story = {
  args: { build: { ...baseBuild, status: 'BROKEN', result: 'FAILURE', changeCount: 0 } },
};

export const Pending: Story = {
  args: { build: { ...baseBuild, status: 'IN_PROGRESS', result: null } },
};
