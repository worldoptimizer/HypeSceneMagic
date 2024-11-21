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
| `data-transition-duration`     | Duration of the transition. **Unitless values are factors relative to the total duration**. Accepts the same formats as `data-transition-delay`.                                         | 1, 0.75, 75%, 0.75          |
| `data-transition-ease`         | Easing function for the transition. Overrides the default easing.                                                                                                                      | easein, power1.in, bounce    |
| `data-transition-order`        | Z-index stacking order during the transition. Use `front` to bring an element forward, `back` to send it behind, or specify a z-index value.                                            | front, back, 10              |
| `data-transition-fallback`     | Fallback animation for elements without a matching identifier in the other scene. Define GSAP animation properties.                                                                     | opacity:0; x:+=100           |
| `data-transition-fallback-from`| Fallback animation applied to elements in the **target** scene when there's no match in the current scene.                                                                             | opacity:0; scale:0.5         |
| `data-transition-fallback-to`  | Fallback animation applied to elements in the **current** scene when there's no match in the target scene.                                                                             | opacity:0; x:100             |

**Note**: The `data-transition-fallback` attributes allow you to define how unmatched elements transition, ensuring a smooth visual experience.

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

- **`beforeStart`**: Called before the transition begins.
- **`afterEnd`**: Called after the transition completes.

**Usage**:

```javascript
hypeDocument.showSceneNamedMagic('Scene2', 1.0, 'power1.inOut', {
    beforeStart: function(currentScene, targetScene, context) {
        console.log('Transition is about to start.');
    },
    afterEnd: function(currentScene, targetScene, context) {
        console.log('Transition has completed.');
    }
});
```

### Fallback Animations

Fallback animations define how elements without a matching identifier should behave during transitions. This ensures that all elements transition smoothly, even if they don't have a counterpart in the other scene.

When you assign fallback animations to an element, you're specifying how it should appear or disappear if it doesn't have a matching element in the target or current scene.

- **`data-transition-fallback`**: Applied to both entering and exiting unmatched elements.
- **`data-transition-fallback-from`**: Specific to elements in the **target** scene without a match in the current scene.
- **`data-transition-fallback-to`**: Specific to elements in the **current** scene without a match in the target scene.

**Defining Fallback Animations**:

In the **Identity Inspector**, add the appropriate attribute and define the animation properties using GSAP syntax:

- `opacity`: Controls the transparency.
- `x`, `y`: Controls the position.
- `scale`: Controls the size.

**Examples**:

- **For an element appearing in the target scene (no match in current scene):**

  To make an unmatched element fade in and move from the left in the target scene:

  1. Select the element in the **Identity Inspector**.
  2. Add the attribute `data-transition-fallback-from` with the value `opacity:0; x:-100`.

  This ensures that the element fades in and moves from 100 pixels to the left when it appears without a counterpart in the current scene.

- **For an element disappearing from the current scene (no match in target scene):**

  To make an unmatched element fade out and move to the right in the current scene:

  1. Select the element in the **Identity Inspector**.
  2. Add the attribute `data-transition-fallback-to` with the value `opacity:0; x:+100`.

  This configuration ensures that when there's no matching element in the target scene, the element will fade out and move 100 pixels to the right during the transition.

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
