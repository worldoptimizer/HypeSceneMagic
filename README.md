# Hype Scene Magic 

#### Overview

**SceneMagic** is a powerful tool for creating visually stunning scene transitions within Tumult Hype. Inspired by the fluid animations and seamless transitions introduced by Steve Jobs in Apple's Keynote presentations, SceneMagic harnesses the potential of web animations to enhance performance and interactivity. Whether you're creating simple animations or complex transitions, SceneMagic offers a versatile set of tools to bring your content to life.

---

### Getting Started

To begin using SceneMagic, follow these steps to set up a basic transition:

#### Step-by-Step Guide

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

### Examples

#### Simple Example: Fade Transition

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

#### Intermediate Example: Slide Transition

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

#### Advanced Example: Using Hooks for Custom Actions

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

### Tips for Effective Transitions

- **Consistent Naming**: Ensure that elements you want to animate have consistent class names across scenes, prefixed with `magic`.
- **Easing Functions**: Experiment with different easing functions (`easein`, `easeout`, `easeinout`) to achieve the desired effect.
- **Duration**: Adjust the duration of your transitions to make them feel natural and smooth.
- **Debugging**: Use browser console logs in hooks to debug and fine-tune your transitions.
