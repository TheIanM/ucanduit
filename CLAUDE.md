# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **ucanduit**, a lightweight gamified productivity suite built with Tauri (Rust + Web Technologies). The application is designed for 24/7 operation as an always-on-top productivity assistant featuring a circular oscilloscope visual that responds to audio.

## Your Behaviour
You will ensure code is clean, clear, and functional.
You will not rush, slow down and avoid silly mistakes. 
DO NOT GUESS, if you don't know something be honest and ask for further instructions

## Architecture

- **Framework**: Tauri (Rust backend + HTML/CSS/JS frontend)
- **Data Storage**: Local JSON files for cross-platform compatibility
- **Audio Processing**: Web Audio API for real-time oscilloscope visualization
- **Window Management**: Always-on-top borderless floating windows
- **Target Platforms**: macOS and Windows

## Core Components

The application consists of several integrated productivity tools:

1. **Virtual Assistant**: Circular oscilloscope with breathing gradient core
2. **Productivity Tools**: To-do lists, habit tracker, quick memos, timer system
3. **Audio Systems**: Music player, ambient noise generator with mixing capabilities
4. **Gamification**: Usage tracking and unlockable customizations
5. **Window Modes**: Full mode (unified interface) and Mini mode (floating widgets)

## Development Phases

The project follows a phased approach:
- **Phase 1**: Foundation with Tauri setup and oscilloscope assistant
- **Phase 2**: Core productivity features
- **Phase 3**: Enhanced audio integration
- **Phase 4**: Advanced UI with floating widgets  
- **Phase 5**: Gamification system
- **Phase 6**: Polish and distribution

## Performance Requirements

- Memory usage: Target <256MB (max 512MB)
- CPU usage: <1% idle, <5% active
- 24/7 operation capability without crashes or memory leaks

## Development Status

This is a new project in early planning stages. The codebase structure needs to be established following Tauri conventions with proper separation between Rust backend and web frontend.