/**
 * Load scripts in parallel.
 * Copyright (C) 2009 happychickoo
 *
 * Licensed under the terms of the MIT license.
 */
function decode_value(key, value){
    switch(key){
    case 'src':
    case 'SRC':
        value = decodeURI(value);
    break;
    default:
        break;
    }
    return value;
}
function convert_to_object(script){
    switch (typeof script){
    case 'string':
        script = {src: script};
        break;
    case 'object':
        break;
    default:
        throw new Error('Found \"' + script +
                        '\" instead of valid object or URL. ' +
                        'Script list must contain only string ' +
                        'URLs or objects with attributes for the' +
                        ' script element.');
    }
    return script;
}
function getScripts(scripts){
    var lt = "%3C",
        gt = "%3E",
        doc = document,
        len = scripts.length,
        key = null,
        script = null,
        value = null,
        ua = navigator.userAgent;

    if(ua.indexOf("MSIE") > -1 || ua.indexOf("WebKit") > -1) {
        for (var i = 0; i < len; ++i){
            script = convert_to_object(scripts[i]);
            var attrs = [];
            for (key in script){
                if (script.hasOwnProperty(key) &&
                    typeof key === 'string'){
                    value = decode_value(key, script[key]);
                    attrs.push([key,
                                '\"' + value + '\"'
                                ].join('='));
                }
            }
            var html = unescape([lt,
                                 'script ',
                                 attrs.join(' '),
                                 gt,
                                 lt,
                                 '/script',
                                 gt
                                 ].join(''));
            doc.writeln(html);
        }
    } else {
        var body = doc.getElementsByTagName('body')[0];
        for (var j = 0; j < len; ++j){
            var elem = doc.createElement('script');
            script = convert_to_object(scripts[j]);
            for (key in script){
                if (script.hasOwnProperty(key) &&
                    typeof key === 'string'){
                    value = decode_value(key, script[key]);
                    elem.setAttribute(key, value);
                }
            }
            body.appendChild(elem);
        }
    }
}

