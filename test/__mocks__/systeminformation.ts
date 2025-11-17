// Mock for systeminformation module

export const cpu = jest.fn().mockResolvedValue({
  manufacturer: 'Intel',
  brand: 'Core i7-9700K',
  vendor: 'Intel',
  family: '6',
  model: '158',
  stepping: '12',
  revision: '',
  voltage: '',
  speed: 3.6,
  speedMin: 3.6,
  speedMax: 4.9,
  cores: 8,
  physicalCores: 8,
  processors: 1,
  socket: 'LGA1151',
  cache: {
    l1d: 262144,
    l1i: 262144,
    l2: 2097152,
    l3: 12582912,
  },
});

export const mem = jest.fn().mockResolvedValue({
  total: 17179869184,
  free: 8589934592,
  used: 8589934592,
  active: 8589934592,
  available: 8589934592,
});

export const graphics = jest.fn().mockResolvedValue({
  controllers: [
    {
      model: 'NVIDIA GeForce RTX 3080',
      vendor: 'NVIDIA',
      vram: 10240,
      vramDynamic: false,
    },
  ],
});
