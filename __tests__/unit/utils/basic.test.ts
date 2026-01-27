import { describe, it, expect } from 'vitest';

describe('Vitest Configuration Test', () => {
  describe('Basic Assertions', () => {
    it('should pass boolean assertions', () => {
      expect(true).toBe(true);
      expect(false).toBe(false);
      expect(true).toBeTruthy();
      expect(false).toBeFalsy();
    });

    it('should handle number comparisons', () => {
      const sum = 2 + 2;
      expect(sum).toBe(4);
      expect(sum).toBeGreaterThan(3);
      expect(sum).toBeLessThan(5);
      expect(sum).toBeGreaterThanOrEqual(4);
      expect(sum).toBeLessThanOrEqual(4);
    });

    it('should handle string operations', () => {
      const greeting = 'Hello, SmartTrack!';
      expect(greeting).toContain('SmartTrack');
      expect(greeting).toMatch(/Smart/);
      expect(greeting).toHaveLength(18);
    });

    it('should handle array operations', () => {
      const vehicles = ['sedan', 'suv', 'truck'];
      expect(vehicles).toHaveLength(3);
      expect(vehicles).toContain('sedan');
      expect(vehicles).toEqual(['sedan', 'suv', 'truck']);
    });

    it('should handle object comparisons', () => {
      const vehicle = {
        id: 'V001',
        type: 'sedan',
        status: 'available'
      };
      
      expect(vehicle).toHaveProperty('id');
      expect(vehicle).toHaveProperty('type', 'sedan');
      expect(vehicle).toEqual({
        id: 'V001',
        type: 'sedan',
        status: 'available'
      });
    });
  });

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('success');
      await expect(promise).resolves.toBe('success');
    });

    it('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('failed'));
      await expect(promise).rejects.toThrow('failed');
    });

    it('should handle async/await', async () => {
      const asyncFunction = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('delayed success'), 10);
        });
      };
      
      const result = await asyncFunction();
      expect(result).toBe('delayed success');
    });
  });

  describe('Custom Matchers', () => {
    it('should use custom toBeWithinRange matcher', () => {
      const number = 15;
      expect(number).toBeWithinRange(10, 20);
    });
  });
});
