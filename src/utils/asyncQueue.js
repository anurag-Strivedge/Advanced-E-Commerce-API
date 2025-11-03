/**
 * Simple in-memory async queue for background jobs
 * In production, this should be replaced with a proper queue system like Bull, BullMQ, or RabbitMQ
 */

class AsyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add a job to the queue
   * @param {Function} job - Async function to execute
   * @param {Object} data - Data to pass to the job
   */
  add(job, data) {
    this.queue.push({ job, data, addedAt: new Date() });
    console.log(`Job added to queue. Queue size: ${this.queue.length}`);

    // Start processing if not already processing
    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Process jobs in the queue
   */
  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { job, data } = this.queue.shift();

    try {
      await job(data);
      console.log('Job completed successfully');
    } catch (error) {
      console.error('Job failed:', error.message);
      // In production, implement retry logic here
    }

    // Process next job
    setImmediate(() => this.process());
  }
}

// Create singleton instance
const emailQueue = new AsyncQueue();

/**
 * Simulated email sending function
 * In production, integrate with actual email service (SendGrid, AWS SES, etc.)
 * @param {Object} data - Email data
 */
const sendConfirmationEmail = async (data) => {
  const { orderId, userEmail, totalAmount } = data;

  // Simulate async email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('=== EMAIL SENT ===');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Order Confirmation - Order #${orderId}`);
  console.log(`Order Total: $${totalAmount.toFixed(2)}`);
  console.log('==================');
};

/**
 * Queue a confirmation email
 * @param {Object} emailData - Email data
 */
const queueConfirmationEmail = (emailData) => {
  emailQueue.add(sendConfirmationEmail, emailData);
};

module.exports = {
  queueConfirmationEmail,
  AsyncQueue,
};
