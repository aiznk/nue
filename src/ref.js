export class Ref {
	constructor (value) {
		this.value = value
		this.getListeners = []
		this.setListeners = []
		this.proxy = new Proxy(this, {
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
	}

	call (funcname, ...args) {
		this.value[funcname](...args)
		for (let fn of this.setListeners) {
			fn(this.value, this.value)
		}
	}

	onGet (fn) {
		this.getListeners.push(fn)
	}

	onSet (fn) {
		this.setListeners.push(fn)
	}

	removeGetListener (fn) {
		this.getListeners = this.getListeners.filter(func => func !== fn)
	}

	removeSetListener (fn) {
		this.setListeners = this.setListeners.filter(func => func !== fn)
	}
}

export function ref (value) {
	return new Ref(value)
}

