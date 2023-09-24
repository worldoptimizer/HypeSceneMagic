# Hype Scene Magic

Certainly, here's an enhanced "Overview" section that includes a comparison to its inspiration from Keynote's magic transitions:

---

## Overview

Hype SceneMagic is a high-performance JavaScript extension crafted to bring the ease and sophistication of Keynote's "Magic Move" transitions into the realm of Tumult Hype projects. With a focus on delivering visually captivating scene transitions, it bridges the gap between the effortless animations found in presentation software and the often complex world of web development.

### Keynote Inspiration:

If you've ever used Keynote's "Magic Move" transition, you know how it can make objects elegantly glide from one slide to the next. Objects on the first slide automatically find their corresponding counterparts on the next slide and smoothly animate to their new positions. It's a feature that offers both aesthetic and narrative continuity.

### Hype SceneMagic's Answer:

In a similar fashion, Hype SceneMagic identifies "magical" elements within your current and target scenes, performing a visually seamless transition based on pre-defined attributes like `top`, `left`, `width`, `height`, `rotateZ`, `scaleX`, `scaleY`, and `opacity`. Just like in Keynote, you don't have to manually script each object's movement between scenes—SceneMagic does it for you.

#### Technical Highlights:

1. **Seamless Integration**: Designed to work out-of-the-box with Tumult Hype's native JavaScript API.

2. **Auto-Mapping**: Automatically locates and matches elements across scenes based on class identifiers.

3. **User Experience**: Implements a click-prevention mechanism during transitions to avoid accidental interactions.

4. **Easing Control**: Allows you to specify custom easing functions to get just the right visual effect.

By offering a streamlined API with automatic magic transition capabilities, Hype SceneMagic empowers you to create presentations and web experiences that are as engaging as they are effortless, echoing the convenience and sophistication of Keynote's transitions in a web-centric context.

## Features

- **Seamless Scene Transitions**: Achieve smooth and visually captivating transitions between scenes.
  
- **Hype CommandPipeline Compatibility**: Integrate easily with existing Hype CommandPipeline functionalities.

- **Click Prevention**: Built-in mechanisms to prevent undesired clicks during transitions.

- **Customizable**: Extendable properties and attributes offer maximum flexibility and customization.

## Version History

- 2.0: Major rewrite, now released under the MIT license.
- 2.1: Added examples showcasing the head inclusion and Hype CommandPipeline compatibility.
- 2.2: Minor bug fixes and turned into a self-contained extension.

## Installation

To install Hype SceneMagic, include the `HypeSceneMagic.js` file within the head section of your HTML or directly inside your Tumult Hype project.

```html
<script src="path/to/HypeSceneMagic.js"></script>
```

## API

### `hypeDocument.showSceneNamedMagic(targetSceneName, duration, ease)`

Transitions to a named scene with the specified duration and easing function.

### `hypeDocument.showNextSceneMagic(duration, ease)`

Moves to the next scene in the queue, applying the magic transition.

### `hypeDocument.showPreviousSceneMagic(duration, ease)`

Moves to the previous scene in the queue with the magic transition.

## Getting Started

To get started with Hype SceneMagic, follow these steps:

1. Include the `HypeSceneMagic.js` in your HTML or Hype project.
2. Use the API functions within your Hype scene's JavaScript actions or in your external scripts.

## Usage

Basic example to show a named scene with magic transition:

```javascript
hypeDocument.showSceneNamedMagic('Scene2', 1.0, 'easeinout');
```

## Contributing

Contributions, whether it be feature requests, bug reports, or code contributions, are always welcome! Please read our contributing guidelines before making any changes.

## FAQ

### How do I integrate Hype SceneMagic in existing projects?

Simply include the script and start calling the API methods in your Hype project.

### Does it work with mobile browsers?

Yes, Hype SceneMagic is designed to work across all major desktop and mobile browsers.

## License

This project is licensed under the MIT License. Please see the [LICENSE.md](LICENSE.md) file for more details.

## Contact

For further inquiries, feel free to reach out or visit the [official documentation](https://maxziebell.de).
