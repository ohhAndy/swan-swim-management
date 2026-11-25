import { Injectable } from "@nestjs/common";

// Resend allows 10 requests/sec per team; leave headroom for overlapping sends.
const DEFAULT_REQUESTS_PER_SECOND = 8;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Per process: with several API instances, lower RESEND_MAX_REQUESTS_PER_SECOND.
@Injectable()
export class ResendRateLimiter {
  private readonly intervalMs: number;
  private nextSlotAt = 0;

  constructor() {
    const configured = Number(process.env.RESEND_MAX_REQUESTS_PER_SECOND);
    const perSecond =
      Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_REQUESTS_PER_SECOND;
    this.intervalMs = Math.ceil(1000 / perSecond);
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const slot = Math.max(now, this.nextSlotAt);
    this.nextSlotAt = slot + this.intervalMs;
    if (slot > now) {
      await sleep(slot - now);
    }
  }

  pauseFor(ms: number): void {
    this.nextSlotAt = Math.max(this.nextSlotAt, Date.now() + ms);
  }
}
