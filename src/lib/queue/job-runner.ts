import EventEmitter from "events";

export interface BackgroundJob {
  id: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number; // 0 - 100
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class JobQueueService extends EventEmitter {
  private jobs: Map<string, BackgroundJob> = new Map();

  createJob(type: string, data: any): BackgroundJob {
    const id = "job-" + Math.random().toString(36).substring(2, 9);
    const job: BackgroundJob = {
      id,
      type,
      status: "PENDING",
      progress: 0,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    this.emit("jobCreated", job);
    return job;
  }

  getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  updateProgress(id: string, progress: number, currentMessage?: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.progress = Math.min(100, Math.max(0, progress));
    job.status = progress >= 100 ? "COMPLETED" : "PROCESSING";
    job.updatedAt = new Date();
    this.emit(`progress:${id}`, { ...job, currentMessage });
  }

  completeJob(id: string, result: any) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "COMPLETED";
    job.progress = 100;
    job.result = result;
    job.updatedAt = new Date();
    this.emit(`progress:${id}`, job);
    this.emit("jobCompleted", job);
  }

  failJob(id: string, errorMessage: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "FAILED";
    job.error = errorMessage;
    job.updatedAt = new Date();
    this.emit(`progress:${id}`, job);
  }

  cancelJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "CANCELLED";
    job.updatedAt = new Date();
    this.emit(`progress:${id}`, job);
  }
}

export const jobQueue = new JobQueueService();
