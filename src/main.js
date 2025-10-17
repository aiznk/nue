/**
 * Nue v0.1.0
 * License: MIT
 */

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

export class Component {
	constructor (name, attrs={}) {
		this.name = name
		this.attrs = attrs
		this.parent = attrs.parent || null
		this.children = []
		this.elem = document.createElement(name)
		this.setElementAttrs(attrs)
		this.bindEvents()
	}

	gen (cname, ...args) {
		let c

		switch (cname.toLowerCase()) {
		default: throw new Error(`invalid component name "${cname}"`)
		case 'span': c = new Span(...args); break
		case 'div': c = new Div(...args); break
		case 'button': c = new Button(...args); break
		case 'textarea': c = new Textarea(...args); break
		case 'section': c = new Section(...args); break
		case 'label': c = new Label(...args); break
		case 'p': c = new P(...args); break
		}

		this.add(c)

		return c
	}

	removeEvent (name, fn) {
		this.elem.removeEventListener(name, fn)
	}

	bindEvent (name, fn) {
		this.elem.addEventListener(name, fn)
	}

	bindEvents () {
		this.bindEvent('input', ev => { this.onInput(ev) })
		this.bindEvent('keyup', ev => { this.onKeyup(ev) })
		this.bindEvent('keydown', ev => { this.onKeydown(ev) })
		this.bindEvent('click', ev => { this.onClick(ev) })
		this.bindEvent('dblclick', ev => { this.onDblClick(ev) })
		this.bindEvent('change', ev => { this.onChange(ev) })
		this.bindEvent('mousedown', ev => { this.onMouseDown(ev) })
		this.bindEvent('mouseup', ev => { this.onMouseUp(ev) })
		this.bindEvent('mouseenter', ev => { this.onMouseEnter(ev) })
		this.bindEvent('contextmenu', ev => { this.onContextMenu(ev) })
	}

	onInput (ev) {}
	onKeyup (ev) {}
	onKeydown (ev) {}
	onClick (ev) {}
	onDblClick (ev) {}
	onChange (ev) {}
	onMouseDown (ev) {}
	onMouseUp (ev) {}
	onMouseEnter (ev) {}
	onContextMenu (ev) {}

	emit (name, value) {
		if (this.parent) {
			this.parent.receive(name, value)
		}
		return this
	}

	receive (name, value) {
		if (this.parent) {
			this.parent.receive(name, value)
		}
		return this
	}

	setElementAttrs (attrs) {
		for (let key in attrs) {
			this.setAttr(key, attrs[key])
		}
		return this
	}

	convAttrKey (key) {
		return key
	}

	removeAttr (key) {
		key = this.convAttrKey(key)
		this.elem.removeAttribute(key)
		return this
	}

	setAttr (key, val) {
		key = this.convAttrKey(key)
		this.elem.setAttribute(key, val)
		return this
	}

	parseStyle () {
		let css = {}
		let style = this.elem.getAttribute('style') || ''
		let lines = style.split(';')
		for (let line of lines) {
			let [key, val] = line.split(':')
			if (!key) {
				continue
			}
			key = key.trim()
			if (val) {
				val = val.trim()
			}
			css[key] = val
		}
		return css		
	}

	show () {
		let css = this.parseStyle()
		css['display'] = ''
		this.setCSS(css)
	}

	hide () {
		let css = this.parseStyle()
		css['display'] = 'none'
		this.setCSS(css)		
	}

	setCSS (css /* Object */) {
		let style = ''
		for (let key in css) {
			style += `${key}: ${css[key]};`
		}
		this.setStyle(style)
	}

	setStyle (val) {
		this.elem.setAttribute('style', val)
	}

	setClass (val) {
		this.elem.setAttribute('class', val)
	}

	setText (text) {
		this.elem.textContent = text
		return this
	}

	setValue (value) {
		this.elem.value = value
		return this
	}

	add (child) {
		child.parent = this
		this.children.push(child)
		this.elem.appendChild(child.elem)
		return this
	}

	clear () {
		for (let child of this.children) {
			this.elem.removeChild(child.elem)
		}
		this.children = []
	}
}

export class Tag extends Component {
	constructor (name, attrs={}) {
		super(name, attrs)
	}
}

export class Ul extends Tag {
	constructor (attrs={}) {
		super('ul', attrs)
	}
}

export class Ol extends Tag {
	constructor (attrs={}) {
		super('ol', attrs)
	}
}

export class Li extends Tag {
	constructor (attrs={}) {
		super('li', attrs)
	}
}

export class Span extends Tag {
	constructor (attrs={}) {
		super('span', attrs)
	}
}

export class Div extends Tag {
	constructor (attrs={}) {
		super('div', attrs)
	}
}

export class Hr extends Tag {
	constructor (text, attrs={}) {
		super('hr', attrs)
	}
}

export class H1 extends Tag {
	constructor (text, attrs={}) {
		super('h1', attrs)
	}
}

export class H2 extends Tag {
	constructor (text, attrs={}) {
		super('h2', attrs)
	}
}

export class H3 extends Tag {
	constructor (text, attrs={}) {
		super('h3', attrs)
	}
}

export class H4 extends Tag {
	constructor (text, attrs={}) {
		super('h4', attrs)
	}
}

export class H5 extends Tag {
	constructor (text, attrs={}) {
		super('h5', attrs)
	}
}

export class H6 extends Tag {
	constructor (text, attrs={}) {
		super('h6', attrs)
	}
}

export class Label extends Tag {
	constructor (text, attrs={}) {
		super('label', attrs)
		this.setText(text)
	}
}

export class Input extends Tag {
	constructor (attrs={}) {
		super('input', attrs)
	}
}

export class Textarea extends Tag {
	constructor (attrs={}) {
		super('textarea', attrs)
	}
}

export class Select extends Tag {
	constructor (attrs={}) {
		super('select', attrs)
	}
}

export class Section extends Tag {
	constructor (attrs={}) {
		super('section', attrs)
	}
}

export class Option extends Tag {
	constructor (value, text, attrs={}) {
		super('option', attrs)
		this.setValue(value)
		this.setText(text)
	}
}

export class Button extends Tag {
	constructor (text, command=null, attrs={}) {
		super('button', attrs)
		this.setText(text)
		this.command = command
	}

	onClick (ev) {
		if (this.command) {
			this.command(ev)
		}
	}
}

export class Img extends Tag {
	constructor (attrs={}) {
		super('img', attrs)
	}
}

export class P extends Tag {
	constructor (attrs={}) {
		super('p', attrs)
	}
}

export class S extends Tag {
	constructor (attrs={}) {
		super('s', attrs)
	}
}

export class Code extends Tag {
	constructor (attrs={}) {
		super('code', attrs)
	}
}

export class Pre extends Tag {
	constructor (attrs={}) {
		super('pre', attrs)
	}
}

export class I extends Tag {
	constructor (attrs={}) {
		super('i', attrs)
	}
}

export class Strong extends Tag {
	constructor (attrs={}) {
		super('strong', attrs)
	}
}

export class Canvas extends Tag {
	constructor (attrs={}) {
		super('canvas', attrs)
	}
}

export class Root extends Component {
	constructor (name='div', attrs={}) {
		super(name, attrs)
		this.mountElem = null
	}

	mount (query) {
		this.mountElem = document.querySelector(query)
		this.mountElem.innerHTML = ''
		this.mountElem.appendChild(this.elem)
	}
}
