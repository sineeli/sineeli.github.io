---
title: Python Pixi - Python Package Manager
date: 2025-11-08 13:27:21
categories: blogs
tags:
  - Python
  - pixi
toc: true
layout: post
---

<!-- more -->

I've tried several Python package managers (pip, conda, Poetry). While trying Pixi, I found its features particularly useful for production setups.

In `pyproject.toml` you can define dependency groups for different environments (dev, test, prod). When installing, specify the environment so only the required dependencies are installed.

This helps keep production environments clean by excluding unnecessary packages.

You can also define reusable tasks and run them with `pixi run <task-name>`. This is a convenient way to run common commands defined in `pyproject.toml`.

## Installing Pixi

```bash
brew install pixi # macOS
# or
curl -fsSL https://pixi.sh/install.sh | sh
```

## How to use Pixi for running a task
`pyproject.toml`

```toml
[project]
name = ""
version = "0.1.0"
description = ""
requires-python = "==3.12"
authors = [{ name = "<author>", email = "<email-address>" }]

[tool.pixi.workspace]
channels = ["conda-forge"]
platforms = ["osx-arm64", "linux-64"]

[tool.pixi.dependencies]
python = "3.12.*"

[tool.pixi.pypi-dependencies]
openai = "*"
openai-agents = "*"
fastmcp = "*"
pytest = "*"
ruff = "*"
pyright = "*"
mypy = "==1.18.2"

[tool.pixi.tasks]
```

Quick add commands:

```
pixi task add format "black src/"
pixi task add lint "ruff src/ --fix"
```

Notes:

- Run a single task: `pixi run <task-name>`
- Make tasks depend on each other if needed (e.g., run format before lint)