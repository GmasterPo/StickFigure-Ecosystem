#!/usr/bin/env node
// Drift check for the workspace mirror of this repository.
//
// These two files are the canonical ones. A development workspace keeps the same two
// paths at its root as links to this repository, so there is only ever one copy to
// edit. A checkout that cannot create links (Windows without core.symlinks=true), a
// hand-made copy, or a regenerated manifest silently breaks that, and nobody notices.
//
//   node tools/check-sync.mjs          # check; exit 1 on drift
//   node tools/check-sync.mjs --fix    # restore the root links
//
// The mirror check runs only when this repository sits next to the other four
// StickFigure-* repositories, so a standalone clone stays quiet.

import { existsSync, readFileSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parent = resolve(repoRoot, '..');
const workspaceSiblings = [
  'StickFigure-Animation-Engine',
  'StickFigure-Combat',
  'StickFigure-Movement',
  'StickFigure-Physics',
];

export const pairs = ['README.md', 'ecosystem.json'].map((name) => ({
  name,
  canonical: join(repoRoot, name),
  mirror: join(parent, name),
}));

const sameFile = (a, b) => {
  try {
    const sa = statSync(a);
    const sb = statSync(b);
    return sa.ino === sb.ino && sa.dev === sb.dev;
  } catch {
    return false;
  }
};

const identical = (a, b) => {
  try {
    return readFileSync(a).equals(readFileSync(b));
  } catch {
    return false;
  }
};

// Guards the manifest itself: a stale regeneration is the other way drift arrives.
function selfCheck(problems) {
  try {
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'ecosystem.json'), 'utf8'));
    const clips = manifest.repositories.reduce((sum, repo) => sum + repo.clips, 0);
    if (manifest.totals.repositories !== manifest.repositories.length) {
      problems.push(
        `totals.repositories is ${manifest.totals.repositories}, manifest lists ${manifest.repositories.length}`,
      );
    }
    if (manifest.totals.clips !== clips) {
      problems.push(`totals.clips is ${manifest.totals.clips}, repositories sum to ${clips}`);
    }
    if (manifest.repositoryUrls.note?.includes('Placeholder')) {
      problems.push('ecosystem.json still carries the placeholder organisation note');
    }
    console.log(
      `ok    ecosystem.json: ${manifest.repositories.length} repositories, ${clips} clips, ${manifest.totals.spriteAtlases} atlases`,
    );
  } catch (error) {
    problems.push(`ecosystem.json unreadable: ${error.message}`);
  }

  const readme = join(repoRoot, 'README.md');
  try {
    const text = readFileSync(readme, 'utf8');
    if (/github\.com\/stickfigure\//.test(text)) {
      problems.push('README.md still points at the placeholder organisation');
    }
  } catch (error) {
    problems.push(`README.md unreadable: ${error.message}`);
  }
}

function mirrorCheck(problems, fix) {
  if (!workspaceSiblings.every((name) => existsSync(join(parent, name)))) {
    console.log(`skip  mirror check: no workspace alongside ${repoRoot}`);
    return;
  }
  for (const { canonical, mirror } of pairs) {
    const label = relative(parent, mirror);
    if (!existsSync(mirror)) {
      console.log(`note  ${label} is absent from the workspace root`);
      continue;
    }
    if (sameFile(mirror, canonical)) {
      console.log(`ok    ${label} -> ${relative(parent, canonical)}`);
      continue;
    }
    if (!fix) {
      problems.push(
        identical(mirror, canonical)
          ? `${label} is a copy of ${relative(parent, canonical)}, not a link (run with --fix)`
          : `${label} has drifted from ${relative(parent, canonical)}`,
      );
      continue;
    }
    try {
      unlinkSync(mirror);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    try {
      symlinkSync(relative(parent, canonical), mirror);
      console.log(`fixed ${label} -> ${relative(parent, canonical)}`);
    } catch (error) {
      problems.push(`could not link ${label}: ${error.message}`);
    }
  }
}

export function checkSync({ fix = false } = {}) {
  const problems = [];
  selfCheck(problems);
  mirrorCheck(problems, fix);
  return problems;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const problems = checkSync({ fix: process.argv.includes('--fix') });
  for (const problem of problems) console.log('FAIL', problem);
  console.log(problems.length === 0 ? 'INDEX FILES IN SYNC' : `${problems.length} PROBLEMS`);
  process.exit(problems.length === 0 ? 0 : 1);
}
