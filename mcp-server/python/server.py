import sys
import json
import os
from pathlib import Path
from typing import Any, Callable, Dict, Optional

class McpServer:
    def __init__(self, server_name: str = "prime-mcp", server_version: str = "1.0.0"):
        self.server_name = server_name
        self.server_version = server_version
        self.tools: Dict[str, Dict[str, Any]] = {}
        self.base_dir: Optional[Path] = None
        self.working_dir: Optional[Path] = None
        self.config_path = Path("mcp-config.json")

    def register_tool(self, name: str, description: str, input_schema: Dict[str, Any], handler: Callable[[Dict[str, Any]], Any]):
        """Registers a tool with its metadata and handler."""
        self.tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": input_schema,
            "handler": handler
        }

    def set_server_info(self, name: str, version: str):
        self.server_name = name
        self.server_version = version
        self.save_state()

    def set_base_dir(self, path: str):
        self.base_dir = Path(path).resolve()
        self.save_state()

    def set_working_dir(self, path: str):
        self.working_dir = Path(path).resolve()
        self.save_state()

    def get_base_dir(self) -> Optional[Path]:
        return self.base_dir

    def get_working_dir(self) -> Optional[Path]:
        return self.working_dir

    def load_state(self):
        if self.config_path.exists():
            try:
                with open(self.config_path, "r") as f:
                    config = json.load(f)
                    self.base_dir = Path(config.get("base_dir", "")).resolve() if config.get("base_dir") else None
                    self.working_dir = Path(config.get("working_dir", "")).resolve() if config.get("working_dir") else None
                    self.server_name = config.get("server_name", self.server_name)
                    self.server_version = config.get("server_version", self.server_version)
                    self.log("STATE LOADED")
            except Exception as e:
                self.log(f"ERROR LOADING STATE: {e}")
        else:
            self.log("NO STATE FILE FOUND")

    def save_state(self):
        state = {
            "base_dir": str(self.base_dir) if self.base_dir else "",
            "working_dir": str(self.working_dir) if self.working_dir else "",
            "server_name": self.server_name,
            "server_version": self.server_version,
        }
        try:
            with open(self.config_path, "w") as f:
                json.dump(state, f, indent=4)
        except Exception as e:
            self.log(f"ERROR SAVING STATE: {e}")

    def log(self, message: str):
        """Logs to stderr to avoid interfering with stdout."""
        sys.stderr.write(f"[LOG] {message}\n")
        sys.stderr.flush()

    def send_response(self, id: Any, result: Any):
        response = {
            "jsonrpc": "2.0",
            "result": result
        }
        if id is not None:
            response["id"] = id
        self.send_output(response)

    def send_error(self, id: Any, code: int, message: str):
        response = {
            "jsonrpc": "2.0",
            "error": {
                "code": code,
                "message": message
            }
        }
        if id is not None:
            response["id"] = id
        self.send_output(response)

    def send_output(self, data: Dict[str, Any]):
        output = json.dumps(data)
        self.log(f"SEND: {output}")
        sys.stdout.write(output + "\n")
        sys.stdout.flush()

    def process_input(self, line: str):
        line = line.strip()
        if not line:
            return
        
        self.log(f"RECV: {line}")
        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            self.send_error(None, -32700, f"Parse error: {str(e)}")
            return

        if request.get("jsonrpc") != "2.0":
            return

        method = request.get("method")
        request_id = request.get("id")

        if method == "initialize":
            self.send_response(request_id, {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": self.server_name, "version": self.server_version}
            })

        elif method == "tools/list":
            tools_list = [
                {
                    "name": t["name"],
                    "description": t["description"],
                    "inputSchema": t["inputSchema"]
                }
                for t in self.tools.values()
            ]
            self.send_response(request_id, {"tools": tools_list})

        elif method == "tools/call":
            params = request.get("params", {})
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            if not tool_name or tool_name not in self.tools:
                self.send_error(request_id, -32601, f"Tool not found: {tool_name}")
                return

            tool = self.tools[tool_name]
            try:
                result = tool["handler"](arguments)
                # Ensure result is wrapped in an MCP content block if it's just text
                if isinstance(result, str):
                    result = {"content": [{"type": "text", "text": result}]}
                self.send_response(request_id, result)
            except Exception as e:
                self.send_error(request_id, -32603, f"Tool execution error: {str(e)}")

        elif request_id is not None:
            self.send_error(request_id, -32601, f"Method not found: {method}")

    def run(self):
        self.load_state()
        for line in sys.stdin:
            self.process_input(line)
