function _oget(o, k, d=null) {
	if (k in o) {
		return o[k]
	} else {
		return d
	}
}

function _setopts (opts, key, events) {
	if (!(key in opts)) {
		opts[key] = events
	}
	return opts
}

function _addattr (o, key, val) {
	if (!(key in o)) {
		o[key] = val
	} else {
		o[key] += val
	}
}

