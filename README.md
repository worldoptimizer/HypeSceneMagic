Here’s an updated README reflecting the latest capabilities of **Hype Scene Magic**:

---

# Hype Scene Magic 

![HypeSceneMagic|](https://playground.maxziebell.de/Hype/SceneMagic/HypeSceneMagic.jpg?)

**Hype Scene Magic** is a powerful tool for creating visually stunning scene transitions within Tumult Hype. Inspired by Apple's Keynote animations, SceneMagic utilizes GSAP to enhance animation performance and interactivity. Whether you're crafting simple animations or complex transitions, SceneMagic offers a robust set of tools to elevate your content.

---

### Content Delivery Network (CDN)
To link SceneMagic into your project, add the following to the `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@latest/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeSceneMagic/HypeSceneMagic.min.js"></script>
```

For specific releases, refer to [JsDelivr SceneMagic](https://www.jsdelivr.com/package/gh/worldoptimizer/HypeSceneMagic).

---

## Getting Started

### Step-by-Step Guide

1. **Add SceneMagic and GSAP Scripts**:
   - Download `HypeSceneMagic.js` and `gsap.min.js`, add them to the **Resources** folder in Tumult Hype, and include these in the **Head HTML** section:
     ```html
     <script src="${resourcesFolderName}/gsap.min.js"></script>
     <script src="${resourcesFolderName}/HypeSceneMagic.js"></script>
     ```

2. **Define Elements with `magic` Classes**:
   - Assign elements a `magic` class prefix to enable SceneMagic’s animations across scenes, e.g., `magicBox`.

3. **Create Transition Functions**:
   - Define JavaScript functions to trigger specific transitions using SceneMagic’s extended API.

---

## Data-Transition Attributes

New `data-transition` attributes offer fine control over animations:

| Attribute                   | Description                                      | Example Values        |
|-----------------------------|--------------------------------------------------|-----------------------|
| `data-transition-id`        | Unique identifier for element matching           | `example1`, `box`     |
| `data-transition-delay`     | Delay before transition (in % of total duration) | `0`, `10`, `50`       |
| `data-transition-duration`  | Duration of transition (in % of total duration)  | `100`, `75`, `50`     |
| `data-transition-order`     | Z-index during transition (`front` or `back`)    | `front`, `back`, `10` |

**Special `target` Keyword**: In attributes like `data-transition-delay`, `data-transition-duration`, and `data-transition-order`, the `target` keyword allows values to inherit from the target element.

---

## Transition Modes

SceneMagic now supports **direct** and **indirect** transition modes. By default, it operates in **indirect** mode.

- **Indirect Mode**: Delays and duration align with the total transition duration.
- **Direct Mode**: Applies delay first, followed by transition duration.

### Changing Transition Mode

Set the transition mode globally:

```javascript
HypeSceneMagic.setDefault('transitionMode', 'direct'); // Direct Mode
HypeSceneMagic.setDefault('transitionMode', 'indirect'); // Indirect Mode
```

---

## Advanced Usage

### Pausing and Adjusting Z-Index During Animations

SceneMagic’s `animateTransition` now dynamically determines element z-index based on the `data-transition-order` attribute. Elements can be moved to the front or back based on their z-order, ensuring seamless animations.

---

## Examples

### Using Hooks for Preparing and Cleaning Up before and after a Transitions

Define custom behaviors at the beginning or end of transitions:

```javascript
function goToSceneWithHooks(hypeDocument, element, event) {
    let hooks = {
        beforeStart: function(currentScene, targetScene) {
            console.log("Transition starting...");
        },
        afterEnd: function(currentScene, targetScene) {
            console.log("Transition ended.");
        }
    };
    hypeDocument.showSceneNamedMagic('Scene 2', 2.0, 'easeinout', hooks);
}
```

---

## Debugging and Tips

- **Use Hooks**: Hooks (`beforeStart`, `afterEnd`) provide custom entry/exit actions during transitions.
- **Consistent Naming**: Ensure consistent `magic` class names for smooth transitions.
- **Debugging**: Use `console.log` within hooks to monitor transition points and properties.
- **Duration Adjustments**: Experiment with `data-transition-duration` for natural, smooth animations.

