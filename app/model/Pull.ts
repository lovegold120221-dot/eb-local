export interface PullResponse {
  status: string;
  digest: string | null;
  total: number | null;
  completed: number | null;
}

export type PullSessionType = {
  promise: Promise<void>;
  abort: () => void;
};
