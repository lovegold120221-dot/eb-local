export interface OllamaPsResponse {
  models: Array<{
    name: string;
    model: string;
    size: number;
    digest: string;
    details: import('./Tag').ModelDetails;
    expires_at: string;
    size_vram: number;
  }>;
}
