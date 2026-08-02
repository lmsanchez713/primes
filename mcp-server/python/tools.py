import os
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional, List
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

def mcp_text(text: str, is_error: bool = False) -> Dict[str, Any]:
    """Formats text as an MCP content block."""
    return {
        "content": [{"type": "text", "text": text}],
        "isError": is_error
    }

def is_path_inside_dir(base_dir: Path, target_path: Path) -> bool:
    """Security check: Ensures the target path is inside the base directory."""
    try:
        # Use resolve() to handle '..' and symlinks before checking relativity
        return target_path.resolve().is_relative_to(base_dir.resolve())
    except (ValueError, RuntimeError):
        return False

def register_all_tools(server):
    """Registers all the tools for the server."""

    def get_base_path() -> Optional[Path]:
        """Returns the base directory if set, otherwise falls back to working dir."""
        base_path = server.get_base_dir()
        if base_path:
            return Path(base_path).resolve()
        
        wd = server.get_working_dir()
        if wd:
            return Path(wd).resolve()
        return None

    def resolve_safe_path(rel_path_str: str) -> (Optional[Path], Optional[str]):
        """
        Sanitizes the input path and ensures it stays within the base directory.
        Returns (Absolute Path, Error Message).
        """
        base_path = get_base_path()
        if not base_path:
            return None, "Base directory not set. Call set_current_path first."

        # 1. Sanitize input: Remove leading slashes and './' to prevent Path 
        # from treating it as an absolute root path.
        sanitized_rel = rel_path_str.lstrip('./').lstrip('/')
        if not sanitized_rel:
            return None, "Invalid relative path provided."

        # 2. Construct full path
        full_path = (base_path / sanitized_rel).resolve()

        # 3. Security Check: Prevent directory traversal outside the base directory
        if not is_path_inside_dir(base_path, full_path):
            return None, f"Security error: Path '{rel_path_str}' is outside the base directory."

        return full_path, None

    # 1. set_current_path
    def handle_set_current_path(args: Dict[str, Any]):
        path_str = args.get("path")
        if not path_str:
            return mcp_text("Missing path parameter", True)
        try:
            abs_path = Path(path_str).resolve()
            if not abs_path.exists():
                return mcp_text(f"Path does not exist: {abs_path}", True)
            server.set_base_dir(str(abs_path))
            return mcp_text(f"Base directory set to: {abs_path}")
        except Exception as e:
            return mcp_text(f"Error setting path: {str(e)}", True)
    
    server.register_tool(
        "set_current_path",
        "Set the base directory for all file operations",
        {
            "type": "object",
            "properties": {
                "path": { "type": "string", "description": "Absolute or relative path" }
            },
            "required": ["path"]
        },
        handle_set_current_path
    )

    # 2. show_file_tree
    def handle_show_file_tree(args: Dict[str, Any]):
        base_path = get_base_path()
        if not base_path:
            return mcp_text("Base directory not set. Call set_current_path first.", True)
        try:
            file_list = []
            for root, dirs, filenames in os.walk(base_path):
                for filename in filenames:
                    full_path = Path(root) / filename
                    try:
                        rel_path = full_path.relative_to(base_path)
                        file_list.append(str(rel_path))
                    except ValueError:
                        # This might happen if there are symlinks outside the base dir
                        continue
            
            if not file_list:
                return mcp_text("Directory is empty.")
            
            return mcp_text("\n".join(sorted(file_list)))
        except Exception as e:
            return mcp_text(f"Error listing files: {str(e)}", True)

    server.register_tool(
        "show_file_tree",
        "Lists all files in the directory tree",
        {"type": "object", "properties": {}},
        handle_show_file_tree
    )

    # 3. list_files (non-recursive)
    def handle_list_files(args: Dict[str, Any]):
        base_path = get_base_path()
        if not base_path:
            return mcp_text("Base directory not set. Call set_current_path first.", True)
        try:
            if not base_path.is_dir():
                return mcp_text(f"Base path is not a directory: {base_path}", True)
            items = []
            for entry in base_path.iterdir():
                items.append(entry.name)
            
            if not items:
                return mcp_text("Directory is empty.")
            
            return mcp_text("\n".join(sorted(items)))
        except Exception as e:
            return mcp_text(f"Error listing directory contents: {str(e)}", True)

    server.register_tool(
        "list_files",
        "Lists files and folders in the current directory (non-recursive)",
        {"type": "object", "properties": {}},
        handle_list_files
    )

    # 4. read_file
    def handle_read_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        if not rel_path_str:
            return mcp_text("Missing 'path' argument", True)
        
        full_path, error = resolve_safe_path(rel_path_str)
        if error:
            return mcp_text(error, True)

        if not full_path.exists():
            return mcp_text(f"File not found: {full_path}", True)
        
        try:
            return mcp_text(full_path.read_text(encoding="utf-8"))
        except Exception as e:
            return mcp_text(f"Failed to read file: {str(e)}", True)

    server.register_tool(
        "read_file",
        "Reads the content of a file",
        {
            "type": "object",
            "properties": {
                "path": { "type": "string", "description": "Relative path from base directory" }
            },
            "required": ["path"]
        },
        handle_read_file
    )

    # 5. write_file
    def handle_write_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        content = args.get("content")
        if not rel_path_str or content is None:
            return mcp_text("Missing 'path' or 'content' argument", True)
        
        full_path, error = resolve_safe_path(rel_path_str)
        if error:
            return mcp_text(error, True)

        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            return mcp_text(f"File written successfully at {rel_path_str}")
        except Exception as e:
            return mcp_text(f"Failed to write file: {str(e)}", True)

    server.register_tool(
        "write_file",
        "Writes content to a file",
        {
            "type": "object",
            "properties": {
                "path": { "type": "string" },
                "content": { "type": "string" }
            },
            "required": ["path", "content"]
        },
        handle_write_file
    )

    # 6. delete_file
    def handle_delete_file(args: Dict[str, Any]):
        rel_path_str = args.get("path")
        if not rel_path_str:
            return mcp_text("Missing 'path' argument", True)
        
        full_path, error = resolve_safe_path(rel_path_str)
        if error:
            return mcp_text(error, True)

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
        "Deletes a file from the base directory",
        {
            "type": "object",
            "properties": { "path": { "type": "string" } },
            "required": ["path"]
        },
        handle_delete_file
    )

    # 7. google_search
    # didn't work, have to check the right way (api key?)

    # 8. get_web_page
    def handle_get_web_page(args: Dict[str, Any]):
        url = args.get("url")
        if not url:
            return mcp_text("Missing 'url' argument", True)
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose()
            
            text = soup.get_text(separator='\n', strip=True)
            return mcp_text(text[:5000])  # Limit to 5000 chars for brevity
        except Exception as e:
            return mcp_text(f"Failed to fetch page: {str(e)}", True)

    server.register_tool(
        "get_web_page",
        "Get the content of a web page",
        {
            "type": "object",
            "properties": {
                "url": { "type": "string", "description": "The URL of the web page" }
            },
            "required": ["url"]
        },
        handle_get_web_page
    )

    # 6. cmake_build (Ported from C++)
    def handle_cmake_build(args: Dict[str, Any]):
        import subprocess
        base_path = get_base_path()
        if not base_path:
            return mcp_text("Repo path not set. Call set_current_path first.", True)

        build_type = args.get("build_type", "Release")
        targets = args.get("targets", [])
        if not isinstance(targets, list):
            targets = []

        build_dir = Path(r"C:\primes\out\build")
        cmake_exe = Path(r"C:\code\cmake\bin\cmake.exe")

        if not cmake_exe.exists():
            return mcp_text(f"CMake executable not found at {cmake_exe}", True)

        config_cmd = [
            str(cmake_exe),
            "-B", str(build_dir),
            f"-DCMAKE_BUILD_TYPE={build_type}",
            str(base_path)
        ]

        try:
            config_proc = subprocess.run(config_cmd, capture_output=True, text=True, shell=False)
            config_output = config_proc.stdout + config_proc.stderr
            
            if "Error" in config_output or "error" in config_output:
                return mcp_text(f"CMake configuration failed:\n{config_output}", True)

            build_cmd = [str(cmake_exe), "--build", str(build_dir)]
            for target in targets:
                build_cmd.extend(["--target", str(target)])

            build_proc = subprocess.run(build_cmd, capture_output=True, text=True, shell=False)
            build_output = build_proc.stdout + build_proc.stderr

            if "Error" in build_output or "error" in build_output:
                return mcp_text(f"CMake build failed:\n{build_output}", True)

            return mcp_text(f"Build completed successfully.\n{build_output}")

        except subprocess.CalledProcessError as e:
            return mcp_text(f"Subprocess error during cmake build: {str(e)}", True)
        except Exception as e:
            return mcp_text(f"Unexpected error during cmake build: {str(e)}", True)

    server.register_tool(
        "cmake_build",
        "Executa o build do CMake para o repositÃ³rio. Configura e compila os targets especificados.",
        {
            "type": "object",
            "properties": {
                "build_type": { "type": "string", "description": "Tipo de build (Debug, Release, RelWithDebInfo, MinSizeRel)" },
                "targets": { "type": "array", "items": { "type": "string" }, "description": "Lista de targets para build. Se vazio, builda tudo." }
            },
            "required": []
        },
        handle_cmake_build
    )

    # 7. execute_python_code
    #def handle_execute_python_code(args: Dict[str, Any]):
    #    code = args.get("code", "")
    #    if not code:
    #        return mcp_text("Missing required 'code' argument", True)
    #
    #    files_to_pass = args.get("files", [])
    #    if not isinstance(files_to_pass, list):
    #        files_to_pass = []
    #
    #    repo_path = get_base_path()
    #    if not repo_path:
    #        return mcp_text("Repository path not configured", True)
    #
    #    resolved_files = []
    #    for rel in files_to_pass:
    #        full = repo_path / rel
    #        if not full.exists():
    #            return mcp_text(f"File not found: {rel}", True)
    #        resolved_files.append(str(full))
    #
    #    import tempfile
    #    import shutil
    #    with tempfile.TemporaryDirectory(prefix="mcp_py_") as temp_dir:
    #        temp_dir_path = Path(temp_dir)
    #        try:
    #            script_file = temp_dir_path / "script.py"
    #            script_file.write_text(code, encoding="utf-8")
    #
    #            for rel in files_to_pass:
    #                src = repo_path / rel
    #                dst = temp_dir_path / rel
    #                dst.parent.mkdir(parents=True, exist_ok=True)
    #                shutil.copy2(src, dst)
    #
    #            result = subprocess.run(
    #                ["python", str(script_file)],
    #                cwd=str(temp_dir_path),
    #                capture_output=True,
    #                text=True,
    #                timeout=30
    #            )
    #            
    #            output = result.stdout
    #            if result.stderr:
    #                output += "\n" + result.stderr
    #            
    #            return mcp_text(output)
    #
    #        except subprocess.TimeoutExpired:
    #            return mcp_text("Python script timed out.", True)
    #        except Exception as e:
    #            return mcp_text(f"Python execution error: {str(e)}", True)
    #
    #server.register_tool(
    #    "execute_python_code",
    #    "Executa cÃ³digo Python enviado pelo cliente e devolve a saÃ­da",
    #    {
    #        "type": "object",
    #        "properties": {
    #            "code": { "type": "string", "description": "CÃ³digo Python a ser executado" },
    #            "files": {
    #                "type": "array",
    #                "items": { "type": "string", "description": "Caminhos relativos de arquivos a serem disponibilizados ao script" },
    #                "default": []
    #            },
    #            "args": {
    #                "type": "object",
    #                "description": "Argumentos adicionais (opcional)",
    #                "default": {}
    #            }
    #        },
    #        "required": ["code"]
    #    },
    #    handle_execute_python_code
    #)

    # 8. deploy_web_front_local
    #def handle_deploy_to_local_web_server(args: Dict[str, Any]):
    #    path = args.get("path", "/")
    #    if path and not path.startswith('/'):
    #        path = '/' + path
    #
    #    dest_dir = Path(r"C:\code\httpd\Apache24\htdocs")
    #    repo_path = get_base_path()
    #    if not repo_path:
    #        return mcp_text("Repo path not set.", True)
    #
    #    src_dir = repo_path / "project-will/web-client"
    #    if not src_dir.exists():
    #        return mcp_text(f"Source directory not found: {src_dir}", True)
    #
    #    try:
    #        import shutil
    #        import webbrowser
    #        shutil.copytree(src_dir, dest_dir, dirs_exist_ok=True)
    #        webbrowser.open(f"http://127.0.0.1:8080{path}")
    #        return mcp_text(f"Files copied to {dest_dir}. Browser opened at 127.0.0.1{path}")
    #    except Exception as e:
    #        return mcp_text(f"Failed to copy files: {str(e)}", True)
    #
    #server.register_tool(
    #    "deploy_to_local_web_server",
    #    "Copia o conteÃºdo da pasta web_front/html para o servidor web local de desenvolvimento e abre o navegador no endereÃ§o 127.0.0.1.",
    #    {
    #        "type": "object",
    #        "properties": {
    #            "path": { "type": "string", "description": "Path opcional no site para abrir no navegador" }
    #        },
    #        "required": []
    #    },
    #    handle_deploy_to_local_web_server
    #)

def initialize_all_tools(server):
    register_all_tools(server)
