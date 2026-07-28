import subprocess
import os
import shutil
import tempfile
import webbrowser
from pathlib import Path
from typing import Any, Dict
import sys

def mcp_text(text: str, is_error: bool = False) -> Dict[str, Any]:
    """Formats text as an MCP content block."""
    return {
        "content": [{"type": "text", "text": text}],
        "isError": is_error
    }

def is_path_inside_repo(repo_path: Path, target_path: Path) -> bool:
    """Security check: Ensures the target path is inside the repository."""
    try:
        return Path(target_path).resolve().is_relative_to(repo_path.resolve())
    except ValueError:
        return False

def register_all_tools(server):
    """Registers all the tools for the server."""

    # 1. set_repository_path
    def handle_set_repository_path(args: Dict[str, Any]):
        path_str = args.get("path")
        if not path_str:
            return mcp_text("Missing path parameter", True)
        try:
            abs_path = Path(path_str).resolve()
            if not abs_path.exists():
                return mcp_text(f"Path does not exist: {abs_path}", True)
            server.set_repo_path(str(abs_path))
            return mcp_text(f"Repository path set to: {abs_path}")
        except Exception as e:
            return mcp_text(f"Error setting path: {str(e)}", True)
    
    server.register_tool(
        "set_repository_path",
        "Define the root path of the Git repository",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative path"}
            },
            "required": ["path"]
        },
        handle_set_repository_path
    )

    # 2. list_repository_file_tree
    def handle_list_repository_file_tree(args: Dict[str, Any]):
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set. Call set_repository_path first.", True)
        try:
            result = subprocess.run(
                ["git", "-C", str(repo), "ls-files"],
                capture_output=True, text=True, check=True
            )
            return mcp_text(result.stdout)
        except subprocess.CalledProcessError as e:
            return mcp_text(f"Git error: {e.stderr}", True)
        except Exception as e:
            return mcp_text(f"Error listing files: {str(e)}", True)

    server.register_tool(
        "list_repository_file_tree",
        "Lists all versioned files in the repository",
        {"type": "object", "properties": {}},
        handle_list_repository_file_tree
    )

    # 3. read_file
    def handle_read_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        if not rel_path_str:
            return mcp_text("Missing 'path' argument", True)
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set.", True)
        
        full_path = (repo / rel_path_str).resolve()
        if not full_path.exists():
            return mcp_text(f"File not found: {full_path}", True)
        if not is_path_inside_repo(repo, full_path):
            return mcp_text("Access denied: Path outside repository", True)

        try:
            return mcp_text(full_path.read_text(encoding="utf-8"))
        except Exception as e:
            return mcp_text(f"Failed to read file: {str(e)}", True)

    server.register_tool(
        "read_file",
        "Reads the content of a file in the repository",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path"}
            },
            "required": ["path"]
        },
        handle_read_file
    )

    # 4. write_file
    def handle_write_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        content = args.get("content")
        if not rel_path_str or content is None:
            return mcp_text("Missing 'path' or 'content' argument", True)
        
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set.", True)

        full_path = (repo / rel_path_str).resolve()
        if not is_path_inside_repo(repo, full_path):
            return mcp_text("Path must be inside the repository", True)

        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            return mcp_text(f"File written successfully at {rel_path_str}")
        except Exception as e:
            return mcp_text(f"Failed to write file: {str(e)}", True)

    server.register_tool(
        "write_file",
        "Writes content to a file (validates path to prevent directory traversal)",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        },
        handle_write_file
    )

    # 5. delete_file
    def handle_delete_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        if not rel_path_str:
            return mcp_text("Missing 'path' argument", True)
        
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set.", True)

        full_path = (repo / rel_path_str).resolve()
        if not is_path_inside_repo(repo, full_path):
            return mcp_text("Path must be inside the repository", True)

        try:
            if full_path.exists():
                full_path.unlink()
                return mcp_text("File deleted successfully.")
            else:
                return mcp_text("File does not exist.", True)
        except Exception as e:
            return mcp_text(f"Failed to delete file: {str(e)}", True)

    server.register_tool(
        "delete_file",
        "Deletes a file from the repository",
        {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        },
        handle_delete_file
    )

def initialize_all_tools(server):
    register_all_tools(server)
