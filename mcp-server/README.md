# Python MCP Server

A lightweight, modular MCP (Model Context Protocol) server implemented in Python. This server allows LLMs to interact with local filesystems and directory structures.

## Features

- **Directory Management**: Set the base working directory for all file operations using `set_current_path`.
- **File Listing**: 
    - `list_files`: List files and folders in the current directory (non-recursive).
    - `show_file_tree`: Lists all files in the directory tree recursively.
- **Filesystem Operations**: Read, write, and delete files within the configured base directory with built-in security checks to prevent directory traversal.
- **Web Tools**:
    - `google_search`: Search Google for a query.
    - `get_web_page`: Get the content of a web page.

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
- `requests`
- `beautifulsoup4`

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

The `write_file`, `read_file`, and `delete_file` tools include security logic to ensure all operations are confined within the configured base directory, preventing directory traversal attacks.
