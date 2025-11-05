// LLMService.ts
import { OpenAIRepository } from "../repositories/OpenAIRepository";

export class LLMService {
  repo: OpenAIRepository;

  constructor(repo: OpenAIRepository) {
    this.repo = repo;
  }

  async generate(
    prompt: string | { system: string; user: string },
    options?: { schema?: any }
  ): Promise<any> {
    return await this.repo.generate(prompt, undefined, options);
  }
}
