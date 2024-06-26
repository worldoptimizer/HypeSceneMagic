
# Hype Scene Magic 


![HypeSceneMagic|](https://playground.maxziebell.de/Hype/SceneMagic/HypeSceneMagic.jpg?)

**Hype Scene Magic** is a powerful tool for creating visually stunning scene transitions within Tumult Hype. Inspired by the fluid animations and seamless transitions introduced by Steve Jobs in Apple's Keynote presentations, SceneMagic harnesses the potential of web animations to enhance performance and interactivity. Whether you're creating simple animations or complex transitions, SceneMagic offers a versatile set of tools to bring your content to life.


---

### Content Delivery Network (CDN)

The latest version of SceneMagic can be linked into your project using the following in the head section of your project:

```html
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeSceneMagic/HypeSceneMagic.min.js"></script>
```

Optionally, you can also link a SRI version or specific releases. Read more about that on the JsDelivr (CDN) page for this extension at [https://www.jsdelivr.com/package/gh/worldoptimizer/HypeSceneMagic](https://www.jsdelivr.com/package/gh/worldoptimizer/HypeSceneMagic).

Learn how to use the latest extension version and how to combine extensions into one file at [https://github.com/worldoptimizer/HypeCookBook/wiki/Including-external-files-and-Hype-extensions](https://github.com/worldoptimizer/HypeCookBook/wiki/Including-external-files-and-Hype-extensions).


---

## Getting Started

To begin using SceneMagic, follow these steps to set up a basic transition:

### Step-by-Step Guide

1. **Add SceneMagic Script to Your Project**:
   - Open the **Head HTML** section of your Tumult Hype document.
   - Add the following script to include SceneMagic:
     ```html
     <script src="${resourcesFolderName}/HypeSceneMagic.js"></script>
     ```

2. **Define Elements with Magic Classes**:
   - In Tumult Hype, create the elements you want to animate between scenes.
   - Assign them a class name starting with `magic`, followed by a keyword that will be used to match elements across scenes.
   - To do this, select the element in Tumult Hype, go to the **Identity Inspector**, and set the **Class Name** field. For example, set the class name to `magicBox` or `magicElement1`.

3. **Create Transition Functions**:
   - Define functions to trigger transitions using Hype's JavaScript API. Here are examples of functions to go to specific scenes with different effects:

---

## New Data-Transition Attributes

To enhance the flexibility and control of transitions, several new `data-transition` attributes have been introduced:

| Attribute                   | Description                                                            | Example Values                |
|-----------------------------|------------------------------------------------------------------------|-------------------------------|
| `data-transition-id`        | Assigns a unique identifier to elements for matching between scenes.    | `example1`, `box`, `item123`  |
| `data-transition-delay`     | Specifies the delay before the transition starts, in percentage of the total duration. | `0`, `10`, `50`               |
| `data-transition-duration`  | Defines the duration of the transition, in percentage of the total duration. | `100`, `75`, `50`             |
| `data-transition-order`     | Controls the z-index order during the transition. Accepts `front`, `back`, or a specific number. | `front`, `back`, `10`         |

### Special Note

- **`target`**: The keyword `target` can be used with the `data-transition-delay`, `data-transition-duration`, and `data-transition-order` attributes to inherit values from the target element. This allows for dynamic adjustments based on the properties of the element being transitioned to.

---

## Transition Modes

SceneMagic now supports two transition modes: **direct** and **indirect**. The default mode is **indirect**.

### Indirect Mode (Default)

In indirect mode, the delay and duration are calculated based on the total duration of the transition, ensuring that both the delay and the transition time fit within the overall time.

### Direct Mode

In direct mode, the delay is applied first, and then the transition duration follows, allowing for more precise control over the timing of each part of the transition.

### How to Change the Transition Mode

You can change the transition mode globally by using the `setDefault` function.

```javascript
HypeSceneMagic.setDefault('transitionMode', 'direct');
```

Or revert to the default **indirect** mode:

```javascript
HypeSceneMagic.setDefault('transitionMode', 'indirect');
```

---

## Examples

### Simple Example: Fade Transition

1. **Scene Setup**:
   - Create two scenes in Tumult Hype.
   - In Scene 1, create an element and set its class to `magicBox`. Adjust its properties like opacity and position in the **Metrics Inspector**.
   - In Scene 2, create a similar element with the same class name `magicBox` but with different properties.

   For example:
   - **Scene 1**: 
     - Opacity: 1
     - Position: Top 50px, Left 50px
   - **Scene 2**: 
     - Opacity: 0.5
     - Position: Top 100px, Left 100px

   SceneMagic will animate the transition between these states, giving the illusion of a single object transforming between scenes.

2. **Go to Scene with Fade Transition**:
   ```javascript
   function goToScene2(hypeDocument, element, event) {
       hypeDocument.showSceneNamedMagic('Scene 2', 1.0, 'easeinout');
   }
   ```
   - Attach this function to a button or event to trigger the transition.

### Intermediate Example: Slide Transition

1. **Scene Setup**:
   - Similar to the simple example, create two scenes and add elements with `magic` classes in Tumult Hype.
   - In Scene 1, create an element and set its class to `magicSlide`. Adjust its properties like opacity and position in the **Metrics Inspector**.
   - In Scene 2, create a similar element with the same class name `magicSlide` but with different properties.

   For example:
   - **Scene 1**: 
     - Opacity: 1
     - Position: Top 50px, Left 50px
   - **Scene 2**: 
     - Opacity: 0.5
     - Position: Top 100px, Left 100px

   SceneMagic will slide these elements into their new positions.

2. **Go to Scene with Slide Transition**:
   ```javascript
   function goToScene2WithSlide(hypeDocument, element, event) {
       hypeDocument.showSceneNamedMagic('Scene 2', 1.5, 'easein');
   }
   ```
   - Attach this function to a button or event.

### Advanced Example: Using Hooks for Custom Actions

1. **Scene Setup**:
   - Add elements to your scenes with `magic` classes for matching in Tumult Hype.
   - In Scene 1, create an element and set its class to `magicElement`. Adjust its properties like opacity and position in the **Metrics Inspector**.
   - In Scene 2, create a similar element with the same class name `magicElement` but with different properties.

   For example:
   - **Scene 1**: 
     - Opacity: 1
     - Position: Top 50px, Left 50px
   - **Scene 2**: 
     - Opacity: 0.5
     - Position: Top 100px, Left 100px

   SceneMagic will animate the transition between these states.

2. **Go to Scene with Hooks**:
   ```javascript
   function goToScene2WithHooks(hypeDocument, element, event) {
       let hooks = {
           beforeStart: function(currentScene, targetScene, options) {
               // Bring current element to the front
               let currentElement = currentScene.querySelector('.magicElement');
               if (currentElement) {
                   currentElement.style.zIndex = 9999; // Bring to front
               }
               console.log("Transition starting...");
           },
           afterEnd: function(currentScene, targetScene, options) {
               // do something with elements and options
               console.log("Transition ended.");
           }
       };
       hypeDocument.showSceneNamedMagic('Scene 2', 2.0, 'easeinout', hooks);
   }
   ```
   - Attach this function to an event to observe the hooks in action.

---

## Tips for Effective Transitions

- **Consistent Naming**: Ensure that elements you want to animate have consistent class names across scenes, prefixed with `magic`.
- **Easing Functions**: Experiment with different easing functions (`easein`, `easeout`, `easeinout`) to achieve the desired effect.
- **Duration**: Adjust the duration of your transitions to make them feel natural and smooth.
- **Debugging**: Use browser console logs in hooks to debug and fine-tune your transitions.
