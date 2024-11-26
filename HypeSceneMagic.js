
/*!
 * Hype SceneMagic 2.5.9 (GSAP Version)
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
 * 2.5.6 Refactored beforeStart/afterEnd to onTransitionStart/onTransitionEnd
 *       Added animation registration system for reusable animations
 * 2.5.7 Added onTransitionProgress callback to track overall transition progress
 *       Added custom behaviors: magicTransitionStart/End, magicTransition_{fromScene}_to_{toScene},
 *       magicTransitionFrom_{fromScene}, magicTransitionTo_{toScene} (scene names without spaces)
 * 2.5.8 Added support for data-transition-animation on non-magic elements
 *       Added data-transition-animation-from/to for directional animations
 *       Renamed fallback to animation in attribute names for consistency
 *       Added hypeDocument.applyAnimation() to apply registered and custom GSAP animations to elements
 *       Added durationAnimation and refactored duration to durationTransition
 * 2.5.9 Fixed issue where transitions without magic elements would complete too early
 *       Added minimum duration enforcement using GSAP timeline
 *       Fixed an issue when matching layouts by dimensions interfered with matching by name
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
		durationTransition: 0.5,
		durationAnimation: 0.25,
		registeredAnimations: {},
		hypePropertyMap: {
			x: 'left',
			y: 'top',
			scale: ['scaleX', 'scaleY'],
			scaleX: 'scaleX',
			scaleY: 'scaleY',
			rotation: 'rotateZ',
			opacity: 'opacity',
			width: 'width',
			height: 'height',
			zIndex: 'z-index'
		}
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
	 * Registers an animation for reuse
	 * @param {string} name - Name of the animation
	 * @param {Object|string} animation - Animation properties object or string
	 */
	function registerAnimation(name, animation) {
		if (typeof animation === 'string') {
			animation = parseSimpleAnimation(animation);
		}
		_default.registeredAnimations[name.toLowerCase()] = animation;
	}

	/**
	 * Gets a registered animation by name
	 * @param {string} name - Name of the animation
	 * @returns {Object|null} Animation object if found, null otherwise
	 */
	function getRegisteredAnimation(name) {
		return _default.registeredAnimations[name.toLowerCase()] || null;
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

		// Add registerAnimation to hypeDocument
		hypeDocument.registerAnimation = registerAnimation;

		/**
		 * Shows a scene with magic transition effects
		 * @param {string} targetSceneName - Name of the scene to transition to
		 * @param {number} [duration] - Duration of the transition in seconds
		 * @param {string} [ease] - Easing function to use
		 * @param {Object} [options] - Additional options for the transition
		 * @param {number} [options.crossFadeFactor] - Custom cross fade factor (0-1)
		 * @param {Function} [options.onTransitionStart] - Called before transition starts
		 * @param {Function} [options.onTransitionProgress] - Called during transition with progress (0-1)
		 * @param {Function} [options.onTransitionEnd] - Called after transition completes
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
			
			// Find matching layout in priority order:
			const targetLayout = 
				// 1. Match by exact name
				targetLayouts.find(layout => layout.name === currentLayoutName) || 
				// 2. Match by dimensions
				targetLayouts.find(layout => layout.width === currentLayout.width && layout.height === currentLayout.height) || 
				// 3. Fallback to first layout
				targetLayouts[0];

			// Get scene indices from layout._
			const currentSceneIdx = currentLayout._;
			const targetSceneIdx = targetLayout._;

			// Get scene elements using correct indices
			const currentSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${currentSceneIdx}"]`);
			const targetSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${targetSceneIdx}"]`);

			// If target scene element doesn't exist abort
			if (targetSceneElm === null) return;
			
			// Get duration and cross fade factor
			duration = duration || getDefault('durationTransition');
			const crossFadeFactor = options.crossFadeFactor !== undefined ? options.crossFadeFactor : getDefault('crossFadeFactor');
			const crossFadeDuration = duration * crossFadeFactor;
			
			// Add magicTransition class to hypeDocElm to disable pointer events
			hypeDocElm.classList.add('magicTransition');

			// Add scene-specific classes for z-index management
			currentSceneElm.classList.add('currentScene');
			targetSceneElm.classList.add('targetScene');

			// Call onTransitionStart hook if provided
			if (options.onTransitionStart) {
				options.onTransitionStart(currentSceneElm, targetSceneElm, { duration, ease });
			}

			// Trigger magic transition start event
			hypeDocument.triggerCustomBehaviorNamed('magicTransitionStart');
			
			// Trigger scene-specific transition behaviors (with spaces removed, sorted by specificity)
			hypeDocument.triggerCustomBehaviorNamed(`magicTransitionFrom_${currentSceneName.replace(/\s+/g, '')}`);
			hypeDocument.triggerCustomBehaviorNamed(`magicTransitionTo_${targetSceneName.replace(/\s+/g, '')}`);
			hypeDocument.triggerCustomBehaviorNamed(`magicTransition_${currentSceneName.replace(/\s+/g, '')}_to_${targetSceneName.replace(/\s+/g, '')}`);
			
			// Use swap transition but prohibit default behavior with magicTransition class
			hypeDocument.showSceneNamed(targetSceneName, hypeDocument.kSceneTransitionCrossfade, duration);
			
			// Create a timeline to manage all animations
			const masterTimeline = gsap.timeline({
				onUpdate: function() {
					if (options.onTransitionProgress) {
						options.onTransitionProgress(this.progress(), currentSceneElm, targetSceneElm);
					}
				},
				onComplete: () => {
					// Wait for target scene opacity to be 1 before cleanup
					const checkOpacity = () => {
						const opacity = getComputedStyle(targetSceneElm).opacity;
						if (opacity === '1') {
							// Reset properties for all elements that need restoration after a frame delay
							requestAnimationFrame(() => {
								elementsToRestore.forEach(element => {
									const initialProps = getCachedMagicProperties(element);
									gsap.set(element, initialProps);
								});
							});

							// Clean up classes
							hypeDocElm.classList.remove('magicTransition');
							currentSceneElm.classList.remove('currentScene', 'fadeComplete');
							targetSceneElm.classList.remove('targetScene', 'fadeComplete');
							
							if (options.onTransitionEnd) {
								options.onTransitionEnd(currentSceneElm, targetSceneElm, { duration, ease });
							}

							// Trigger magic transition end event
							hypeDocument.triggerCustomBehaviorNamed('magicTransitionEnd');
						} else {
							requestAnimationFrame(checkOpacity);
						}
					};
					checkOpacity();
				}
			});

			// Add a dummy tween to ensure minimum duration
			masterTimeline.to({}, { duration: duration });

			// Fade in the target scene with GSAP (no easing)
			masterTimeline.fromTo(targetSceneElm, 
				{ '--scene-opacity': 0 },
				{ 
					'--scene-opacity': 1,
					duration: crossFadeDuration,
					ease: "none",
					onComplete: () => {
						// Add fadeComplete class to current and target scenes (to set display and opacity)
						currentSceneElm.classList.add('fadeComplete');
						targetSceneElm.classList.add('fadeComplete');

						// Kill any running animations in current scene to improve performance
						gsap.killTweensOf(currentSceneElm.querySelectorAll('*'));
					}
				},
				0
			);

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
						// Check for data-transition-animation and data-transition-animation-from animation data
						const animation = targetElement.getAttribute('data-transition-animation-from') || targetElement.getAttribute('data-transition-animation');

						// If animation data is found, parse and animate
						if (animation) {
							let animationData;
							
							// Check if animation is a registered animation name
							if (!animation.includes(':')) {
								animationData = getRegisteredAnimation(animation);
							}
							
							// If not a registered animation, parse as simple animation string
							if (!animationData) {
								animationData = parseSimpleAnimation(animation);
							}

							if (animationData) {
								// Get initial properties to make sure they are cached
								getCachedMagicProperties(targetElement);

								const delayPercentage = targetElement.getAttribute('data-transition-delay') || 0;
								const durationPercentage = targetElement.getAttribute('data-transition-duration') || 1;
								const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

								// Get easing from target element or use default
								const easing = targetElement.getAttribute('data-transition-ease') || ease;

								// Add animation to master timeline
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
						
						// Check for data-transition-animation-to and data-transition-animation animation data
						const animation = sourceElement.getAttribute('data-transition-animation-to') || sourceElement.getAttribute('data-transition-animation');
						
						// If animation data is found, parse and animate
						if (animation) {
							let animationData;
							
							// Check if animation is a registered animation name
							if (!animation.includes(':')) {
								animationData = getRegisteredAnimation(animation);
							}
							
							// If not a registered animation, parse as simple animation string
							if (!animationData) {
								animationData = parseSimpleAnimation(animation);
							}
							
							if (animationData) {
								// Get initial properties to make sure they are cached
								getCachedMagicProperties(sourceElement);
								
								const delayPercentage = sourceElement.getAttribute('data-transition-delay') || 0;
								const durationPercentage = sourceElement.getAttribute('data-transition-duration') || 1;
								const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);

								// Get easing from target element or use default
								const easing = sourceElement.getAttribute('data-transition-ease') || ease;

								// Add animation to master timeline
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

			// Helper function to handle animation for non-magic elements
			const handleNonMagicAnimation = (element, isTarget) => {
				const animationType = isTarget ? 'from' : 'to';
				const animation = element.getAttribute(`data-transition-animation-${animationType}`) || 
								element.getAttribute('data-transition-animation');
				
				if (animation) {
					let animationData = animation.includes(':') ? 
						parseSimpleAnimation(animation) : 
						getRegisteredAnimation(animation);

					if (animationData) {
						const delayPercentage = element.getAttribute('data-transition-delay') || 0;
						const durationPercentage = element.getAttribute('data-transition-duration') || 1;
						const timing = calculateTimingValues(delayPercentage, durationPercentage, duration);
						const easing = element.getAttribute('data-transition-ease') || ease;

						masterTimeline[isTarget ? 'from' : 'to'](element, {
							duration: timing.duration,
							ease: getEase(easing),
							...animationData
						}, timing.delay);
					}
				}
			}

			// Get all elements with transition animations in both scenes (excluding magic elements)
			const targetAnimationElms = Array.from(targetSceneElm.querySelectorAll('[data-transition-animation], [data-transition-animation-from], [data-transition-animation-to]'))
				.filter(el => !getTransitionIdentifier(el));
			const sourceAnimationElms = Array.from(currentSceneElm.querySelectorAll('[data-transition-animation], [data-transition-animation-from], [data-transition-animation-to]'))
				.filter(el => !getTransitionIdentifier(el));

			// Handle non-magic elements with transition animations in target scene
			targetAnimationElms.forEach(element => handleNonMagicAnimation(element, true));

			// Handle non-magic elements with transition animations in source scene  
			sourceAnimationElms.forEach(element => handleNonMagicAnimation(element, false));
		}

		/**
		 * Shows the next scene with magic transition effects
		 * @param {number} [duration] - Duration of the transition in seconds
		 * @param {string} [ease] - Easing function to use
		 * @param {Object} [options] - Additional options for the transition
		 * @param {Function} [options.onTransitionStart] - Called before transition starts
		 * @param {Function} [options.onTransitionProgress] - Called during transition with progress
		 * @param {Function} [options.onTransitionEnd] - Called after transition completes
		 */
		hypeDocument.showNextSceneMagic = function(duration, ease, options) {
			const scenes = this.sceneNames();
			const currentSceneIdx = scenes.indexOf(this.currentSceneName());
			const nextSceneName = scenes[currentSceneIdx + 1];
			if (nextSceneName != null) {
				hypeDocument.showSceneNamedMagic(nextSceneName, duration, ease, options);
			}
		}

		/**
		 * Shows the previous scene with magic transition effects
		 * @param {number} [duration] - Duration of the transition in seconds
		 * @param {string} [ease] - Easing function to use
		 * @param {Object} [options] - Additional options for the transition
		 * @param {Function} [options.onTransitionStart] - Called before transition starts
		 * @param {Function} [options.onTransitionProgress] - Called during transition with progress
		 * @param {Function} [options.onTransitionEnd] - Called after transition completes
		 */
		hypeDocument.showPreviousSceneMagic = function(duration, ease, options) {
			const scenes = this.sceneNames();
			const currentSceneIdx = scenes.indexOf(this.currentSceneName());
			const previousSceneName = scenes[currentSceneIdx - 1];
			if (previousSceneName != null) {
				hypeDocument.showSceneNamedMagic(previousSceneName, duration, ease, options);
			}
		}

		/**
		 * Applies an animation to an element(s) using GSAP
		 * @param {HTMLElement|string} element - Element or CSS selector within current scene
		 * @param {string|Object} animation - Animation name or properties
		 * @param {Object} [options] - Animation options
		 * @returns {gsap.core.Tween|null} The GSAP tween instance or null if invalid
		 */
		hypeDocument.applyAnimation = function(element, animation, options = {}) {
			// Kill any running animations on target element
			gsap.killTweensOf(element);
			
			let animationData;
			let target = element;

			// If element is a string, treat it as a selector within current scene
			if (typeof element === 'string') {
				const currentScene = document.getElementById(this.currentSceneId());
				target = currentScene.querySelectorAll(element);
				if (target.length === 0) return null;
			}

			// Handle different animation input types
			if (typeof animation === 'string') {
				// Check if it's a registered animation name
				if (!animation.includes(':')) {
					animationData = getRegisteredAnimation(animation);
				}
				// If not a registered animation, parse as simple animation string
				if (!animationData) {
					animationData = parseSimpleAnimation(animation);
				}
			} else if (typeof animation === 'object') {
				animationData = animation;
			}

			if (!animationData) return null;

			// Map of GSAP properties to Hype properties
			const hypePropertyMap = getDefault('hypePropertyMap');

			// Create animation configuration
			const finalAnimation = {
				ease: getEase(options.ease),
				duration: options.duration || getDefault('durationAnimation'),
				...animationData,
				...options,
				onComplete: () => {
					// Skip syncing Hype properties if skip option is set
					if (!options.skipHypeSync) {
						// Handle both single elements and NodeLists
						const elements = target.length ? target : [target];
						elements.forEach(el => {
							Object.entries(animationData).forEach(([key, value]) => {
								// Map GSAP props to Hype props to sync runtime state
								const hypeProp = hypePropertyMap[key];
								if (hypeProp) {
									if (Array.isArray(hypeProp)) {
										hypeProp.forEach(prop => {
											this.setElementProperty(el, prop, value);
										});
									} else {
										this.setElementProperty(el, hypeProp, value);
									}
								}
							});
						});
					}
					
					// Call user's onComplete if provided
					if (options.onComplete) options.onComplete();
				}
			};

			// Use gsap.from if options.from or animationData.from is true, otherwise use gsap.to
			return (options.from || animationData.from) ? 
				gsap.from(target, finalAnimation) : 
				gsap.to(target, finalAnimation);
		}
		
	}

	if ("HYPE_eventListeners" in window === false) window.HYPE_eventListeners = Array();
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });

	return {
		version: '2.5.9',
		getDefault,
		setDefault,
		clearCachedMagicProperties,
		extractMagicIdentifier,
		registerAnimation
	};
})();
