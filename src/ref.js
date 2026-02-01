export function ref (value) {
	let obj = {
		value,
		getListeners: [],
		setListeners: [],
	}
	let proxy = new Proxy(obj, {
		get (target, prop) {
			for (let fn of target.getListeners) {
				fn(target[prop])
			}
			return target[prop]
		},
		set (target, prop, val) {
			let old = target[prop]
			target[prop] = val
			for (let fn of target.setListeners) {
				fn(old, val)
			}
			return true
		},
	})
	obj.call = (funcname, ...args) => {
		obj.value[funcname](...args)
		for (let fn of obj.setListeners) {
			fn(obj.value, obj.value)
		}
	}
	obj.onGet = fn => {
		obj.getListeners.push(fn)
	}
	obj.onSet = fn => {
		obj.setListeners.push(fn)
	}
	obj.removeGetListener = fn => {
		obj.getListeners = obj.getListeners.filter(func => func !== fn)
	}
	obj.removeSetListener = fn => {
		obj.setListeners = obj.setListeners.filter(func => func !== fn)
	}
	return proxy
}

