import { parseArgs } from "node:util";
import { createModels } from "@earendil-works/pi-ai";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { createPiRunner } from "./pi/runner.ts";
import { buildWorkflow } from "./workflow/graph.ts";

const usage = "用法：npm start -- [--kb] \"你的问题\"";

try {
  const { values, positionals } = parseArgs({
    options: { kb: { type: "boolean" }, help: { type: "boolean", short: "h" } },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(usage);
  } else {
    const question = positionals.join(" ").trim();
    if (!question) throw new Error(usage);
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error("请设置 OPENAI_API_KEY，或运行 npm run demo。");
    }

    const models = createModels();
    models.setProvider(openaiProvider());
    const modelId = process.env.PI_MODEL?.trim() || "gpt-5-mini";
    const model = models.getModel("openai", modelId);
    if (!model) throw new Error(`Pi 没有注册 OpenAI 模型 ${modelId}。`);

    const graph = buildWorkflow(createPiRunner(model, models.streamSimple.bind(models)));
    const result = await graph.invoke({ question, mode: values.kb ? "knowledge" : "chat" });
    console.log(result.answer);
    if (result.toolsUsed.length) {
      console.error(`调用工具：${result.toolsUsed.join(", ")}`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
