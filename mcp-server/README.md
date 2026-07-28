# Python MCP Server

A lightweight, modular MCP (Model Context Protocol) server implemented in Python. This server allows LLMs to interact directly with your local development environment.

## Features

- **Filesystem Management**: Read, write, and delete files within a specified Git repository with built-in security checks.
- **Git Integration**: List all versioned files in a repository using `git ls-files`.
- **Build Automation**: Trigger `cmake` configuration and builds for your projects.
- **Code Execution**: Execute arbitrary Python code in a temporary, isolated directory.
- **Web Deployment**: Automatically deploy local web assets to a local development server (e.g., Apache) and open the browser.

## How to add to LM Studio

To use this server with LM Studio's MCP support, follow these steps:

1.  **Open LM Studio**.
2.  Navigate to the **MCP** section (usually found in the sidebar or within the Local Server settings).
3.  Click on **"Add Server"** or the **"+"** icon.
4.  Configure the server with the following settings:
    *   **Type**: `command`
    *   **Command**: `python` (or the full path to your python executable, e.g., `/usr/bin/python3` or `C:\\Python311\\python.exe`)
    *   **Arguments**: The absolute path to the `main.py` file in this repository.
        *   Example: `/Users/yourname/projects/mcp-server/python/main.py`
5.  **Save** the configuration.
6.  Ensure the server status shows as **"Connected"** or **"Running"**.

## Requirements

- Python 3.x
- `git` (for the `list_files` tool)
- `cmake` (for the `cmake_build` tool)
- (Optional) A local web server running on port 8080 for the `deploy` tool.

## Sample Claude Desktop Configuration

If you want to use this server with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "primes": {
      "command": "python",
      "args": [
        "/absolute/path/to/mcp-server/python/main.py"
      ]
    }
  }
}
```

## Security Note

The `write_file` and `delete_file` tools include security logic to ensure all operations are confined within the configured Git repository path, preventing directory traversal attacks.
