/**
 * Loader reloaded.
 *
 * Read this:
 * http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
 *
 * Do not make your inline/embedded JavaScript dependent
 * on ANY of the scripts loaded with this loader.  IE
 * will spit errors about undefined symbols.
 */
function getScriptAttributes(script){
    return script;
}

function loadScript(attributes, where){
    var doc = document,
        script = doc.createElement("script");

    script.type = attributes.type || 'text/javascript';

    if (script.readState){ // IE
        script.onreadystatechange = function(){
            switch(script.readyState){
                case "loaded":
                case "complete":
                    script.onreadystatechange = null;
                    attributes.onload();
                    break;
                default:
                    break;
            }
        };
    } else { // Others
        script.onload = attributes.onload;
    }

    script.src = decodeURI(attributes.src);
    where = where || doc.getElementsByTagName("head")[0];
    where.appendChild(script);
}

function getScripts(scripts){
    var where = document.getElementsByTagName("head")[0];

    for (var i = 0, len = scripts.length, attr = null; i < len; ++i){
        attr = scripts[i];
        switch(Object.prototype.toString.call(attr){
            case '[object String]':
                attr = {src: attr};
                break;
            case '[object Object]':
                break;
            default:
                throw new Error("Found \"" + attr + "instead of valid" +
                " object or URL.  Script list must contain URLs or attribute objects only.");
        }
        attr.onload = attr.onload || function(){};
        loadScript(attr, where);
    }
}


