Introducing @clerk/agent-toolkit
Category
Product
Add Clerk to your agentic workflows with our new agent toolkit.

We're excited to introduce our @clerk/agent-toolkit package, a new experimental package designed to integrate Clerk into your AI agent workflows. This toolkit empowers developers to build powerful agentic systems with support for managing users, user data, organizations, and more. It's designed to work seamlessly with frameworks like Vercel's AI SDK and LangChain.

Adding Clerk to your workflow is as simple as:


import { createClerkToolkit } from '@clerk/agent-toolkit/ai-sdk'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // 1. Instantiate the toolkit
  const toolkit = await createClerkToolkit()

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: systemPrompt,
    // 2. Pass the tools to the model
    tools: toolkit.users(),
  })

  return result.toDataStreamResponse()
}
Running a local MCP server is just as easy:


npx -y @clerk/agent-toolkit -p local-mcp --secret-key sk_123
Key Features
Vercel AI SDK & LangChain support: First-class support for Vercel's AI SDK and LangChain, with framework-specific helpers for each.
Local MCP server support: The @clerk/agent-toolkit package comes with a standalone local MCP server so you can easily integrate Clerk with any MCP client such as Claude Desktop.
Session context injection: Easily inject session claims (userId, sessionId, orgId) into system prompts for contextual awareness.
Scoped helpers: Support for scoping actions to specific users or organizations to limit resource access.
Up Next
Openai SDK support (coming soon): We're actively working on adding support for the openai SDK. Stay tuned for updates!
Try it today
Install the package using your preferred package manager and start building today:


npm install @clerk/agent-toolkit
Check out our example repository and the package's documentation to learn more.

We'd love to hear from you as you build. Your feedback will help shape the future of Clerk and AI. Reach out to 
ai@clerk.dev
.