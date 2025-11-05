import OpenAI from "openai";
export class OpenAIRepository {
  private openai: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI();
    } else {
      console.warn(
        "⚠️  No OPENAI_API_KEY found. OpenAI repository will return mock responses."
      );
      this.openai = null as any;
    }
  }

  async generate<T = string>(
    prompt: string | { system: string; user: string },
    model: string = "gpt-4o-mini",
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      schema?: any;
    }
  ): Promise<T> {
    // Prepare messages
    const messages =
      typeof prompt === "string"
        ? [{ role: "user" as const, content: prompt }]
        : [
            { role: "system" as const, content: prompt.system },
            { role: "user" as const, content: prompt.user },
          ];

    // Prepare completion options
    const completionOptions: any = {
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
    };

    // Add structured response format if schema is provided
    if (options?.schema) {
      completionOptions.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response_schema",
          strict: true,
          schema: options.schema,
        },
      };
    }

    const completion = await this.openai.chat.completions.create(
      completionOptions
    );

    if (!completion.choices[0]?.message?.content) {
      throw new Error("No completion received from OpenAI");
    }

    const content = completion.choices[0].message.content;

    // Return parsed JSON if schema was provided, otherwise return as string
    return options?.schema ? (JSON.parse(content) as T) : (content as T);
  }
}
