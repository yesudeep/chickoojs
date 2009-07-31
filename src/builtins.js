/**
 * Behaves much like the python range() function.
 * Arguments:   [start,] stop[, step]
 *
 * @start  Number  start value
 * @stop   Number  stop value (excluded from result)
 * @step   Number  skip values by this step size
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
 * range(5, 4, 1) -> []
 * range(0, 1, 0) -> error: step cannot be zero
 * range(0.2, 4.0) -> [0, 1, 2, 3]
 */
Number.range = function(/* arguments */) {
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


/**
 * Thanks to Michael Lee Finney for this list
 * of white space characters.
 */
String.whiteSpaceCharacters = [
    0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x0085, 0x00a0,
    0x1680, 0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005,
    0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x200b, 0x2028, 0x2029,
    0x202f, 0x205f, 0x3000
];
String.whiteSpace = [];
for (var c4e1a3e0d627a715dd638f17e51f26bc14249d12 = String.whiteSpaceCharacters.length - 1;
        c4e1a3e0d627a715dd638f17e51f26bc14249d12 > -1;
        --c4e1a3e0d627a715dd638f17e51f26bc14249d12){
    String.whiteSpace[String.whiteSpaceCharacters[c4e1a3e0d627a715dd638f17e51f26bc14249d12]] = true;
}
/*
String.whiteSpace[0x0009] = true;
String.whiteSpace[0x000a] = true;
String.whiteSpace[0x000b] = true;
String.whiteSpace[0x000c] = true;
String.whiteSpace[0x000d] = true;
String.whiteSpace[0x0020] = true;
String.whiteSpace[0x0085] = true;
String.whiteSpace[0x00a0] = true;
String.whiteSpace[0x1680] = true;
String.whiteSpace[0x180e] = true;
String.whiteSpace[0x2000] = true;
String.whiteSpace[0x2001] = true;
String.whiteSpace[0x2002] = true;
String.whiteSpace[0x2003] = true;
String.whiteSpace[0x2004] = true;
String.whiteSpace[0x2005] = true;
String.whiteSpace[0x2006] = true;
String.whiteSpace[0x2007] = true;
String.whiteSpace[0x2008] = true;
String.whiteSpace[0x2009] = true;
String.whiteSpace[0x200a] = true;
String.whiteSpace[0x200b] = true;
String.whiteSpace[0x2028] = true;
String.whiteSpace[0x2029] = true;
String.whiteSpace[0x202f] = true;
String.whiteSpace[0x205f] = true;
String.whiteSpace[0x3000] = true;
*/

/**
 * An extremely fast trim string function.
 * based on Michael Lee Finney's lookup table.
 *
 * @param trimCharacters       String/Array  (Optional)  Trim these characters from both ends of the string.
 *                                           If not specified, only whitespace characters are removed.
 * @param includingWhitespace  Boolean       (Optional)  Trim whitespace characters along with characters specified
 *                                           in trimCharacters.
 */
String.prototype.trim = function(){
    var str = this, len = str.length, c = 0, i = 0, chars = [];
    if (len){
        var includingChars = [], stripChars = [];
        switch (arguments.length){
            case 0:
                chars = String.whiteSpace;
                break;
            case 2:
                if (arguments[1]){
                    includingChars = String.whiteSpaceCharacters;
                }
            case 1:
                chars = [];
                stripChars = arguments[0];
                switch(Object.prototype.toString.call(stripChars)){
                    case '[object String]':
                        // Create a look up table.
                        for (c = stripChars.length - 1; c > -1; --c){
                            chars[stripChars.charCodeAt(c)] = true;
                        }
                        break;
                    case '[object Array]':
                        // Create a look up table.
                        for (c = stripChars.length - 1; c > -1; --c){
                            chars[stripChars[c]] = true;
                        }
                        break;
                    default:
                        // Use existing look up table.
                        break;
                }
                for (c = includingChars.length - 1; c > -1; --c){
                    chars[includingChars[c]] = true;
                }
                break;
            default:
                throw new Error('invalid number of arguments - expected 2 or less, got ' + arguments.length);
        }

        // Remove characters from the end of the string.
        while(chars[str.charCodeAt(--len)]);

        // Remove characters from the beginning of the string.
        if (++len){
            while(chars[str.charCodeAt(i)]){
                ++i;
            }
        }
        str = str.substring(i, len);
    }
    return str;
}

