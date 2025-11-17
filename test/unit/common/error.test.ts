import { ErrorCode, CustomError, Name } from '../../../src/common/error';

describe('CustomError', () => {
  describe('Error Code Mapping', () => {
    it('should have all error codes defined', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe(401);
      expect(ErrorCode.INVALID_PARAMS).toBe(452);
      expect(ErrorCode.NOT_EXIST).toBe(453);
      expect(ErrorCode.ALREADY_EXIST).toBe(454);
      expect(ErrorCode.QUOTA_EXCEED).toBe(457);
      expect(ErrorCode.UNEXPECTED).toBe(500);
      expect(ErrorCode.NOT_IMPLEMENTED).toBe(501);
      expect(ErrorCode.NOT_SUPPORTED).toBe(502);
      expect(ErrorCode.FAIL_FOR_DOCKER).toBe(503);
    });

    it('should map error codes to names correctly', () => {
      expect(Name[ErrorCode.UNAUTHORIZED]).toBe('UNAUTHORIZED');
      expect(Name[ErrorCode.INVALID_PARAMS]).toBe('INVALID_PARAMS');
      expect(Name[ErrorCode.NOT_EXIST]).toBe('NOT_EXIST');
      expect(Name[ErrorCode.ALREADY_EXIST]).toBe('ALREADY_EXIST');
      expect(Name[ErrorCode.QUOTA_EXCEED]).toBe('QUOTA_EXCEED');
      expect(Name[ErrorCode.UNEXPECTED]).toBe('UNEXPECTED');
      expect(Name[ErrorCode.NOT_IMPLEMENTED]).toBe('NOT_IMPLEMENTED');
      expect(Name[ErrorCode.NOT_SUPPORTED]).toBe('NOT_SUPPORTED');
      expect(Name[ErrorCode.FAIL_FOR_DOCKER]).toBe('FAIL_FOR_DOCKER');
    });
  });

  describe('CustomError Class', () => {
    it('should create error with correct status code and message', () => {
      const error = new CustomError(ErrorCode.NOT_EXIST, 'Container not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Container not found');
      expect(error.name).toBe('NOT_EXIST');
    });

    it('should create UNAUTHORIZED error', () => {
      const error = new CustomError(ErrorCode.UNAUTHORIZED, 'Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('UNAUTHORIZED');
    });

    it('should create INVALID_PARAMS error', () => {
      const error = new CustomError(
        ErrorCode.INVALID_PARAMS,
        'Invalid parameters provided'
      );

      expect(error.message).toBe('Invalid parameters provided');
      expect(error.name).toBe('INVALID_PARAMS');
    });

    it('should create ALREADY_EXIST error', () => {
      const error = new CustomError(
        ErrorCode.ALREADY_EXIST,
        'Container already exists'
      );

      expect(error.message).toBe('Container already exists');
      expect(error.name).toBe('ALREADY_EXIST');
    });

    it('should create QUOTA_EXCEED error', () => {
      const error = new CustomError(
        ErrorCode.QUOTA_EXCEED,
        'Container limit exceeded'
      );

      expect(error.message).toBe('Container limit exceeded');
      expect(error.name).toBe('QUOTA_EXCEED');
    });

    it('should create NOT_SUPPORTED error', () => {
      const error = new CustomError(ErrorCode.NOT_SUPPORTED, 'GPU not supported');

      expect(error.message).toBe('GPU not supported');
      expect(error.name).toBe('NOT_SUPPORTED');
    });

    it('should create FAIL_FOR_DOCKER error', () => {
      const error = new CustomError(
        ErrorCode.FAIL_FOR_DOCKER,
        'Docker operation failed'
      );

      expect(error.message).toBe('Docker operation failed');
      expect(error.name).toBe('FAIL_FOR_DOCKER');
    });

    it('should capture stack trace', () => {
      const error = new CustomError(ErrorCode.UNEXPECTED, 'Unexpected error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack!.length).toBeGreaterThan(0);
    });

    it('should extend Error correctly', () => {
      const error = new CustomError(ErrorCode.NOT_EXIST, 'Test error');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof CustomError).toBe(true);
      expect(Object.prototype.toString.call(error)).toBe('[object Error]');
    });

    it('should be catchable as Error', () => {
      try {
        throw new CustomError(ErrorCode.NOT_EXIST, 'Test error');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e).toBeInstanceOf(CustomError);
        if (e instanceof CustomError) {
          expect(e.message).toBe('Test error');
          expect(e.name).toBe('NOT_EXIST');
        }
      }
    });

    it('should preserve error message in different scenarios', () => {
      const scenarios = [
        {
          code: ErrorCode.UNAUTHORIZED,
          message: 'User not authorized to delete container',
        },
        {
          code: ErrorCode.QUOTA_EXCEED,
          message: 'Maximum container count reached',
        },
        { code: ErrorCode.NOT_EXIST, message: 'Container does not exist' },
        {
          code: ErrorCode.ALREADY_EXIST,
          message: 'Container with this ID already exists',
        },
      ];

      scenarios.forEach(({ code, message }) => {
        const error = new CustomError(code, message);
        expect(error.message).toBe(message);
        expect(error.name).toBe(Name[code]);
      });
    });
  });

  describe('Error Name Consistency', () => {
    it('should have consistent name mapping for all error codes', () => {
      const errorCodes = Object.values(ErrorCode).filter(
        (val) => typeof val === 'number'
      ) as number[];

      errorCodes.forEach((code) => {
        expect(Name[code]).toBeDefined();
        expect(typeof Name[code]).toBe('string');
      });
    });

    it('should not have duplicate error codes', () => {
      const errorCodes = Object.values(ErrorCode).filter(
        (val) => typeof val === 'number'
      );
      const uniqueCodes = new Set(errorCodes);

      expect(errorCodes.length).toBe(uniqueCodes.size);
    });
  });
});
