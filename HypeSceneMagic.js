/*!
 * Hype SceneMagic 2.5.3 (GSAP Version)
 * Copyright (c) 2024 Max Ziebell, (https://maxziebell.de). MIT-license
 * Requires GSAP animation library (https://greensock.com/gsap/)
 */

/*
 * Version-History
 * 2.5.0 Adapted to use GSAP instead of Web Animations API
 * 2.5.1 Fixed id bug supporting multiple layouts (use the same name for layouts)
 * 2.5.2 Added support for data-transition-fallback attributes when magic pair is not matched
 *       Unified and cleaned up parsing, and added more documentation.
 * 2.5.3 Added data-transition-fallback-from/to for fine-grained directional transitions
 */

if ("HypeSceneMagic" in window === false) window['HypeSceneMagic'] = (function() {
    let _default = {
        easingMap: {
            'easein': 'power1.in',
            'easeout': 'power1.out',
            'easeinout': 'power1.inOut'
        },
        defaultProperties: {
            width: 'auto',
            height: 'auto',
            opacity: 1,
            borderRadius: '0px',
            transform: '',
            wordSpacing: 'normal',
            backgroundColor: 'transparent',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            textAlign: 'left',
            textShadow: 'none',
            lineHeight: 'normal',
            letterSpacing: 'normal',
            textDecoration: 'none',
        },
        transitionMode: 'indirect'
    };

    /**
     * Sets default configuration values for HypeSceneMagic
     * @param {(string|Object)} key - Either a string key or an object containing multiple key-value pairs
     * @param {*} [value] - The value to set if key is a string
     * @returns {void}
     */
    function setDefault(key, value) {
        if (typeof(key) == 'object') {
            _default = key;
            return;
        }
        _default[key] = value;
    }

    /**
     * Gets default configuration values from HypeSceneMagic
     * @param {string} [key] - Optional key to get specific default value
     * @returns {*} The entire default object if no key provided, otherwise the value for the specified key
     */
    function getDefault(key) {
        if (!key) return _default;
        return _default[key];
    }

    /**
     * Gets computed style properties for an element with fallback to default values
     * @param {HTMLElement} element - The element to get properties for
     * @returns {Object} Object containing style properties with their computed or default values
     */
    function getProperties(element) {
        let properties = {};
        let defaultProperties = getDefault('defaultProperties');
        for (let key in defaultProperties) {
            properties[key] = element.style[key] || defaultProperties[key];
        }
        return properties;
    }

    /**
     * Gets the mapped easing function name based on the provided ease string
     * @param {string} [ease='power1.inOut'] - The easing function name to map
     * @returns {string} The mapped easing function name from easingMap or the original ease if no mapping exists
     */
    function getEase(ease) {
        ease = ease || 'power1.inOut';
        return getDefault('easingMap')[ease.toLowerCase()] || ease;
    }

    /**
     * Finds the appropriate element to apply z-index to, checking if parent is a HYPE container
     * @param {HTMLElement} element - The element to check
     * @returns {HTMLElement} Either the parent container element or the original element
     */
    function findZIndexElement(element) {
        if (element.parentElement && element.parentElement.classList.contains('HYPE_element_container')) {
            return element.parentElement;
        }
        return element;
    }

    /**
     * Determines the appropriate z-index value based on the order parameter
     * @param {HTMLElement} element - The element to determine z-index for
     * @param {string|number} order - Either 'front', 'back' or a specific z-index value
     * @returns {string} The calculated z-index value as a string
     */
    function determineZIndex(element, order) {
        if (order === 'front' || order === 'back') {
            const siblings = Array.from(element.parentElement.children);
            const zIndices = siblings.map(el => parseInt(getComputedStyle(el).zIndex) || 0);
            
            if (order === 'front') {
                const maxZ = Math.max(...zIndices);
                return (maxZ + 1).toString();
            } else { // 'back'
                const minZ = Math.min(...zIndices);
                return (minZ - 1).toString();
            }
        }
        return order;
    }

    /**
     * Calculates timing values for transitions based on percentages and total duration
     * @param {number} delayPercentage - Delay percentage (0-100)
     * @param {number} durationPercentage - Duration percentage (0-100) 
     * @param {number} totalDuration - Total transition duration in seconds
     * @returns {Object} Object containing calculated delay and duration
     */
    function calculateTimingValues(delayPercentage, durationPercentage, totalDuration) {
        const normalizedDelay = delayPercentage / 100;
        const normalizedDuration = durationPercentage / 100;
        const delay = normalizedDelay * totalDuration;

        if (getDefault('transitionMode') === 'direct') {
            return {
                delay,
                duration: Math.max(0, Math.min(totalDuration - delay, totalDuration * normalizedDuration))
            };
        }
        
        return {
            delay,
            duration: (totalDuration - delay) * normalizedDuration
        };
    }

    /**
     * Animates a transition between two elements with configurable timing and properties
     * @param {HTMLElement} targetElement - The element to transition to
     * @param {HTMLElement} originElement - The element to transition from 
     * @param {number} totalDuration - Total duration of the transition in seconds
     * @param {string} ease - Easing function to use for the transition
     */
    function animateTransition(targetElement, originElement, totalDuration, ease) {
        const fromProperties = getProperties(originElement);
        const toProperties = getProperties(targetElement);

        function getAttributeValue(attr, defaultValue) {
            let sourceValue = originElement.getAttribute(attr);
            if (sourceValue === 'target') {
                return targetElement.getAttribute(attr) || defaultValue;
            }
            return sourceValue || defaultValue;
        }

        const delayPercentage = parseFloat(getAttributeValue('data-transition-delay', '0'));
        const durationPercentage = parseFloat(getAttributeValue('data-transition-duration', '100'));
        
        const timing = calculateTimingValues(delayPercentage, durationPercentage, totalDuration);

        const transitionOrder = getAttributeValue('data-transition-order', null);
        let zIndexElement = null;

        if (transitionOrder !== null) {
            zIndexElement = findZIndexElement(targetElement);
            const newZIndex = determineZIndex(zIndexElement, transitionOrder);
            gsap.set(zIndexElement, { zIndex: newZIndex });
        }

        decomposeTransform(fromProperties);
        decomposeTransform(toProperties);

        const tl = gsap.timeline();

        tl.fromTo(targetElement, fromProperties, {
            ...toProperties,
            duration: timing.duration,
            ease: getEase(ease),
            delay: timing.delay,
            onComplete: () => {
                if (zIndexElement) {
                    gsap.set(zIndexElement, { clearProps: 'zIndex' });
                }
                gsap.set(originElement, fromProperties);
            }
        });

        const originTween = gsap.fromTo(originElement, fromProperties, {
            ...toProperties,
            duration: timing.duration,
            ease: getEase(ease),
            delay: timing.delay,
            onComplete: () => {}
        });

        tl.add(originTween, 0);
        tl.call(() => originTween.pause(), [], timing.duration / 2);
    }

    /**
     * Decomposes transform string into individual transform properties
     * @param {Object} properties - Object containing CSS properties including transform
     */
    function decomposeTransform(properties) {
        const transform = properties.transform || '';
        const decomposed = {
            translateX: 0,
            translateY: 0,
            translateZ: 0,
            rotate: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scaleX: 1,
            scaleY: 1,
        };
    
        const regex = /(\w+)\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(transform)) !== null) {
            const [_, prop, value] = match;
            const values = value.split(',').map(v => parseFloat(v));
            switch (prop) {
                case 'translateX': decomposed.translateX = values[0]; break;
                case 'translateY': decomposed.translateY = values[0]; break;
                case 'translateZ': decomposed.translateZ = values[0]; break;
                case 'rotate': decomposed.rotate = values[0]; break;
                case 'rotateX': decomposed.rotateX = values[0]; break;
                case 'rotateY': decomposed.rotateY = values[0]; break;
                case 'rotateZ': decomposed.rotateZ = values[0]; break;
                case 'scaleX': decomposed.scaleX = values[0]; break;
                case 'scaleY': decomposed.scaleY = values[0]; break;
                case 'scaleZ': decomposed.scaleZ = values[0]; break;
                case 'scale': 
                    decomposed.scaleX = values[0];
                    decomposed.scaleY = values.length > 1 ? values[1] : values[0];
                    break;
            }
        }
    
        delete properties.transform;
        Object.assign(properties, decomposed);
    }

    /**
     * Adds CSS styles to disable pointer events during magic transitions.
     * Creates a style element with id 'magicTransitionStyle' if it doesn't already exist
     * and appends it to the document head.
     * @returns {void}
     */
    function addMagicTransitionCSS() {
        if (!document.getElementById('magicTransitionStyle')) {
            let style = document.createElement('style');
            style.id = 'magicTransitionStyle';
            style.textContent = `.magicTransition, .magicTransition * {pointer-events:none !important;}`;
            document.head.appendChild(style);
        }
    }

    /**
     * Gets the transition identifier from an element, either from a data attribute or CSS class
     * @param {HTMLElement} element - The DOM element to get the transition identifier from
     * @returns {string|null} The transition identifier if found, null otherwise
     */
    function getTransitionIdentifier(element) {
        const dataId = element.getAttribute('data-transition-id');
        if (dataId) return dataId;
    
        for (let className of element.classList) {
            if (className.startsWith('magic') && className.length > 5) {
                return className.slice(5).toLowerCase();
            }
        }
    
        return null;
    }

    /**
     * Parses a string of animation properties into an object
     * @param {string} dataString - String containing animation properties in format "prop1:value1;prop2:value2"
     * @returns {Object|null} Animation object with parsed properties and values, or null if no data
     */
    function parseSimpleAnimation(dataString) {
        if (!dataString) return null;
        
        const properties = dataString.split(';').filter(Boolean);
        const animation = {};
        const blacklist = ['delay', 'duration'];
        const percentageProps = ['scale', 'scaleX', 'scaleY', 'scaleZ'];
        
        properties.forEach(prop => {
            const [key, value] = prop.trim().split(':').map(s => s.trim());
            
            if (blacklist.includes(key)) {
                console.info(`Property '${key}' is not allowed in fallback animations`);
                return;
            }
            
            // Handle percentage values for scale properties
            if (percentageProps.includes(key) && value.endsWith('%')) {
                animation[key] = parseFloat(value) / 100;
            } else {
                // Pass other values directly to GSAP for parsing
                animation[key] = value;
            }
        });
        
        return animation;
    }

    /**
     * Main document load handler for Hype Scene Magic functionality
     * @param {Object} hypeDocument - The Hype document instance
     * @param {HTMLElement} element - The document element
     * @param {Event} event - The load event
     */
    function HypeDocumentLoad(hypeDocument, element, event) {
        const hypeDocElm = element;
        addMagicTransitionCSS();

        /**
         * Shows a scene with magic transition effects
         * @param {string} targetSceneName - Name of the scene to transition to
         * @param {number} [duration=0.5] - Duration of the transition in seconds
         * @param {string} [ease] - Easing function to use
         * @param {Object} [hooks] - Transition lifecycle hooks
         * @param {Function} [hooks.beforeStart] - Called before transition starts
         * @param {Function} [hooks.afterEnd] - Called after transition completes
         */
        hypeDocument.showSceneNamedMagic = function(targetSceneName, duration, ease, hooks) {
            
            hooks = hooks || {};
            const scenes = this.sceneNames();
            const currentSceneName = this.currentSceneName();
            const currentLayoutName = this.currentLayoutName();
            
            // Get current layout info
            const currentLayouts = this.layoutsForSceneNamed(currentSceneName);
            const currentLayout = currentLayouts.find(layout => {
                // First try to match by name
                if (layout.name === currentLayoutName) return true;
                
            }) || currentLayouts[0];

            // Find matching target layout by name or dimensions
            const targetLayouts = this.layoutsForSceneNamed(targetSceneName);
            const targetLayout = targetLayouts.find(layout => {
                // First try to match by name
                if (layout.name === currentLayoutName) return true;
                // Then try to match dimensions
                return layout.width === currentLayout.width && 
                       layout.height === currentLayout.height;
            }) || targetLayouts[0];

            // Get scene indices from layout._
            const currentSceneIdx = currentLayout._;
            const targetSceneIdx = targetLayout._;

            // Get scene elements using correct indices
            const currentSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${currentSceneIdx}"]`);
            const targetSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${targetSceneIdx}"]`);

            duration = duration || 0.5;

            if (targetSceneElm != null) {
                this.running_SceneMagic = true;
                
                hypeDocElm.classList.add('magicTransition');

                if (hooks.beforeStart) {
                    hooks.beforeStart(currentSceneElm, targetSceneElm, { duration, ease });
                }

                this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);
                this.pauseTimelineNamed('timelineName');
                this.triggerCustomBehaviorNamed('magicTransition');

                currentSceneElm.style.display = 'block';

                const targetMagicElms = targetSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');
                const sourceMagicElms = currentSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');

                // Store initial states for elements with fallback-to animations
                const initialStates = new Map();

                // Handle elements in target scene
                targetMagicElms.forEach(targetElement => {
                    const targetId = getTransitionIdentifier(targetElement);
                    if (targetId) {
                        const sourceElement = Array.from(sourceMagicElms).find(el => {
                            const sourceId = getTransitionIdentifier(el);
                            return sourceId && sourceId.toLowerCase() === targetId.toLowerCase();
                        });

                        if (sourceElement) {
                            animateTransition(targetElement, sourceElement, duration, ease);
                        } else {
                            // Check for fallback animation data - fallback-from takes precedence
                            const fallbackAnimation = targetElement.getAttribute('data-transition-fallback-from') || 
                                                    targetElement.getAttribute('data-transition-fallback');
                            if (fallbackAnimation) {
                                const animationData = parseSimpleAnimation(fallbackAnimation);
                                if (animationData) {
                                    const delayPercentage = parseFloat(targetElement.getAttribute('data-transition-delay') || '0');
                                    const durationPercentage = parseFloat(targetElement.getAttribute('data-transition-duration') || '100');
                                    
                                    const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

                                    gsap.from(targetElement, {
                                        ...animationData,
                                        duration: timing.duration,
                                        delay: timing.delay,
                                        ease: animationData.ease || getEase(ease)
                                    });
                                }
                            }
                        }
                    }
                });

                // Handle elements in source scene that aren't in target scene
                sourceMagicElms.forEach(sourceElement => {
                    const sourceId = getTransitionIdentifier(sourceElement);
                    if (sourceId) {
                        const targetElement = Array.from(targetMagicElms).find(el => {
                            const targetId = getTransitionIdentifier(el);
                            return targetId && targetId.toLowerCase() === sourceId.toLowerCase();
                        });

                        if (!targetElement) {
                            // Check for fallback-to animation
                            const fallbackToAnimation = sourceElement.getAttribute('data-transition-fallback-to') || 
                                                      sourceElement.getAttribute('data-transition-fallback');
                            if (fallbackToAnimation) {
                                const animationData = parseSimpleAnimation(fallbackToAnimation);
                                if (animationData) {
                                    // Store initial state
                                    initialStates.set(sourceElement, { ...getProperties(sourceElement) });

                                    const delayPercentage = parseFloat(sourceElement.getAttribute('data-transition-delay') || '0');
                                    const durationPercentage = parseFloat(sourceElement.getAttribute('data-transition-duration') || '100');
                                    
                                    const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

                                    gsap.to(sourceElement, {
                                        ...animationData,
                                        duration: timing.duration,
                                        delay: timing.delay,
                                        ease: animationData.ease || getEase(ease),
                                        onComplete: () => {
                                            // Reset to initial state
                                            const initialState = initialStates.get(sourceElement);
                                            if (initialState) {
                                                gsap.set(sourceElement, initialState);
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                });

                gsap.fromTo(targetSceneElm, { opacity: 0 }, { opacity: 1, duration: duration / 2, ease: 'linear' });

                gsap.delayedCall(duration, () => {
                    currentSceneElm.style.display = 'none';
                    hypeDocElm.classList.remove('magicTransition');
                    this.running_SceneMagic = false;
                    this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);

                    if (hooks.afterEnd) {
                        hooks.afterEnd(currentSceneElm, targetSceneElm, { duration, ease });
                    }
                });
            }
        }

        /**
         * Shows the next scene with magic transition effects
         * @param {number} [duration] - Duration of the transition in seconds
         * @param {string} [ease] - Easing function to use
         * @param {Object} [hooks] - Transition lifecycle hooks
         */
        hypeDocument.showNextSceneMagic = function(duration, ease, hooks) {
            const scenes = this.sceneNames();
            const currentSceneIdx = scenes.indexOf(this.currentSceneName());
            const nextSceneName = scenes[currentSceneIdx + 1];
            if (nextSceneName != null) {
                hypeDocument.showSceneNamedMagic(nextSceneName, duration, ease, hooks);
            }
        }

        /**
         * Shows the previous scene with magic transition effects
         * @param {number} [duration] - Duration of the transition in seconds
         * @param {string} [ease] - Easing function to use
         * @param {Object} [hooks] - Transition lifecycle hooks
         */
        hypeDocument.showPreviousSceneMagic = function(duration, ease, hooks) {
            const scenes = this.sceneNames();
            const currentSceneIdx = scenes.indexOf(this.currentSceneName());
            const previousSceneName = scenes[currentSceneIdx - 1];
            if (previousSceneName != null) {
                hypeDocument.showSceneNamedMagic(previousSceneName, duration, ease, hooks);
            }
        }

        /**
         * Event handler to check if scene magic transition is running
         * @param {Object} hypeDocument - The Hype document instance
         * @param {HTMLElement} element - The document element
         * @param {Event} event - The event object
         * @returns {boolean} True if scene magic is not running, false otherwise
         */
        function runningSceneMagic(hypeDocument, element, event) {
            if (hypeDocElm == element) return !hypeDocument.running_SceneMagic;
        }

        hypeDocument.running_SceneMagic = false;
        window.HYPE_eventListeners.push({"type": "HypeSceneLoad", "callback": runningSceneMagic });
        window.HYPE_eventListeners.push({ "type": "HypeSceneUnload", "callback": runningSceneMagic });
    }

    if ("HYPE_eventListeners" in window === false) window.HYPE_eventListeners = Array();
    window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });

    return {
        version: '2.5.3',
        getDefault: getDefault,
        setDefault: setDefault,
    };
})();
