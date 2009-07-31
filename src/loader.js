/**
 * Load scripts in parallel.
 * Copyright (C) 2009 happychickoo
 *
 * Licensed under the terms of the MIT license.
 */
function decodeValue(key, value){
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
function convertToObject(script){
    switch (Object.prototype.toString.call(script)){
    case '[object String]':
        script = {src: script};
        break;
    case '[object Object]':
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
            script = convertToObject(scripts[i]);
            var attrs = [];
            for (key in script){
                if (script.hasOwnProperty(key) &&
                    typeof key === 'string'){
                    value = decodeValue(key, script[key]);
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
            script = convertToObject(scripts[j]);
            for (key in script){
                if (script.hasOwnProperty(key) &&
                    typeof key === 'string'){
                    value = decodeValue(key, script[key]);
                    elem.setAttribute(key, value);
                }
            }
            body.appendChild(elem);
        }
    }
}

