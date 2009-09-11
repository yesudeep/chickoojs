/*
 * JsonRpcService object for RightJS.
 * Copyright (C) 2009  Yesudeep Mangalapilly <yesudeep@gmail.com>.
 *
 * Released under terms of the MIT license.
 *
 * Dependencies:
 *
 * 		* Native JSON or json2.js (http://www.json.org/json2.js).
 */
var JsonRpcService = new Class({
	include: Options,

	/**
	 * Used as the id for an RPC message.
	 * Request-to-response mapping uses this identifier.
	 *
	 * Version 1.0 of the JSON RPC Specification states that this can be any
	 * JavaScript type.  However, the proposal for the latest version 2.0 of the
	 * Specification requires this to be a JSON scalar (an immutable object)
	 * barring fractionals or floating point numbers as they are approximate
	 * and cannot be used to match requests to response reliably.
	 */
	serial_id: 0,

	/**
	 * Namespace for remote API method names.
	 */
	api: {},

	/**
	 * Configurable options.
	 */
	Options: {
		/**
		 * Service Proxy URL.
		 */
		url: '',

		/**
		 * HTTP Headers set per request.
		 */
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json, text/javascript, text/html, ' +
					'text/xml, application/xml, */*'
		},

		/**
		 * Cross-domain requests cannot be asynchronous.
		 */
		async: true,

		/**
		 * Version string.  Can be one of these values: "1.1", "2.0", etc.
		 * If a version number is not specified, version 1.1 will be
		 * used.
		 *
		 * Versions included in remote call messages must be strings (not
		 * numbers).  JSON-RPC Specification version 2.0 adds an additional key
		 * to stringified JSON message called 'jsonrpc' which *must* be included
		 * for it to qualify as a version 2.0 message.  The server must return
		 * this version in the response using the same field name.
		 */
		version: '1.1',

		/**
		 * HTTP Method used for sending the RPC message.
		 * POST is used if no value is provided.
		 *
		 * @note	Currently only POST is supported.
		 */
		method: 'POST',

		/**
		 * List of remote API methods for which local method wrappers will be
		 * generated.  The generated wrapper methods will be placed in the
		 * service.api.* namespace.
		 */
		api: []
	},

	/**
	 * Constructor.
	 *
	 * @url			String	A JsonRpcService instance acts as a proxy for this
	 * 						service URL.
	 * @options  	Object	An object contains various options that you want
	 * 						overridden with your values.
	 */
	initialize: function(url, options){
		this.setOptions(options);
		this.options.url = url;

		var version = this.options.version;
		switch(version){
			case '1.0':
			case '1.1':
				this.message_template = {version: version};
				break;
			default:
				this.message_template = {jsonrpc: version};
				break;
		}

		var methods = options.api;
		for (var i = methods.length - 1, method_name = ''; i > -1; i--){
			method_name = methods[i];
			this.api[method_name] = this.__create_api(method_name);
		}
	},

	// Private methods.
	__create_api: function(method_name){
		var service = this;

		return function(params, onSuccess, onCancel){
			var options = service.options;
			service.__remote_call(options, method_name,
					params, onSuccess, onCancel);
		}
	},

	__remote_call: function(options, method_name, params, onSuccess, onCancel){
		var serial_id = ++this.serial_id;
		var version = options.version;
		var message = Object.merge(this.message_template, {
			method: method_name,
			params: params,
			id: serial_id
		});

		if (onSuccess && !isFunction(onSuccess)){
			throw new Error('invalid parameter - onSuccess is not a function');
		}
		if (onCancel && !isFunction(onCancel)){
			throw new Error('invalid parameter - onSuccess is not a function');
		}

		// Uses the json2.js or native JSON object to stringify.
		var string_message = JSON.stringify(message);

		// Xhr setup
		var xhr = new Xhr(options.url, {
			async: options.async,
			// Stop forcing 'application/x-www-form-urlencoded' content-type.
			urlEncoded: false,
			evalJSON: true,
			onSuccess: function(request){
				var json = request.responseJSON;
				var result = json.result;
				if (json.id == serial_id){
					if (result){
						onSuccess(result);
					} else {
						var error = json.error;
						if (error){
							var error_message = ((error.code)?
									'[' + error.code + ']': '') +
								error.type + ' -- ' + error.message;
							throw new Error(error_message);
						} else {
							throw new Error('JSONRPCError -- ' +
									'undefined error');
						}
					}
				}
			},
			onCancel: function(request){
				onCancel(request);
			}
		});
		var headers = options.headers;
		Object.keys(headers).each(function(key){
			xhr.setHeader(key, headers[key]);
		});
		xhr.send(string_message);
	},

    // Public service methods.
	remote_call: function(method_name, params, onSuccess, onCancel){
		var options = this.options;
		this.__remote_call(options, method_name, params, onSuccess, onCancel);
	}
});

