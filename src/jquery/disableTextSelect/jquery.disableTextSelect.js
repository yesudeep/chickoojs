// http://chris-barr.com/entry/disable_text_selection_with_jquery/
//jQuery(function(){
	//jQuery.extend(
	    jQuery.fn.disableTextSelect = function(){
		    return this.each(function(){
		    	if (jQuery.browser.mozilla) {
		    	    //Firefox
		    		jQuery(this).css('MozUserSelect','none');
		    	} else if (jQuery.browser.msie) {
		    	    //IE
		    		jQuery(this).bind('selectstart', function(){ return false; });
		    	} else {
		    	    //Opera, etc.
		    		jQuery(this).mousedown(function(){ return false; });
		    	}
		    });
	    }
	//);
//});

