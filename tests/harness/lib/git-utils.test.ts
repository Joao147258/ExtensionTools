import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import {
  isGitRepository,
  hasCommits,
  getStagedFiles,
  getOutgoingCommitObjects,
  getOutgoingFiles,
  getTrackedFiles,
  getGitBlobContent,
  createStagedSnapshot,
} from '../../../scripts/lib/git-utils.mjs';

describe('LIB-02 — git-utils.mjs Unit Tests', () => {
  let gitDir;

  beforeEach(() => {
    gitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-utils-test-'));
    execSync('git init', { cwd: gitDir, stdio: 'ignore' });
    execSync('git config user.name "Test Dev"', { cwd: gitDir });
    execSync('git config user.email "test@example.com"', { cwd: gitDir });
  });

  afterEach(() => {
    fs.rmSync(gitDir, { recursive: true, force: true });
  });

  describe('isGitRepository() and hasCommits()', () => {
    it('identifies git repository correctly', () => {
      expect(isGitRepository(gitDir)).toBe(true);
      expect(isGitRepository(os.tmpdir())).toBe(false);
    });

    it('identifies that new repository has no commits initially', () => {
      expect(hasCommits(gitDir)).toBe(false);
    });

    it('identifies commits after initial commit is made', () => {
      fs.writeFileSync(path.join(gitDir, 'init.txt'), 'start');
      execSync('git add init.txt', { cwd: gitDir });
      execSync('git commit -m "init"', { cwd: gitDir });

      expect(hasCommits(gitDir)).toBe(true);
    });
  });

  describe('getStagedFiles() and createStagedSnapshot()', () => {
    it('returns staged files in empty repository without commits', () => {
      fs.writeFileSync(path.join(gitDir, 'file1.txt'), 'one');
      execSync('git add file1.txt', { cwd: gitDir });

      const staged = getStagedFiles(gitDir);
      expect(staged).toEqual(['file1.txt']);
    });

    it('extracts authentic blob from git index even if working tree is modified', () => {
      fs.writeFileSync(path.join(gitDir, 'file.txt'), 'STAGED_BLOB_CONTENT');
      execSync('git add file.txt', { cwd: gitDir });

      // Modifica working tree
      fs.writeFileSync(path.join(gitDir, 'file.txt'), 'WORKING_TREE_MODIFIED');

      const blobContent = getGitBlobContent('file.txt', '', gitDir);
      expect(blobContent).toBe('STAGED_BLOB_CONTENT');

      const snapshot = createStagedSnapshot(['file.txt'], gitDir);
      try {
        const snapContent = fs.readFileSync(path.join(snapshot.targetRoot, 'file.txt'), 'utf8');
        expect(snapContent).toBe('STAGED_BLOB_CONTENT');
      } finally {
        snapshot.cleanup();
      }
    });
  });

  describe('getOutgoingCommitObjects() and getTrackedFiles()', () => {
    it('returns empty array when repository has no commits', () => {
      expect(getOutgoingCommitObjects(gitDir)).toEqual([]);
      expect(getOutgoingFiles(gitDir)).toEqual([]);
    });

    it('retrieves commits and files when commits are present', () => {
      fs.writeFileSync(path.join(gitDir, 'commit1.txt'), 'c1');
      execSync('git add commit1.txt', { cwd: gitDir });
      execSync('git commit -m "first"', { cwd: gitDir });

      fs.writeFileSync(path.join(gitDir, 'commit2.txt'), 'c2');
      execSync('git add commit2.txt', { cwd: gitDir });
      execSync('git commit -m "second"', { cwd: gitDir });

      const objs = getOutgoingCommitObjects(gitDir);
      expect(objs.length).toBeGreaterThanOrEqual(2);
      expect(objs.some((o) => o.file === 'commit1.txt')).toBe(true);
      expect(objs.some((o) => o.file === 'commit2.txt')).toBe(true);

      const uniqueFiles = getOutgoingFiles(gitDir);
      expect(uniqueFiles).toContain('commit1.txt');
      expect(uniqueFiles).toContain('commit2.txt');

      const tracked = getTrackedFiles(gitDir);
      expect(tracked).toContain('commit1.txt');
      expect(tracked).toContain('commit2.txt');
    });
  });
});
