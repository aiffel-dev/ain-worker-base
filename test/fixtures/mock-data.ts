// Mock data fixtures for tests

export const mockGpuInfo = {
  '0': {
    gpuName: 'NVIDIA GeForce RTX 3080',
    driverVersion: '470.57.02',
    memoryUsed: 2048,
    memoryTotal: 10240,
  },
  '1': {
    gpuName: 'NVIDIA GeForce RTX 3080',
    driverVersion: '470.57.02',
    memoryUsed: 1024,
    memoryTotal: 10240,
  },
};

export const mockCpuInfo = {
  manufacturer: 'Intel',
  brand: 'Core i7-9700K',
  cores: 8,
  physicalCores: 8,
  processors: 1,
  speed: 3.6,
};

export const mockNvidiaSmiOutput = `NVIDIA GeForce RTX 3080, 470.57.02, 2048 MiB, 10240 MiB
NVIDIA GeForce RTX 3080, 470.57.02, 1024 MiB, 10240 MiB
`;

export const mockContainerInfo = {
  'test-container-1': {
    started: true,
    imagePath: 'ubuntu:18.04',
    externalPorts: ['8080'],
    GPUDeviceId: ['0'],
    labels: {
      'ain-connect': 'container',
      'request-id': 'r123456',
      owner: '0x1234567890abcdef',
    },
  },
};

export const mockCreateContainerParams = {
  imagePath: 'ubuntu:18.04',
  ports: {
    http: 8080,
  },
  envs: {
    TEST_ENV: 'test-value',
  },
  command: ['python', 'app.py'],
  labels: {},
};

export const mockDeleteContainerParams = {
  containerId: 'test-container-1',
};

export const mockRequestInfo = {
  userAinAddress: '0x1234567890abcdef',
  createdAt: Date.now(),
  params: mockCreateContainerParams,
  requestType: 'createContainer',
};

export const mockMnemonic =
  'test wallet mnemonic phrase with twelve words for testing purposes only';
