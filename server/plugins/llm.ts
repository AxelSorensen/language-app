import { OpenAIRepository } from "../../app/repositories/OpenAIRepository";
import { LLMService } from "../../app/services/LLMService";

export default defineNitroPlugin((nitroApp) => {
  const repo = new OpenAIRepository(process.env.OPENAI_API_KEY || "");
  const llm_service = new LLMService(repo);

  nitroApp.hooks.hook("request", (event: any) => {
    event.context.llm_service = llm_service;
  });
});
