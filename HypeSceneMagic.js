/*!
 * Hype SceneMagic 2.5.1 (GSAP Version)
 * Copyright (c) 2024 Max Ziebell, (https://maxziebell.de). MIT-license
 * Adapted for GSAP (this version requires GSAP to be loaded)
 */

/*
 * Version-History
 * 2.5.0 Adapted to use GSAP instead of Web Animations API
 * 2.5.1 Fixed id bug supporting multiple layouts (use the same name for layouts)
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

    function setDefault(key, value) {
        if (typeof(key) == 'object') {
            _default = key;
            return;
        }
        _default[key] = value;
    }

    function getDefault(key) {
        if (!key) return _default;
        return _default[key];
    }

    function getProperties(element) {
        let properties = {};
        let defaultProperties = getDefault('defaultProperties');
        for (let key in defaultProperties) {
            properties[key] = element.style[key] || defaultProperties[key];
        }
        return properties;
    }

    function getEase(ease) {
        ease = ease || 'power1.inOut';
        return getDefault('easingMap')[ease.toLowerCase()] || ease;
    }

    function findZIndexElement(element) {
        if (element.parentElement && element.parentElement.classList.contains('HYPE_element_container')) {
            return element.parentElement;
        }
        return element;
    }

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

        const delayPercentage = Math.max(0, Math.min(1, parseFloat(getAttributeValue('data-transition-delay', '0')) / 100));
        const durationPercentage = Math.max(0, Math.min(1, parseFloat(getAttributeValue('data-transition-duration', '100')) / 100));
        
        let delay, actualDuration;

        if (getDefault('transitionMode') === 'direct') {
            delay = delayPercentage * totalDuration;
            actualDuration = Math.max(0, Math.min(totalDuration - delay, totalDuration * durationPercentage));
        } else {
            delay = delayPercentage * totalDuration;
            actualDuration = (totalDuration - delay) * durationPercentage;
        }

        const transitionOrder = getAttributeValue('data-transition-order', null);
        let zIndexElement = null;

        if (transitionOrder !== null) {
            zIndexElement = findZIndexElement(targetElement);
            const newZIndex = determineZIndex(zIndexElement, transitionOrder);
            gsap.set(zIndexElement, { zIndex: newZIndex });
        }

        decomposeTransform(fromProperties);
        decomposeTransform(toProperties);

        // GSAP Timeline for the transition
        const tl = gsap.timeline();

        // Animate from origin to target
        tl.fromTo(targetElement, fromProperties, {
            ...toProperties,
            duration: actualDuration,
            ease: getEase(ease),
            delay: delay,
            onComplete: () => {
                if (zIndexElement) {
                    gsap.set(zIndexElement, { clearProps: 'zIndex' });
                }
                gsap.set(originElement, fromProperties); // Reset to original state
            }
        });

        
        // Animate origin element
        const originTween = gsap.fromTo(originElement, fromProperties, {
            ...toProperties,
            duration: actualDuration,
            ease: getEase(ease),
            delay: delay,
            onComplete: () => {
               
            }
        });

        tl.add(originTween, 0); // Add to main timeline, start at the same time as target animation

        // Pause the origin animation at 50% progress
        tl.call(() => originTween.pause(), [], actualDuration / 2);
    }

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
    
        // Remove the original transform property and assign decomposed properties
        delete properties.transform;
        Object.assign(properties, decomposed);
    }
    

    function addMagicTransitionCSS() {
        if (!document.getElementById('magicTransitionStyle')) {
            let style = document.createElement('style');
            style.id = 'magicTransitionStyle';
            style.textContent = `.magicTransition, .magicTransition * {pointer-events:none !important;}`;
            document.head.appendChild(style);
        }
    }

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

    function HypeDocumentLoad(hypeDocument, element, event) {
        const hypeDocElm = element;
        addMagicTransitionCSS();

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

        hypeDocument.showNextSceneMagic = function(duration, ease, hooks) {
            const scenes = this.sceneNames();
            const currentSceneIdx = scenes.indexOf(this.currentSceneName());
            const nextSceneName = scenes[currentSceneIdx + 1];
            if (nextSceneName != null) {
                hypeDocument.showSceneNamedMagic(nextSceneName, duration, ease, hooks);
            }
        }

        hypeDocument.showPreviousSceneMagic = function(duration, ease, hooks) {
            const scenes = this.sceneNames();
            const currentSceneIdx = scenes.indexOf(this.currentSceneName());
            const previousSceneName = scenes[currentSceneIdx - 1];
            if (previousSceneName != null) {
                hypeDocument.showSceneNamedMagic(previousSceneName, duration, ease, hooks);
            }
        }

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
        version: '2.5.1',
        getDefault: getDefault,
        setDefault: setDefault,
    };
})();
