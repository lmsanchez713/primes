import subprocess
import os
import shutil
import tempfile
import webbrowser
from pathlib import Path
from typing import Any, Dict

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

    # 1. set_repo_path
    def handle_set_repo_path(args: Dict[str, Any]):
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
        "set_repo_path",
        "Define o caminho raiz do repositório Git",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Caminho absoluto ou relativo"}
            },
            "required": ["path"]
        },
        handle_set_repo_path
    )

    # 2. list_files
    def handle_list_files(args: Dict[str, Any]):
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set. Call set_repo_path first.", True)
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
        "list_files",
        "Lista todos os arquivos versionados no repositório",
        {"type": "object", "properties": {}},
        handle_list_files
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
        "Lê o conteúdo de um arquivo no repositório",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Caminho relativo"}
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
        "Escreve conteúdo em um arquivo (valida path para evitar directory traversal)",
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
        "Apaga um arquivo do repositório",
        {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        },
        handle_delete_file
    )

    # 6. cmake_build
    def handle_cmake_build(args: Dict[str, Any]):
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set.", True)
        
        build_type = args.get("build_type", "Release")
        targets = args.get("targets", [])
        
        build_dir = Path("C:/lumi/out/build") # As in C++ source
        
        try:
            # 1. Configure
            config_cmd = [
                "cmake", "-B", str(build_dir),
                "-DCMAKE_BUILD_TYPE=" + build_type,
                str(repo)
            ]
            config_res = subprocess.run(config_cmd, capture_output=True, text=True)
            if config_res.returncode != 0:
                return mcp_text(f"CMake configuration failed:\n{config_res.stderr}", True)

            # 2. Build
            build_cmd = ["cmake", "--build", str(build_dir)]
            if targets:
                for target in targets:
                    build_cmd.extend(["--target", target])
            
            build_res = subprocess.run(build_cmd, capture_output=True, text=True)
            if build_res.returncode != 0:
                return mcp_text(f"CMake build failed:\n{build_res.stderr}", True)

            return mcp_text(f"Build completed successfully:\n{build_res.stdout}")
        except Exception as e:
            return mcp_text(f"CMake execution error: {str(e)}", True)

    server.register_tool(
        "cmake_build",
        "Executa o build do CMake para o repositório.",
        {
            "type": "object",
            "properties": {
                "build_type": {"type": "string", "description": "Tipo de build (Debug, Release...)"},
                "targets": {"type": "array", "items": {"type": "string"}, "description": "Lista de targets"}
            }
        },
        handle_cmake_build
    )

    # 7. execute_python_code
    def handle_execute_python(args: Dict[str, Any]):
        code = args.get("code")
        if not code:
            return mcp_text("Missing required 'code' argument", True)
        
        repo_path = server.get_repo_path()
        if not repo_path:
            return mcp_text("Repository path not configured", True)

        files_to_pass = args.get("files", [])
        
        # Create temp dir
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_dir_path = Path(tmp_dir)
            resolved_files = []

            # Copy files
            for rel_path in files_to_pass:
                src = repo_path / rel_path
                dst = tmp_dir_path / rel_path
                if not src.exists():
                    return mcp_text(f"File not found: {rel_path}", True)
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                resolved_files.append(str(dst.resolve()))

            # Run python
            try:
                # We pass the code via stdin to python to avoid shell injection issues
                # and we run from the temp directory so imports work relative to it
                process = subprocess.run(
                    [sys.executable, "-c", code],
                    cwd=str(tmp_dir_path),
                    capture_output=True,
                    text=True,
                    timeout=30 # Safety timeout
                )
                
                if process.returncode != 0:
                    return mcp_text(f"Python error: {process.stderr}", True)
                
                return mcp_text(process.stdout)
            except subprocess.TimeoutExpired:
                return mcp_text("Python execution timed out.", True)
            except Exception as e:
                return mcp_text(f"Python execution error: {str(e)}", True)

    server.register_tool(
        "execute_python_code",
        "Executa código Python enviado pelo cliente.",
        {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}},
                "args": {"type": "object"}
            },
            "required": ["code"]
        },
        handle_execute_python
    )

    # 8. deploy_to_local_web_server
    def handle_deploy_web(args: Dict[str, Any]):
        path_suffix = args.get("path", "").lstrip("/")
        repo = server.get_repo_path()
        if not repo:
            return mcp_text("Repo path not set.", True)

        # In C++ source it used: projects/web_front/html
        # But also had a specific hardcoded path in the tool: 
        # std::filesystem::path src_dir = std::filesystem::path(repo) / "project-will/web-client";
        # I'll use the one from C++ implementation for consistency
        src_dir = repo / "project-will" / "web-client"
        dest_dir = Path("C:/code/httpd/Apache24/htdocs") # Hardcoded in C++

        if not src_dir.exists():
            return mcp_text(f"Source directory not found: {src_dir}", True)

        try:
            if dest_dir.exists():
                shutil.rmtree(dest_dir)
            shutil.copytree(src_dir, dest_dir)
            
            url = f"http://127.0.0.1:8080/{path_suffix}"
            webbrowser.open(url)
            return mcp_text(f"Files copied to {dest_dir}. Browser opened at {url}")
        except Exception as e:
            return mcp_text(f"Failed to deploy: {str(e)}", True)

    server.register_tool(
        "deploy_to_local_web_server",
        "Copia o conteúdo da pasta web_client para o servidor web local e abre o navegador.",
        {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path opcional no site para abrir no navegador"}
            }
        },
        handle_deploy_web
    )

def initialize_all_tools(server):
    register_all_tools(server)
