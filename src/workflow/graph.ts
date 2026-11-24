import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import type { PiRunner } from "../pi/runner.ts";
import { searchKnowledge } from "../tools/knowledge.ts";

const WorkflowState = new StateSchema({
  question: z.string().trim().min(1),
  mode: z.enum(["chat", "knowledge"]),
  answer: z.string().default(""),
  toolsUsed: z.array(z.string()).default(() => []),
});

export function buildWorkflow(runPi: PiRunner) {
  return new StateGraph(WorkflowState)
    .addNode("chat", ({ question }) =>
      runPi({
        prompt: question,
        systemPrompt: "你是通用助手。使用用户的语言简洁回答。",
        tools: [],
      }),
    )
    .addNode("knowledge", ({ question }) =>
      runPi({
        prompt: question,
        systemPrompt:
          "你是公司制度助手。先调用 search_knowledge 获取资料，再仅根据工具结果回答。" +
          "引用条目编号。查不到时明确说明。",
        tools: [searchKnowledge],
      }),
    )
    .addConditionalEdges(START, ({ mode }) => mode, ["chat", "knowledge"])
    .addEdge("chat", END)
    .addEdge("knowledge", END)
    .compile();
}
