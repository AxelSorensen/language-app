export interface Word {
  id: string;
  text: string;
  correction?: string | null;
  translation?: string | null;
  status: "empty" | "pending" | "checked" | "error" | "idle";
  sentenceError?: { correction: string; explanation: string } | null;
  newlyAdded?: boolean;
  firstUsed?: string;
}
