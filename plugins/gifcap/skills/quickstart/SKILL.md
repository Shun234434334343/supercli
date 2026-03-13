# GifCap Skill

Capture your screen, optimize GIFs, and automate media documentation with `gifcap`.

## Quick Start

### 1. Setup
Install dependencies and link the CLI:
```bash
dcli gifcap cli setup
```

### 2. Automated Recording
Record 5 seconds of the screen:
```bash
dcli gifcap screen record --duration 5 --output recording.gif
```

### 3. Smart Cropping
Record a specific area (e.g., center screen or removing bars):
```bash
dcli gifcap screen record --duration 10 --top 100 --left 50 --output tutorial.gif
```

### 4. GIF Optimization
Reduce file size of an existing GIF to below 2MB:
```bash
dcli gifcap media optimize --input large.gif --target-size 2 --output optimized.gif
```

## Tips for Agents
- **Non-Interactive Mode**: Always use `--duration` for recording to ensure the process terminates.
- **JSON Output**: The plugin uses `parseJson: true`, so commands return structured data about the output path and final media metadata.
- **Cropping**: Use `-t`, `-l`, `-b`, `-r` to focus on the relevant part of the UI.
