# Productivity Assistant - Full Vision

## Project Overview
A lightweight, gamified productivity suite that balances functionality with aesthetic appeal, designed for 24/7 operation without interfering with primary work.

## Technical Requirements

### Platform Support
- **Primary**: macOS and Windows
- **Performance**: Resource-light for 24/7 operation
- **Memory Management**: Auto-restart prompts when RAM usage exceeds thresholds
- **Cross-Platform**: Single codebase with native performance

### Architecture
- **Framework**: Tauri (Rust + Web Technologies)
- **Data**: Local JSON with export/import capability
- **UI**: SVG-based assistant with HTML/CSS interface
- **Window Management**: Custom borderless floating widgets

## Core Functionality

### Productivity Tools
1. **To-Do List**
   - Simple task creation/completion
   - Basic categorization
   - Progress tracking for gamification

2. **Habit Tracker**
   - Daily habit check-offs
   - Streak tracking
   - Visual progress indicators

3. **Quick Memos**
   - Fast note capture
   - Auto-save functionality
   - Basic search/organization

4. **Timer System**
   - Pomodoro-style work sessions
   - Customizable durations
   - Break reminders

5. **Music Player**
   - Local file playback
   - Future: Plexamp integration
   - Basic controls (play/pause/skip)

6. **Ambient Noise**
   - Coffee shop sounds
   - Rain/nature sounds
   - Gentle chatter
   - Volume mixing with music

### Gamification System

#### Virtual Assistant - Circular Oscilloscope
- **Visual Design**: Circular oscilloscope (sharp outer ring) with breathing gradient core (blurred inner circle)
- **Audio Response**: Outer ring responds to ambient audio as radial waveform visualization
- **Breathing Effect**: Inner gradient core pulses/breathes independently for "alive" feeling
- **Customization**: Unlockable colors, gradients, and oscilloscope styles through productivity usage

#### Reward Loop
- **Usage Tracking**: "You listened to X hours of rain sounds; unlock new gradient colors"
- **Unlockables**: New assistant gradient themes, oscilloscope colors, breathing patterns
- **Progress**: Subtle visual indicators that enhance rather than distract
- **Milestones**: Completion streaks, total usage metrics, sound mixing achievements

## User Experience Design

### Full Mode
- **Layout**: Always-on-top rectangle (15% screen width/height)
- **Position**: User-configurable side/corner placement
- **Content**: All tools accessible in unified interface
- **Aesthetic**: Clean, minimal, non-intrusive

### Mini Mode
- **Core Window**: Assistant + menu button only
- **Tool Widgets**: Individual floating windows for active tools
- **Shapes**: Custom borderless designs (advanced feature)
- **Management**: Moveable, closeable, always-on-top

### Window Behavior
- **Always-on-top**: Never gets buried under other apps
- **Transparency**: Configurable opacity levels
- **Drag/Resize**: Intuitive window manipulation
- **Memory**: Position and size preferences saved

## Data Architecture

### Local Storage
- **Format**: JSON configuration files
- **Location**: OS-appropriate user data directory
- **Backup**: Manual export/import functionality
- **Structure**: Modular data for each productivity tool

### Tracking Metrics
- Task completions and streaks
- Timer session durations and frequency
- Music/ambient sound listening time
- Habit tracking consistency
- Overall app usage patterns

## Development Phases

### Phase 1: Foundation (POC)
- Basic Tauri application with always-on-top window management
- Circular oscilloscope assistant (sharp outer ring + blurred breathing gradient core)
- Ambient noise system with multiple CC0 loops and volume mixing
- Web Audio API integration for real-time oscilloscope visualization
- Basic timer functionality with visual feedback
- UI implementation using established design system (Quicksand font, color palette)

### Phase 2: Core Productivity
- To-do list implementation
- Habit tracking system
- Quick memo functionality
- Data persistence layer

### Phase 3: Enhanced Audio Integration
- Music player implementation (local files)
- Advanced ambient noise system with more sound categories
- Audio mixing capabilities with crossfading
- Enhanced oscilloscope that responds to music + ambient noise simultaneously
- Plexamp integration planning and initial implementation

### Phase 4: Advanced UI
- Mini mode implementation
- Floating widget system
- Custom window shapes
- Enhanced animations

### Phase 5: Gamification & Customization
- Complete reward system with usage tracking and unlockables
- Assistant visual customization (gradient themes, oscilloscope colors, breathing patterns)
- Achievement milestones and streak tracking
- Sound-based rewards (unlock new ambient sounds through usage)
- Advanced visual feedback during productivity sessions

### Phase 6: Polish & Distribution
- Performance optimization
- Cross-platform testing
- Steam/App Store preparation
- Documentation and user guides

## Success Criteria
- **Performance**: <512MB RAM usage (target <256MB), <1% CPU when idle, <5% CPU active
- **Stability**: 24/7 operation without crashes, memory leaks, or performance degradation
- **Usability**: Intuitive interface that enhances productivity without creating distractions
- **Engagement**: Circular oscilloscope provides subtle, hypnotic feedback that motivates usage
- **Audio Quality**: Clean ambient noise mixing without artifacts or audio processing lag
- **Visual Appeal**: Polished circular oscilloscope + breathing gradient aesthetic worthy of commercial release

## Future Considerations
- **Cloud Sync**: Optional data synchronization across devices
- **Plugin System**: Third-party integrations and extensions
- **Themes**: Visual customization beyond assistant modifications
- **Mobile Companion**: Simplified mobile app for habit tracking
- **Analytics**: Optional usage analytics for improvement insights