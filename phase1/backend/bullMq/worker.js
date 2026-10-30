import { Worker } from "bullmq";
import Redis from "ioredis";
import sendEmail from "../config/sendEmail.js";

const connection = new Redis("redis://localhost:6379", {
    maxRetriesPerRequest: null,
});

const worker = new Worker("emailQueue", async (job) => {

    console.log("Processing job:", job.id);

    await sendEmail(
        job.data.to,
        job.data.subject,
        job.data.message
    );

}, { connection });

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
    console.log(`Job ${job?.id} failed: ${error.message}`);
});