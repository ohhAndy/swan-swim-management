import { ResendRateLimiter } from "./resend-rate-limiter";

describe("ResendRateLimiter", () => {
  const original = process.env.RESEND_MAX_REQUESTS_PER_SECOND;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.RESEND_MAX_REQUESTS_PER_SECOND = original;
  });

  const startTimes = async (limiter: ResendRateLimiter, count: number) => {
    const started: number[] = [];
    const calls = Array.from({ length: count }, () =>
      limiter.acquire().then(() => started.push(Date.now())),
    );
    await jest.advanceTimersByTimeAsync(10_000);
    await Promise.all(calls);
    return started;
  };

  it("never lets more than the configured number start in one second", async () => {
    delete process.env.RESEND_MAX_REQUESTS_PER_SECOND;
    const started = await startTimes(new ResendRateLimiter(), 30);

    for (const t of started) {
      const inWindow = started.filter((s) => s >= t && s < t + 1000).length;
      expect(inWindow).toBeLessThanOrEqual(8);
    }
  });

  it("delays every later request after a pause", async () => {
    process.env.RESEND_MAX_REQUESTS_PER_SECOND = "10";
    const limiter = new ResendRateLimiter();
    limiter.pauseFor(2000);

    const started = await startTimes(limiter, 2);
    expect(started[0]).toBeGreaterThanOrEqual(2000);
    expect(started[1]).toBeGreaterThanOrEqual(2100);
  });
});
