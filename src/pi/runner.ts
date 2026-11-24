import { Agent, type AgentTool, type StreamFn } from "@earendil-works/pi-agent-core";
import type { Api, Model } from "@earendil-works/pi-ai";

interface PiTask {
  prompt: string;
  systemPrompt: string;
  tools: AgentTool[];
}

interface PiResult {
  answer: string;
  toolsUsed: string[];
}

export type PiRunner = (task: PiTask) => Promise<PiResult>;

export function createPiRunner(model: Model<Api>, streamFn: StreamFn): PiRunner {
  return async (task) => {
    const agent = new Agent({
      initialState: {
        model,
        systemPrompt: task.systemPrompt,
        tools: task.tools,
      },
      streamFn,
    });

    await agent.prompt(task.prompt);

    const lastReply = agent.state.messages.findLast((message) => message.role === "assistant");
    if (agent.state.errorMessage || lastReply?.stopReason === "error" || lastReply?.stopReason === "aborted") {
      throw new Error(agent.state.errorMessage || lastReply?.errorMessage || "Pi 执行失败。");
    }

    const answer = lastReply?.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!answer) {
      throw new Error("Pi 没有返回文本答案。");
    }

    const toolsUsed = agent.state.messages.flatMap((message) =>
      message.role === "toolResult" && !message.isError ? [message.toolName] : [],
    );
    return { answer, toolsUsed };
  };
}
