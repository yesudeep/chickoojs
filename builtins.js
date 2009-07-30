/**
 * Behaves much like the python range() function.
 * Arguments:   [start,] stop[, step]
 *
 * @start    start value
 * @stop     stop value (excluded from result)
 * @step     skip values by this step size
 *
 * range() -> error: needs more arguments
 * range(4) -> [0, 1, 2, 3]
 * range(0) -> []
 * range(0, 4) -> [0, 1, 2, 3]
 * range(0, 4, 1) -> [0, 1, 2, 3]
 * range(0, 4, -1) -> []
 * range(4, 0, -1) -> [4, 3, 2, 1]
 * range(0, 4, 5) -> [0]
 * range(5, 0, 5) -> []
 *   range(5, 4, 1) -> []
 * range(0, 1, 0) -> error: step cannot be zero
 * range(0.2, 4.0) -> [0, 1, 2, 3]
 */
function range(/* arguments */) {
    var start, end, step;
    var array = [];

    switch(arguments.length){
    case 0:
        throw new Error('range() expected at least 1 argument, got 0 - must be specified as [start,] stop[, step]');
        return array;
        // break;
    case 1:
        start = 0;
        end = Math.floor(arguments[0]) - 1;
        step = 1;
        break;
    case 2:
    case 3:
    default:
        start = Math.floor(arguments[0]);
        end = Math.floor(arguments[1]) - 1;
        var s = arguments[2];
        if (typeof s === 'undefined'){
            s = 1;
        }
        step = Math.floor(s) || (function(){ throw new Error('range() step argument must not be zero'); })();
        break;
    }

    if (step > 0){
        for (var i = start; i <= end; i += step){
            array.push(i);
        }
    } else if (step < 0) {
        step = -step;
        if (start > end){
            for (var i = start; i > end + 1; i -= step){
                array.push(i);
            }
        }
    }
    return array;
}

