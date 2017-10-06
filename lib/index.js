var Promise = require('bluebird')
	, fs = Promise.promisifyAll(require("fs"))
	, path = require('path')
	//__ checking types shortcuts used by global.check()
	, types = { 'o': 'object', 'b': 'boolean', 'n': 'number', 's': 'string', 'f': 'function', 'a': 'array', 'j': 'jq', 'c': 'class', 'es': 'elements', 'e': 'element',
	'co': 'collection', 't': 'textnode', 'wh': 'whitespace', 'w': 'window'
}
;

global.check = function (v, wishType, flag) {
	if (v === null)    return false;
	//console.log('check : ', wishType, typeof wishType);
	var type = (typeof v).toLowerCase(),
		valid = type != 'undefined';
	if (!valid || typeof wishType != 'string')    return valid;
	if (v instanceof Array)    type = 'array';
	var wt = types[wishType];
	if (typeof wt == 'undefined')    return console.warn('[ window.check ] unable to retrieve wishType from shortcuts : ', wishType, window.check.types);
	valid = type == wt;
	//console.log('check : ', type, wishType, flag, v);
	if (!valid || typeof flag == 'undefined')    return valid;
	switch (wt) {
		case 'element' :
			if (typeof flag == 'string') valid = check(v[flag]);
			break;
		case 'array' :
		case 'string' :
		case 'jq' :
		case 'elements' :
		case 'collection' :
			var min = 1;// default min length required
			if (typeof flag == 'number') min = flag;
			valid = v.length >= min;
			break;
		case 'number' :
		case 'boolean' :
			valid = v != 0;
			break;
		default :
			break;
	}
	return valid;
};

//__ TODO : unit test & descriptions
var mod = module.exports = {
	mixin: function (dest, src, deep) {
		if (!check(src, 'o'))  return src;
		if (!check(dest, 'o'))  dest = {};
		if (check(deep, 'a')) {// copy only some properties
			for (var i = 0, max = deep.length; i < max; i++) {
				var prop = deep[i];
				if (!check(src[prop])) continue;
				dest[prop] = src[prop];
			}
		} else {
			for (var prop in src) {
				// console.log('prop', prop);
				if (deep) {
					dest[prop] = (src[prop] && src[prop].constructor == Object) ? mod.mixin(dest[prop], src[prop]) : src[prop];
				} else {
					dest[prop] = src[prop];
				}
			}
		}
		return dest;
	}
	//_____ get an nested value of an object such get( obj, 'path.to.property' )
	, get : function( obj, pathVar, defaultVal ){
		defaultVal = check(defaultVal) ? defaultVal : null;
		if(!check(obj))	return defaultVal;//{	console.warn('[ window.checkDeep ] 1st arg must be an object : ', obj); return false;}
		if (typeof pathVar == 'number') pathVar += '';
		else if(!check(pathVar,'s',1)){	console.warn('[ dutils.get ] 2nd arg must be a non empty string : ', pathVar); return null;}
		var t = pathVar.split('.'),
			p = obj;
		// check full path existence
		for(var i = 0, max = t.length; i < max; i++){
			var key = t[i], z = parseInt(key);
			if(!isNaN(z)) key = z;
			//console.log('key : ', key, p);
			if(!check(p[key]))	return defaultVal;
			p = p[key];
		}
		return p === null ? defaultVal : p;
	}
	, parseDir : function( dir_path, options ){
		// console.log('parseDir', dir_path);
		options = options || {};
		var filters = [];
		if(options.extension_include){//__ extension_include = regExp
			filters.push(function( filename ){
				return filename.match( '\.'+options.extension_include+'$' );
			});
		}
		if( options.types ){//__ extension_include = regExp
			filters.push(function( filename, stat ){
				switch( options.types ){
					case 2 :    return stat.isDirectory(); // only dirs
					case 1 :    return stat.isFile(); // only files
					default :   return true;
				}
			});
		}

		var res = [];
		return fs.readdirAsync( dir_path )
			.filter(function( filename ) {
				// console.log('filter');
				var path_file = path.join(dir_path, filename );
				return fs.statAsync( path_file ).then(function( stat ){
					for(var i = 0, max = filters.length; i < max; i++){
						if(!filters[i](filename, stat))   return false;
					}
					var file = {filename:filename, size:stat.size, created:stat.ctime, is_file:stat.isFile()};
					if( file.is_file ){
						file.is_img = !!filename.match('\.(jpe?g|gif|png)$');
					}
					res.push( file );
					return filename;
				})
					;
			}).then(function( files ){
				return res;
			})
			// .catch(function(err){
			//     throw err;//new Error(err.message);
			// })
			;
	}
	, findValue : function( obj, value, options ){
		var me = this
			, res = []
			, type = typeof value;
		options = options || {};
		if(options.trace)   console.log('_findValue', value, options );
		if(!options.max_result) options.max_result = Infinity;

		me.traverse( obj, function( _value, path ){
			if( type == typeof value && value == _value){
				res.push( path );
				if(res.length >= options.max_result)    return false;
			}
		}, options );
		return res;

	}
	, traverse : function( obj, callback, options ){
		if( typeof callback != 'function'){
			return console.warn(new Error('2nd arg callback must be a funtion.'), callback );
		}
		var count = 0
			, stack_over = false
			, parsed_prop = '$$$'
		;
		options = options || {};
		if(!options.max_test) options.max_test = Infinity;
		if(!options.max_level) options.max_level = Infinity;
		if(!options.exclude)    options.exclude = {};
		var isTrav = function( a ){
			return ( typeof a == 'object' || a.constructor === Array );
		};
		var _traverse = function( _obj, path_prefix, level ){
			if( stack_over || level > options.max_level || !_obj || _obj[parsed_prop] || !isTrav(_obj) )   return;
			if(options.trace)   console.log('traverse', count, path_prefix );
			Object.defineProperty( _obj, parsed_prop, { value : 1, writable: true });
			path_prefix = path_prefix ? (path_prefix+'.') : '';
			if(++count > options.max_test ){
				stack_over = true;
				if(options.trace)   console.log('stack over');
				return;
			}
			for(var key in _obj ){
				if(options.exclude[key])    continue;
				// console.log('key', key );
				var p = path_prefix+key;
				if(false === callback( _obj[key], p ))   return stack_over = true;
				_traverse( _obj[key], p, level+1 );
			}
		};
		_traverse( obj, '', 0 );

	}
};





