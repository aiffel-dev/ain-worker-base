import * as fs from 'fs';
import * as path from 'path';
import {
  createContainer,
  deleteContainer,
  getAllContainerInfo,
} from '../../../src/job/docker';
import Docker from '../../../src/util/docker';
import { CustomError, ErrorCode } from '../../../src/common/error';
import * as constants from '../../../src/common/constants';

// Mock Docker class
jest.mock('../../../src/util/docker');

// Mock Connect SDK
jest.mock('@ainblockchain/connect-sdk', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    downloadFile: jest.fn().mockResolvedValue(undefined),
    uploadFile: jest.fn().mockResolvedValue('file-ref'),
  })),
}));

describe('Job Docker Module', () => {
  let mockDockerInstance: any;
  const testDir = '/tmp/ain-worker-test-job';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Docker instance
    mockDockerInstance = {
      run: jest.fn().mockResolvedValue({
        publishPorts: {
          '8000': '3000',
          '8001': '4000',
        },
      }),
      kill: jest.fn().mockResolvedValue('test-request-id'),
      getContainerInfosByLabel: jest.fn().mockResolvedValue([]),
      getContainerInfo: jest.fn().mockResolvedValue({
        State: {
          Status: 'running',
          ExitCode: 0,
        },
      }),
    };

    (Docker.getInstance as jest.Mock).mockReturnValue(mockDockerInstance);

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Set environment variables
    process.env.SHARED_PATH = testDir;
    process.env.NODE_PORT_IP = '192.168.1.100';
    process.env.CONTAINER_VCPU = '2';
    process.env.CONTAINER_MEMORY_GB = '4';
    process.env.CONTAINER_GPU_CNT = '1';
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getAllContainerInfo()', () => {
    it('should return empty object when no containers exist', async () => {
      mockDockerInstance.getContainerInfosByLabel.mockResolvedValue([]);

      const result = await getAllContainerInfo();

      expect(result).toEqual({});
    });

    it('should return container information for running containers', async () => {
      const mockContainers = [
        {
          Names: ['/test-container-1'],
          State: 'running',
          Image: 'ubuntu:18.04',
          Labels: {
            [constants.LABEL_FOR_AIN_CONNECT]: 'container',
            [constants.LABEL_FOR_REQUEST_ID]: 'r123456',
            [constants.LABEL_FOR_OWNER]: '0x1234567890abcdef',
          },
        },
      ];

      mockDockerInstance.getContainerInfosByLabel.mockResolvedValue(mockContainers);

      const result = await getAllContainerInfo();

      expect(result['test-container-1']).toBeDefined();
      expect(result['test-container-1'].status).toBe('running');
      expect(result['test-container-1'].imagePath).toBe('ubuntu:18.04');
      expect(result['test-container-1'].requestId).toBe('r123456');
    });

    it('should return exit code for exited containers', async () => {
      const mockContainers = [
        {
          Names: ['/test-container-1'],
          State: 'exited',
          Image: 'ubuntu:18.04',
          Labels: {
            [constants.LABEL_FOR_AIN_CONNECT]: 'container',
            [constants.LABEL_FOR_REQUEST_ID]: 'r123456',
            [constants.LABEL_FOR_OWNER]: '0x1234567890abcdef',
          },
        },
      ];

      mockDockerInstance.getContainerInfosByLabel.mockResolvedValue(mockContainers);
      mockDockerInstance.getContainerInfo.mockResolvedValue({
        State: {
          ExitCode: 0,
        },
      });

      const result = await getAllContainerInfo();

      expect(result['test-container-1'].exitCode).toBe(0);
    });

    it('should handle multiple containers', async () => {
      const mockContainers = [
        {
          Names: ['/test-container-1'],
          State: 'running',
          Image: 'ubuntu:18.04',
          Labels: {
            [constants.LABEL_FOR_AIN_CONNECT]: 'container',
            [constants.LABEL_FOR_REQUEST_ID]: 'r123456',
            [constants.LABEL_FOR_OWNER]: '0x1234567890abcdef',
          },
        },
        {
          Names: ['/test-container-2'],
          State: 'exited',
          Image: 'alpine:latest',
          Labels: {
            [constants.LABEL_FOR_AIN_CONNECT]: 'container',
            [constants.LABEL_FOR_REQUEST_ID]: 'r789012',
            [constants.LABEL_FOR_OWNER]: '0xabcdef1234567890',
          },
        },
      ];

      mockDockerInstance.getContainerInfosByLabel.mockResolvedValue(mockContainers);
      mockDockerInstance.getContainerInfo.mockResolvedValue({
        State: {
          ExitCode: 1,
        },
      });

      const result = await getAllContainerInfo();

      expect(Object.keys(result).length).toBe(2);
      expect(result['test-container-1']).toBeDefined();
      expect(result['test-container-2']).toBeDefined();
    });
  });

  describe('createContainer()', () => {
    const mockStorageSdk = {
      downloadFile: jest.fn().mockResolvedValue(undefined),
    };

    it('should create container without ports successfully', async () => {
      mockDockerInstance.run.mockResolvedValue({
        publishPorts: {},
      });

      const result = await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
        },
        '0x1234567890abcdef',
        'r123456'
      );

      expect(result.containerId).toBeDefined();
      expect(result.endpoint).toBeUndefined();
      expect(mockDockerInstance.run).toHaveBeenCalled();
    });

    it('should create container with port mappings', async () => {
      const result = await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['python', 'app.py'],
          envs: {},
          ports: {
            http: 3000,
            grpc: 4000,
          },
        },
        '0x1234567890abcdef',
        'r123456'
      );

      expect(result.containerId).toBeDefined();
      expect(result.endpoint).toBeDefined();
      expect((result.endpoint as any).http).toBe('192.168.1.100:8000');
      expect((result.endpoint as any).grpc).toBe('192.168.1.100:8001');
    });

    it('should throw error when NODE_PORT_IP not set but ports provided', async () => {
      delete process.env.NODE_PORT_IP;

      await expect(
        createContainer(
          {
            imagePath: 'ubuntu:18.04',
            command: ['echo', 'test'],
            envs: {},
            ports: {
              http: 3000,
            },
          },
          '0x1234567890abcdef',
          'r123456'
        )
      ).rejects.toThrow(CustomError);
    });

    it('should create directory for file operations', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
          downloadFileRef: 'file-ref-123',
        },
        '0x1234567890abcdef',
        'r123456',
        mockStorageSdk as any
      );

      const requestDir = path.join(testDir, 'r123456');
      expect(fs.existsSync(requestDir)).toBe(true);
    });

    it('should download file when downloadFileRef provided', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
          downloadFileRef: 'file-ref-123',
        },
        '0x1234567890abcdef',
        'r123456',
        mockStorageSdk as any
      );

      expect(mockStorageSdk.downloadFile).toHaveBeenCalledWith(
        'file-ref-123',
        expect.stringContaining('/r123456/input')
      );
    });

    it('should set input data path environment variable', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
          downloadFileRef: 'file-ref-123',
        },
        '0x1234567890abcdef',
        'r123456',
        mockStorageSdk as any
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.envs).toHaveProperty(constants.ENV_KEY_FOR_INPUT_DATA_PATH);
    });

    it('should set output data path environment variable', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
          uploadFileName: 'output.txt',
        },
        '0x1234567890abcdef',
        'r123456',
        mockStorageSdk as any
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.envs).toHaveProperty(constants.ENV_KEY_FOR_OUTPUT_DATA_PATH);
    });

    it('should throw error when storage SDK not available but file operations requested', async () => {
      await expect(
        createContainer(
          {
            imagePath: 'ubuntu:18.04',
            command: ['echo', 'test'],
            envs: {},
            ports: {},
            downloadFileRef: 'file-ref-123',
          },
          '0x1234567890abcdef',
          'r123456'
        )
      ).rejects.toThrow(CustomError);
    });

    it('should pass resource limits to Docker.run', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
        },
        '0x1234567890abcdef',
        'r123456'
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.resourceLimit).toEqual({
        vcpu: Number(constants.CONTAINER_VCPU),
        memoryGB: Number(constants.CONTAINER_MEMORY_GB),
        gpuCnt: Number(constants.CONTAINER_GPU_CNT),
      });
    });

    it('should set labels correctly', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
          labels: {
            'custom-label': 'custom-value',
          },
        },
        '0x1234567890abcdef',
        'r123456'
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.labels).toHaveProperty('custom-label', 'custom-value');
      expect(runCall.labels).toHaveProperty(constants.LABEL_FOR_OWNER, '0x1234567890abcdef');
      expect(runCall.labels).toHaveProperty(constants.LABEL_FOR_AIN_CONNECT, 'container');
      expect(runCall.labels).toHaveProperty(constants.LABEL_FOR_REQUEST_ID, 'r123456');
    });

    it('should set volume binds correctly', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {},
          ports: {},
        },
        '0x1234567890abcdef',
        'r123456'
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.binds).toBeDefined();
      expect(runCall.binds.length).toBe(1);
      expect(runCall.binds[0]).toContain('r123456');
    });

    it('should merge user envs with system envs', async () => {
      await createContainer(
        {
          imagePath: 'ubuntu:18.04',
          command: ['echo', 'test'],
          envs: {
            USER_VAR: 'user-value',
          },
          ports: {},
        },
        '0x1234567890abcdef',
        'r123456'
      );

      const runCall = mockDockerInstance.run.mock.calls[0][0];
      expect(runCall.envs).toHaveProperty('USER_VAR', 'user-value');
    });
  });

  describe('deleteContainer()', () => {
    it('should delete container successfully', async () => {
      const result = await deleteContainer(
        {
          containerId: 'test-container-1',
        },
        '0x1234567890abcdef'
      );

      expect(result.containerId).toBe('test-container-1');
      expect(result.status).toBe('terminated');
      expect(result.terminatedAt).toBeDefined();
      expect(result.createRequestId).toBe('test-request-id');
    });

    it('should pass owner label to Docker.kill', async () => {
      await deleteContainer(
        {
          containerId: 'test-container-1',
        },
        '0x1234567890abcdef'
      );

      expect(mockDockerInstance.kill).toHaveBeenCalledWith('test-container-1', {
        [constants.LABEL_FOR_OWNER]: '0x1234567890abcdef',
      });
    });

    it('should throw error if container does not belong to user', async () => {
      mockDockerInstance.kill.mockRejectedValue(
        new CustomError(ErrorCode.UNAUTHORIZED, 'UNAUTHORIZED')
      );

      await expect(
        deleteContainer(
          {
            containerId: 'test-container-1',
          },
          '0x1234567890abcdef'
        )
      ).rejects.toThrow(CustomError);
    });

    it('should include termination timestamp', async () => {
      const before = Date.now();
      const result = await deleteContainer(
        {
          containerId: 'test-container-1',
        },
        '0x1234567890abcdef'
      );
      const after = Date.now();

      expect(result.terminatedAt).toBeGreaterThanOrEqual(before);
      expect(result.terminatedAt).toBeLessThanOrEqual(after);
    });

    it('should return original request ID from container labels', async () => {
      mockDockerInstance.kill.mockResolvedValue('original-request-id');

      const result = await deleteContainer(
        {
          containerId: 'test-container-1',
        },
        '0x1234567890abcdef'
      );

      expect(result.createRequestId).toBe('original-request-id');
    });
  });
});
