---
title: MCP Server
date: 2025-12-20 10:00:00
categories: blogs
tags:
    - MCP
    - AI
    - Agentic
toc: true
layout: post
---

This blog post explains **MCP Server** and how to set it up using **FastMCP**. Additionally, it demonstrates how to create a simple AI Agent client that connects to the MCP server and utilizes the exposed tools.

<!-- more -->

## 🚀 What is MCP Server?

In simple terms, **MCP Server** is like a tool API server for AI agents.

Instead of keeping tools (functions like “search”, “read file”, “add numbers”) inside your agent code, you host them on a server. Any MCP-compatible client can connect to that server and call the tools.

### 💡 The Basic Idea

* **Client/Agent**: The app that chats with the model (Claude Desktop, Cursor, Copilot, or your own Python app).
* **Model**: The LLM that decides what to do (answer directly vs call a tool).
* **MCP Server**: The server that actually runs tools and returns results.

### 🔄 Request/Response Flow

1. The **client** constructs the tool call request (tool name + JSON parameters).
2. Sends it to the **MCP Server** (typically as a POST request).
3. The **server** executes the tool.
4. Returns the **tool output** back to the client.

The **Model Context Protocol (MCP)** standardizes the request and response format so tools can be reused across clients.

---

## ❓ Why Use MCP Server?

In general, you can write Agentic workflows without worrying about MCP Server, but each framework (OpenAI, Gemini, Anthropic) has its own framework-specific requirements. If you have a tool, you have to write separate code or customize for each framework.

**MCP Server** abstracts all that away and provides a unified interface to work with any framework. So it becomes **plug and play** for any framework you want to use.

---

## 🛠️ How Does MCP Server Work?

Now here is where we usually get confused: **what is the client?**

### 📱 What Counts as a Client?

A client is anything that can connect to an MCP Server and ask it to run tools.

* **Existing MCP clients**: Claude Desktop, Cursor, Copilot (these already know how to talk MCP).
* **Your own client**: A custom app built using an agent framework (like the Python client below).

### 🔄 Switching (Swapping) Between Clients

This is the main benefit of MCP: the **server/tools stay the same**, and you can swap the client.

To swap clients, you usually only need:

1. The **MCP Server URL** (for `streamable-http`, e.g., `http://localhost:8000/mcp`).
2. The **MCP transport type** (here: `streamable-http`).
3. The same **tool schema** exposed by the server (your `@mcp.tool` functions).

**Then:**

* If you’re moving from the **Python client → Claude Desktop/Cursor/Copilot**: Configure that app to connect to your MCP Server URL.
* If you’re moving from **Claude Desktop/Cursor/Copilot → your Python client**: Keep the server running and point your Python client to the same URL.

The tool list will be discovered from the server, so you don’t rewrite tools for each client.

---

## ⚙️ Setting Up MCP Server

I am using **FastMCP** here instead of the official MCP Server implementation because it's easier to set up and use.

### 📦 Install FastMCP

You can install FastMCP using pip:

```bash
pip install fastmcp
```

### 📝 Create a Simple MCP Server

**File:** `mcp_server.py`

#### 🚦 Understanding Transport Modes

* **`streamable-http`**: Deploy MCP server as a separate service over network. Multiple clients can access the same server over HTTP. Use this for production deployments.
* **`stdio`**: For local clients running in the same environment. The client starts the MCP server as a subprocess. Use this for development and testing.

In this example, we use `streamable-http` for network-based communication.

#### 🏗️ Server Initialization

Initialize the FastMCP server instance with a name.

```python
from fastmcp import FastMCP

mcp = FastMCP(
    name="MyMCPServer",
)
```

#### 🛠️ Tool Definitions

Define the tools that will be exposed to clients. Each tool is a Python function decorated with `@mcp.tool` and includes type hints and docstrings for clarity.

Each function here represents a tool that the MCP server exposes. Clients can call these tools by name, passing the required parameters. The description in the docstring helps clients understand what each tool does.

> **Example:** If the user asks something like “add 5 and 3”, the model can decide to call the `add` tool with `{ "x": 5, "y": 3 }`, and then use the returned result to respond.

```python
@mcp.tool
def add(x: float, y: float) -> float:
    """Add two numbers."""
    print(f"Adding {x} and {y}")
    return x + y

@mcp.tool
def subtract(x: float, y: float) -> float:
    """Subtract two numbers."""
    print(f"Subtracting {y} from {x}")
    return x - y


@mcp.tool
def multiply(x: float, y: float) -> float:
    """Multiply two numbers."""
    print(f"Multiplying {x} and {y}")
    return x * y


@mcp.tool
def divide(x: float, y: float) -> float:
    """Divide two numbers."""
    print(f"Dividing {x} by {y}")
    if y == 0:
        raise ValueError("Cannot divide by zero.")
    return x / y


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
```

