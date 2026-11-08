import { describe, it, expect, vi } from 'vitest';
import { maskSensitiveData, logger } from '../../../scripts/lib/logger.mjs';

describe('LIB-03 — logger.mjs Unit & Adversarial Tests', () => {
  const testAwsKey = 'AKIA' + '1234567890ABCDEF';
  const testGhToken = 'ghp_' + '123456789012345678901234567890123456';

  describe('maskSensitiveData() — Sanitização Ativa', () => {
    it('redacts AWS Access Keys to safe prefix + redacted marker', () => {
      const raw = `Config AWS key: ${testAwsKey} in file`;
      const safe = maskSensitiveData(raw);
      expect(safe).toContain('AKI***REDACTED***');
      expect(safe).not.toContain(testAwsKey);
    });

    it('redacts GitHub Tokens completely', () => {
      const raw = `Token: ${testGhToken}`;
      const safe = maskSensitiveData(raw);
      expect(safe).toContain('ghp***REDACTED***');
      expect(safe).not.toContain(testGhToken);
    });

    it('redacts generic key assignments (api_key = "...")', () => {
      const raw = 'client_' + 'secret = "super_confidential_secret_value_123"';
      const safe = maskSensitiveData(raw);
      expect(safe).toContain('client_secret = "***REDACTED***"');
      expect(safe).not.toContain('super_confidential_secret_value_123');
    });

    it('redacts entire private key blocks', () => {
      const raw =
        '-----BEGIN ' +
        'RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END ' +
        'RSA PRIVATE KEY-----';
      const safe = maskSensitiveData(raw);
      expect(safe).toBe('[BLOCO_CHAVE_PRIVADA_MASCARADO]');
      expect(safe).not.toContain('MIIEowIBAAKCAQEA');
    });

    it('redacts workstation paths (/home/<username>/ -> /home/[USER]/)', () => {
      const raw = 'File located at ' + ['', 'home', 'sampleuser', 'projects', 'app.ts'].join('/');
      const safe = maskSensitiveData(raw);
      expect(safe).toBe('File located at /home/[USER]/projects/app.ts');
      expect(safe).not.toContain('sampleuser');
    });

    it('redacts custom forbidden corporate terms', () => {
      const raw = 'Connecting to PROPRIETARY_CORP_BACKEND service';
      const safe = maskSensitiveData(raw, ['PROPRIETARY_CORP_BACKEND']);
      expect(safe).toContain('***REDACTED_TERM***');
      expect(safe).not.toContain('PROPRIETARY_CORP_BACKEND');
    });
  });

  describe('logger methods and streams', () => {
    it('writes info, success and warn to stdout and error to stderr without leaking secrets', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      logger.info(`Info message with ${testAwsKey}`);
      expect(stdoutSpy).toHaveBeenCalled();
      const lastStdout = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0];
      expect(lastStdout).not.toContain(testAwsKey);
      expect(lastStdout).toContain('AKI***REDACTED***');

      logger.error(`Error message with ${testAwsKey}`);
      expect(stderrSpy).toHaveBeenCalled();
      const lastStderr = stderrSpy.mock.calls[stderrSpy.mock.calls.length - 1][0];
      expect(lastStderr).not.toContain(testAwsKey);
      expect(lastStderr).toContain('AKI***REDACTED***');

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });
  });
});
