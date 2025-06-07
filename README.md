# 🐟💥 Fishcannon - Interactive Aquatic Animation

An interactive web application featuring animated fish that fire bubbles at targets with customizable physics and multi-target capabilities.

## ✨ Features

### 🎯 Enhanced Multi-Mode System
- **Draggable Indicators**: All fish and target positions are fully draggable in multimode
- **Intuitive Controls**: Each indicator has + and − buttons for adding/removing positions
- **Visual Feedback**: Clear visual distinction between fish (green) and targets (red)
- **Smart Pairing**: Automatic intelligent pairing between fish and targets
- **No Confusion**: Single mode and multimode indicators are completely separate

### 🎮 Interactive Controls
- **Single Mode**: Simple drag-and-drop positioning for one fish and one target
- **Multi Mode**: Advanced positioning system with multiple fish and targets
- **Real-time Physics**: Adjustable bubble size, character size, and sprite scaling
- **Keyboard Shortcuts**: Quick access to common functions

### 🎨 Visual System
- **Multi-layer Canvas**: Optimized rendering with separate layers for different elements
- **Smooth Animations**: Fluid fish movements and bubble trajectories
- **Custom Images**: Upload your own character images for bubble contents
- **Responsive Design**: Works on desktop and mobile devices

### Core Animation System
- **Multi-layered Canvas**: Background, fish, foreground, animation, and UI layers
- **Physics-based Bubbles**: Realistic bubble trajectories with gravity and drag
- **Dynamic Fish Animation**: Fish sprites with mouth opening/closing during firing
- **Particle Effects**: Bubble pop effects with configurable particles
- **Multi-target Mode**: Support for multiple fish and targets with concurrent firing

### Interactive Controls
- **Drag & Drop Positioning**: Move fish and targets by dragging indicators
- **Real-time Physics**: Adjust bubble size, character size, and fish sprite size
- **Keyboard Shortcuts**: Space to fire, I to toggle indicators, H to toggle panels
- **Canvas Interaction**: Click to set target positions (single mode)

### Media Management
- **Tabbed Upload Interface**: Separate tabs for Characters, Background, and Foreground media
- **Multi-format Support**: Images (PNG, JPG, GIF) and Videos (MP4, WebM, etc.)
- **Automatic Cycling**: Multiple background/foreground images cycle every 2 seconds
- **Cycle Controls**: Adjustable interval (1-10 seconds) and pause/play functionality
- **Video Support**: Muted autoplay videos and GIFs loop automatically
- **Smart Thumbnails**: Media type indicators (IMAGE/VIDEO/GIF) on thumbnails

### Advanced Features
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Concurrent Operations**: Multiple fish can fire simultaneously with individual cooldowns
- **Responsive Design**: Mobile-friendly interface with touch support
- **Performance Optimized**: Hardware acceleration and efficient rendering

## 🚀 Quick Start

1. **Open the Application**: Load `index.html` in a web browser
2. **Basic Usage**: 
   - Drag the fish 🐟 and target 🎯 indicators to position them
   - Click "Test Fire Bubble" to see the animation
3. **Multi-Mode**:
   - Click "Enable Multi-Mode" to access advanced features
   - Drag existing indicators to reposition them
   - Click + buttons to add new fish or targets
   - Click − buttons to remove positions (minimum 1 of each type)

## 🎯 Multi-Mode Guide

### Adding Positions
- **Fish**: Click the + button on any fish indicator to add a new fish nearby
- **Targets**: Click the + button on any target indicator to add a new target nearby

### Removing Positions  
- **Fish**: Click the − button on any fish indicator (must have at least 1 fish)
- **Targets**: Click the − button on any target indicator (must have at least 1 target)

### Repositioning
- **Drag**: Simply drag any indicator to move it to a new position
- **Real-time**: Changes are applied immediately

### Smart Pairing
The system automatically creates intelligent pairings between fish and targets:
- **Equal numbers**: 1:1 pairing
- **More targets**: Each fish gets multiple targets
- **More fish**: Fish share targets based on proximity

## 🎛️ Controls

### Keyboard Shortcuts
- **Space**: Fire bubble
- **I**: Toggle indicators visibility
- **H**: Toggle control panels

### Mouse Controls
- **Drag**: Move fish and target positions
- **Click +**: Add new position
- **Click −**: Remove position

## 🔧 Technical Features

### Clean Modular Architecture
- **Canvas Manager**: Multi-layer canvas system with centralized management
- **Animation System**: Smooth physics-based animations with state machines
- **UI Controller**: Enhanced indicator management and event handling
- **Image Manager**: Custom image handling with media upload support
- **Renderer**: Optimized drawing system with layer separation
- **Utilities**: Centralized constants, logging, and math functions

### Performance Optimizations
- **Layer Separation**: Different canvas layers for different content types
- **Efficient Rendering**: Only redraw what's necessary
- **Smooth Animations**: 60fps animation loop with proper timing
- **Concurrent Operations**: Multiple fish can fire simultaneously
- **Smart Logging**: Configurable debug levels for development

## 📁 Project Structure

```
fishcannon/
├── index.html              # Main application page
├── css/
│   ├── main.css            # Core styles
│   ├── controls.css        # UI control styles
│   └── uploaders.css       # Image upload styles
├── js/
│   ├── main.js             # Application entry point
│   ├── core/               # Core system modules
│   │   └── CanvasManager.js
│   ├── ui/                 # User interface components
│   │   └── UIController.js
│   ├── rendering/          # Canvas rendering system
│   │   └── Renderer.js
│   ├── animation/          # Animation and physics
│   │   └── AnimationSystem.js
│   ├── managers/           # Resource management
│   │   ├── ImageManager.js
│   │   ├── ImageCycler.js
│   │   └── MediaUploader.js
│   └── utils/              # Shared utilities
│       ├── Constants.js
│       ├── Logger.js
│       └── MathUtils.js
├── assets/                 # Game assets (fish sprites, presets)
└── sounds/                 # Audio assets (future use)
```

## 🎨 Customization

### Physics Parameters
- **Bubble Size**: 20-80px diameter
- **Character Size**: 10-100px after bubble pop
- **Sprite Size**: 50-200% scaling for fish sprites
- **Animation Timing**: Configurable durations in Constants.js

### Visual Themes
- Customizable through CSS variables
- Support for custom background and foreground images
- Adjustable indicator styles and colors
- Centralized configuration in utils/Constants.js

### Development Features
- **Debug Logging**: Configurable log levels for development
- **Modular Design**: Easy to extend with new features
- **Clean Architecture**: Well-separated concerns for maintainability

## 🐛 Troubleshooting

### Common Issues
- **Indicators not showing**: Press 'I' to toggle indicator visibility
- **Multimode not working**: Ensure you've clicked "Enable Multi-Mode"
- **Dragging not responsive**: Check that indicators are visible and not overlapping

### Performance Tips
- Close other browser tabs for better performance
- Use smaller images for better loading times
- Reduce physics settings on slower devices

## 🤝 Contributing

Feel free to contribute improvements, bug fixes, or new features! The clean modular architecture makes it easy to extend functionality.

### Development Guidelines
- **Configuration**: Modify values in `js/utils/Constants.js`
- **Logging**: Use module-specific loggers from `js/utils/Logger.js`
- **Math Operations**: Leverage utilities in `js/utils/MathUtils.js`
- **New Modules**: Follow established patterns and use utilities

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Built with ❤️ and lots of bubbles** 🫧
