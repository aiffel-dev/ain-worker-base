import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { validateMnemonic } from 'bip39';
import {
  createMnemonic,
  fileExists,
  replaceFileSync,
  getGpuInfo,
  getCpuInfo,
  delay,
  exec,
} from '../../../src/util/utils';
import { mockNvidiaSmiOutput, mockGpuInfo } from '../../fixtures/mock-data';

// Mock child_process for exec
jest.mock('child_process');

// Mock systeminformation
jest.mock('systeminformation', () => ({
  cpu: jest.fn().mockResolvedValue({
    manufacturer: 'Intel',
    brand: 'Core i7-9700K',
    cores: 8,
    physicalCores: 8,
    processors: 1,
    speed: 3.6,
  }),
}));

describe('Utility Functions', () => {
  describe('createMnemonic', () => {
    it('should generate a valid BIP39 mnemonic', () => {
      const mnemonic = createMnemonic();

      expect(mnemonic).toBeDefined();
      expect(typeof mnemonic).toBe('string');
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it('should generate 12 words by default', () => {
      const mnemonic = createMnemonic();
      const words = mnemonic.split(' ');

      expect(words.length).toBe(12);
    });

    it('should generate different mnemonics each time', () => {
      const mnemonic1 = createMnemonic();
      const mnemonic2 = createMnemonic();
      const mnemonic3 = createMnemonic();

      expect(mnemonic1).not.toBe(mnemonic2);
      expect(mnemonic2).not.toBe(mnemonic3);
      expect(mnemonic1).not.toBe(mnemonic3);
    });

    it('should generate valid mnemonics consistently', () => {
      for (let i = 0; i < 10; i++) {
        const mnemonic = createMnemonic();
        expect(validateMnemonic(mnemonic)).toBe(true);
      }
    });
  });

  describe('fileExists', () => {
    const testDir = '/tmp/ain-worker-test';
    const testFile = path.join(testDir, 'test-file.txt');

    beforeEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should return true for existing file', () => {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFile, 'test content');

      expect(fileExists(testFile)).toBe(true);
    });

    it('should return false for non-existing file', () => {
      expect(fileExists(testFile)).toBe(false);
    });

    it('should return true for existing directory', () => {
      fs.mkdirSync(testDir, { recursive: true });

      expect(fileExists(testDir)).toBe(true);
    });

    it('should return false for non-existing directory', () => {
      expect(fileExists('/non/existing/directory')).toBe(false);
    });
  });

  describe('replaceFileSync', () => {
    const testDir = '/tmp/ain-worker-test';
    const testFile = path.join(testDir, 'nested/test-file.json');

    beforeEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should create directory if it does not exist', () => {
      const data = { test: 'value' };
      replaceFileSync(testFile, data);

      expect(fs.existsSync(path.dirname(testFile))).toBe(true);
    });

    it('should create new file with JSON content', () => {
      const data = { test: 'value', number: 123 };
      replaceFileSync(testFile, data);

      expect(fs.existsSync(testFile)).toBe(true);
      const content = fs.readFileSync(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });

    it('should replace existing file content', () => {
      const data1 = { first: 'data' };
      const data2 = { second: 'data' };

      replaceFileSync(testFile, data1);
      const content1 = fs.readFileSync(testFile, 'utf-8');
      expect(JSON.parse(content1)).toEqual(data1);

      replaceFileSync(testFile, data2);
      const content2 = fs.readFileSync(testFile, 'utf-8');
      expect(JSON.parse(content2)).toEqual(data2);
    });

    it('should format JSON with 2-space indentation', () => {
      const data = { key: 'value' };
      replaceFileSync(testFile, data);

      const content = fs.readFileSync(testFile, 'utf-8');
      const expectedContent = JSON.stringify(data, null, 2);
      expect(content).toBe(expectedContent);
    });

    it('should handle complex nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3],
            },
          },
        },
      };
      replaceFileSync(testFile, data);

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });
  });

  describe('getGpuInfo', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should parse nvidia-smi output correctly', async () => {
      (childProcess.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: any) => {
          callback(null, { stdout: mockNvidiaSmiOutput, stderr: '' });
        }
      );

      const gpuInfo = await getGpuInfo();

      expect(gpuInfo).toEqual(mockGpuInfo);
      expect(gpuInfo['0']).toBeDefined();
      expect(gpuInfo['0'].gpuName).toBe('NVIDIA GeForce RTX 3080');
      expect(gpuInfo['0'].driverVersion).toBe('470.57.02');
      expect(gpuInfo['0'].memoryUsed).toBe(2048);
      expect(gpuInfo['0'].memoryTotal).toBe(10240);
    });

    it('should handle multiple GPUs', async () => {
      (childProcess.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: any) => {
          callback(null, { stdout: mockNvidiaSmiOutput, stderr: '' });
        }
      );

      const gpuInfo = await getGpuInfo();

      expect(Object.keys(gpuInfo).length).toBe(2);
      expect(gpuInfo['0']).toBeDefined();
      expect(gpuInfo['1']).toBeDefined();
    });

    it('should return empty object when nvidia-smi fails', async () => {
      (childProcess.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: any) => {
          callback(new Error('nvidia-smi not found'), null);
        }
      );

      const gpuInfo = await getGpuInfo();

      expect(gpuInfo).toEqual({});
    });

    it('should return empty object when no GPU is available', async () => {
      (childProcess.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: any) => {
          callback(null, { stdout: '', stderr: '' });
        }
      );

      const gpuInfo = await getGpuInfo();

      expect(gpuInfo).toEqual({});
    });

    it('should parse memory values as integers', async () => {
      const output = 'Tesla V100, 450.51.06, 1024 MiB, 16384 MiB\n';
      (childProcess.exec as unknown as jest.Mock).mockImplementation(
        (cmd: string, callback: any) => {
          callback(null, { stdout: output, stderr: '' });
        }
      );

      const gpuInfo = await getGpuInfo();

      expect(typeof gpuInfo['0'].memoryUsed).toBe('number');
      expect(typeof gpuInfo['0'].memoryTotal).toBe('number');
      expect(gpuInfo['0'].memoryUsed).toBe(1024);
      expect(gpuInfo['0'].memoryTotal).toBe(16384);
    });
  });

  describe('getCpuInfo', () => {
    it('should return CPU information', async () => {
      const cpuInfo = await getCpuInfo();

      expect(cpuInfo).toBeDefined();
      expect(cpuInfo.manufacturer).toBe('Intel');
      expect(cpuInfo.brand).toBe('Core i7-9700K');
      expect(cpuInfo.cores).toBe(8);
      expect(cpuInfo.physicalCores).toBe(8);
      expect(cpuInfo.speed).toBe(3.6);
    });

    it('should return consistent CPU information', async () => {
      const cpuInfo1 = await getCpuInfo();
      const cpuInfo2 = await getCpuInfo();

      expect(cpuInfo1).toEqual(cpuInfo2);
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay execution for specified milliseconds', async () => {
      const delayTime = 1000;
      const delayPromise = delay(delayTime);

      jest.advanceTimersByTime(delayTime);
      await delayPromise;

      expect(true).toBe(true); // If we get here, delay worked
    });

    it('should work with different delay times', async () => {
      const delays = [100, 500, 1000, 2000];

      for (const delayTime of delays) {
        const delayPromise = delay(delayTime);
        jest.advanceTimersByTime(delayTime);
        await delayPromise;
        // Delay completed successfully
        expect(true).toBe(true);
      }
    });

    it('should return a promise', () => {
      const result = delay(100);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('exec', () => {
    it('should be a promisified version of childProcess.exec', () => {
      expect(typeof exec).toBe('function');
    });
  });
});
