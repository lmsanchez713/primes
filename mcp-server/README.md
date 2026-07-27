# MCP Server (Python Port) Development Roadmap

## Phase 1: The MCP Engine (Core)
- [ ] Implement `McpServer` class (JSON-RPC 2.0 loop).
- [ ] Implement tool registration system.
- [ ] Implement `initialize` and `tools/list` methods.
- [ ] Implement state management (loading/saving `config.json`).
- [ ] Implement error handling and JSON-RPC response formatting.

## Phase 2: Filesystem & Security
- [ ] Implement `set_repo_path` with path resolution.
- [ ] Implement `is_path_inside_repo` security helper.
- [ ] Implement `list_files` (via `git ls-files`).
- [ ] Implement `read_file`.
- [ ] Implement `write_file` and `delete_file` with security validation.

## Phase 3: External & System Tools
- [ ] Implement `cmake_build` using `subprocess`.
- [ ] Implement `execute_python_code` with temporary directory management.
- [ ] Implement `deploy_to_local_web_server` using `shutil` and `webbrowser`.

## Phase 4: Finalization
- [ ] Refine error handling for all tool handlers.
- [ ] Implement logging to `sys.stderr`.
- [ ] Add CLI entry point in `main.py`.
