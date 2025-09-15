# Hype Scene Magic

![HypeSceneMagic](https://playground.maxziebell.de/Hype/SceneMagic/HypeSceneMagic.jpg)

**Hype Scene Magic** is a powerful extension for [Tumult Hype](https://tumult.com/hype/), designed to create visually stunning and seamless scene transitions. Inspired by Apple's Keynote animations, SceneMagic leverages the [GSAP](https://greensock.com/gsap/) animation library to enhance performance and interactivity. Whether you're crafting simple fades or complex animations, SceneMagic provides a robust set of tools to elevate your projects.

---

## Content Delivery Network (CDN)

To include SceneMagic in your project, add the following scripts to your **Head HTML**:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@latest/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeSceneMagic/HypeSceneMagic.min.js"></script>
```

**Note**: For production environments, it's recommended to download these scripts and include them locally in your project to ensure reliability and performance.

---

## Getting Started

### Step 1: Include Required Libraries

Ensure that both GSAP and Hype Scene Magic are included in your Tumult Hype project by adding them to the **Head HTML** as shown above.

### Step 2: Apply Magic Transitions

- **Using Class Names**: Assign class names starting with `magic` to elements you want to animate across scenes. For example, `magicBox`, `magicCircle`, or any unique identifier like `magicMyElement`.
- **Using Data Attributes**: Alternatively, use the `data-transition-id` attribute to assign a unique identifier to elements.

These identifiers are used to match elements across scenes for seamless transitions. Identifiers are **case-insensitive** and matched without the `magic` prefix.

### Step 3: Trigger Scene Transitions

Use the provided functions to navigate between scenes with magic transitions:

```javascript
// Navigate to a specific scene with magic transition
hypeDocument.showSceneNamedMagic('SceneName', duration, easing, options);

// Navigate to the next scene with magic transition
hypeDocument.showNextSceneMagic(duration, easing, options);

// Navigate to the previous scene with magic transition
hypeDocument.showPreviousSceneMagic(duration, easing, options);
```

- **`duration`**: (Optional) Transition duration in seconds. Default is `0.5`.
- **`easing`**: (Optional) Easing function name. Default is `power1.inOut`.
- **`options`**: (Optional) An object containing additional settings like `crossFadeFactor`, `beforeStart`, and `afterEnd`.

---

## Core Features

### Magic Class Names and Identifiers

To enable magic transitions between elements across scenes, assign a unique identifier to each element:

- **Using Class Names**: Add a class starting with `magic`, followed by a unique name. For example, `magicLogo`, `magicHeader`.
- **Using Data Attributes**: Use the `data-transition-id` attribute to define a unique identifier. For example, `data-transition-id="logo"`.

**Note**: Identifiers are case-insensitive and matched without the `magic` prefix. An element with the class `magicBox` will match an element with `data-transition-id="box"` in another scene.

### Setting Data Attributes in Tumult Hype

In Tumult Hype, data attributes are set using the **Identity Inspector**:

1. Select the element you wish to add an attribute to.
2. In the **Identity Inspector**, click on the **Edit Attributes** button.
3. Add a new attribute by clicking the **+** button.
4. Enter the attribute name (e.g., `data-transition-delay`) and its value.

### Transition Attributes

Customize transitions using the following data attributes:

| Attribute                      | Description                                                                                                                                                                           | Example Values             |
|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|
| `data-transition-id`           | Unique identifier for matching elements across scenes. Identifiers are case-insensitive and exclude the `magic` prefix.                                                                | logo, header                |
| `data-transition-delay`        | Delay before the transition starts. **Unitless values are factors relative to the total duration** (e.g., `0.5` equals 50%). Can also be percentages (`50%`) or time units (`0.5s`, `500ms`). | 0.5, 50%, 0.5s, 500ms        |
| `data-transition-duration`     | Duration of the transition. **Unitless values are factors relative to the total duration** (e.g., `1` equals 100%, but thats anyway the default). Accepts the same formats as `data-transition-delay`.                                         | 1, 0.75, 75%, 0.75          |
| `data-transition-ease`         | Easing function for the transition. Overrides the default easing.                                                                                                                      | easein, power1.in, bounce    |
| `data-transition-order`        | Z-index stacking order during the transition. Use `front` to bring an element forward, `back` to send it behind, or specify a z-index value.                                            | front, back, 10              |
| `data-transition-animation`     | Animation for elements during scene transitions. For magic-connected elements, only applies when no match is found. Define GSAP animation properties.                                    | opacity:0; x:+=100           |
| `data-transition-animation-from`| Animation applied to elements in the **target** scene. For magic-connected elements, only applies when no match is found in the current scene.                                          | opacity:0; scale:0.5         |
| `data-transition-animation-to`  | Animation applied to elements in the **current** scene. For magic-connected elements, only applies when no match is found in the target scene.                                          | opacity:0; x:100             |

**Note**: For elements without magic connections, the animation attributes define their transition behavior. For magic-connected elements, these animations serve as fallbacks when no matching element is found in the other scene.

### Special `target` Keyword

Use the `target` keyword in attributes to inherit values from the matching element in the target scene. This allows for dynamic transitions based on the target element's properties.

**Applicable Attributes**:

- `data-transition-delay="target"`
- `data-transition-duration="target"`
- `data-transition-order="target"`

**Example**:

In the **Identity Inspector**, set:

- `data-transition-delay` to `target`
- `data-transition-duration` to `target`

This means the element will use the `data-transition-delay` and `data-transition-duration` values from its matching element in the target scene.

---


## Shorthand Scene Navigation with `magicCard`

For more streamlined and powerful scene navigation, SceneMagic provides the `hypeDocument.magicCard` function. This shorthand is especially useful for creating sequential or logic-based flows, like slideshows or interactive stories, by building on top of `showSceneNamedMagic`.

```javascript
hypeDocument.magicCard(name, options);
```

### Navigation Targets

The `name` parameter accepts several formats to define the navigation target:

| `name` Value | Description |
|--------------|-------------|
| `'>'` | Navigates to the **next** scene in the document's scene order. Wraps around to the first scene if at the end. |
| `'<'` | Navigates to the **previous** scene in the document's scene order. Wraps around to the last scene if at the beginning. |
| `'>BaseName'` | Navigates to the **next** scene whose name starts with `BaseName`. |
| `'<BaseName'` | Navigates to the **previous** scene whose name starts with `BaseName`. |
| `'SceneName'` | Navigates directly to the scene with the specified name. |

### Options

The `options` parameter can be either an `Object` containing transition settings or a `Number` to specify the duration directly. All options are passed through to `showSceneNamedMagic`.

```javascript
// Navigate to the next scene over 1.5 seconds
hypeDocument.magicCard('>', 1.5);

// Navigate to the previous scene with custom options
hypeDocument.magicCard('<', {
    duration: 0.8,
    ease: 'bounce.out',
    crossFadeFactor: 0.3
});

// Navigate to the next scene starting with "Chapter2"
hypeDocument.magicCard('>Chapter2');
```

---



### Multiple Magic Identifiers & Match Resolution

SceneMagic 2.6.0 introduces support for multiple magic identifiers per element through both class names and data attributes. Elements can now be tagged with multiple identifiers that are matched case-insensitively across scenes:

```javascript
// Scene 1
<div class="magicHeader magicLogo">...</div>

// Scene 2  
<div data-transition-id="header,logo">...</div>
```

When multiple potential matches exist between scenes, SceneMagic employs a "last match wins" strategy - the last valid match takes precedence and any existing animations on the elements are killed via `gsap.killTweensOf()`. This ensures clean transitions without animation conflicts.

Match resolution follows this process:
1. Collect all identifiers from both class names (`magic*`) and `data-transition-id` attributes
2. Convert identifiers to lowercase and remove `magic` prefix
3. Compare identifier sets between elements to find matches
4. For multiple matches, use the last valid match and kill any existing tweens
5. Apply the transition animation between the matched elements

This provides maximum flexibility for complex layouts while maintaining predictable animation behavior through automatic cleanup of conflicting transitions.
This capability is particularly powerful for efficient carousel implementations. Instead of creating individual off-screen elements for each possible card position, you can use a single element tagged with multiple positions (e.g., `magicCard1 magicCard2`) to represent multiple starting states. When transitioning between scenes, SceneMagic automatically matches with the optimal position, allowing fluid animations from any card to any other card while maintaining a minimal DOM footprint.


---

### Built-in Custom Behaviors Callbacks for Persistent Symbols

SceneMagic automatically triggers several custom behaviors during transitions that you can use in Tumult Hype's Actions panel:

| Custom Behavior | Description |
|----------------|-------------|
| `magicTransitionStart` | Triggered when any magic transition begins |
| `magicTransitionEnd` | Triggered when any magic transition completes |
| `magicTransition_{fromScene}_to_{toScene}` | Triggered for specific scene combinations |
| `magicTransitionFrom_{fromScene}` | Triggered when transitioning from a specific scene |
| `magicTransitionTo_{toScene}` | Triggered when transitioning to a specific scene |

**Examples**:

If transitioning from "Scene A" to "Scene B":
- `magicTransition_SceneA_to_SceneB`
- `magicTransitionFrom_SceneA`
- `magicTransitionTo_SceneB`

If transitioning from "My First Scene" to "Product Details":
- `magicTransition_MyFirstScene_to_ProductDetails`
- `magicTransitionFrom_MyFirstScene`
- `magicTransitionTo_ProductDetails`

**Note**: All spaces are removed from scene names in the custom behavior names.

---

### Transition Animations

Elements can participate in scene transitions through animation attributes set in the Identity Inspector. These animations define how elements enter and exit during scene transitions.

| Attribute | Description |
|-----------|-------------|
| `data-transition-animation` | Animation applied during both entry and exit |
| `data-transition-animation-from` | Animation applied when the element enters |
| `data-transition-animation-to` | Animation applied when the element exits |

#### Common Animation Patterns

Here are common examples when used with `data-transition-animation-from`:

```
opacity:0                // Start transparent, fade in
opacity:0; x:-100       // Start left, fade in while moving right
opacity:0; x:100        // Start right, fade in while moving left
opacity:0; scale:0.5    // Start small, fade in while scaling up
opacity:0; y:-50        // Start above, fade in while moving down
opacity:0; rotate:180   // Start rotated, fade in while spinning
opacity:0; scale:150%   // Start large, fade in while scaling down
x:-100; opacity:0       // Start left and transparent
backgroundColor:#fff    // Start white, transition to element color
```

**Note**: When using the same values in `data-transition-animation-to`, the animation will be reversed. For example, `opacity: 0; x: -100` will fade out while moving left.

#### Using Registered Animations

For frequently used animations, you can register them once and reuse them by name:

```javascript
// Register common animations
hypeDocument.registerAnimation('fadeIn', 'opacity:0');
hypeDocument.registerAnimation('fadeLeft', 'opacity:0; x:-100');
hypeDocument.registerAnimation('fadeRight', 'opacity:0; x:100');
hypeDocument.registerAnimation('scaleUp', 'opacity:0; scale:0.5');
hypeDocument.registerAnimation('slideDown', 'opacity:0; y:100');
```

Then use the registered name in your attribute value:
```
fadeLeft     // Use instead of 'opacity:0; x:-100'
scaleUp      // Use instead of 'opacity:0; scale:0.5'
slideDown    // Use instead of 'opacity:0; y:100'
```

### Transition Animations as Fallbacks

For elements with magic connections (matching identifiers across scenes), transition animations serve a different purpose. They act as fallbacks when:
1. The element doesn't find a matching element in the target scene
2. The element in the target scene doesn't find a match in the current scene

In these cases, the transition animations provide a graceful way to animate unmatched elements:
- Elements without matches in the target scene will use `data-transition-animation-to` or `data-transition-animation`
- Elements without matches in the current scene will use `data-transition-animation-from` or `data-transition-animation`

**Note**: If an element has a magic connection (finds its match in the other scene), these transition animations are ignored in favor of the magic transition between the matched elements.

---


## Transition Customization

### Cross-Fade Factor

The `crossFadeFactor` determines the portion of the total duration used for the cross-fade between scenes. The default value is `0.5`, meaning the cross-fade occurs over half of the transition duration.

**Usage**:

```javascript
hypeDocument.showSceneNamedMagic('Scene2', 1.0, 'power1.inOut', {
    crossFadeFactor: 0.7
});
```

### Lifecycle Hooks

SceneMagic provides hooks to execute custom code at specific points during the transition:

| Hook | Description |
|------|-------------|
| `onTransitionStart` | Called before the transition begins |
| `onTransitionProgress` | Called continuously during the transition with progress (0-1) |
| `onTransitionEnd` | Called after the transition completes |

**Usage**:

```javascript
hypeDocument.showSceneNamedMagic('Scene2', 1.0, 'power1.inOut', {
	onTransitionStart: function(currentScene, targetScene, context) {
		console.log('Transition is about to start.');
	},
	onTransitionProgress: function(progress, currentScene, targetScene) {
		console.log('Transition progress:', progress);
	},
	onTransitionEnd: function(currentScene, targetScene, context) {
		console.log('Transition has completed.');
	}
});
```

---

## Easing Options

SceneMagic maps Tumult Hype's easing names to GSAP equivalents to ensure consistent animations.

### Mapped Easing Names

| **Tumult Hype Easing** | **GSAP Equivalent**  |
|------------------------|-----------------------|
| easein                 | power1.in             |
| easeout                | power1.out            |
| easeinout              | power1.inOut          |

**Note**: When specifying easing functions in SceneMagic, you can use Tumult Hype's easing names, and they will be automatically mapped to the corresponding GSAP easing functions.

### Using GSAP Easing

You can use any GSAP easing function directly for advanced animations:

| **GSAP Easing** | Description                                       |
|------------------|---------------------------------------------------|
| power1.in        | Accelerating from zero velocity.                  |
| power1.out       | Decelerating to zero velocity.                    |
| power1.inOut     | Acceleration until halfway, then deceleration.    |
| bounce.out       | Bounces at the end of the transition.             |
| elastic.in       | Elastic effect at the beginning.                  |

For a complete list of easing functions, refer to the [GSAP Easing Documentation](https://greensock.com/docs/v3/Eases).

---

## Advanced Usage


### Clearing Cached Properties

SceneMagic caches initial properties of elements to optimize performance. If you need to force a recalculation (e.g., after dynamically changing styles), you can clear the cache:

```javascript
// Clear cache for a specific element
HypeSceneMagic.clearCachedMagicProperties(element);

// Clear the entire cache
HypeSceneMagic.clearCachedMagicProperties();
```

### Setting Defaults

You can customize default settings globally using the `setDefault` method:

```javascript
// Set the default cross-fade factor
HypeSceneMagic.setDefault('crossFadeFactor', 0.6);

// Set multiple defaults at once
HypeSceneMagic.setDefault({
    duration: 1.0,
    easingMap: {
        'easein': 'power2.in',
        'easeout': 'power2.out',
        'easeinout': 'power2.inOut'
    }
});
```

### Retrieving Defaults

To get the current default settings:

```javascript
// Get all defaults
let defaults = HypeSceneMagic.getDefault();

// Get a specific default value
let duration = HypeSceneMagic.getDefault('duration');
```

### Direct Animation Application

Use `applyAnimation` to trigger GSAP animations on any element:

```javascript
// Apply animation to an element
hypeDocument.applyAnimation(element, "scale:2;rotation:45");

// Apply animation with options
hypeDocument.applyAnimation(element, "scale:2", {
	duration: 0.3,
	ease: "bounce.out",
	from: true,  // Use gsap.from instead of gsap.to
	onComplete: function() {
		console.log("Animation complete!");
	}
});

// Apply a registered animation
hypeDocument.applyAnimation(element, "bounceIn");
```

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `duration` | Number | Animation duration in seconds | 0.25 |
| `ease` | String | GSAP easing function | 'power1.inOut' |
| `from` | Boolean | If true, uses gsap.from instead of gsap.to | false |
| `skipHypeSync` | Boolean | Skip syncing final values to Hype properties | false |
| `onComplete` | Function | Callback when animation completes | null |

---

## Best Practices

- **Consistent Identifiers**: Ensure that matching elements across scenes have the same identifier (class name or `data-transition-id`). Remember that identifiers are case-insensitive and exclude the `magic` prefix.
- **Fallback Animations**: Use fallback attributes to define how unmatched elements should appear or disappear during transitions.
- **Performance Optimization**: Limit the number of elements with complex animations to maintain smooth performance.
- **Testing Transitions**: Test transitions on different devices and browsers to ensure consistency.

---

## Troubleshooting

- **Elements Not Matching**: Verify that identifiers are correctly assigned, case-insensitive, and exclude the `magic` prefix.
- **Animations Not Playing**: Check for JavaScript errors in the console and ensure GSAP is correctly included.
- **Z-Index Issues**: Use `data-transition-order` to manage stacking contexts during transitions.
- **Unexpected Delays or Durations**: Remember that unitless values in `data-transition-delay` and `data-transition-duration` are factors relative to the total duration.

---

## Additional Resources

- [Tumult Hype Documentation](https://tumult.com/hype/documentation/)
- [GSAP Documentation](https://greensock.com/docs/)
- [SceneMagic GitHub Repository](https://github.com/worldoptimizer/HypeSceneMagic)

---

With Hype Scene Magic, you can create engaging and dynamic animations in Tumult Hype effortlessly. By leveraging GSAP's robust animation capabilities, SceneMagic offers precise control over scene transitions, allowing for creativity and interactivity in your projects.

Happy animating!
