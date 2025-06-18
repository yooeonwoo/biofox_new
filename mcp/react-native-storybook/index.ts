import { createMcp } from '@modelcontextprotocol/sdk/server';
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
  transport: 'stdio',
});

const getStoriesSchema = z.object({
  configDir: z.string().describe('Absolute path to the directory containing your .storybook config folder'),
});

mcp.createTool(
  'get_stories',
  getStoriesSchema,
  async ({ configDir }: z.infer<typeof getStoriesSchema>) => {
    // For React Native, the story index is often in a different location
    const storyIndexJsonPath = path.join(configDir, 'ondevice-stories.json');

    if (!fs.existsSync(storyIndexJsonPath)) {
      // Fallback for web-like structures
      const fallbackPath = path.join(configDir, 'storybook-story-index.json');
      if (!fs.existsSync(fallbackPath)) {
        throw new Error(`Could not find story index at ${storyIndexJsonPath} or ${fallbackPath}`);
      }
      return readStories(fallbackPath);
    }
    
    return readStories(storyIndexJsonPath);
  },
);

function readStories(filePath: string) {
    const storyIndex: StoryIndex = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const stories = Object.values(storyIndex.entries)
      .filter((entry) => entry.type === 'story')
      .map((entry) => `${entry.title}/${entry.name}`);

    return stories;
}


async function main() {
  await mcp.serve(async () => {
    // The server is now running
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 