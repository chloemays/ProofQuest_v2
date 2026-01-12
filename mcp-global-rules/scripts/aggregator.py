"""
MCP Aggregator
==============
Runs multiple MCP commands in sequence for high-level workflows.
"""

from pathlib import Path
import sys
import os

from .utils import Console, find_project_root

def run_command(command_name: str, args: list = None):
    """Import and run an MCP command."""
    # We need to import the aggregator COMMANDS mapping or use a local version
    # Since we can't easily import from ..mcp due to execution context, 
    # we'll map the common ones here.
    
    mapping = {
        'index-all': 'index_all',
        'recall': 'memory',
        'autocontext': 'autocontext',
        'review': 'review',
        'security': 'security',
        'profile': 'profile',
        'architecture': 'architecture',
        'todos': 'todo_index',
    }
    
    if command_name not in mapping:
        Console.fail(f"Unknown command mapping: {command_name}")
        return 1
        
    module_name = mapping[command_name]
    try:
        module = __import__(f'scripts.{module_name}', fromlist=[module_name])
        
        # Save original argv
        old_argv = list(sys.argv)
        
        # Mock sys.argv for the target module
        sys.argv = [f'scripts/{module_name}.py'] + (args or [])
        
        result = 0
        if hasattr(module, 'main'):
            result = module.main() or 0
        else:
            Console.fail(f"Module {module_name} has no main function")
            result = 1
            
        # Restore argv
        sys.argv = old_argv
        return result
    except Exception as e:
        Console.fail(f"Error running {command_name}: {e}")
        return 1

def brain_load():
    """Deep context, memory, and indexing."""
    Console.header("Brain Load: Deep Context & Indexing")
    
    Console.info("Step 1: Rebuilding all indexes...")
    run_command('index-all')
    
    Console.info("Step 2: Recalling project state...")
    run_command('recall', ['project'])
    
    Console.info("Step 3: Loading auto-context...")
    run_command('autocontext', ['--auto'])
    
    Console.ok("Brain load complete.")
    return 0

def guard_rail(path: str = "."):
    """Full quality and security audit."""
    Console.header(f"Guard Rail Audit: {path}")
    
    Console.info("Step 1: Strict Code Review...")
    run_command('review', [path, '--strict'])
    
    Console.info("Step 2: Security Audit...")
    run_command('security', [path])
    
    Console.info("Step 3: Performance & Complexity Profile...")
    run_command('profile', [path])
    
    Console.info("Step 4: Architecture Validation...")
    run_command('architecture', [path])
    
    Console.ok("Guard rail audit complete.")
    return 0

def next_step():
    """Aggregated tasks, todos, and roadmap."""
    Console.header("Next Steps & Roadmap")
    
    Console.info("--- Current TODOs ---")
    run_command('todos')
    
    Console.info("\n--- Recalled Tasks ---")
    run_command('recall', ['tasks'])
    
    # Try to find README development section
    root = find_project_root()
    readme = root / 'README.md'
    if readme.exists():
        Console.info("\n--- README Roadmap ---")
        try:
            content = readme.read_text(encoding='utf-8')
            if 'Roadmap' in content:
                roadmap = content.split('Roadmap')[1].split('##')[0]
                print(roadmap.strip())
            elif 'Phase' in content:
                lines = content.split('\n')
                phases = [line for line in lines if '- [' in line]
                print('\n'.join(phases))
        except Exception:
            pass
            
    Console.ok("Next steps synthesis complete.")
    return 0

def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        return 1
        
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    if cmd == 'brain-load':
        return brain_load()
    elif cmd == 'guard-rail':
        return guard_rail(args[0] if args else ".")
    elif cmd == 'next-step':
        return next_step()
    else:
        Console.fail(f"Unknown mega-command: {cmd}")
        return 1
