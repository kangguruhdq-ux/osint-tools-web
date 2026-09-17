import { NextRequest } from "next/server";
import { jobQueue } from "@/lib/queue/job-runner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Missing jobId query parameter", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial job state
      const initialJob = jobQueue.getJob(jobId);
      if (initialJob) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialJob)}\n\n`)
        );
      }

      const onProgress = (jobData: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(jobData)}\n\n`)
          );
          if (jobData.status === "COMPLETED" || jobData.status === "FAILED" || jobData.status === "CANCELLED") {
            jobQueue.off(`progress:${jobId}`, onProgress);
            controller.close();
          }
        } catch {
          // Stream closed by client
          jobQueue.off(`progress:${jobId}`, onProgress);
        }
      };

      jobQueue.on(`progress:${jobId}`, onProgress);

      req.signal.addEventListener("abort", () => {
        jobQueue.off(`progress:${jobId}`, onProgress);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
