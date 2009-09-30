/*!
 * jQuery CSS Class Animations v 0.8
 *
 * Copyright (c) 2009 Johnny Marnell
 * johnnymarnell 'at' gmail 'dot' com
 * http://johnnymarnell.com
 * http://www.emusic.com/artist/Johnny-Marnell-MP3-Download/12078073.html
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 */
(function(jQuery) {

//	Algorithm summary:
// 		To animate by class in an at least slightly powerful manner, we need to be able to do things like:
//			$('body div').animate('.selected')
//		which may not only increase the height of the div itself (slide it open) but also fade in more
//		content to the div that was hidden before, etc.  To achieve cool stuff like this, we need to be able to
//		split a CSS selector into parent and child subselectors, then for each element in a jQuery selection
//		that matches a parent subselector animate it *AND* its children to their cummulative, cascaded style state,
// 		based on all provided CSS rules.
//
//		The general algorithm I use is when animating to class 'foo', find all CSS rules with '.foo' in them,
//		break them into the parental and children portion.  If there is no child portion, then this rule is what
//		I call a leaf, i.e. it will potentially animate items in the jQ collection itself.  When children subselectors
//		exist, children of matching jQ collection items will be animated. (See note below)
//		Keep a running list of unique parent and child subselectors, and compile all the CSS properties that are
//		defined for them.  Also, store the specificity of each subselector for later.
//		Once we've generated all the applicable rules and their resultant CSS property state, for each item in the
//		jQuery selection that satisfies the parent subselector, we animate that item (if there is leaf state); we
//		cascade the CSS properties for these subselectors, and do the same for any children found in each item.
//		Once our compiled CSS properties are properly cascaded (with a specificity sort), we execute all animations,
//		at the end of which add the proper 'foo' class and add(and remove) any transitional classes.
//
//		Note on parent, child, and leaf subselectors:
//		E.g. for "body div.foo a" and "body p.foo", the parent subselectors are "body div" and "body p", the
//		children are "a" and "", and thus the latter is also leaf state.
//
//		Note on original callbacks:
//		The originally supplied callback (if any) will be wrapped with our own that will handle all the class
//		transitions (since, at the end of the animation, we add the class we just animated to) and will fire when
//		all the animations have finished.

// Safe namespacing	
var $ = jQuery,	
// Cache whatever css parsing we do so that we don't repeat ourselves
	cssCache = {},
// Store the native jquery animate method so we can overload it
	jqNativeAnimate = jQuery.fn.animate,
// All the CSS properties that jQuery animates
	jqAnimationProps = ['borderSpacing', 'borderTopWidth',
		'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'bottom', 'elevation',
		'fontSize', 'fontStyle', 'fontWeight', 'height', 'left', 'letterSpacing', 'lineHeight', 'marginRight',
		'marginLeft', 'marginTop', 'marginBottom', 'margin', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth',
		'outlineWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
		'right', 'textIndent', 'top', 'verticalAlign', 'width', 'wordSpacing', 'zIndex', 'opacity',
		'borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'border', 'outline', 'padding'
	];

// Key Methods for Plugin:

// If not already cached, for each CSS rule in each style sheet references the target class, build its CSS cache
// (call cacheCss) and store the result.
function getCssCache(clazz) {
	var cache = cssCache[clazz], classRegExp, sheet, rules, j, selector, rule, sheets = window.document.styleSheets;
	if(!cache) {
		classRegExp = new RegExp('(.*)\\.' + clazz + '(\\S+)?(?:\\s+(.*))?');
		cache = cssCache[clazz] = {};

		// Note, we use standard for loop, jQuery.each was barfing in ie
		for(j = 0; j < sheets.length; j++) {
			sheet = sheets[j];
			rules = sheet.cssRules || sheet.rules;
			for(var i = 0; i < rules.length; i++) {
				rule = rules[i];
				selector = rule.selectorText;

				// If the base rule conains our class
				if(selector && selector.match(classRegExp)) {

					//Now split up any CSV combined rules
					jQuery.each(selector.split(/,\s*/), function(i, selector) {
						var match = selector.match(classRegExp), len;
						if(match) {
							len = match[1].length;

							// Here, we add an asterisk to the rule if omitted (as commonly done).  We check
							// for zero length string before the class e.g. ".foo", or ending with a space, e.g.
							// "body div " from "body div .foo"
							if(len === 0 || match[1].substring(len - 1, len).match(/\s/)) {
								//log('adding asterisk to ', match[1]);
								match[1] += '*';
							}
							cacheCss(match, rule, selector, cache);
						}
					});
				}
			}
		}
	}
	return cache;
}



// Splits the rule into "parent" and "children" subselectors and stores CSS properties for each.
// Also remembers "leaf" rules. (see above)
function cacheCss(match, rule, selector, cache) {

	var css = {}, elemSelector, elem, prop, i, style = rule.style, animatablePropertyPresent = false;
	
	//log("working with rule, match: ", match, 'rule: ', rule, 'rule.style:', style);

	// This loop is mainly for browser compatibility; if the property exists and is a valid string, then
	// we assume there was a CSS property definition.
	for(i = 0; i < jqAnimationProps.length; i++) {
		prop = jqAnimationProps[i];
		if(style[prop] && typeof(style[prop])) {
			css[prop] = style[prop];
			animatablePropertyPresent = true;
		}
	}
	
	if(animatablePropertyPresent) {
		elemSelector = match[1] + (match[2] || '');
		elem = cache[elemSelector] || (cache[elemSelector] = {
			specificity: calculateSpecificity(elemSelector)
		});

		// If no child subselector
		if(!match[3]) {

			// create if not present yet, and add the css props for this subselector
			if(!elem.leaf) {
				elem.leaf = {
					css: css,
					specificity: elem.specificity
				};
			} else {
				jQuery.extend(elem.leaf.css, css);
			}
			//log('new leaf state: ', elem.leaf.css);

		} else {
			elemSelector = match[3];
			elem.children = elem.children || {};

			// create if not present yet, and add the css props for this subselector
			if(!elem.children[elemSelector]) {
				elem.children[elemSelector] = {
					css: css,
					specificity: elem.specificity + calculateSpecificity(elemSelector)
				};
			} else {
				jQuery.extend(elem.children[elemSelector].css, css); //todo:jmarnell do i need to make a copy here?
			}
			//log('new child state', elem.children[elemSelector].css);
		}
	}
	//log('new css rule def: ', cache);
}

// For each element in the domHash, find the parent rules it matches by breaking up the subselector, then walking
// up the DOM tree and calling .is().  Add that rules css to the final returned result.  If there are child selectors
// find any children that match and add the CSS props.
function cascadeStylesBySelector(rules, domHash) {
	jQuery.each(rules, function(selector, data) {
		var subselectors = selector.split(/\s+/);
		//log('testing subselectors:', subselectors);
		jQuery.each(domHash.parents, function(uid, parent) {
			var index, jq = $(parent.el);
			for(index = subselectors.length - 1; index >= 0 && jq.length && jq.get(0).tagName != 'HTML'; jq = jq.parent()) {
				if(jq.is(subselectors[index])) {
					//log(jq.get(0), 'is', subselectors[index]);
					index--;
				}
			}
			if(index < 0) {
				if(data.leaf) {
					(parent.css || (parent.css = [])).push(data.leaf);
				}
				if(data.children) {
					// Reset back to leaf
					jq = $(parent.el);
					jQuery.each(data.children, function(selector, data) {
						jq.find(selector).each(function() {
							var id = jQuery.data(this);
							(domHash.children[id] || (domHash.children[id] = {
								el: this,
								css: []
							})).css.push(data);
						});
					});
				}
			}
		});
	});
}

// Alternative cascade method I started with.  Instead of breaking up the parent subselector, it will actually select
// the selector and look for intersection.  I like the other better, because a simple rule like '.foo' would end up
// selecting EVERY element in the DOM tree
//function cascadeStyles(cache, domHash) {
//	jQuery.each(cache, function(selector, data) {
//		$(selector).each(function() {
//			var jq, hash = domHash.parents[this];
//			if(hash) {
//				if(data.leaf) {
//					hash.css = hash.css || [];
//					hash.css.push(data.leaf);
//				}
//				if(data.children) {
//					jq = $(this);
//					jQuery.each(data.children, function(selector, data) {
//						jq
//							.find(selector)
//							.each(function() {
//								var hash;
//								hash = domHash.children[this] || (domHash.children[this] = {
//									el: this,
//									css: []
//								});
//								hash.css.push(data);
//							});
//					});
//				}
//			}
//		});
//	});
//}

// The root class animation method we delegate to.  It will set up the rule cache for the class, perform the cascade,
// and execute the animations.
function animateToClass(jq, clazz, fromClass, args) {
	var i, queue = [], callback, callbackIndex, fn,
// The new set of arguments we'll build and use for the native jQ animate call, start with placeholder for tween vals			
		newArgs = [null],
// Here we store all dom elements we're working with (mapped via dom element) divided up into parents and children.  We
// need to store them in case multiple rules affect multiple elements in the current selected DOM tree
		domHash = {
			parents: {},
			children: {}
		};

// Store all the parents
	jq.each(function() {
		domHash.parents[this] = {
			el: this
		};
	});

// Fetch or build and save the css rules for this class, then cascade them over the current selection
	jQuery.each(clazz, function() {
//			cascadeStyles(getCssCache(this), domHash);
		cascadeStylesBySelector(getCssCache(this), domHash);
	});
	//log('full css set:', domHash);

// Start with the args after the class ones
	for(i = (fromClass ? 2 : 1); i < args.length; i++) {
		fn = args[i];
		newArgs.push(fn);
		if(!!fn && typeof fn != "string" && !fn.nodeName &&
			fn.constructor != Array && /^[(\[]?\s*function/.test( fn + "" )) {
			callback = args[i];
			callbackIndex = newArgs.length - 1;
		}
	}
	callbackIndex = callback ? callbackIndex : newArgs.length;

// Now actually perform all the animations for the parents and children 
	jQuery.each(domHash.parents, function(uid, parent) {
		var jq = $(parent.el);

// If their is target class-based CSS pertaining to this parent, then start the animation and schedule the class transition
		if(parent.css) {
			jq.addClass('ca-to-' + clazz.join(' ca-to-') + (fromClass ? ' ca-from-' + fromClass.join(' ca-from-') : ''));
			animateWithNewArgs(newArgs, jq, parent, queue, callbackIndex, callback, clazz, fromClass);

// Otherwise, just schedule the transition
		} else {
			enqueueTransition(queue, jq, clazz, fromClass, callback);
		}
	});

// 
	jQuery.each(domHash.children, function(uid, child) {
		animateWithNewArgs(newArgs, $(child.el), child, queue, callbackIndex, callback);
	});
	if(!queue.pendingAnimations) {
		executeTransitions(queue);
	}
}

// Supporting methods:

// Cascade the cached css properties for this element to get the final set to animate to, then add it to the queue,
// and call animate with the proper callback
function animateWithNewArgs(newArgs, jq, el, queue, callbackIndex, callback, clazz, fromClass) {
	newArgs[0] = cascadeStyleProperties(jq, el.css);
	//log('cascade for ', el.el, ':', el.css, ' ==> ', newArgs[0]);
	queue.pendingAnimations = (queue.pendingAnimations || 0) + 1;
	if(clazz) {
		enqueueTransition(queue, jq, clazz, fromClass, callback);
	}
	newArgs[callbackIndex] = function() {
		// if we're the last, then execute them all
		if(--queue.pendingAnimations === 0) {
			executeTransitions(queue);
		}
	};
	jqAnimate(jq, newArgs);
}

// I'm seeing a bug with jQuery's curCSS in that it doesn't check the currentStyle when
// querying opacity in IE, thus, if something starts out as opacity != 1, jQuery still
// thinks it's 1 and will pop... unless we set it explicity with .css
function opacity_bugFixJQIE(el) {
	if(el && el.currentStyle && el.currentStyle.filter) {
		//log('fixing opacity first ', el, jQuery.attr(el.currentStyle, 'opacity'));
		$(el).css('opacity', jQuery.attr(el.currentStyle, 'opacity'));
	}
}

function jqAnimate(caller, args) {
	//log('animating ', caller.get(0), ' to ', args[0], args[1], args[2], args[3], args[4]);

	// had this, instead, to pop to class (not animate) for debugging
	//return caller.css(args[0]);

	opacity_bugFixJQIE(caller.get(0));
	return jqNativeAnimate.apply(caller, args);
}

// Note: this isn't bulletproof, but should be good enough... calculates the specificity (I used base 200
// for safety (in case there were ten html tag descriptors vs. 1 class, etc).  Basically, split the rule on
// whitespace, then see if each token has one '#' (id descriptor), or one or many class descriptor category
// characters, and if the first char is neither, assume it is an html tag descriptor.
function calculateSpecificity(rule) {
	var tokens = rule.split(/\s+/), score = 0, id;

	jQuery.each(tokens, function(i, token) {
		id = false;
		jQuery.each(token, function(i, letter) {
			//look for at most one id descriptor
			if(!id && letter === '#') {
				score += 40000;
				id = true;
			}

			//check for [psuedo]class and attributes
			else if(letter === '.' || letter === ':' || letter === '[') {
				score += 200;
			}

			//if the first char was not a special one, assume html tag descriptor
			else if(i === 0) {
				score += 1;
			}
		});
	});

	//log('calculated', score, 'specificity for', rule);
	return score;
}

// Detect uses of .animate with class selectors and delegate to class animation
function classAnimationDelegate() {
	var clazz, fromClass, arg0 = arguments[0], arg1 = arguments[1];
	if(typeof arg0 === 'string' && arg0.indexOf('.') === 0) {
		clazz = arg0.substring(1).split(/\./);
		if(typeof arg1 === 'string' && arg1.indexOf('.') === 0) {
			fromClass = arg1.substring(1).split(/\./);
		}
		return animateToClass(this, clazz, fromClass, arguments);
	} else {
		return jqAnimate(this, arguments);
	}
}

// Sort by specificity for cascade
function sortByCascade(lhs, rhs) {
	return lhs.specificity - rhs.specificity;
}

// Schedule a class transition to occur once the animations are finished
function enqueueTransition(queue, jq, clazz, fromClass, callback) {
	queue.push({
		jq: jq,
		clazz: clazz,
		fromClass: fromClass,
		callback: callback
	});
}

// Strip out any classes we've added (prefixed with 'ca-')
function removeClasses(jq) {
	var classes = jq.attr('class');
	if(classes) {
		classes = classes.split(/\s+/);
		jQuery.each(classes, function() {
			if(this.indexOf('ca-') === 0) {
				jq.removeClass(this);
			}
		});
	}
}

// Perform queued class transitions (i.e. add the to class, remove the from, etc.)
function executeTransitions(queue) {
	jQuery.each(queue, function(i, transition) {
		var jq = transition.jq;
		//log('transition: ', transition, 'from string:', transition.fromClass && transition.fromClass.join(' '));
		removeClasses(jq);
		if(transition.fromClass) {
			jq.removeClass(transition.fromClass.join(' '));
		}
		jq.addClass(transition.clazz.join(' ') + ' ca-done-' + transition.clazz.join(' ca-done-'));
		if(transition.callback) {
			transition.callback.apply(jq.get(0));
		}
	});
}

// Iterate down the css chain (in increasing specificity order) and compile all them together
function cascadeStyleProperties(jq, css) {
	var result = {};
	jQuery.each(css.sort(sortByCascade), function(i, css) {
		jQuery.extend(result, css.css);
	});

//  I originally had these here because in an effort to get sliding down to work.. sometimes it was popping
//  on non fixed height div's...
//
//	jQuery.each(result, function(prop, val) {
//		if(prop === 'height') {
//			if(val.match(/\s*100\s*%\s*/)) {
//				result[prop] = 'show' || jq.get(0).scrollHeight + 'px';
//			} else if (parseInt(val) === 0) {
//				result[prop] = 'hide';
//			}
//		} else if(prop === 'width') {
//			if(val.match(/\s*100\s*%\s*/)) {
//				result[prop] = 'show' || jq.get(0).scrollWidth + 'px';
//			} else if (parseInt(val) === 0) {
//				result[prop] = 'hide';
//			}
//		}
//	});

	return result;
}

//// Debug logging
//var log = function() {
//	console.log(arguments);
////	alert(1);
//}

jQuery.fn.extend({
	animate: classAnimationDelegate,
	cacheClassAnimation: function(clazz) {
		getCssCache(clazz);
	}
});

})(window.jQuery);