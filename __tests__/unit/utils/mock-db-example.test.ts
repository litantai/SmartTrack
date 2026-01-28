import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB, getMockCollection, setMockCollection } from '../../utils/test-db';
import mongoose from 'mongoose';

describe('Mocked Database Usage Examples', () => {
  beforeEach(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should demonstrate basic mock setup', async () => {
    // Verify connection is mocked
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should demonstrate seeding mock data', () => {
    // Seed test data
    const mockVehicles = [
      { vehicleId: 'V001', brand: 'Tesla', model: 'Model 3' },
      { vehicleId: 'V002', brand: 'BMW', model: 'X5' }
    ];
    
    setMockCollection('vehicles', mockVehicles);
    
    // Retrieve and verify
    const vehicles = getMockCollection('vehicles');
    expect(vehicles).toHaveLength(2);
    expect(vehicles[0].vehicleId).toBe('V001');
  });

  it('should demonstrate collection operations', async () => {
    // Setup initial data
    setMockCollection('users', [
      { username: 'admin', role: 'admin' },
      { username: 'driver1', role: 'driver' }
    ]);

    // Verify collection data
    const users = getMockCollection('users');
    expect(users).toHaveLength(2);
    
    // Clear collection
    await clearTestDB();
    
    // Verify collection is empty after clear
    const emptyUsers = getMockCollection('users');
    expect(emptyUsers).toHaveLength(0);
  });

  it('should demonstrate mock cleanup', async () => {
    // Add data
    setMockCollection('bookings', [{ bookingId: 'B001' }]);
    expect(getMockCollection('bookings')).toHaveLength(1);
    
    // Clear should remove all data
    await clearTestDB();
    expect(getMockCollection('bookings')).toHaveLength(0);
  });
});

describe('Mock Database Lifecycle', () => {
  it('should handle full lifecycle', async () => {
    // Connect
    await connectTestDB();
    expect(mongoose.connection.readyState).toBe(1);
    
    // Use
    setMockCollection('test', [{ id: 1 }]);
    expect(getMockCollection('test')).toHaveLength(1);
    
    // Clear
    await clearTestDB();
    expect(getMockCollection('test')).toHaveLength(0);
    
    // Disconnect
    await disconnectTestDB();
  });
});
