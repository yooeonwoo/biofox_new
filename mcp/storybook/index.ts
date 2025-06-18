import { createMcp } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

interface StoryIndex {
  v: number;
  entries: Record<string, StoryIndexEntry>;
}

interface StoryIndexEntry {
  type?: 'story' | 'docs';
  id: string;
  title: string;
  name: string;
  importPath: string;
}

const mcp = createMcp({
  // Since we are interacting with a local dev server,
  // we can just use stdio for transport
  transport: 'stdio',
});

const getStoriesSchema = z.object({
  configDir: z.string().describe('Absolute path to directory containing the .storybook config folder'),
});

mcp.createTool(
  'get_stories',
  getStoriesSchema,
  async ({ configDir }: z.infer<typeof getStoriesSchema>) => {
    const storyIndexJsonPath = path.join(configDir, 'storybook-story-index.json');
    if (!fs.existsSync(storyIndexJsonPath)) {
      throw new Error(`Could not find story index at ${storyIndexJsonPath}`);
    }

    const storyIndex: StoryIndex = JSON.parse(fs.readFileSync(storyIndexJsonPath, 'utf-8'));

    const stories = Object.values(storyIndex.entries)
      .filter((entry) => entry.type === 'story')
      .map((entry) => `${entry.title}/${entry.name}`);

    return stories;
  },
);

async function main() {
  await mcp.serve(async () => {
    // The server is now running
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 