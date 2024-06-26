/*!
 * Hype SceneMagic 2.4.0
 * Copyright (c) 2024 Max Ziebell, (https://maxziebell.de). MIT-license
 */

/*
 * Version-History
 * 2.0 Rewrite released under MIT-license
 * 2.1 Added demo how to include in head and use with Hype CommandPipeline
 * 2.2 Minor fixes and converted into self-contained extension
 * ---
 * 2.3.0 Code improvements based on feedback
 * 2.3.1 Added hooks support for afterEnd and beforeStart
 * 2.3.2 Fixed sceneLoad autoplay and added magicTransition behavior
 * 2.4.0 Implemented data-transition-id, data-transition-delay, and data-transition-duration attributes
 *       Implemented data-transition-order with 'front' and 'back' keywords for z-index control       
 *       Added 'target' keyword for delay, duration and order to use values from target element
 *       Added the capability to mix and match magic class notation and data-transition-id
 *       Added direct and indirect transition mode (default is indirect)
 */

if ("HypeSceneMagic" in window === false) window['HypeSceneMagic'] = (function() {
	/*
	 * This is the default configuration
	 */
	let _default = {
		easingMap: {
			'easein': 'ease-in',
			'easeout': 'ease-out',
			'easeinout': 'ease-in-out'
		},
		defaultProperties: {
			'width': 'auto',
			'height': 'auto',
			'opacity': '1',
			'borderRadius': '0px',
			'transform': '',
			'wordSpacing': 'normal',
			'backgroundColor': 'transparent',
			'color': 'inherit',
			'fontSize': 'inherit',
			'fontFamily': 'inherit',
			'fontWeight': 'inherit',
			'textAlign': 'left',
			'textShadow': 'none',
			'lineHeight': 'normal',
			'letterSpacing': 'normal',
			'textDecoration': 'none',
		},
		transitionMode: 'indirect'
	};

	/**
	 * This function allows to override a global default by key or if a object is given as key to override all default at once
	 *
	 * @param {String} key This is the key to override
	 * @param {String|Function|Object} value This is the value to set for the key
	 */
	function setDefault(key, value) {
		//allow setting all defaults
		if (typeof(key) == 'object') {
			_default = key;
			return;
		}

		//set specific default
		_default[key] = value;
	}

	/**
	 * This function returns the value of a default by key or all default if no key is given
	 *
	 * @param {String} key This the key of the default.
	 * @return Returns the current value for a default with a certain key.
	 */
	function getDefault(key) {
		// return all defaults if no key is given
		if (!key) return _default;

		// return specific default
		return _default[key];
	}

	/**
	 * This function returns the current properties of an element
	 *
	 * @param {HTMLElement} element This is the element to get the properties from
	 * @return Returns the current properties of an element
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
	 * This function returns the current properties of an element
	 * 
	 * @param {String} ease This is the easing to get the easing function for
	 * @return Returns the easing function for a given easing string
	 */
	function getEase(ease) {
		ease = ease || 'ease-in-out';
		return getDefault('easingMap')[ease.toLowerCase()] || ease;
	}

	 /**
	 * This function finds the appropriate element to apply z-index
	 * 
	 * @param {HTMLElement} element The starting element
	 * @return {HTMLElement} The element to apply z-index to
	 */
	function findZIndexElement(element) {
		if (element.parentElement && element.parentElement.classList.contains('HYPE_element_container')) {
			return element.parentElement;
		}
		return element;
	}

	/**
	 * This function determines the appropriate z-index based on the order value
	 * 
	 * @param {HTMLElement} element The element to set z-index for
	 * @param {String} order The order value ('front', 'back', or a number)
	 * @return {String} The calculated z-index value
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
		return order; // If it's a number or any other value, return as is
	}

	/**
	 * This function animates the transition between two elements
	 * 
	 * @param {HTMLElement} targetElement This is the element to animate to
	 * @param {HTMLElement} originElement This is the element to animate from
	 * @param {Number} totalDuration This is the total duration of the animation in seconds
	 * @param {String} ease This is the easing of the animation
	 */
	function animateTransition(targetElement, originElement, totalDuration, ease) {
		// Extract the properties using Hype's API
		const fromProperties = getProperties(originElement);
		const toProperties = getProperties(targetElement);

		function getAttributeValue(attr, defaultValue) {
			let sourceValue = originElement.getAttribute(attr);
			if (sourceValue === 'target') {
				return targetElement.getAttribute(attr) || defaultValue;
			}
			return sourceValue || defaultValue;
		}

		const delayPercentage = Math.max(0, Math.min(1, parseFloat(getAttributeValue('data-transition-delay', '0')) / 100));
		const durationPercentage = Math.max(0, Math.min(1, parseFloat(getAttributeValue('data-transition-duration', '100')) / 100));
		
		let delay;
		let actualDuration;

		if (getDefault('transitionMode') === 'direct') {
			delay = delayPercentage * totalDuration;
			actualDuration = Math.max(0, Math.min(totalDuration - delay, totalDuration * durationPercentage));
		} else {
			delay = delayPercentage * totalDuration;
			actualDuration = (totalDuration - delay) * durationPercentage;
		}

		// Handle transition order
		const transitionOrder = getAttributeValue('data-transition-order', null);
		let originalZIndex = null;
		let zIndexElement = null;

		if (transitionOrder !== null) {
			zIndexElement = findZIndexElement(targetElement);
			originalZIndex = zIndexElement.style.zIndex;
			const newZIndex = determineZIndex(zIndexElement, transitionOrder);
			zIndexElement.style.zIndex = newZIndex;
		}

		// Setup the transformation and animation properties
		const animations = [];

		for (const property in fromProperties) {
			if (fromProperties[property] !== undefined && toProperties[property] !== undefined) {
				let keyframes;
				if (delay > 0 || actualDuration < (totalDuration - delay)) {
					keyframes = [
						{ [property]: fromProperties[property], offset: 0 },
						{ [property]: fromProperties[property], offset: delay / totalDuration },
						{ [property]: toProperties[property], offset: (delay + actualDuration) / totalDuration },
						{ [property]: toProperties[property], offset: 1 }
					];
				} else {
					keyframes = [
						{ [property]: fromProperties[property] },
						{ [property]: toProperties[property] }
					];
				}
				animations.push({ property, keyframes });
			}
		}

		// Execute the animations
		animations.forEach(({ keyframes }) => {
			try {
				const options = {
					duration: totalDuration * 1000,
					easing: getEase(ease),
					fill: 'forwards'
				};

				const targetAnimation = targetElement.animate(keyframes, options);
				const originAnimation = originElement.animate(keyframes, options);

				// Pause the origin animation after half its duration and restore styles
				setTimeout(() => {
					originAnimation.pause();

					// restore from values all loop or foreach
					for (const property in fromProperties) {
						originElement.style[property] = fromProperties[property];
					}
				}, totalDuration * 500); // Half of the total duration in milliseconds

				// Restore original z-index after animation completes
				targetAnimation.onfinish = () => {
					if (zIndexElement && originalZIndex !== null) {
						if (originalZIndex === '') {
							zIndexElement.style.removeProperty('z-index');
						} else {
							zIndexElement.style.zIndex = originalZIndex;
						}
					}
				};

			} catch (e) {
				console.warn('Animation has an error', e);
			}
		});
	}
	
	/**
	 * This function adds the CSS to prevent clicks during the transition
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
	 * Extracts the transition identifier from an element.
	 * Prioritizes data-transition-id, then falls back to magic class.
	 * 
	 * @param {HTMLElement} element The element to extract the identifier from
	 * @return {string|null} The extracted identifier or null if not found
	 */
	function getTransitionIdentifier(element) {
		// Check for data-transition-id first
		const dataId = element.getAttribute('data-transition-id');
		if (dataId) return dataId;
	
		// Fall back to magic class
		for (let className of element.classList) {
			if (className.startsWith('magic') && className.length > 5) {
				return className.slice(5).toLowerCase(); // Convert to lowercase for case-insensitive matching
			}
		}
	
		return null; // No identifier found
	}


	/**
	 * This function adds the magic transition to the HypeDocument
	 * 
	 * @param {HypeDocument} hypeDocument This is the HypeDocument
	 * @param {HTMLElement} element This is the element of the HypeDocument
	 * @param {Event} event This is the event
	 */
	function HypeDocumentLoad(hypeDocument, element, event) {

		const hypeDocElm = element;
		addMagicTransitionCSS();

		hypeDocument.showSceneNamedMagic = function(targetSceneName, duration, ease, hooks) {
			hooks = hooks || {};
			const scenes = this.sceneNames();
			const currentSceneName = this.currentSceneName();
			const currentSceneIdx = scenes.indexOf(currentSceneName);
			const currentSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${currentSceneIdx}"]`);
			const targetSceneIdx = scenes.indexOf(targetSceneName);
			const targetSceneElm = document.querySelector(`#${this.documentId()} > [hype_scene_index="${targetSceneIdx}"]`);

			// defaults
			duration = duration || 0.5;

			if (targetSceneElm != null) {
				this.running_showSceneNamedCustom = true;

				// Prevent clicks
				hypeDocElm.classList.add('magicTransition');

				// Trigger beforeStart hook
				if (hooks.beforeStart) {
					hooks.beforeStart(currentSceneElm, targetSceneElm, {
						duration: duration,
						ease: ease
					});
				}

				this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);
				this.pauseTimelineNamed('timelineName');
				this.triggerCustomBehaviorNamed('magicTransition');

				currentSceneElm.style.display = 'block';

				// Updated selector to include both class and data-attribute based elements
				const targetMagicElms = targetSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');
				const sourceMagicElms = currentSceneElm.querySelectorAll('div[class*="magic"], div[data-transition-id]');

				targetMagicElms.forEach(targetElement => {
					const targetId = getTransitionIdentifier(targetElement);
					if (targetId) {
						const sourceElement = Array.from(sourceMagicElms).find(el => {
							const sourceId = getTransitionIdentifier(el);
							return sourceId && sourceId.toLowerCase() === targetId.toLowerCase();
						});

						if (sourceElement) {
							animateTransition(targetElement, sourceElement, duration, ease);
						}
					}
				});

				targetSceneElm.animate([{
					opacity: 0
				}, {
					opacity: 1
				}], {
					duration: duration * 500,
					easing: "linear"
				});

				setTimeout(function() {
					currentSceneElm.style.display = 'none';
					// Allow clicks
					hypeDocElm.classList.remove('magicTransition');
					this.running_SceneMagic = false;
					this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);

					// Trigger afterEnd hook
					if (hooks.afterEnd) {
						hooks.afterEnd(currentSceneElm, targetSceneElm, {
							duration: duration,
							ease: ease
						});
					}

				}.bind(this), duration * 1000);
			}
		}

		/**
		 * This function shows the next scene with a magic transition
		 * 
		 * @param {Number} duration This is the duration of the transition
		 * @param {String} ease This is the easing of the transition
		 * @param {Object} hooks Optional hooks to run before and after the transition
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
		 * This function shows the previous scene with a magic transition
		 * 
		 * @param {Number} duration This is the duration of the transition
		 * @param {String} ease This is the easing of the transition
		 * @param {Object} hooks Optional hooks to run before and after the transition
		 */
		hypeDocument.showPreviousSceneMagic = function(duration, ease, hooks) {
			const scenes = this.sceneNames();
			const currentSceneIdx = scenes.indexOf(this.currentSceneName());
			const previousSceneName = scenes[currentSceneIdx - 1];
			if (previousSceneName != null) {
				hypeDocument.showSceneNamedMagic(previousSceneName, duration, ease, hooks);
			}
		}

		/* Disable some Hype internal functions when SceneMagic is running */
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
		version: '2.4.0',
		getDefault: getDefault,
		setDefault: setDefault,
	};
})();
