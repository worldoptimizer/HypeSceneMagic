/*!
Hype SceneMagic 2.2
copyright (c) 2019 Max Ziebell, (https://maxziebell.de). MIT-license
*/
/*
* Version-History
* 2.0 Rewrite released under MIT-license
* 2.1 Added demo how to include in head and use with Hype CommandPipeline
* 2.2 Minor fixes and converted into self contained extension
*/

if("HypeSceneMagic" in window === false) window['HypeSceneMagic'] = (function () {

	function extendHype(hypeDocument, element, event) {

		/**
		* hypeDocument.showSceneNamedMagic
		* @param {String} transition target scene name
		* @param {Number} duration of transition
		* @param {String} ease type
		*/
		hypeDocument.showSceneNamedMagic = function (targetSceneName, duration, ease) {
			var tProp= ['top','left','width','height','rotateZ','scaleX','scaleY','opacity'];
			
			var scenes = this.sceneNames();
			var currentSceneName = this.currentSceneName();
			
			var currentSceneIdx = scenes.indexOf(currentSceneName);
			var currentSceneElm = document.querySelector ('#'+this.documentId()+' > [hype_scene_index="'+currentSceneIdx+'"]');
			
			var targetSceneIdx = scenes.indexOf(targetSceneName);
			var targetSceneElm = document.querySelector ('#'+this.documentId()+' > [hype_scene_index="'+targetSceneIdx+'"]');
			
			if (targetSceneElm!=null) {
			 	this.running_showSceneNamedCustom = true;
		
			 	preventClickElm.style.zIndex = 999;
			 	
				this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);
				
				currentSceneElm.style.display = 'block';
				
				var magicElms = targetSceneElm.querySelectorAll('div[class*="magic"]');
				
				magicElms.forEach(n => {		
					for (var i=0; i<n.classList.length; i++) {
						if (n.classList[i].indexOf('magic') === 0 && n.classList[i].length>5){
							var oE = currentSceneElm.querySelector('.'+n.classList[i]);
							if (oE) {
								for (var j=0; j<tProp.length; j++) {
									var tP = tProp[j];
									var nA = hypeDocument.getElementProperty(n, tP);
									var oA = hypeDocument.getElementProperty(oE, tP);
									if (nA !== oA) {
										hypeDocument.setElementProperty(n, tP, oA);
										hypeDocument.setElementProperty(n, tP, nA, duration, ease);
										hypeDocument.setElementProperty(oE, tP, nA, duration, ease);
										setTimeout(function(){
											this.setElementProperty(oE, tP, oA);
										}.bind(hypeDocument),duration*1000);
									}
								}	
							}
						}
					}
				});
				
				this.setElementProperty(targetSceneElm, 'opacity', 0);
				this.setElementProperty(targetSceneElm, 'opacity', 1, duration*0.5, ease);

				setTimeout(function(){
					currentSceneElm.style.display = 'none';
					preventClickElm.style.zIndex = -999;
					this.running_SceneMagic = false;
					this.showSceneNamed(targetSceneName, this.kSceneTransitionInstant);
				}.bind(this),duration*1000);
			}		
		}
		
		/**
		* hypeDocument.showNextSceneMagic
		* @param {Number} duration of transition
		* @param {String} ease type
		*/
		hypeDocument.showNextSceneMagic = function(duration, ease) {
			var scenes = this.sceneNames();
			var currentSceneIdx = scenes.indexOf(this.currentSceneName());
			var nextSceneName = scenes[currentSceneIdx+1];
			if (nextSceneName!=null){
				hypeDocument.showSceneNamedMagic (nextSceneName, duration, ease);
			}
		}
		
		/**
		* hypeDocument.showPreviousSceneMagic
		* @param {Number} duration of transition
		* @param {String} ease type
		*/
		hypeDocument.showPreviousSceneMagic = function(duration, ease) {
			var scenes = this.sceneNames();
			var currentSceneIdx = scenes.indexOf(this.currentSceneName());
			var previousSceneName = scenes[currentSceneIdx-1];
			if (previousSceneName!=null){
				hypeDocument.showSceneNamedMagic (previousSceneName, duration, ease);
			}
		}
			
		/* track if our transition is running */
		hypeDocument.running_SceneMagic = false;
			
		/* listen for scene loads and negate init it our transition is running */
		window.HYPE_eventListeners.push({"type":"HypeSceneLoad", "callback":function(){
			return !hypeDocument.running_SceneMagic;
		}});
		
		/* listen for scene loads and negate init it our transition is running */
		window.HYPE_eventListeners.push({"type":"HypeSceneUnload", "callback":function(){
			return !hypeDocument.running_SceneMagic;
		}});
		
		/* add layer to Hype for click prevention, anybody know a better solution? */
		var hypeDocElm = document.getElementById(hypeDocument.documentId());
		var preventClickElm = hypeDocElm.querySelector('.preventClicks');
		if (preventClickElm == null) {
			preventClickElm = document.createElement("div");
			preventClickElm.classList.add('preventClicks');
			preventClickElm.style='position:absolute;width:100%;height:100%;z-index:-999';
			hypeDocElm.appendChild(	preventClickElm);
		}
		
		return true;
	}
	
	
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array(); }
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": extendHype});

	/* Reveal Public interface to window['HypeSceneMagic'] */
	return {
		version: '2.2'
	};
})();
