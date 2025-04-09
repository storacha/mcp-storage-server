import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDelegation,
  parseIpfsPath,
  normalizeIpfsPath,
} from '../../../../src/core/storage/utils.js';
import { IpfsPathError } from '../../../../src/core/storage/types.js';
import { CID } from 'multiformats';
import * as Proof from '@storacha/client/proof';
import { Delegation, Capabilities } from '@ucanto/interface';

// Mock Proof.parse to avoid actual proof parsing in tests
vi.mock('@storacha/client/proof', () => ({
  parse: vi.fn().mockImplementation(data => {
    // Return the cleaned data for verification in tests
    return { _cleanedData: data } as unknown as Delegation<Capabilities>;
  }),
}));

describe('Storage Utils', () => {
  // Define a valid CID constant for testing
  const VALID_CID = 'bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y';

  describe('parseIpfsPath', () => {
    it('should parse standard CID/filename format', () => {
      const path = `${VALID_CID}/bmoney.txt`;
      const resource = parseIpfsPath(path);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/bmoney.txt',
      });
    });

    it('should parse /ipfs/ prefix format', () => {
      const originalPath = `/ipfs/${VALID_CID}/bmoney.txt`;
      const resource = parseIpfsPath(originalPath);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/bmoney.txt',
      });
    });

    it('should parse ipfs/ prefix (without leading slash)', () => {
      const originalPath = `ipfs/${VALID_CID}/bmoney.txt`;
      const resource = parseIpfsPath(originalPath);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/bmoney.txt',
      });
    });

    it('should parse ipfs:// protocol', () => {
      const originalPath = `ipfs://${VALID_CID}/bmoney.txt`;
      const resource = parseIpfsPath(originalPath);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/bmoney.txt',
      });
    });

    it('should handle complex nested paths correctly', () => {
      const originalPath = `ipfs://${VALID_CID}/dir/subdir/file.txt`;
      const resource = parseIpfsPath(originalPath);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/dir/subdir/file.txt',
      });
    });

    it('should handle paths with query parameters', () => {
      const originalPath = `/ipfs/${VALID_CID}/file.txt?download=true`;
      const resource = parseIpfsPath(originalPath);

      expect(resource).toEqual({
        protocol: 'ipfs:',
        cid: CID.parse(VALID_CID),
        pathname: '/file.txt?download=true',
      });
    });

    it('should throw for paths without a slash', () => {
      expect(() => parseIpfsPath(VALID_CID)).toThrow(IpfsPathError);
      expect(() => parseIpfsPath(VALID_CID)).toThrow('Must contain a slash separator');
    });

    it('should throw for paths with empty filenames', () => {
      expect(() => parseIpfsPath(`${VALID_CID}/`)).toThrow(IpfsPathError);
      expect(() => parseIpfsPath(`${VALID_CID}/`)).toThrow('Filename cannot be empty');
    });

    it('should throw for paths with invalid CIDs', () => {
      expect(() => parseIpfsPath('not-a-cid/file.txt')).toThrow(IpfsPathError);
      expect(() => parseIpfsPath('not-a-cid/file.txt')).toThrow('Invalid CID');
    });

    it('should not parse uppercase IPFS protocols', () => {
      // This will throw because after removing the protocol, we're left with an invalid CID
      expect(() =>
        parseIpfsPath('IPFS://bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/file.txt')
      ).toThrow(IpfsPathError);
    });

    it('should not parse other URL protocols', () => {
      // This will throw because the path doesn't match any expected IPFS format
      expect(() => parseIpfsPath('http://example.com/ipfs/file.txt')).toThrow(IpfsPathError);
    });
  });

  describe('normalizeIpfsPath', () => {
    it('should not modify already normalized paths (CID/filename format)', () => {
      const path = `${VALID_CID}/bmoney.txt`;
      expect(normalizeIpfsPath(path)).toBe(path);
    });

    it('should remove /ipfs/ prefix', () => {
      const originalPath = `/ipfs/${VALID_CID}/bmoney.txt`;
      const expectedPath = `${VALID_CID}/bmoney.txt`;
      expect(normalizeIpfsPath(originalPath)).toBe(expectedPath);
    });

    it('should remove ipfs/ prefix (without leading slash)', () => {
      const originalPath = `ipfs/${VALID_CID}/bmoney.txt`;
      const expectedPath = `${VALID_CID}/bmoney.txt`;
      expect(normalizeIpfsPath(originalPath)).toBe(expectedPath);
    });

    it('should remove ipfs:// protocol', () => {
      const originalPath = `ipfs://${VALID_CID}/bmoney.txt`;
      const expectedPath = `${VALID_CID}/bmoney.txt`;
      expect(normalizeIpfsPath(originalPath)).toBe(expectedPath);
    });

    it('should handle empty string', () => {
      expect(normalizeIpfsPath('')).toBe('');
    });

    it('should handle IPFS paths with other formats correctly', () => {
      // Handle uppercase variants
      expect(normalizeIpfsPath(`IPFS://${VALID_CID}/file.txt`)).toBe(
        `IPFS://${VALID_CID}/file.txt`
      );

      // Not normalize other URL protocols
      expect(normalizeIpfsPath('http://example.com/ipfs/file.txt')).toBe(
        'http://example.com/ipfs/file.txt'
      );
    });
  });

  describe('parseDelegation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should remove all whitespace characters from the input', async () => {
      const testDelegation = 'AB CD\nEF\tGH\r\nIJ';
      const expectedCleanedData = 'ABCDEFGHIJ';

      const result = await parseDelegation(testDelegation);

      expect(Proof.parse).toHaveBeenCalledWith(expectedCleanedData);
      expect((result as unknown as { _cleanedData: string })._cleanedData).toBe(
        expectedCleanedData
      );
    });

    it('should handle delegation data with no whitespace', async () => {
      const testDelegation = 'ABCDEFGHIJ';

      const result = await parseDelegation(testDelegation);

      expect(Proof.parse).toHaveBeenCalledWith(testDelegation);
      expect((result as unknown as { _cleanedData: string })._cleanedData).toBe(testDelegation);
    });

    it('should handle delegation data with only whitespace', async () => {
      const testDelegation = '   \n\t\r\n  ';
      const expectedCleanedData = '';

      const result = await parseDelegation(testDelegation);

      expect(Proof.parse).toHaveBeenCalledWith(expectedCleanedData);
      expect((result as unknown as { _cleanedData: string })._cleanedData).toBe(
        expectedCleanedData
      );
    });

    it('should handle mixed content with various whitespace', async () => {
      const testDelegation = `
        ey123
        456 789
        abc\tdef
        ghi\r\njkl
      `;
      const expectedCleanedData = 'ey123456789abcdefghijkl';

      const result = await parseDelegation(testDelegation);

      expect(Proof.parse).toHaveBeenCalledWith(expectedCleanedData);
      expect((result as unknown as { _cleanedData: string })._cleanedData).toBe(
        expectedCleanedData
      );
    });
  });
});
