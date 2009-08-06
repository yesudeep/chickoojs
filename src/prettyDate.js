var prettyTimeDiff = (function() { 
    var ints = {
        second: 1,
        minute: 60,
        hour: 3600,
        day: 86400,
        week: 604800,
        month: 2592000,
        year: 31536000,
        decade: 315360000
    };
 
    return function(aTime, bTime) { 
        aTime = +new Date(aTime);
        bTime = bTime === undefined ? +new Date() : +new Date(bTime);
 
        var timeGap = Math.abs(bTime - aTime) / 1000,
            amount, measure, remainder, smallest;
 
        for (var i in ints) {
            if (timeGap > ints[i] && ints[i] > (ints[measure] || 0)) {
                measure = i;
            }
            if (!smallest || ints[i] < smallest) {
                smallest = ints[i];
            }
        }
 
        amount = Math.floor(timeGap / ints[measure]);
 
        if (timeGap > 31536000) {
            /* Handle leap years */
            timeGap -= Math.floor(ints[measure] * amount / 31536000 / 4) * 86400;
        }
 
        amount += ' ' + measure  + (amount > 1 ? 's' : '');
 
        remainder = timeGap % ints[measure];
 
        if (remainder >= smallest) {
            amount += ', ' + arguments.callee(+new Date() - remainder*1000 );
        }

        return amount;
    }; 
})();

