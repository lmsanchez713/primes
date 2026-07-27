import sys
from server import McpServer
from tools import initialize_all_tools

def main():
    # Initialize the server
    server = McpServer()
    
    # Register all tools
    initialize_all_tools(server)
    
    # Start the server loop
    server.run()

if __name__ == "__main__":
    main()
