import { deepStrictEqual, match } from "node:assert/strict";
import {
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxToolCall,
} from "@earendil-works/pi-ai";
import { createPiRunner } from "./pi/runner.ts";
import { buildWorkflow } from "./workflow/graph.ts";

const faux = fauxProvider();
faux.setResponses([
  fauxAssistantMessage([fauxText("你好！")]),
  fauxAssistantMessage(
    [fauxToolCall("search_knowledge", { query: "报销" })],
    { stopReason: "toolUse" },
  ),
  fauxAssistantMessage([fauxText("差旅结束后 10 个工作日内提交报销。[KB-001]")]),
]);

const models = createModels();
models.setProvider(faux.provider);
const graph = buildWorkflow(createPiRunner(faux.getModel(), models.streamSimple.bind(models)));

const chat = await graph.invoke({ question: "你好", mode: "chat" });
deepStrictEqual(chat.toolsUsed, []);
match(chat.answer, /你好/);

const knowledge = await graph.invoke({ question: "差旅报销期限是多久？", mode: "knowledge" });
deepStrictEqual(knowledge.toolsUsed, ["search_knowledge"]);
match(knowledge.answer, /KB-001/);
deepStrictEqual(faux.state.callCount, 3);

console.log(JSON.stringify({ chat, knowledge }, null, 2));
