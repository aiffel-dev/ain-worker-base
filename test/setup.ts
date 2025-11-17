// Global test setup
// This file runs before all tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NETWORK_TYPE = 'TESTNET';
process.env.NAME = 'test-worker';
process.env.APP_NAME = 'test-app';
process.env.CONTAINER_MAX_CNT = '5';
process.env.CONTAINER_VCPU = '2';
process.env.CONTAINER_MEMORY_GB = '4';
process.env.CONTAINER_GPU_CNT = '0';
process.env.SHARED_PATH = '/tmp/ain-worker-test';
process.env.ENABLE_STORAGE = 'false';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Clean up after all tests
afterAll(() => {
  // Add any global cleanup here
});
