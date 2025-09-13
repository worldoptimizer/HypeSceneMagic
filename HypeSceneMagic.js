/*!
 * Hype SceneMagic 2.6.5 (GSAP Version)
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
 * 2.6.0 Added support for multiple magic identifiers per element
 *       Removed match tracking in favor of "last match wins" approach (using killTweensOf)
 *       Added onTransitionPrepare callback and moved onTransitionStart to timeline start
 * 2.6.1 Fixed issue where non-magic elements with data-transition-animation weren't being properly restored
 * 2.6.2 Added skipProperties to default configuration to skip properties from being tweened like fontFamily
 *       Fixed issue when delays and durations exceeded into next magic transition by ending previous master timeline
 * 2.6.3 Fixed issue where getCurrentMagicProperties was not being used for source elements
 * 2.6.4 Refactored property caching and getting for clarity and robustness
 * 2.6.5 Added two-cache system: pristine for initial state, restore for per-transition state.
 */

if ("HypeSceneMagic" in window === false) window['HypeSceneMagic'] = (function() {	
	const _version = '2.6.5';
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
		},
		skipProperties: ['fontFamily'],
	};

	// --- Two-Cache System ---
	// The master cache, populated on scene prepare with true initial states.
	let _pristineElementCache = new WeakMap(); 
	// A temporary cache built for each transition, listing elements to be restored.
	let _restoreElementCache = new WeakMap();

	// store document related state
	const _documentStates = new WeakMap();

	/**
	 * Gets the current magic properties by reading the element's inline style attribute.
	 * This is a direct, non-cached read of the element's live state.
	 * @param {HTMLElement} element - The element to get live properties for.
	 * @returns {Object} Object containing the element's current inline style properties.
	 */
	function getCurrentMagicProperties(element) {
		const properties = {};
		const defaultProperties = getDefault('defaultProperties');
		for (let key in defaultProperties) {
			if (getDefault('skipProperties').includes(key)) continue;
			properties[key] = element.style[key] || defaultProperties[key];
		}
		return properties;
	}

	/**
	 * Clears the pristine cached properties for an element or all cached properties if no element is provided.
	 * @param {HTMLElement} [element] - Optional element to clear cache for. If not provided, clears entire cache.
	 */
	function clearCachedMagicProperties(element) {
		if (element) {
			_pristineElementCache.delete(element);
		} else {
			_pristineElementCache = new WeakMap();
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
	 * Gets all transition identifiers from an element
	 * @param {HTMLElement} element - The DOM element
	 * @returns {string[]} Array of cleaned identifiers
	 */
	function getTransitionIdentifiers(element) {
		const identifiers = [];
		
		// Get identifiers from magic classes
		element.classList.forEach(className => {
			if (className.toLowerCase().startsWith('magic') && className.length > 5) {
				identifiers.push(className.slice(5).toLowerCase());
			}
		});
		
		// Get identifiers from data attribute
		const dataIds = element.getAttribute('data-transition-id');
		if (dataIds) {
			identifiers.push(...dataIds.split(',')
				.map(id => id.trim().toLowerCase())
				.map(id => id.startsWith('magic') ? id.slice(5) : id)
				.filter(Boolean)
			);
		}
		
		return [...new Set(identifiers)]; // Remove duplicates
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
			// If we are currently running a transition, end it
			if (hypeDocElm.classList.contains('magicTransition')) {
				const documentState = _documentStates.get(hypeDocument);
				if (documentState && documentState.masterTimeline) {
					// end the timeline by forwarding to the end
					documentState.masterTimeline.progress(1);
					// remove the master timeline reference
					delete documentState.masterTimeline;
					// inform the user that the transition was ended and why
					console.warn('HypeSceneMagic: Previous magic transition was interrupted by a new one. This indicates overlapping magic transitions in your Hype document.');
				}
			}
			
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
			
			// Clear the temporary restore cache at the start of every transition
			_restoreElementCache = new WeakMap();
			
			// Get duration and cross fade factor
			duration = duration || getDefault('durationTransition');
			const crossFadeFactor = options.crossFadeFactor !== undefined ? options.crossFadeFactor : getDefault('crossFadeFactor');
			const crossFadeDuration = duration * crossFadeFactor;
			
			// Add magicTransition class to hypeDocElm to disable pointer events
			hypeDocElm.classList.add('magicTransition');

			// Add scene-specific classes for z-index management
			currentSceneElm.classList.add('currentScene');
			targetSceneElm.classList.add('targetScene');

			// Call onTransitionPrepare hook if provided (before any setup)
			if (options.onTransitionPrepare) {
				options.onTransitionPrepare(currentSceneElm, targetSceneElm, { duration, ease });
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
				onStart: () => {
					// Call onTransitionStart hook when timeline actually starts
					if (options.onTransitionStart) {
						options.onTransitionStart(currentSceneElm, targetSceneElm, { duration, ease });
					}
				},
				onUpdate: function() {
					if (options.onTransitionProgress) {
						options.onTransitionProgress(this.progress(), currentSceneElm, targetSceneElm);
					}
				},
				onComplete: () => {
					// Wait for target scene opacity to be 1 before cleanup
					const checkOpacity = () => {
						const opacity = getComputedStyle(targetSceneElm).opacity;
						if (parseFloat(opacity) == 1) {
							// Reset properties for all elements that need restoration after a frame delay
							requestAnimationFrame(() => {
								elementsToRestore.forEach(element => {
									const initialProps = _restoreElementCache.get(element);
									if (initialProps) gsap.set(element, initialProps);
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

							// Remove the master timeline reference
							const documentState = _documentStates.get(hypeDocument);
							if (documentState) {
								delete documentState.masterTimeline;
							}
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
			
			// Helper function to prepare an element for restoration by copying its pristine
			// state into the temporary restore cache.
			const prepareForRestoration = (element) => {
				if (_pristineElementCache.has(element) && !_restoreElementCache.has(element)) {
					_restoreElementCache.set(element, _pristineElementCache.get(element));
				}
				elementsToRestore.add(element);
			};

			// Handle elements in target scene that are also in source scene
			targetMagicElms.forEach(targetElement => {
				const targetIds = getTransitionIdentifiers(targetElement);
				
				// If element has transition identifiers
				if (targetIds.length > 0) {
					// Find matching element in source scene
					const sourceElement = Array.from(sourceMagicElms).find(el => {
						const sourceIds = getTransitionIdentifiers(el);
						return sourceIds.some(sourceId => targetIds.includes(sourceId));
					});

					// If matching element is found, animate transition
					if (sourceElement) {
						// Kill any existing animations
						gsap.killTweensOf([targetElement, sourceElement]);
						
						// Prepare the source element to be restored to its pristine state.
						prepareForRestoration(sourceElement);
						
						// Get the LIVE properties from the source element for a smooth transition start.
						const fromProperties = getCurrentMagicProperties(sourceElement);

						// Get the PRISTINE properties of the target for the transition's end state.
						const toProperties = _pristineElementCache.get(targetElement) || getCurrentMagicProperties(targetElement);

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
							// Kill any existing animations
							gsap.killTweensOf(targetElement);
							
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
				const sourceIds = getTransitionIdentifiers(sourceElement);
				if (sourceIds.length > 0) {
					// Find matching element in target scene
					const hasMatch = Array.from(targetMagicElms).some(el => {
						const targetIds = getTransitionIdentifiers(el);
						return targetIds.some(targetId => sourceIds.includes(targetId));
					});

					// If no matching element is found
					if (!hasMatch) {
						// Prepare the source element to be restored to its pristine state.
						prepareForRestoration(sourceElement);
						
						// Kill any existing animations
						gsap.killTweensOf(sourceElement);
						
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
					// Prepare the element to be restored to its pristine state.
					prepareForRestoration(element);
					
					// Kill any existing animations
					gsap.killTweensOf(element);
					
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
				.filter(el => getTransitionIdentifiers(el).length === 0);
			const sourceAnimationElms = Array.from(currentSceneElm.querySelectorAll('[data-transition-animation], [data-transition-animation-from], [data-transition-animation-to]'))
				.filter(el => getTransitionIdentifiers(el).length === 0);

			// Handle non-magic elements with transition animations in target scene
			targetAnimationElms.forEach(element => handleNonMagicAnimation(element, true));

			// Handle non-magic elements with transition animations in source scene  
			sourceAnimationElms.forEach(element => handleNonMagicAnimation(element, false));

			// Store a reference to the master timeline in hypeDocument
			if (!_documentStates.has(hypeDocument)) {
				_documentStates.set(hypeDocument, {});
			}
			_documentStates.get(hypeDocument).masterTimeline = masterTimeline;
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

	/**
	 * Populates the pristine cache with the true initial state of all potential transition elements.
	 * This fires at the earliest possible moment, before the scene is fully displayed.
	 * @param {Object} hypeDocument - The Hype document instance
	 * @param {HTMLElement} element - The Scene element
	 * @param {Event} event - The prepare for display event
	 */
	function HypeScenePrepareForDisplay(hypeDocument, element, event) {
		const sceneElm = element; // The 'element' argument IS the scene element
		if (sceneElm) {
			const transitionElements = sceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id], [data-transition-animation], [data-transition-animation-from], [data-transition-animation-to]');
			
			transitionElements.forEach(el => {
				// This populates the pristine cache with the as-designed state.
				// We only set it if it doesn't already exist to be efficient.
				if (!_pristineElementCache.has(el)) {
					_pristineElementCache.set(el, getCurrentMagicProperties(el));
				}
			});
		}
	}

	if ("HYPE_eventListeners" in window === false) window.HYPE_eventListeners = Array();
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });
	window.HYPE_eventListeners.push({ "type": "HypeScenePrepareForDisplay", "callback": HypeScenePrepareForDisplay });

	return {
		version: _version,
		getDefault,
		setDefault,
		clearCachedMagicProperties,
        getTransitionIdentifiers,
		registerAnimation
	};
})();
