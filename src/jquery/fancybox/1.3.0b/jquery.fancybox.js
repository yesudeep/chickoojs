/*
 
	FancyBox playground - just playing
	v.1.3.0 - beta 24.11.09
 
*/
;(function($) {
 
	$.fn.fixPNG = function() {
		return this.each(function () {
			var image = $(this).css('backgroundImage');
 
			if (image.match(/^url\(["']?(.*\.png)["']?\)$/i)) {
				image = RegExp.$1;
				$(this).css({
					'backgroundImage': 'none',
					'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=" + ($(this).css('backgroundRepeat') == 'no-repeat' ? 'crop' : 'scale') + ", src='" + image + "')"
				}).each(function () {
					var position = $(this).css('position');
					if (position != 'absolute' && position != 'relative')
						$(this).css('position', 'relative');
				});
			}
		});
	};
 
	var defaults = {
	    padding             :	10,
	    margin				:	20,
		ajax				:   {},
		type				:	false,
		modal				:	false,
		autoScale			:	true,
		autoDimensions		:	true,
		frameWidth			:	560,
		frameHeight			:	340,
		zoomOpacity			:	false,
		zoomSpeedIn			:	0,
		zoomSpeedOut		:	0,
		zoomSpeedChange		:	300,
		easingIn			:	'swing',
		easingOut			:	'swing',
		easingChange		:	'swing',
		overlayShow			:	false,
		overlayOpacity		:	0.3,
		overlayColor		:	'#666',
		enableEscapeButton	:	true,
		showCloseButton		:	true,
		hideOnOverlayClick	:	true,
		hideOnContentClick	:	false,
		callbackOnStart		:	null,
		callbackOnCancel	:	null,
		callbackOnShow		:	null,
		callbackOnClose		:	null
	};
 
	var tmp, loading, overlay, wrap, outer, inner, content, close, nav_left, nav_right;
 
	var selectedIndex = 0, selectedOpts = {}, selectedArray = [], currentIndex = 0, currentOpts = {}, currentArray = [];
 
	var ajaxLoader = null, imagePreloader = new Image, imageRegExp = /\.(jpg|gif|png|bmp|jpeg)(.*)?$/i;
 
	var loadingTimer, loadingFrame = 1;
 
	var start_pos, final_pos, busy = false, shadow = 20, fx = $.extend($('<div/>')[0], { prop: 0 });
 
	var IE6 = $.browser.msie && $.browser.version.substr(0,1) == 6 && !window.XMLHttpRequest;
 
	$.fn.fancybox = function(opts) {
 
		$(this).data('fancybox', $.extend({}, opts));
 
		$(this).unbind('click.fb').bind('click.fb', function(e) {
			e.preventDefault();
 
			$(this).blur();
 
			fancybox_process( this );
 
			return false;
		});
 
		return this;
    };
 
    /*
 
	Public functions
 
	*/
 
    $.fancybox = function(obj, opts) {
		if ($.isArray(obj)) {
		    for (var i = 0, j = obj.length; i < j; i++) {
				if (typeof obj[i] == 'object') {
                    $(obj[i]).data('fancybox', $.extend( {}, opts, obj[i].opts));
				} else {
                    obj[i] = $({}).data('fancybox', $.extend({content : obj[i]}, opts));
				}
			}
 
		} else {
 
			if (typeof obj == 'object') {
                $(obj).data('fancybox', $.extend({}, defaults, opts));
			} else {
                obj = $({}).data('fancybox', $.extend({content : obj}, opts));
			}
		}
 
		fancybox_process( obj );
    };
 
    $.fancybox.showActivity = function() {
		clearInterval(loadingTimer);
 
		loading.show();
		loadingTimer = setInterval(fancybox_animate_loading, 66);
	};
 
	$.fancybox.prev = function() {
		return $.fancybox.pos( currentIndex - 1);
	};
 
	$.fancybox.next = function() {
		return $.fancybox.pos( currentIndex + 1);
	};
 
	$.fancybox.pos = function(pos) {
		pos = parseInt(pos);
 
		if (pos > -1 && currentArray.length > pos) {
			selectedIndex = pos;
 
			fancybox_start();
		}
 
		return false;
	};
 
	$.fancybox.close = function() {
		if (busy) return;
 
 		if (!wrap.is(':visible')) {
			return;
		}
 
		busy = true;
 
		if (currentOpts && $.isFunction(currentOpts.callbackOnClose)) {
			var ret = currentOpts.callbackOnClose(currentArray, currentIndex);
 
			if (ret == false) {
				busy = false;
				return ret;
			}
		};
 
		fancybox_abort();
 
		$( close.add( nav_left ).add( nav_right ) ).hide();
 
		wrap.unbind();
		inner.unbind();
		overlay.unbind();
 
		$(document).unbind('keydown.fb');
 
		function _cleanup() {
			overlay.fadeOut('fast');
 
    		inner.css('overflow', 'hidden').empty();
 
    		wrap.hide();
 
    		busy = false;
		}
 
		if (currentOpts.zoomSpeedOut > 0) {
			start_pos = fancybox_get_zoom_from();
 
			var pos = wrap.position();
 
 			final_pos = {
				top		:	pos.top ,
				left	:	pos.left,
				width	:	wrap.width(),
				height	:	wrap.height()
			};
 
			if (currentOpts.zoomOpacity) {
				final_pos.opacity = 1;
			}
 
			fx.prop = 1;
 
			$(fx).animate({ prop: 0 }, {
				 duration	: currentOpts.zoomSpeedOut,
				 easing		: currentOpts.easingOut,
				 step		: fancybox_draw,
				 complete	: _cleanup
			});
 
		} else {
			wrap.fadeOut('fast', _cleanup);
		}
	};
 
 	$.fancybox.cancel = function() {
 		if (busy) return;
 
		fancybox_abort();
 
		if (selectedOpts && $.isFunction(selectedOpts.callbackOnCancel)) {
			selectedOpts.callbackOnCancel(selectedArray, selectedIndex);
		};
 
		fancybox_revert();
	};
 
	/*
 
	Inner functions
 
	*/
 
	function fancybox_process(obj) {
		selectedArray	= [];
		selectedIndex	= 0;
 
		if (obj.nodeName) {
		    var rel = $(obj).attr('rel') || '';
 
			if (!rel || rel == '' || rel === 'nofollow') {
			    selectedArray.push(obj);
 
			} else {
	            selectedArray	= $("a[rel=" + rel + "], area[rel=" + rel + "]");
	            selectedIndex	= selectedArray.index( obj );
			}
 
        } else if ($.isArray(obj)) {
             selectedArray = jQuery.merge(selectedArray, obj);
 
		} else {
			 selectedArray.push(obj);
		}
 
		fancybox_start();
	};
 
	function fancybox_abort() {
		loading.hide();
 
		$(imagePreloader).unbind();
 
		if (ajaxLoader) ajaxLoader.abort();
 
		tmp.empty();
	};
 
	function fancybox_revert() {
		selectedIndex	= currentIndex;
		selectedArray	= currentArray;
		selectedOpts	= currentOpts;
	}
 
 	function fancybox_get_type() {
		if (selectedOpts.type) {
		    return selectedOpts.type;
		};
 
		var obj		= selectedArray[ selectedIndex ];
        var href	= obj.href || $(obj).attr('href') || false;
 
        if (!href) {
            return typeof obj == 'object' ? 'obj' : 'element';
        }
 
		if (href.match("iframe") || (typeof obj.className !== 'undefined' && obj.className.indexOf("iframe") >= 0 )) {
		    return 'iframe';
 
		} else if (href.match(imageRegExp)) {
		    return 'image';
 
		} else if (href.match(/#/)) {
            return 'element';
 
		} else {
            return 'ajax';
		}
 	};
 
	function fancybox_start() {
	    fancybox_abort();
 
		var obj		= selectedArray[ selectedIndex ];
        var href	= obj.href || $(obj).attr('href') || false;
        var type;
 
        if (typeof $(obj).data('fancybox') == 'undefined') {
        	selectedOpts = $.extend({}, defaults, selectedOpts);
		} else {
			selectedOpts = $.extend({}, defaults, $(obj).data('fancybox'));
		}
 
		if (selectedOpts.content) {
 	        obj		= selectedOpts.content
		    type	= 'html';
		} else {
		    type = fancybox_get_type();
		}
 
		if (selectedOpts.autoDimensions && type !== 'iframe') {
			selectedOpts.frameWidth		= false;
			selectedOpts.frameHeight	= false;
		}
 
		if (selectedOpts.modal) {
			selectedOpts.hideOnOverlayClick	= false;
			selectedOpts.hideOnContentClick	= false;
			selectedOpts.enableEscapeButton	= false;
			selectedOpts.showCloseButton	= false;
		}
 
		selectedOpts.type = type;
 
		switch (type) {
			case 'image' :
				imagePreloader = new Image; imagePreloader.src = href;
 
				if (imagePreloader.complete) {
					fancybox_process_image();
 
				} else {
					$.fancybox.showActivity();
					$(imagePreloader).unbind().one('load', fancybox_process_image);
				}
 
			break;
 
			case 'iframe' :
			   $.fancybox.showActivity();
 
			    $('<iframe id="fancybox-frame" name="fancybox-frame' + Math.round(Math.random() * 1000) + '" frameborder="0" hspace="0" src="' + href + '"></iframe>').load(function() {
					$(this).unbind();
					fancybox_show();
				}).appendTo(tmp);
 
			break;
 
			case 'obj' :
			case 'element' :
				if (type == 'element' && href) obj = href.substr(href.indexOf("#"));
 
				 $(obj).clone(true).removeAttr("id").appendTo(tmp).css('display', 'block');
 
				 fancybox_process_inline();
			break;
 
			case 'html' :
			    tmp.html('<div id="fancybox-content">' + obj + '</div>');
 
			    fancybox_process_inline();
			break;
 
			case 'ajax' :
				$.fancybox.showActivity();
 
				ajaxLoader = $.ajax( $.extend({
					url		: href,
					success	: function(data) {
						tmp.html('<div id="fancybox-content">' + data + '</div>');
			    		fancybox_process_inline();
					}
				}, selectedOpts.ajax) );
 
			break;
   		}
 	};
 
	function fancybox_process_image() {
		selectedOpts.frameWidth	 = imagePreloader.width;
		selectedOpts.frameHeight = imagePreloader.height;
 
		$("<img />").attr('src', imagePreloader.src).attr('id', 'fancybox_img').appendTo( tmp );
 
		fancybox_show();
	};
 
	function fancybox_process_inline() {
		if ($.browser.msie && parseInt($.browser.version.substr(0, 1)) < 7) {
			$('embed, object, select', tmp).css('visibility', 'visible');
		}
 
		if (selectedOpts.autoDimensions) {
 			selectedOpts.frameWidth	 = tmp.width();
 			selectedOpts.frameHeight = tmp.height();
		}
 
 		fancybox_show();
	};
 
	function fancybox_show() {
	    busy = true;
 
        loading.hide();
 
		currentArray	= selectedArray;
 		currentIndex	= selectedIndex;
 		currentOpts		= selectedOpts;
 
 		inner[0].scrollTop	= 0;
		inner[0].scrollLeft	= 0;
 
		if (currentOpts.overlayShow) {
			overlay.css({
				'background-color'	: currentOpts.overlayColor,
				'opacity'			: currentOpts.overlayOpacity
			}).unbind().show();
		}
 
		final_pos = fancybox_get_zoom_to();
 
		if (wrap.is(":visible")) {
 
			$( close.add( nav_left ).add( nav_right ) ).hide();
 
			var pos = wrap.position();
 
			start_pos = {
				top		:	pos.top ,
				left	:	pos.left,
				width	:	wrap.width(),
				height	:	wrap.height()
			};
 
			var equal = (start_pos.width == final_pos.width && start_pos.height == final_pos.height);
 
			inner.fadeOut(equal ? "fast" : 'normal', function() {
				inner.css({
					top			: currentOpts.padding,
					left		: currentOpts.padding,
					width		: start_pos.width	- (currentOpts.padding * 2) > 0 ? start_pos.width	- (currentOpts.padding * 2) : 1,
					height		: start_pos.height	- (currentOpts.padding * 2) > 0 ? start_pos.height	- (currentOpts.padding * 2) : 1,
					overflow	: 'hidden'
				}).empty();
 
				function finish_resizing() {
					inner.html( tmp.contents() ).fadeIn(equal ? "fast" : 'normal', _finish);
				}
 
				fx.prop = 0;
 
				$(fx).animate({ prop: 1 }, {
					 duration	: equal ? 0 : currentOpts.zoomSpeedChange,
					 easing		: currentOpts.easingChange,
					 step		: fancybox_draw,
					 complete	: finish_resizing
				});
			});
 
			return;
		}
 
		wrap.css('opacity', 1);
 
		if (currentOpts.zoomSpeedIn > 0) {
 
			start_pos = fancybox_get_zoom_from();
 
			inner.css({
				top			: currentOpts.padding,
				left		: currentOpts.padding,
				width		: start_pos.width	- (currentOpts.padding * 2) > 0 ? start_pos.width	- (currentOpts.padding * 2) : 1,
				height		: start_pos.height	- (currentOpts.padding * 2) > 0 ? start_pos.height	- (currentOpts.padding * 2) : 1
			});
 
			inner.html( tmp.contents() );
 
 			wrap.css(start_pos);
 
 			wrap.show();
 
 			if (currentOpts.zoomOpacity) {
				final_pos.opacity = 0;
			}
 
			fx.prop = 0;
 
			$(fx).animate({ prop: 1 }, {
				 duration	: currentOpts.zoomSpeedIn,
				 easing		: currentOpts.easingIn,
				 step		: fancybox_draw,
				 complete	: _finish
			});
 
		} else {
 
			inner.css({
				top			: currentOpts.padding,
				left		: currentOpts.padding,
				width		: final_pos.width	- (currentOpts.padding * 2) > 0 ? final_pos.width	- (currentOpts.padding * 2) : 1,
				height		: final_pos.height	- (currentOpts.padding * 2) > 0 ? final_pos.height	- (currentOpts.padding * 2) : 1
			});
 
			inner.html( tmp.contents() );
 
			wrap.css( final_pos ).fadeIn( _finish );
		}
	};
 
	function fancybox_draw(pos) {
		var width	= Math.round(start_pos.width	+ (final_pos.width	- start_pos.width)	* pos);
		var height	= Math.round(start_pos.height	+ (final_pos.height	- start_pos.height)	* pos);
 
		var top		= Math.round(start_pos.top	+ (final_pos.top	- start_pos.top)	* pos);
		var left	= Math.round(start_pos.left	+ (final_pos.left	- start_pos.left)	* pos);
 
		$(wrap).css({
			'width'		: width		+ 'px',
			'height'	: height	+ 'px',
			'top'		: top		+ 'px',
			'left'		: left		+ 'px'
		});
 
		width	-= currentOpts.padding * 2;
		height	-= currentOpts.padding * 2;
 
		if (width > 0 && height > 0) {
			inner.css({
				'width'		: width		+ 'px',
				'height'	: height	+ 'px'
			});
		}
 
		if (typeof final_pos.opacity !== 'undefined') {
			var opacity = pos < 0.5 ? 0.5 : pos;
 
			wrap.css('opacity', opacity);
		}
	};
 
	function _finish() {
		if ($.browser.msie) {
			inner[0].style.removeAttribute('filter');
			wrap[0].style.removeAttribute('filter');
		}
 
		inner.css('overflow', selectedOpts.type == 'iframe' || selectedOpts.type == 'image' || $(currentArray[ currentIndex ]).is('img') ? 'hidden' : 'auto');
 
		currentOpts.hideOnContentClick ? inner.one('click',		$.fancybox.close )	: inner.unbind();
 		currentOpts.hideOnOverlayClick ? overlay.one('click',	$.fancybox.close )	: overlay.unbind();
 
 		currentOpts.showCloseButton ? close.show() : close.hide();
 
	    fancybox_set_navigation();
 
	    if ($.isFunction(currentOpts.callbackOnShow)) {
			currentOpts.callbackOnShow(currentArray, currentIndex);
		}
 
	    busy = false;
 
	    fancybox_preload_images();
	};
 
	function fancybox_get_zoom_to() {
		var view	= fancybox_get_viewport();
		var to		= {};
 
		var margin = currentOpts.margin;
		var resize = currentOpts.autoScale;
 
		var horizontal_space	= (shadow + margin) * 2 ;
		var vertical_space		= (shadow + margin) * 2 ;
 
		if (currentOpts.frameWidth.toString().indexOf('%') > -1) {
			to.width = ((view[0] * parseFloat(currentOpts.frameWidth)) / 100) - (shadow * 2) ;
 
			resize = false;
 
		} else {
			to.width = currentOpts.frameWidth	+ (currentOpts.padding * 2);
		}
 
		if (currentOpts.frameHeight.toString().indexOf('%') > -1) {
			to.height = ((view[1] * parseFloat(currentOpts.frameHeight)) / 100) - (shadow * 2);
 
			resize = false;
		} else {
			to.height = currentOpts.frameHeight + (currentOpts.padding * 2);
		}
 
		if (resize && (to.width > (view[0] - horizontal_space) || to.height > (view[1] - vertical_space))) {
			var ratio = Math.min(Math.min( view[0] - horizontal_space, to.width) / to.width, Math.min( view[1] - vertical_space, to.height) / to.height);
 
			to.width	= Math.round(ratio * to.width);
			to.height	= Math.round(ratio * to.height);
		}
 
		to.top	= view[3] + ((view[1] - (to.height	+ (shadow * 2 ))) * 0.5);
		to.left	= view[2] + ((view[0] - (to.width	+ (shadow * 2 ))) * 0.5);
 
		if (currentOpts.autoScale == false) {
			to.top	= to.top	< view[3] ? view[3]  : to.top;
			to.left	= to.left	< view[2] ? view[2]  : to.left;
		}
 
		return to;
	};
 
	function fancybox_get_zoom_from() {
	    var obj		= currentArray[ currentIndex ];
		var view	= fancybox_get_viewport();
		var from 	= {
			width	: 1,
			height	: 1,
			top		: view[3] + view[1] * 0.5,
			left	: view[2] + view[0] * 0.5
		};
 
		var orig_item = false;
 
 		if (typeof obj.orig !== 'undefined' && obj.orig.nodeName) {
			orig_item = $(obj.orig);
 
		} else {
			if ($(obj).children("img:first").length) {
				orig_item = $(obj).children("img:first");
 
			} else if (obj.nodeName) {
				orig_item = $(obj);
			}
		}
 
		if (orig_item && orig_item.length) {
			var pos = fancybox_get_obj_pos(orig_item);
 
			from.width	= pos.width		+ (currentOpts.padding * 2);
			from.height	= pos.height	+ (currentOpts.padding * 2);
			from.top	= pos.top		- currentOpts.padding - shadow;
			from.left	= pos.left		- currentOpts.padding - shadow;
		}
 
		return from;
	};
 
	function fancybox_set_navigation() {
		$(document).unbind('keydown.fb').bind('keydown.fb', function(e) {
			if (e.keyCode == 27 && currentOpts.enableEscapeButton) {
				e.preventDefault();
				$.fancybox.close();
 
			} else if(e.keyCode == 37) {
				e.preventDefault();
				$.fancybox.prev();
 
			} else if(e.keyCode == 39) {
				e.preventDefault();
 				$.fancybox.next();
			}
		});
 
		if ($.fn.mousewheel) {
			wrap.unbind('mousewheel.fb');
 
			if (currentArray.length > 1 && $.fn.mousewheel) {
				wrap.bind('mousewheel.fb', function(e, delta) {
					e.preventDefault();
 
					if (busy || delta == 0) return;
 
					delta < 0 ? $.fancybox.prev() : $.fancybox.next();
				});
			}
		}
 
		if (currentIndex != 0) {
			nav_left.show();
		}
 
		if (currentIndex != ( currentArray.length -1)) {
			nav_right.show();
		}
	};
 
	function fancybox_preload_images() {
		if ((currentArray.length -1) > currentIndex) {
			var href = currentArray[ currentIndex + 1 ].href;
 
			if (typeof href !== 'undefined' && href.match(imageRegExp)) {
				var objNext = new Image();
				objNext.src = href;
			}
		}
 
		if (currentIndex > 0) {
			var href = currentArray[ currentIndex - 1 ].href;
 
			if (typeof href !== 'undefined' && href.match(imageRegExp)) {
				var objNext = new Image();
				objNext.src = href;
			}
		}
	};
 
	function fancybox_animate_loading() {
		if (!loading.is(':visible')){
			clearInterval(loadingTimer);
			return;
		}
 
		$('div', loading).css('top', (loadingFrame * -40) + 'px');
 
		loadingFrame = (loadingFrame + 1) % 12;
	};
 
	function fancybox_get_viewport() {
		return [ $(window).width(), $(window).height(), $(document).scrollLeft(), $(document).scrollTop() ];
	};
 
	function fancybox_get_obj_pos(obj) {
		var pos		= obj.offset();
 
		pos.top		+= parseFloat( obj.css('paddingTop') )	|| 0;
		pos.left	+= parseFloat( obj.css('paddingLeft') )	|| 0;
 
		pos.top		+= parseFloat( obj.css('border-top-width') )	|| 0;
		pos.left	+= parseFloat( obj.css('border-left-width') )	|| 0;
 
		pos.width	= obj.width();
		pos.height	= obj.height();
 
		return pos;
	};
 
	function fancybox_init() {
		if ($("#fancybox-wrap").length) return;
 
		tmp			= $('<div id="fancybox-tmp"></div>').appendTo("body");
		loading		= $('<div id="fancybox_loading"><div></div></div>').appendTo("body");
		overlay		= $('<div id="fancybox-overlay"></div>').appendTo("body");
		wrap		= $('<div id="fancybox-wrap"></div>').appendTo('body');
 
		outer	= $('<div id="fancybox-outer"></div>')
			.append('<div class="fancy_bg" id="fancy_bg_n"></div><div class="fancy_bg" id="fancy_bg_ne"></div><div class="fancy_bg" id="fancy_bg_e"></div><div class="fancy_bg" id="fancy_bg_se"></div><div class="fancy_bg" id="fancy_bg_s"></div><div class="fancy_bg" id="fancy_bg_sw"></div><div class="fancy_bg" id="fancy_bg_w"></div><div class="fancy_bg" id="fancy_bg_nw"></div>')
			.appendTo( wrap );
 
		inner	= $('<div id="fancybox-inner"></div').appendTo( outer );
		close	= $('<a id="fancybox-close"></a>').appendTo( outer );
 
		nav_left	= $('<a href="javascript:;" id="fancybox_left"><span class="fancy_ico" id="fancybox_left_ico"></span></a>').appendTo( outer );
		nav_right	= $('<a href="javascript:;" id="fancybox_right"><span class="fancy_ico" id="fancybox_right_ico"></span></a>').appendTo( outer );
 
		close.click( $.fancybox.close );
		loading.click( $.fancybox.cancel );
 
		nav_left.bind("click", function(e) {
			e.preventDefault();
			$.fancybox.prev();
		});
 
		nav_right.bind("click", function(e) {
			e.preventDefault();
			$.fancybox.next();
		});
 
		if ($.browser.msie) {
			outer.find('.fancy_bg').fixPNG();
		}
 
		if (IE6) {
			$(close.add( '.fancy_ico').add('div', loading) ).fixPNG();
		}
 
	};
 
	$(document).ready(function() {
		fancybox_init();
	});
 
})(jQuery);

