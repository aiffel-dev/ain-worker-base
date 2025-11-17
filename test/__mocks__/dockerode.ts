// Mock for Dockerode

const mockContainer = {
  inspect: jest.fn().mockResolvedValue({
    Id: 'mock-container-id',
    Name: '/mock-container',
    State: {
      Status: 'running',
      Running: true,
      Paused: false,
      Restarting: false,
      OOMKilled: false,
      Dead: false,
      Pid: 12345,
      ExitCode: 0,
    },
    Config: {
      Image: 'ubuntu:18.04',
      Cmd: ['tail', '-f'],
      Labels: {},
      Env: [],
    },
    HostConfig: {
      CpusetCpus: '0-1',
      Memory: 4000000,
      PortBindings: {},
      Binds: [],
      DeviceRequests: [],
    },
    NetworkSettings: {
      Ports: {},
    },
  }),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  exec: jest.fn().mockResolvedValue({
    start: jest.fn().mockResolvedValue(undefined),
  }),
  logs: jest.fn().mockResolvedValue('mock logs'),
};

const mockImage = {
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockModem = {
  followProgress: jest.fn((stream: any, onFinished: any) => {
    onFinished(null);
    return Promise.resolve();
  }),
};

class MockDockerode {
  modem = mockModem;

  constructor(options?: any) {}

  createContainer = jest.fn().mockResolvedValue(mockContainer);

  getContainer = jest.fn().mockReturnValue(mockContainer);

  listContainers = jest.fn().mockResolvedValue([
    {
      Id: 'mock-container-id',
      Names: ['/mock-container'],
      Image: 'ubuntu:18.04',
      ImageID: 'sha256:mock',
      Command: 'tail -f',
      Created: Date.now() / 1000,
      Ports: [],
      Labels: {},
      State: 'running',
      Status: 'Up 1 hour',
      HostConfig: {
        NetworkMode: 'default',
      },
      NetworkSettings: {
        Networks: {},
      },
      Mounts: [],
    },
  ]);

  pull = jest.fn((repoTag: string, options: any, callback: any) => {
    callback(null, {});
  });

  getImage = jest.fn().mockReturnValue(mockImage);

  listImages = jest.fn().mockResolvedValue([
    {
      Id: 'sha256:mock-image-id',
      RepoTags: ['ubuntu:18.04'],
      Created: Date.now() / 1000,
      Size: 64200000,
      VirtualSize: 64200000,
    },
  ]);
}

export default MockDockerode;
export { mockContainer, mockImage, mockModem };
