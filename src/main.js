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

class TemplateTag {
	constructor () {
		this.name = null
		this.attrs = {}
		this.type = 'begin'
		this.text = ''
		this.index = 0
		this.code = null
	}

	skipSpaces () {
		for (; this.index < this.code.length; this.index++) {
			let c = this.code[this.index]
			if (c === ' ' || c === '　') {
				// pass
			} else {
				break
			}
		}
	}

	parseName () {
		this.skipSpaces()
		this.name = ''

		if (this.code[this.index] === '/') {
			this.type = 'end'
			this.index++
		}

		for (; this.index < this.code.length; this.index++) {
			let c = this.code[this.index]
			// console.log(`name: [${c}]`)
			if (c === '>' || c === ' ') {
				break
			} else if (c === '/') {
				this.type = 'close'
			} else {
				this.name += c
			}
		}

		this.skipSpaces()
	}

	parseAttrKey () {
		this.skipSpaces()
		let key = ''
		for (; this.index < this.code.length; this.index++) {
			let c = this.code[this.index]
			// console.log(`key: [${c}]`)
			if (c === '/') {
				this.type = 'end'
			} else if (c === '>' || c === '=' ||
			           c === ' ' || c === '　') {
				break
			} else {
				key += c
			}
		}		
		this.skipSpaces()
		return key
	}

	parseAttrValue () {
		this.skipSpaces()
		let val = ''
		let m = 0
		if (this.code[this.index] === '"') {
			m = 10
			this.index++
		}
		for (; this.index < this.code.length; this.index++) {
			let c = this.code[this.index]
			// console.log(`value: [${c}]`)
			if (m === 0) {
				if (c === '/') {
					this.type = 'close'
				} else if (c === '"' || 
					c === ' ' || c === '　' || c === '>') {
					break
				} else {
					val += c
				}
			} else if (m === 10) {
				if (c === '"') {
					break
				} else {
					val += c
				}
			}
		}
		this.skipSpaces()
		return val
	}

	parse (i, code) {
		this.index = i
		this.code = code
		let m = 0

		// console.log(`parse enter: [${this.code[this.index]}]`)
		if (this.code[this.index] === '<') {
			m = 0 // tag
			this.index++
		} else {
			m = 10 // text content
		}

		if (m === 0) {
			this.parseName()
			// console.log('parseName', this.name)

			for (; this.index < this.code.length; ) {
				this.skipSpaces()
				let c = this.code[this.index]
				// console.log(`parse: [${c}]`)

				if (c === '>') {
					this.index++
					break
				} else if (c === '/') {
					this.type = 'close'
					this.index++
					continue
				}

				let key = this.parseAttrKey()
				this.skipSpaces()
				c = this.code[this.index]
				if (c === '>') {
					this.attrs[key] = null
					break
				} else if (c === '=') {
					this.index++
					let val = this.parseAttrValue()
					this.attrs[key] = val
				} else if (c === ' ' || c === '　') {
					this.attrs[key] = null
				}
			}
		} else {
			this.type = 'text'

			for (; this.index < this.code.length; this.index++) {
				let c = this.code[this.index]
				if (c === '<') {
					break
				} else {
					this.text += c
				}
			}
		}

		return this.index
	}
}

class Template {
	constructor () {
		this.tTags = []
		this.root = new Tag('TemplateRoot')
		this.components = {}
	}

	parse (code, {
		components={},
	}={}) {
		this.tTags = []
		this.components = components

		for (let i = 0; i < code.length; ) {
			let tag = new TemplateTag()
			i = tag.parse(i, code)
			this.tTags.push(tag)
		}

		// console.log(Object.assign([], this.tTags))
		this.tree({
			parent: this.root,
			children: this.root.children,
		})
	}

	hasComponent (name) {
		return name in this.components
	}

	getComponent (name) {
		return this.components[name]
	}