To run the server:

```bash
python mcp_server.py
```

<div style="text-align:center;">
<img src="mcp-server.png" alt="MCP Server Running" style="max-width:100%; width:800px; height:auto;" />
</div>

---
You can also inspect the available tools by running `fastmcp dev mcp_server.py` and it will start an inspector server at `http://127.0.0.1:6274`. You will see the token attached to the URL in the terminal. Basically, here you can test the tools directly from the browser, given the input parameters.

<div style="text-align:center;">
<img src="mcp-inspector.png" alt="MCP Server Inspector" style="max-width:100%; width:800px; height:auto;" />
</div>

---

## 🤖 MCP Client Example

This is a standalone AI Agent client that connects to an MCP server. The client uses OpenAI (or Ollama) as the language model and the MCP server provides the tools.

### 📋 Prerequisites

Install required libraries:

```bash
pip install openai openai-agents rich
```

### 🆓 Using Free Models with Ollama (Optional)

Instead of using the paid OpenAI API, use free local models with **Ollama** for development and cost-free experimentation.

#### 📥 Install Ollama

1. Download and install Ollama from [ollama.ai](https://ollama.ai).
2. Start the Ollama service.
3. Pull a model: `ollama pull llama3.2`.

Visit the [Ollama Library](https://ollama.ai/library) to see all available models.

#### ⚠️ Important Note on Function Calling

> **Not all models support function calling.** Choose models that support function calling for best results. This example uses `llama3.2`.

If the agent fails to use tools, switch to larger models available in Ollama, or use the OpenAI API.

---

## 💻 Client Code

**File:** `mcp_client.py`

### ⚙️ Configuration & Imports

Configure connection settings and import required libraries.

1. **OpenAI (Paid)**: Better performance, faster responses.
2. **Ollama (Free)**: Local models, no API key required.

This example uses Ollama. To use OpenAI, uncomment Option 1 and comment out Option 2.

> **Note:** If you want to swap this custom Python client with another MCP client (Claude Desktop/Cursor/Copilot), keep the MCP Server running and reuse the same `MCP_SERVER_URL`. Only the client changes.

I am using `gpt-5-nano` for OpenAI for better function calling support. You can experiment with other models as well using Ollama. I tried with `llama3.2` but multiple tool calls were not working well, so switched to OpenAI's `gpt-5-nano`.

```python
import asyncio
import os
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

# --- Configuration ---

# Option 1: Using OpenAI (Paid) - Better performance, faster responses
OPENAI_API_KEY = ""  # Replace with your actual OpenAI API Key
MCP_SERVER_URL = "http://localhost:8000/mcp"
MODEL_NAME = "gpt-5-nano"

# Option 2: Using Ollama (Free) - Local models, no API key required
# Make sure Ollama is running: ollama serve
# And you have pulled a model: ollama pull llama3.2
# OPENAI_API_KEY = "ollama"
# BASE_URL = "http://localhost:11434/v1"  # Ollama server URL
# MODEL_NAME = "llama3.2"  # or use mistral, neural-chat, etc.

# Set env var for libraries that auto-detect it
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# --- Imports from your Agent Framework ---
# Adjust these imports based on the specific library you are using.
# This example assumes a structure similar to 'openai-agents' or a custom wrapper.
from agents import (
    OpenAIChatCompletionsModel,
    Agent,
    Runner,
    ModelSettings
)
from agents.mcp import MCPServerStreamableHttp
from openai import AsyncClient

console = Console()
```

### 🏗️ Resource Initialization

Initialize the MCP server connection and the language model client.

* **MCP Server Connection**: Uses Streamable HTTP transport to connect to the server.
* **OpenAI Client**: Works with both OpenAI and Ollama APIs (OpenAI-compatible).
* **Model**: Initialized using `OpenAIChatCompletionsModel`.

```python
async def initialize_agent() -> tuple[MCPServerStreamableHttp, OpenAIChatCompletionsModel]:
    """Initializes the MCP server, OpenAI client, and Agent."""
    console.print(f"[bold blue]Connecting to MCP Server at {MCP_SERVER_URL}...[/bold blue]")

    mcp_server_cm = MCPServerStreamableHttp(
        params={"url": MCP_SERVER_URL},
        cache_tools_list=True, # Cache the tools list for performance so we don't fetch it every time
    )

    openai_client = AsyncClient(
        api_key=OPENAI_API_KEY,
        # base_url="http://localhost:11434/v1",
        timeout=60,
    )

    model = OpenAIChatCompletionsModel(model="gpt-5-nano", openai_client=openai_client)

    return mcp_server_cm, model
```

### 💬 Chat Turn Handler

Manages a single conversation turn with the agent.

* **Runner**: Orchestrator that manages agent execution, including tool calls and response generation. Handles complexity like single or multiple tool calls and handoffs between tools. It's a wrapper that manages the agent's execution flow.
* **Result**: Once the runner completes, extract the final output and return it.

```python
async def chat_turn(
    agent: Agent,
    history: list[dict[str, str]],
    user_input: str,
) -> str | None:
    """Handles a single turn of conversation."""
    history.append({"role": "user", "content": user_input})

    try:
        with console.status("[bold green]Thinking...[/bold green]", spinner="dots"):
            result = await Runner.run(starting_agent=agent, input=history)

        final_text = result.final_output
        history.append({"role": "assistant", "content": final_text})

        return final_text
    except Exception as e:
        console.print(f"[bold red]Error during turn:[/bold red] {e}")
        return None
```

### 🏗️ Main Function & Agent Creation

Create the agent with the model, MCP server connection, and instructions.

* **Agent Class**: Defines the agent's behavior including name, model, connected MCP servers, model settings, and instructions.
* **MCP Server Connection**: Passed to the agent, allowing it to utilize the tools registered on the MCP server.
* **Internal Conversion**: All MCP tools are converted to function calling format that the model understands.

```python
async def main() -> None:
    mcp_server_cm, model = await initialize_agent()

    async with mcp_server_cm as mcp_server:
        agent = Agent(
            name="MCP_Agent",
            model=model,
            mcp_servers=[mcp_server],
            model_settings=ModelSettings(tool_choice="auto"),
            instructions="""
            You are an intelligent agent that uses the to perform calculations as needed.
            Always choose the appropriate tool for mathematical operations.
            call `add` to add two numbers float values.
            call `subtract` to subtract two numbers float values.
            call `multiply` to multiply two numbers float values.
            call `divide` to divide two numbers float values.
            """,
        )

        console.print(
            Panel.fit(
                "[bold green]Agent Ready[/bold green] (Type 'stop' or 'close' to exit)",
                title="System",
            )
        )
        chat_history: list[dict] = []

        while True:
            user_input = console.input("\n[bold yellow]You:[/bold yellow] ").strip()

            if user_input.lower() in ["stop", "close", "exit", "quit"]:
                console.print("[bold red]Goodbye![/bold red]")
                break

            response = await chat_turn(agent, chat_history, user_input)

            if response:
                console.print("\n[bold cyan]Agent:[/bold cyan]")
                console.print(Markdown(response))


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 📝 Summary

1. You may think tools are just small functions LLMs can do by default, but in reality, you can design complex tools that encapsulate business logic, access databases, call external APIs, and more. **MCP Server** allows you to centralize these tools and make them accessible to any MCP-compatible client.
2. Now here if you ask `add 2 and 4` as it can call the `add` tool on the MCP server, get the result `6`, and respond back. But you can do more complex operations by chaining tool calls and these actions are handled by the **Runner** internally.

```text
You: add 56 and 3546.9 then multiply by 3.2 and subtract 10
Agent: Final result: 11519.28
Breakdown:
- 56 + 3546.9 = 3602.9
- 3602.9 × 3.2 = 11529.28 
- 11529.28 − 10 = 11519.28 

You: add 357 and 234 then multiply by 56.3 and subtract 4 and then divide by 26

Final result: 1279.5884615384615 (approximately)

Breakdown:
- 357 + 234 = 591
- 591 × 56.3 = 33273.3
- 33273.3 − 4 = 33269.3
- 33269.3 ÷ 26 ≈ 1279.5884615384615
```
### 📊 Inspecting Tool Calls

1. If you check the MCP server logs, you can check the order of tool calls made by the agent. The order in which you asked agent to perform operations is preserved in the tool calls. 
2. Also you get much more control over the result as you can the floating point precision in the tool implementations.

<div style="text-align:center;">
<img src="tool-calls.png" alt="MCP Tool Calls" style="max-width:100%; width:800px; height:auto;" />
</div>