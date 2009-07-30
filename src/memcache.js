/**
 * memcache.js - memcache-like object for javascript.
 * Copyright (C) 2009 happychickoo.
 * Licensed under the terms of the MIT license.
 */
this.memcache = {
    datastore: {},
    get: function(key){
        logger.debug(['[memcache.get.key]', key].join(' '));
        return this.datastore[key];
    },
    set: function(key, value, timeout /* milliseconds */){
        var store = this.datastore;
    	/*if (typeof timeout === 'undefined'){
          timeout = 0;
          }*/
        timeout = timeout || 0;
        var human_timeout = timeout / 1000;
        logger.debug(['[memcache.set.key]', key, 'timeout: ', human_timeout, 'seconds'].join(' '));
        store[key] = value;
        if (timeout){
            setTimeout(function(){
                    logger.debug(['[memcache.delete.key]', key, 'timeout: ', human_timeout, 'seconds reached'].join(' '));
                    delete store[key];
                }, timeout);
        }
    },
    remove: function(key){
    	logger.debug(['[memcache.remove.key]', key].join(' '));
        delete this.datastore[key];
    },
    clear: function(){
    	logger.debug('[memcache.clear.keys]');
        this.datastore = {};
    }
};