	tree ({
		begin=null,
		parent=null,
		children=[],
		dep=0,
	}={}) {
		if (!this.tTags.length) {
			return
		}

		let tag = this.tTags.shift()
		// console.log('tree:', dep, tag.name, tag.type)

		/*
			<div>
				<span>123</span>
				<p>
					<span>223</span>
				</p>
			</div>
		*/
		if (tag.type === 'begin') {
			let compo
			if (this.hasComponent(tag.name)) {
				compo = this.getComponent(tag.name)
			} else {
				compo = new Tag(tag.name, tag.attrs)
			}
			compo.parent = parent
			parent = compo
			this.tree({ 
				begin: tag,
				parent,
				children: compo.children,
				dep: dep+1,
			})
			children.push(compo)
		} else if (tag.type === 'end') {
			if (begin) {
				if (begin.name.toLowerCase() === tag.name.toLowerCase()) {
					return
				}
			}
		} else if (tag.type === 'close') {
			let compo
			if (this.hasComponent(tag.name)) {
				compo = this.getComponent(tag.name)
			} else {
				compo = new Tag(tag.name, tag.attrs)
			}
			compo.parent = parent
			parent = compo
			children.push(compo)			
		} else if (tag.type === 'text') {
			let compo = new Tag('text')
			compo.text = tag.text
			children.push(compo)
		}

		this.tree({ begin, parent, children, dep:dep+1 })
	}
}

export class Component {
	constructor (name, attrs={}) {
		this.name = name
		this.attrs = Object.assign({}, attrs)
		this.parent = attrs.parent || null
		this.children = []
		this.elem = document.createElement(name)
		this.setElementAttrs(attrs)
		this.bindEvents()
	}

	template (code) {
		let tmpl = new Template()
		tmpl.parse(code)
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

export function test () {
	let t

	t = new Template()
	t.parse('<div><span>123</span><p id="223" maxlength=323>423</p><img alt="hige" /></div>')
	// console.log(t)
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].children.length === 3)
	console.assert(t.root.children[0].children[0].name === 'span')
	console.assert(t.root.children[0].children[0].children.length === 1)
	console.assert(t.root.children[0].children[0].children[0].text === '123')
	console.assert(t.root.children[0].children[1].name === 'p')
	console.assert(t.root.children[0].children[1].attrs['id'] === '223')
	console.assert(t.root.children[0].children[1].attrs['maxlength'] === '323')
	console.assert(t.root.children[0].children[1].children.length === 1)
	console.assert(t.root.children[0].children[1].children[0].text === '423')
	console.assert(t.root.children[0].children[2].name === 'img')
	console.assert(t.root.children[0].children[2].attrs['alt'] === 'hige')

	t = new Template()
	let Hoge = new Tag('Hoge')
	let Moge = new Tag('Moge')
	let Oge = new Tag('Oge')
	t.parse(`<div><Hoge>123</Hoge><Moge id="223" maxlength=323>423</Moge><Oge age=20 weight="60" /></div>`, {
		components: {
			Hoge, Moge, Oge,
		},
	})
	// console.log(t)
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].children.length === 3)
	console.assert(t.root.children[0].children[0].name === 'Hoge')
	console.assert(t.root.children[0].children[1].name === 'Moge')
	console.assert(t.root.children[0].children[2].name === 'Oge')

	t = new Template()
	t.parse(`aaa<div>bbb<p>ccc</p>ddd</div>eee`)
	console.assert(t.root.children.length === 3)
	console.assert(t.root.children[0].name === 'text')
	console.assert(t.root.children[0].text === 'aaa')
	console.assert(t.root.children[1].name === 'div')
	console.assert(t.root.children[1].children.length === 3)
	console.assert(t.root.children[1].children[0].name === 'text')
	console.assert(t.root.children[1].children[0].text === 'bbb')
	console.assert(t.root.children[1].children[1].name === 'p')
	console.assert(t.root.children[1].children[1].children.length === 1)
	console.assert(t.root.children[1].children[1].children[0].name === 'text')
	console.assert(t.root.children[1].children[1].children[0].text === 'ccc')
	console.assert(t.root.children[1].children[2].name === 'text')
	console.assert(t.root.children[1].children[2].text === 'ddd')
	console.assert(t.root.children[2].name === 'text')
	console.assert(t.root.children[2].text === 'eee')

	console.log('OK')
}
