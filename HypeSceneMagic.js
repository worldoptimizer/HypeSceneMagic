/*!
 * Hype SceneMagic 2.5.5 (GSAP Version)
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
 * 2.5.4 Removed the indirect transition mode as it was too complex and unintuitive
 *       Refactored to use a native Hype crossfade transition, but overridden with the magicTransition class
 *       Added z-index management for proper scene layering during transitions
 * 2.5.5 Added support for runtime transition mapping and made identifiers case-insensitive
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
        crossFadeFactor: 0.5,
        duration: 0.5
    };

    // Add WeakMap for storing initial properties
    const _initialPropertiesCache = new WeakMap();

    /**
     * Gets computed style properties for an element with caching
     * @param {HTMLElement} element - The element to get properties for
     * @param {boolean} [force=false] - Force recalculation of properties
     * @returns {Object} Object containing style properties
     */
    function getCachedMagicProperties(element, force = false) {
        // Check cache first
        if (!force && _initialPropertiesCache.has(element)) {
            return _initialPropertiesCache.get(element);
        }

        // Calculate properties
        let properties = {};
        let defaultProperties = getDefault('defaultProperties');
        for (let key in defaultProperties) {
            properties[key] = element.style[key] || defaultProperties[key];
        }

        // Store in cache
        _initialPropertiesCache.set(element, properties);
        
        return properties;
    }

    /**
     * Clears the cached properties for an element or all cached properties if no element is provided
     * @param {HTMLElement} [element] - Optional element to clear cache for. If not provided, clears entire cache
     */
    function clearCachedMagicProperties(element) {
        if (element) {
            _initialPropertiesCache.delete(element);
        } else {
            _initialPropertiesCache.clear();
        }
    }

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
     * Calculates timing values for transitions based on percentages/factors and total duration
     * @param {string|number} delayValue - Delay as percentage (with %), factor, or time value (s/ms)
     * @param {string|number} durationValue - Duration as percentage (with %), factor, or time value (s/ms)
     * @param {number} totalDuration - Total transition duration in seconds
     * @returns {Object} Object containing calculated delay and duration in seconds
     */
    function calculateTimingValues(delayValue, durationValue, totalDuration) {
        const calculateValue = (value) => {
            if (typeof value === 'string') {
                if (value.endsWith('%')) {
                    // Handle percentage values (e.g., "50%")
                    return (parseFloat(value) / 100) * parseFloat(totalDuration);
                } else if (value.endsWith('ms')) {
                    // Handle millisecond values (e.g., "500ms")
                    return parseFloat(value) / 1000;
                } else if (value.endsWith('s')) {
                    // Handle second values (e.g., "0.5s")
                    return parseFloat(value);
                }
            }
            // Handle factor values (e.g., 0.5)
            return parseFloat(value) * parseFloat(totalDuration);
        };

        const delay = calculateValue(delayValue);
        const duration = calculateValue(durationValue);
        return { delay, duration };
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
            style.textContent = [
                '.magicTransition, .magicTransition * { pointer-events: none !important; }',
                '.magicTransition > .HYPE_scene { transform: none !important; }',
                '.magicTransition > .HYPE_scene.currentScene { z-index: 1 !important; display: block !important; }',
                '.magicTransition > .HYPE_scene.targetScene { z-index: 2 !important; display: block !important; opacity: var(--scene-opacity, 0) !important; }',
                '.magicTransition > .HYPE_document > .HYPE_element_container { z-index: 1000 !important; }',
                '.magicTransition > .HYPE_scene.currentScene.fadeComplete { display: none !important; }',
                '.magicTransition > .HYPE_scene.targetScene.fadeComplete { opacity: 1 !important; }'
            ].join('');
            document.head.appendChild(style);
        }
    }

    /**
     * Extracts the magic identifier from an element's class list
     * @param {HTMLElement} element - The element to check
     * @returns {string|null} The identifier portion of the magic class, or null if not found
     */
    function extractMagicIdentifier(element) {
        for (let className of element.classList) {
            if (className.toLowerCase().startsWith('magic') && className.length > 5) {
                return className.slice(5).toLowerCase();
            }
        }
        return null;
    }

    /**
     * Gets the transition identifier from an element
     * @param {HTMLElement} element - The DOM element to get the transition identifier from
     * @returns {string|null} The transition identifier if found, null otherwise
     */
    function getTransitionIdentifier(element) {
        // Try to get identifier from class first
        let identifier = extractMagicIdentifier(element);
        
        // If no class identifier found, check data attribute
        if (!identifier) {
            identifier = element.getAttribute('data-transition-id');
        }
        
        // Remove 'magic' prefix if present and convert to lowercase
        if (identifier && identifier.toLowerCase().startsWith('magic')) {
            identifier = identifier.slice(5);
        }
        
        // Return lowercase identifier or null if none found
        return identifier ? identifier.toLowerCase() : null;
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
        const percentageProps = ['scale', 'scaleX', 'scaleY', 'scaleZ'];
        
        properties.forEach(prop => {
            const [key, value] = prop.trim().split(':').map(s => s.trim());
            
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
         * @param {number} [duration] - Duration of the transition in seconds
         * @param {string} [ease] - Easing function to use
         * @param {Object} [options] - Additional options for the transition
         * @param {number} [options.crossFadeFactor] - Custom cross fade factor (0-1)
         * @param {Function} [options.beforeStart] - Called before transition starts
         * @param {Function} [options.afterEnd] - Called after transition completes
         */
        hypeDocument.showSceneNamedMagic = function(targetSceneName, duration, ease, options = {}) {
            // Return if we are currently running a transition
            if (hypeDocElm.classList.contains('magicTransition')) return;

            // Get current scene and layout names
            const currentSceneName = this.currentSceneName();
            const currentLayoutName = this.currentLayoutName();
            
            // Avoid unnecessary calculations if target scene is the same as the current scene
            if (targetSceneName === currentSceneName) return;
            
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

            duration = duration || getDefault('duration');
            const crossFadeFactor = options.crossFadeFactor !== undefined ? options.crossFadeFactor : getDefault('crossFadeFactor');
            const crossFadeDuration = duration * crossFadeFactor;

            if (targetSceneElm != null) {
                // Add magicTransition class to hypeDocElm to disable pointer events
                hypeDocElm.classList.add('magicTransition');

                // Add scene-specific classes for z-index management
                currentSceneElm.classList.add('currentScene');
                targetSceneElm.classList.add('targetScene');

                // Call beforeStart hook if provided
                if (options.beforeStart) {
                    options.beforeStart(currentSceneElm, targetSceneElm, { duration, ease });
                }

                // Use swap transition but prohibit default behavior with magicTransition class
                hypeDocument.showSceneNamed(targetSceneName, hypeDocument.kSceneTransitionCrossfade, duration);
                
                // Create a timeline to manage all animations
                const masterTimeline = gsap.timeline({
                    onComplete: () => {
                        // Reset properties for all elements that need restoration
                        elementsToRestore.forEach(element => {
                            const initialProps = getCachedMagicProperties(element);
                            gsap.set(element, initialProps);
                        });

                        // Clean up classes
                        hypeDocElm.classList.remove('magicTransition');
                        currentSceneElm.classList.remove('currentScene', 'fadeComplete');
                        targetSceneElm.classList.remove('targetScene', 'fadeComplete');
                        
                        if (options.afterEnd) {
                            options.afterEnd(currentSceneElm, targetSceneElm, { duration, ease });
                        }
                    }
                });

                // Fade in the target scene with GSAP (no easing)
                masterTimeline.fromTo(targetSceneElm, 
                    { '--scene-opacity': 0 },
                    { 
                        '--scene-opacity': 1,
                        duration: crossFadeDuration,
                        ease: "none",
                        onComplete: () => {
                            currentSceneElm.classList.add('fadeComplete');
                            targetSceneElm.classList.add('fadeComplete');
                        }
                    }
                );

                // Kill any running animations in current scene after crossfade to improve performance
                masterTimeline.call(() => {
                    gsap.killTweensOf(currentSceneElm.querySelectorAll('*'));
                }, null, crossFadeDuration);
                
                // todo: check if this is needed anymore by checking if it still has an effect
                this.triggerCustomBehaviorNamed('magicTransition');

                // Get all magic elements in target and source scenes
                const targetMagicElms = targetSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');
                const sourceMagicElms = currentSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');

                // Store references to elements that need restoration
                const elementsToRestore = new Set();

                // Handle elements in target scene that are also in source scene
                targetMagicElms.forEach(targetElement => {
                    const targetId = getTransitionIdentifier(targetElement);
                    
                    // If element has a transition identifier, it's a magic element
                    if (targetId) {
                        // Find matching element in source scene
                        const sourceElement = Array.from(sourceMagicElms).find(el => {
                            const sourceId = getTransitionIdentifier(el);
                            return sourceId && sourceId.toLowerCase() === targetId.toLowerCase();
                        });

                        // If matching element is found, animate transition
                        if (sourceElement) {
                            // Add source element to restore list
                            elementsToRestore.add(sourceElement);
                            
                            // Get and cache initial properties of both elements
                            const fromProperties = getCachedMagicProperties(sourceElement);
                            const toProperties = getCachedMagicProperties(targetElement);

                            // Helper function to get attribute value from source or target element
                            function getAttributeValue(attr, defaultValue) {
                                let sourceValue = sourceElement.getAttribute(attr);
                                if (sourceValue === 'target') {
                                    return targetElement.getAttribute(attr) || defaultValue;
                                }
                                return sourceValue || defaultValue;
                            }

                            // Get transition attributes
                            const delayPercentage = getAttributeValue('data-transition-delay', 0);
                            const durationPercentage = getAttributeValue('data-transition-duration', 1);
                            const transitionOrder = getAttributeValue('data-transition-order', null);

                            // Calculate timing values
                            const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

                            // Get easing from target element or use default
                            const easing = getAttributeValue('data-transition-ease', ease);

                            // Handle transition stacking order
                            let zIndexElement = null;

                            if (transitionOrder !== null) {
                                zIndexElement = findZIndexElement(targetElement);
                                const newZIndex = determineZIndex(zIndexElement, transitionOrder);
                                gsap.set(zIndexElement, { zIndex: newZIndex });
                            }

                            // Create a nested timeline for this element pair
                            const elementTimeline = gsap.timeline({
                                onComplete: () => {
                                    if (zIndexElement) {
                                        gsap.set(zIndexElement, { clearProps: 'zIndex' });
                                    }
                                }
                            });

                            // Add fromTo tweens to element timeline
                            elementTimeline.fromTo(targetElement, fromProperties, {
                                ...toProperties,
                                duration: timing.duration,
                                ease: getEase(easing)
                            }, timing.delay);

                            elementTimeline.fromTo(sourceElement, fromProperties, {
                                ...toProperties,
                                duration: timing.duration,
                                ease: getEase(easing)
                            }, timing.delay);

                            // Add element timeline to master timeline
                            masterTimeline.add(elementTimeline, 0);
                            
                        } else {
                            // Check for data-transition-fallback-from and data-transition-fallback animation data
                            const fallbackAnimation = targetElement.getAttribute('data-transition-fallback-from') || targetElement.getAttribute('data-transition-fallback');

                            // If fallback animation data is found, parse and animate
                            if (fallbackAnimation) {
                                const animationData = parseSimpleAnimation(fallbackAnimation);
                                if (animationData) {
                                    // Get initial properties to make sure they are cached
                                    getCachedMagicProperties(targetElement);

                                    const delayPercentage = targetElement.getAttribute('data-transition-delay') || 0;
                                    const durationPercentage = targetElement.getAttribute('data-transition-duration') || 1;
                                    const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

                                    // Get easing from target element or use default
                                    const easing = targetElement.getAttribute('data-transition-ease') || ease;

                                    // Add fallback animation to master timeline
                                    masterTimeline.from(targetElement, {
                                        duration: timing.duration,
                                        ease: getEase(easing),
                                        ...animationData
                                    }, timing.delay);
                                }
                            }
                        }
                    }
                });

                // Handle elements in source scene that aren't in target scene
                sourceMagicElms.forEach(sourceElement => {
                    const sourceId = getTransitionIdentifier(sourceElement);
                    if (sourceId) {
                        // Find matching element in target scene
                        const targetElement = Array.from(targetMagicElms).find(el => {
                            const targetId = getTransitionIdentifier(el);
                            return targetId && targetId.toLowerCase() === sourceId.toLowerCase();
                        });

                        // If matching element is found, animate transition
                        if (!targetElement) {
                            elementsToRestore.add(sourceElement);
                            
                            // Check for data-transition-fallback-to and data-transition-fallback animation data
                            const fallbackToAnimation = sourceElement.getAttribute('data-transition-fallback-to') || sourceElement.getAttribute('data-transition-fallback');
                            
                            // If fallback-to animation data is found, parse and animate
                            if (fallbackToAnimation) {
                                const animationData = parseSimpleAnimation(fallbackToAnimation);
                                
                                if (animationData) {
                                    // Get initial properties to make sure they are cached
                                    getCachedMagicProperties(sourceElement);
                                    
                                    const delayPercentage = sourceElement.getAttribute('data-transition-delay') || 0;
                                    const durationPercentage = sourceElement.getAttribute('data-transition-duration') || 1;
                                    const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

                                    // Get easing from target element or use default
                                    const easing = sourceElement.getAttribute('data-transition-ease') || ease;

                                    // Add fallback animation to master timeline
                                    masterTimeline.to(sourceElement, {
                                        duration: timing.duration,
                                        ease: getEase(easing),
                                        ...animationData,
                                    }, timing.delay);
                                }
                            }
                        }
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

    }

    if ("HYPE_eventListeners" in window === false) window.HYPE_eventListeners = Array();
    window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });

    return {
        version: '2.5.5',
        getDefault,
        setDefault,
        clearCachedMagicProperties,
        extractMagicIdentifier
    };
})();
