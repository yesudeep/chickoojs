jQuery.fn.liveFilter = function(list, options){
	var list = jQuery(list);
    var prefs = jQuery.extend({
        onComplete: function(elems){},
        timeout: 0,
        childSelector: 'li',
        includeHTML: false,  // Keep this as false for major speed up.
        invisibleClass: '',
        useQuickSilver: false  // Slower and requires quicksilver.js
    }, options);

    var invisibleClass = prefs.invisibleClass;
    if (invisibleClass){
    	// Use class names to speed up hiding and display without many calculations.
    	// Let CSS keep track of how to "unhide and restore the style.display attribute."
        var show = function(elem){
            elem.removeClass(invisibleClass);
        }
        var hide = function(elem){
            elem.addClass(invisibleClass);
        }
    } else {
    	// These do a lot of calculation and hence will be slower
    	// than simply adding a class that hides stuff.
        var show = function(elem){
            elem.show();
        }
        var hide = function(elem){
            elem.hide();
        }
    }
	if (list.length) {
		var rows = list.children(prefs.childSelector);
		var cache = [];
		// http://blog.coderlab.us/2006/04/18/the-textcontent-and-innertext-properties/
		var innerContent = (document.getElementsByTagName("body")[0].innerText !== undefined)? 'innerText': 'textContent';
		if (prefs.includeHTML) {
			innerContent = 'innerHTML';
		}
		for (var i = rows.length - 1; i > -1; --i){
			cache.unshift(rows[i][innerContent].toLowerCase());
		}
		/*
		Original shit.
		var cache = null;
		if (prefs.includeHTML){
		    // HTML is slower to search, so it's disabled by default.  The user
		    // is really only after the text not the markup.
		    cache = rows.map(function(){
				return jQuery(this).html().toLowerCase();
			});
		} else {
    		cache = rows.map(function(){
				return jQuery(this).text().toLowerCase();
			});
		}*/

		var filter = null;
		if (prefs.useQuickSilver && typeof prototype.score === 'function'){
			filter = filter_quicksilver;
		} else {
			filter = filter_index;
		}
		var deferred_filter = filter;
		if (prefs.timeout){
    		deferred_filter = jQuery.defer(prefs.timeout, filter);
    	}
		this
			.keyup(deferred_filter).keyup()
			// .change doesn't fire for input[type=search] (webkit) elements,
			// which means clicking the 'x' button doesn't clear search.
			// This handler is to do just that.
			.click(filter).click()
			.parents('form').submit(function(){
				return false;
			});
	}

	return this;

	function filter_quicksilver(e){
		var term = trimString(jQuery(this).val().toLowerCase());
		var scores = [];

		if (!term) {
		    /*
		     * Show all the rows when the search term is empty.
		     */
			//rows.show();
			show(rows);
			prefs.onComplete(rows);
		} else {

			/*
			 * Even a simple for(...){...} is faster than jQuery.each().
			 *
			 * Calling the callback function passed to each on every element has the overhead
			 * of setting up the function stack frame and scope, and then discarding both when the function
			 * exits scope.  With a for loop this entire overhead is avoided.
			 *
			 * Speed ups may not be noticeable for a small list, but for a large list
			 * this will quickly become apparent.  So avoid this code (even if it's a bit more readable):
			 *
			 * cache.each(function(i){
			 *	 var score = this.score(term);
			 *   if (score > 0) { scores.push([score, i]); }
			 * });
			 */

			// Begin optimization.
			var score = 0;
			/*for (var i = 0, cacheLength = cache.length; i < cacheLength; i++){
    			score = cache[i].score(term);
			    if (score > 0) {
			        scores.push([score, i]);
			    }
			}*/
			// Reverse loops are faster than forward loops.  There's less variable comparison going on.
			// One of the operands of the relational operator usually ends up being a literal.
			for (var i = cache.length - 1; i > -1; --i){
			    score = cache[i].score(term);
			    /*if (score > 0){
			        scores.push([score, i]);
			    }*/
			    (score > 0) && scores.push([score, i]); // Avoid branching.
			}
			// End optimization.

            var visibleRows = [];

			/*
			 * Again not the right place to use the each method.  Avoid each()
			 * as much as possible and attached function setup overhead.
			 *
			 * jQuery.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
			 *    var row = rows[this[1]];
			 *	  visibleRows.push(row);
			 *    jQuery(row).show();
			 * });
			 */

            //rows.hide();
			hide(rows);

            // Begin optimization.
            var sortedScores = scores; //.sort(function(a, b){return b[0] - a[0];});  // Sort for ranking, but elements aren't getting reordered in the DOM below.  What's the point?
			/*for (var i = 0, sortedScoresLength = sortedScores.length; i < sortedScoresLength; i++){
			    var row = rows[sortedScores[i][1]];
			    visibleRows.push(row);
			    jQuery(row).show();
			}*/
			for (var i = sortedScores.length - 1, row = null; i > -1; --i){
			    row = rows[sortedScores[i][1]];
			    visibleRows.push(row);
			    show(jQuery(row));
			    //jQuery(row).show();
			}
			// End optimization.

			prefs.onComplete(visibleRows);
		}

	}

	function filter_index(e){
		var term = jQuery.trim(jQuery(this).val().toLowerCase());
		if (!term){
			show(rows);
			//rows.show();
			prefs.onComplete(rows);
		} else {
			var visibleRows = [];
			for (var i = cache.length - 1, row = null; i > -1; --i){
				if (cache[i].indexOf(term) > -1){
					row = rows[i];
					visibleRows.push(row);
				}
			}
			hide(rows);
			//rows.hide();
			for (var i = visibleRows.length - 1; i > -1; --i){
				//jQuery(visibleRows[i]).show();
				show(jQuery(visibleRows[i]));
			}
			prefs.onComplete(visibleRows);
		}
	}
};
