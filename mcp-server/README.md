# Python MCP Server

A lightweight, modular MCP (Model Context Protocol) server implemented in Python. This server allows LLMs to interact with local filesystems and directory structures.

## Features

### Directory Management
*   **`set_current_path`**: Sets the base working directory for all subsequent file operations. **Note: You must call this before performing any filesystem operations.**

### File Listing
*   **`list_files`**: Lists files and folders in the current directory (non-recursive).
*   **`show_file_tree`**: Recursively lists all files in the directory tree.

### Filesystem Operations
*   **`read_file`**: Reads the content of a file within the configured base directory.
*   **`write_file`**: Writes content to a file, creating directories as needed.
*   **`delete_file`**: Deletes a file from the base directory.

### Web Tools
*   **`get_web_page`**: Fetches and returns the text content of a web page via URL.

## Security Note

The `read_file`, `write_file`, and `delete_file` tools include security logic to ensure all operations are confined within the configured base directory, preventing directory traversal attacks.

## How to add to LM Studio

To use this server with LM Studio's MCP support, follow these steps:

1.  **Open LM Studio**.
2.  Navigate to the **MCP** section.
3.  Click on **"Add Server"** or the **"+"** icon.
4.  Configure the server:
    *   **Type**: `command`
    *   **Command**: `python` (or your python executable path)
    *   **Arguments**: The absolute path to the `main.py` file in this repository.
        *   Example: `/Users/yourname/projects/mcp-server/python/main.py`
5.  **Save** and ensure status is **"Connected"**.

## Requirements

*   Python 3.x
*   `requests`
*   `beautifulsoup4`

## Sample Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

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
