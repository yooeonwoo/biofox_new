import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { fetch } from 'undici';

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

// Create an MCP server
const server = new McpServer({
  name: "react-native-storybook",
  version: "1.0.0"
});

// Add get_stories tool
server.tool("get_stories",
  {
    storybookUrl: z.string().url().default('http://localhost:6006').describe('URL of the running Storybook server'),
  },
  async ({ storybookUrl }) => {
    try {
      const storiesJsonUrl = new URL('stories.json', storybookUrl).toString();
      const response = await fetch(storiesJsonUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch stories.json: ${response.statusText}`);
      }

      const storyIndex: StoryIndex = await response.json() as StoryIndex;
      const stories = Object.values(storyIndex.entries)
        .filter((entry) => entry.type === 'story')
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          name: entry.name,
        }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(stories, null, 2)
        }]
      };
    } catch (error: any) {
      console.error("Failed to get stories from Storybook server:", error);
      // fallback to file system
      try {
        const configDir = '.storybook'; // Assuming it's in the root
        const storyIndexJsonPath = path.join(configDir, 'storybook-story-index.json');
        if (!fs.existsSync(storyIndexJsonPath)) {
          throw new Error(`Could not find story index at ${storyIndexJsonPath}`);
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify(readStories(storyIndexJsonPath), null, 2)
          }]
        };
      } catch (fsError: any) {
        throw new Error(`Failed to fetch from URL and file system. URL Error: ${error.message}. FS Error: ${fsError.message}`);
      }
    }
  }
);

function readStories(filePath: string) {
  const storyIndex: StoryIndex = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const stories = Object.values(storyIndex.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => `${entry.title}/${entry.name}`);

  return stories;
}

async function main() {
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('React Native Storybook MCP server is running and adapted for web.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 