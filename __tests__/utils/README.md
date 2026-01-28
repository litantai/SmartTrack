# Test Utilities

## Overview

This directory contains utility functions for testing SmartTrack applications using **Vitest mocks** instead of external database dependencies.

## Why Vitest Mocks Instead of MongoDB Memory Server?

- ✅ **No External Dependencies**: No need to download MongoDB binaries
- ✅ **Firewall-Friendly**: Works in restricted network environments
- ✅ **Fast**: Instant startup, no database initialization overhead
- ✅ **Cloud-Compatible**: Runs perfectly in CI/CD pipelines without internet access
- ✅ **Simple**: Pure JavaScript mocking with Vitest

## Usage

### Basic Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../utils/test-db';

describe('My Service Tests', () => {
  beforeEach(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should test something', async () => {
    // Your test code here
  });
});
```

### Working with Mock Collections

```typescript
import { getMockCollection, setMockCollection } from '../utils/test-db';

// Seed test data
setMockCollection('vehicles', [
  { vehicleId: 'V001', brand: 'Tesla', status: 'available' },
  { vehicleId: 'V002', brand: 'BMW', status: 'booked' }
]);

// Retrieve data for assertions
const vehicles = getMockCollection('vehicles');
expect(vehicles).toHaveLength(2);
```

### Example: Testing a Service

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { connectTestDB, setMockCollection, clearTestDB } from '../utils/test-db';
import { VehicleService } from '@/lib/db/services/vehicle.service';

describe('VehicleService', () => {
  beforeEach(async () => {
    await connectTestDB();
    
    // Setup test data
    setMockCollection('vehicles', [
      { 
        _id: '507f1f77bcf86cd799439011',
        vehicleId: 'V001',
        brand: 'Tesla',
        model: 'Model 3',
        status: 'available'
      }
    ]);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should find available vehicles', async () => {
    const result = await VehicleService.findAvailable();
    expect(result).toHaveLength(1);
    expect(result[0].vehicleId).toBe('V001');
  });
});
```

## API Reference

### `connectTestDB()`
Initializes Vitest mocks for Mongoose connections and operations.

### `clearTestDB()`
Clears all mock collections. Call this in `afterEach` to ensure test isolation.

### `disconnectTestDB()`
Cleans up all mocks. Call this in `afterAll` to restore original Mongoose behavior.

### `getMockCollection(name: string): any[]`
Returns the current data in a mock collection.

### `setMockCollection(name: string, data: any[])`
Seeds a mock collection with test data.

## Best Practices

1. **Always Clear Between Tests**: Use `clearTestDB()` in `afterEach` to prevent test pollution
2. **Seed Data Explicitly**: Don't rely on data from previous tests
3. **Use Descriptive Collection Names**: Match your actual Mongoose model names
4. **Test Isolation**: Each test should be able to run independently
5. **Keep It Simple**: Mock only what you need for the specific test

## Migration from MongoDB Memory Server

If you have existing tests using MongoDB Memory Server:

1. Replace `MongoMemoryServer.create()` with `connectTestDB()`
2. Replace `mongoServer.stop()` with `disconnectTestDB()`
3. Use `setMockCollection()` to seed data instead of actual DB operations
4. Use `getMockCollection()` to verify data instead of querying the DB

## See Also

- Example tests: `__tests__/unit/utils/mock-db-example.test.ts`
- Vitest documentation: https://vitest.dev/
- Mongoose documentation: https://mongoosejs.com/
