export class Ref {
	constructor (value) {
		this.value = value
		this.getListeners = []
		this.setListeners = []

		return new Proxy(this, {
			get (target, prop, receiver) {
				const value = Reflect.get(target, prop, receiver)

				for (let fn of target.getListeners) {
					fn(value)
				}

				return value
			},
			set (target, prop, val, receiver) {
				let old = Reflect.get(target, prop, receiver)
				const result = Reflect.set(target, prop, val, receiver)

				for (let fn of target.setListeners) {
					fn(old, val)
				}

				return result
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

