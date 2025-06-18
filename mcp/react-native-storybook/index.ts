import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

// Create an MCP server
const server = new McpServer({
  name: "react-native-storybook",
  version: "1.0.0"
});

// Add get_stories tool
server.tool("get_stories",
  { configDir: z.string().describe('Absolute path to the directory containing your .storybook config folder') },
  async ({ configDir }) => {
    const storyIndexJsonPath = path.join(configDir, 'ondevice-stories.json');

    if (!fs.existsSync(storyIndexJsonPath)) {
      const fallbackPath = path.join(configDir, 'storybook-story-index.json');
      if (!fs.existsSync(fallbackPath)) {
        throw new Error(`Could not find story index at ${storyIndexJsonPath} or ${fallbackPath}`);
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify(readStories(fallbackPath), null, 2)
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(readStories(storyIndexJsonPath), null, 2)
      }]
    };
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
  console.log('React Native Storybook MCP server is running');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 