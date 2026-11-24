import type { AgentTool } from "@earendil-works/pi-agent-core";
import { z } from "zod";

const articles = [
  {
    id: "KB-001",
    keywords: ["报销", "reimbursement"],
    text: "差旅结束后 10 个工作日内提交报销，附发票和行程单。",
  },
  {
    id: "KB-002",
    keywords: ["年假", "annual leave"],
    text: "年假申请需提前 3 个工作日提交，由直属主管审批。",
  },
];

const searchInput = z.object({ query: z.string().trim().min(1) }).strict();

export const searchKnowledge: AgentTool = {
  name: "search_knowledge",
  label: "搜索知识库",
  description: "按简短关键词搜索示例公司制度，例如「报销」「年假」。结果附条目编号。",
  parameters: z.toJSONSchema(searchInput),
  async execute(_toolCallId, input) {
    const { query } = searchInput.parse(input);
    const normalizedQuery = query.toLowerCase();
    const hits = articles.filter(({ keywords }) =>
      keywords.some((keyword) => normalizedQuery.includes(keyword)),
    );

    return {
      content: [
        {
          type: "text",
          text: hits.map(({ id, text }) => `[${id}] ${text}`).join("\n") || "未找到匹配条目。",
        },
      ],
      details: { articleIds: hits.map(({ id }) => id) },
    };
  },
};
