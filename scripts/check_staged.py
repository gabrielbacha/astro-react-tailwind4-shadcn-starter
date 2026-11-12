#!/usr/bin/env python3
"""Read-only local-tool checks of staged bytes/config, with no package preparation."""
from __future__ import annotations
import subprocess
import tempfile
from pathlib import Path

FORMAT_SUFFIXES = {'.astro', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.jsonc', '.md', '.mdx', '.css', '.yml', '.yaml'}
LINT_SUFFIXES = {'.astro', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'}
CONFIGS = {'oxfmt': ('.oxfmtrc.json', '.oxfmtrc.jsonc'), 'oxlint': ('.oxlintrc.json', '.oxlintrc.jsonc')}

def git(root, *args): return subprocess.check_output(['git', '-C', str(root), *args])

def run(project: Path) -> int:
    project = project.resolve()
    root = Path(git(project, 'rev-parse', '--show-toplevel').decode().strip())
    paths = [p.decode() for p in git(root, 'diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR').split(b'\0') if p]
    with tempfile.TemporaryDirectory(prefix='staged-quality-') as directory:
        snapshot = Path(directory); copied = {}
        # Resolve stylesheet plugins from the installed local toolchain only.
        # This link does not copy or execute package preparation or env loaders.
        dependencies = project / 'node_modules'
        if dependencies.is_dir():
            (snapshot / 'node_modules').symlink_to(dependencies.resolve(), target_is_directory=True)
        def copy_entry(path):
            relative = Path(path)
            if relative.is_absolute() or '..' in relative.parts: raise ValueError('staged path is outside the repository')
            entry = git(root, 'ls-files', '--stage', '--', ':(literal)' + path).decode()
            if not entry.startswith('100'): return None  # No symlinks/submodules/external targets.
            target = snapshot / relative; target.parent.mkdir(parents=True, exist_ok=True)
            data = git(root, 'show', ':' + path); target.write_bytes(data); copied[target] = data
            return target
        targets = [target for path in paths if Path(path).suffix.lower() in FORMAT_SUFFIXES and (target := copy_entry(path))]
        if not targets: return 0
        tracked = [p.decode() for p in git(root, 'ls-files', '-z').split(b'\0') if p]
        # Formatter stylesheet references use the committed/staged version as well.
        for path in tracked:
            if Path(path).suffix.lower() == '.css': copy_entry(path)
        configs = {}
        for tool, names in CONFIGS.items():
            for name in names:
                relative = (project.relative_to(root) / name).as_posix()
                if relative in tracked and (target := copy_entry(relative)):
                    configs[tool] = target; break
        for tool, flag, files in [('oxfmt', '--check', targets), ('oxlint', None, [p for p in targets if p.suffix.lower() in LINT_SUFFIXES])]:
            if not files: continue
            executable = next((base / 'node_modules' / '.bin' / tool for base in [project, root] if (base / 'node_modules' / '.bin' / tool).is_file()), None)
            if executable is None:
                print(f'Missing installed local {tool}. Complete the repository frozen install before committing. No install was started.'); return 1
            command = [str(executable)]
            if flag: command.append(flag)
            if tool in configs: command.extend(['--config', str(configs[tool])])
            command.extend(str(path) for path in files)
            result = subprocess.run(command, cwd=snapshot, check=False)
            if any(path.read_bytes() != data for path, data in copied.items()):
                print('A checker changed the temporary snapshot. The real index and worktree were not changed.'); return 1
            if result.returncode:
                print('Staged checks failed. Run explicit fixes, review the hunks, then stage only intended changes.'); return result.returncode
        return 0

if __name__ == '__main__': raise SystemExit(run(Path.cwd()))
