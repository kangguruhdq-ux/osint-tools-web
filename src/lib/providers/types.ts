export type ProviderHealthStatus = "ACTIVE" | "CONFIGURATION_REQUIRED" | "ERROR" | "DISABLED";

export interface ProviderHealth {
  status: ProviderHealthStatus;
  latencyMs?: number;
  message?: string;
  requiredEnvOrKey?: string;
  configUrl?: string;
}

export interface UsageEstimate {
  estimatedCostUsd: number;
  quotaUnits: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  providerName: string;
  requiresConfiguration?: boolean;
  requiredProviderKey?: string;
  timestamp: string;
  latencyMs?: number;
  sourceAttribution?: string;
}

export interface ToolProvider<TInput = any, TOutput = any> {
  id: string;
  name: string;
  category: "downloader" | "osint" | "ai" | "files" | "security";
  baseUrl?: string;
  checkHealth(): Promise<ProviderHealth>;
  execute(input: TInput): Promise<ToolResult<TOutput>>;
  estimateCost?(input: TInput): Promise<UsageEstimate>;
}
