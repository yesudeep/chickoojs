/* Disable all debugging functions when the firebug and blackird
 * consoles are not available. We output logs to both when available. */

// Common function patterns.
function fn_echo(w){return w;}
function fn_true(w){return true;}
function fn_false(w){return false;}
function fn_nop(){}

var __disable_logger = false;
var __have_firebug = true;    // Do we have firebug?
var __have_blackbird = true;  // Do we have blackbird?
var __grep_friendly = true;   // Insert grep friendly information into logs so that they can be parsed offline.

// Firebug
if(typeof window.console == 'undefined'){
    __have_firebug = false;
    window.console = {
        log: fn_nop
    };
}
// Blackbird
if (typeof log == 'undefined'){
    __have_blackbird = false;
    this.log = {toggle: fn_nop,
                move: fn_nop,
                resize: fn_nop,
                clear: fn_nop,
                debug: fn_nop,
                info: fn_nop,
                warn: fn_nop,
                error: fn_nop,
                profile: fn_nop
    };
}

// Use this logger instead of
if (__disable_logger || !__have_firebug){
    this.logger = this.log;
} else {
    this.logger = {
        toggle: log.toggle,
        move: log.move,
        resize: log.resize,
        clear: function(){
            console.clear();
            log.clear();
        },
        profile: log.profile,
        format: (__grep_friendly)? function(message, message_type){
            if (!message_type){
                message_type = '';
            }
            var d = ['[', Date(), ']'].join('');
            var m = [d, message_type, message].join(' -- ');
            return m;
        }: function(message, message_type){
            return message;
        },
        error: function(message){
            var m = this.format(message, 'ERROR');
            console.error(m);
            log.error(m);
        },
        debug: function(message){
            var m = this.format(message, 'DEBUG');
            console.debug(m);
            log.debug(m);
        },
        info: function(message){
            var m = this.format(message, 'INFO');
            console.info(m);
            log.info(m);
        },
        warn: function(message){
            var m = this.format(message, 'WARNING');
            console.warn(m);
            log.warn(m);
        }
    };
}

logger.info('Logging started');

