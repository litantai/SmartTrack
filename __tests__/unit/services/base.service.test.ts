import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../utils/test-db';

describe('BaseService - Vitest Example', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should pass a basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should perform mathematical operations', () => {
    const sum = 2 + 2;
    expect(sum).toBe(4);
    expect(sum).toBeGreaterThan(3);
    expect(sum).toBeLessThan(5);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  it('should validate database connection is working', async () => {
    // This test validates that MongoDB Memory Server is working
    const mongoose = await import('mongoose');
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });
});
