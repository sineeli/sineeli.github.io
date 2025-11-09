---
title: Python Pixi - Python Package Manager
date: 2025-11-08 13:27:21
categories: blogs
tags:
  - python
  - pixi
toc: true
layout: post
---

<!-- more -->

I've tried several Python package managers (pip, conda, Poetry). While trying Pixi, I found its features particularly useful for production setups.

In `pyproject.toml` you can define dependency groups for different environments (dev, test, prod). When installing, specify the environment so only the required dependencies are installed.

This helps keep production environments clean by excluding unnecessary packages.

You can also define reusable tasks and run them with `pixi run <task-name>`. This is a convenient way to run common commands defined in `pyproject.toml`.

## How to use Pixi for running a task
pixi.toml

```toml
[tasks]
# Format code (black)
format = "black src/"
# Lint (ruff)
lint = "ruff src/ --fix"
```

Quick add commands:

```
pixi task add format "black src/"
pixi task add lint "ruff src/ --fix"
```

Notes:

- Run a single task: `pixi run <task-name>`
- Make tasks depend on each other if needed (e.g., run format before lint)