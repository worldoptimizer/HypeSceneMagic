# Hype Scene Magic 

![HypeSceneMagic](https://playground.maxziebell.de/Hype/SceneMagic/HypeSceneMagic.jpg?)

**Hype Scene Magic** is a powerful tool for creating visually stunning scene transitions within Tumult Hype. Inspired by Apple's Keynote animations, SceneMagic utilizes GSAP to enhance animation performance and interactivity. Whether you're crafting simple animations or complex transitions, SceneMagic offers a robust set of tools to elevate your content.

---

## Content Delivery Network (CDN)

To link SceneMagic into your project, add the following to the **Head HTML**:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@latest/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeSceneMagic/HypeSceneMagic.min.js"></script>
```

For specific releases, refer to [JsDelivr SceneMagic](https://www.jsdelivr.com/package/gh/worldoptimizer/HypeSceneMagic).

---

## Getting Started

### Step 1: Add Resources
Include the GSAP and Hype Scene Magic libraries in the **Head HTML** of your Tumult Hype project.

### Step 2: Apply Magic Transitions
Assign `magic` prefixed class names or `data-transition` attributes to elements. These attributes are configured via the **Attribute Panel** to define animation behavior across scenes.

---

## Core Features

### Magic Class Names
Use `magic` prefixed class names for elements to enable SceneMagic animations. For instance, use `magicBox` or `magicCircle` to apply transitions.

### Transition Attributes
Configure element transitions through the following attributes, set in the **Attribute Panel**:

| Attribute                   | Description                                                                                         | Example Values                |
|-----------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------|
| `data-transition-id`        | Unique identifier for matching elements between scenes.                                            | `example1`, `box`             |
| `data-transition-delay`     | Delay before transition starts, as a percentage of total duration.                                 | `0`, `10`, `50`               |
| `data-transition-duration`  | Duration of transition, as a percentage of total duration.                                         | `100`, `75`, `50`             |
| `data-transition-order`     | Z-index order during transition (`front` places element in front, `back` places it behind).        | `front`, `back`, `10`         |
| `data-transition-fallback`  | Fallback animation for unmatched elements (e.g., fade-in, move down relative).                     | `opacity:0; x:+=100` |
| `data-transition-fallback-from` | Fallback animation applied to unmatched elements in the **current** scene during transitions.   | `opacity:0; scale:0.5`        |
| `data-transition-fallback-to`   | Fallback animation applied to unmatched elements in the **target** scene during transitions.    | `opacity:0;  x:100` |

### Special `target` Keyword

The `target` keyword allows certain attributes like `data-transition-delay`, `data-transition-duration`, and `data-transition-order` to dynamically inherit their values from the corresponding element in the target scene. If the target element does not define the attribute, a default or fallback value is used.

This feature ensures that elements can adapt their transition behavior based on the target scene, providing more flexibility and control.

For example:
- **`data-transition-delay="target"`**: Inherits the delay percentage from the target element.
- **`data-transition-duration="target"`**: Uses the duration percentage from the target element.
- **`data-transition-order="target"`**: Synchronizes the stacking order with the target element for consistent layering.

The `target` keyword simplifies complex transitions by making elements responsive to their counterparts in the next scene.

---

## Transition Modes

SceneMagic supports two modes of operation:

- **Indirect Mode (Default)**: Delays and durations are relative to the total transition duration.
- **Direct Mode**: Applies delays and durations sequentially (delay first, then transition).

### Changing Transition Modes
You can set the transition mode globally using the `setDefault` method:

```javascript
HypeSceneMagic.setDefault('transitionMode', 'direct'); // Direct Mode
HypeSceneMagic.setDefault('transitionMode', 'indirect'); // Indirect Mode
```

---

## Advanced Options

### Lifecycle Hooks
SceneMagic provides hooks for custom logic during transitions:

| Hook           | Description                             |
|----------------|-----------------------------------------|
| `beforeStart`  | Executes before the transition begins.  |
| `afterEnd`     | Executes after the transition completes.|

Define behaviors using these hooks:

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
    hypeDocument.showSceneNamedMagic('Scene2', 2.0, 'easeinout', hooks);
}
```

---

## Easing Options

### Mapped Easing Names
SceneMagic maps Tumult Hype easing names to GSAP equivalents, ensuring consistency:

| **Hype Easing** | **GSAP Equivalent**   |
|------------------|-----------------------|
| `easein`         | `power1.in`          |
| `easeout`        | `power1.out`         |
| `easeinout`      | `power1.inOut`       |

### Using GSAP Easing
You can use any GSAP easing directly for advanced transitions:

| **GSAP Easing** | Description                                       |
|------------------|---------------------------------------------------|
| `bounce.out`     | Adds a bounce effect to the transition's end.     |
| `elastic.in`     | Creates an elastic effect at the start.           |
| `back.inOut`     | Smooth curve with overshooting both ends.         |

 [Read more about GSAP easing functions here](https://greensock.com/docs/v3/Eases) 

---

With these features and tools, you can use Hype Scene Magic to create engaging, dynamic animations in Tumult Hype with ease.
