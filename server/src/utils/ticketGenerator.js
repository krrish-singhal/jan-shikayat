import { Counter } from '../models/Counter.js';

/**
 * Generates concurrency-safe, sequential complaint ticket numbers.
 * Format: CMP-YYYY-000001
 */
export async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const counterKey = `complaint_ticket_${year}`;
  const seq = await Counter.getNextSequence(counterKey);
  const paddedSeq = String(seq).padStart(6, '0');
  return `CMP-${year}-${paddedSeq}`;
}
