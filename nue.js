
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

class Vector2i {
	constructor (x=0, y=0) {
		this.x = x
		this.y = y
	}
}
export class EventData {
	constructor () {
		this.x = 0
		this.y = 0
		this.text = null
	}
}

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
					this.index++
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

		if (tag.type === 'begin') {
			let compo
			if (this.hasComponent(tag.name)) {
				compo = this.getComponent(tag.name)
			} else {
				compo = new Tag(tag.name, tag.attrs)
			}
			compo.parent = parent
			parent = compo
			let childs = []
			this.tree({ 
				begin: tag,
				parent,
				children: childs,
				dep: dep+1,
			})
			for (let child of childs) {
				compo.add(child)
			}
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
			compo.setText(tag.text)
			children.push(compo)
		}

		this.tree({ begin, parent, children, dep:dep+1 })
	}
}

export class Component {
	constructor (name, attrs={}, opts={}) {
		this.name = name
		this.attrs = Object.assign({}, attrs)
		this.opts = Object.assign({}, opts)
		this.parent = attrs.parent || null
		this.children = []
		this.mountElem = null
		if (name === 'text') {
			this.elem = document.createTextNode('')
		} else {
			this.elem = document.createElement(name)
		}
		this._setElementAttrs(attrs)
		this._bindEvents()
	}

	mount (query) {
		this.mountElem = document.querySelector(query)
		this.mountElem.innerHTML = ''
		this.mountElem.appendChild(this.elem)
	}

	insertTextToCaretPos(text) {
		const start = this.elem.selectionStart;
		const end = this.elem.selectionEnd;
		const value = this.elem.value;
		this.elem.value = value.slice(0, start) + text + value.slice(end);
		this.elem.selectionStart = this.elem.selectionEnd = start + text.length;
		this.elem.focus();
	}

	scrollToBottom ({ caret=null }={}) {
		this.elem.scrollTop = this.elem.scrollHeight

		switch (caret) {
		case 'focusBottom':
			this.elem.focus()
			this.elem.setSelectionRange(this.elem.value.length, this.elem.value.length)
			break
		}
	}

	len () {
		return this.children.length
	}

	setChildren (items) {
		this.clear()
		for (let item of items) {
			this.add(item)
		}
	}

	template (code, {
		components={}
	}={}) {
		let tmpl = new Template()
		tmpl.parse(code, {
			components,
		})
		this.clear()
		for (let child of tmpl.root.children) {
			this.add(child)
		}
		return this
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
		return this
	}

	bindEvent (name, fn) {
		this.elem.addEventListener(name, fn)
		return this
	}

	_bindEvents () {
		const map = {
			'input': this.onInput.bind(this),
			'keyup': this.onKeyup.bind(this),
			'keydown': this.onKeydown.bind(this),
			'click': this.onClick.bind(this),
			'dblclick': this.onDblClick.bind(this),
			'change': this.onChange.bind(this),
			'mousedown': this.onMouseDown.bind(this),
			'mouseup': this.onMouseUp.bind(this),
			'mousemove': this.onMouseMove.bind(this),
			'mouseenter': this.onMouseEnter.bind(this),
			'mouseleave': this.onMouseLeave.bind(this),
			'contextmenu': this.onContextMenu.bind(this),
			'pointermove': this.onPointerMove.bind(this),
			'pointerdown': this.onPointerDown.bind(this),
			'pointerup': this.onPointerUp.bind(this),
			'pointercancel': this.onPointerCancel.bind(this),
			'wheel': this.onWheel.bind(this),
			'scroll': this.onScroll.bind(this),
		}
		const events = _oget(this.opts, 'events', null)
		if (events == null) {
			for (let key in map) {
				this.elem.addEventListener(key, map[key])
			}			
		} else if (Array.isArray(events)) {
			for (let key in map) {
				if (events.includes(key)) {
					this.elem.addEventListener(key, map[key])
				}
			}
		}

		return this
	}

	async onScroll (ev) {}
	async onWheel (ev) {}
	async onPointerMove (ev) {}
	async onPointerDown (ev) {}
	async onPointerUp (ev) {}
	async onPointerCancel (ev) {}
	async onInput (ev) {}
	async onKeyup (ev) {}
	async onKeydown (ev) {}
	async onClick (ev) {}
	async onDblClick (ev) {}
	async onChange (ev) {}
	async onMouseDown (ev) {}
	async onMouseUp (ev) {}
	async onMouseMove (ev) {}
	async onMouseEnter (ev) {}
	async onMouseLeave (ev) {}
	async onContextMenu (ev) {}

	async emit (name, value) {
		if (this.parent) {
			await this.parent.receive(name, value)
		}
		return this
	}

	async receive (name, value) {
		if (this.parent) {
			await this.parent.receive(name, value)
		}
		return this
	}

	_setElementAttrs (attrs) {
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

	getAttr (key, defval=null) {
		return this.elem.getAttribute(key) || defval
	}
	
	setAttr (key, val) {
		// console.log(`key[${key}] val[${val}]`)
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
		return this
	}

	hide () {
		let css = this.parseStyle()
		css['display'] = 'none'
		this.setCSS(css)		
		return this
	}

	setCSS (css /* Object */) {
		let style = ''
		for (let key in css) {
			style += `${key}: ${css[key]};`
		}
		this.setStyle(style)
		return this
	}

	setStyle (val) {
		this.elem.setAttribute('style', val)
	}

	setClass (val) {
		this.elem.setAttribute('class', val)
	}

	removeClass (val) {
		let cls = this.elem.className.split(' ')
		cls = cls.filter(el => el !== val)
		this.elem.className = cls.join(' ')
	}

	addClass (val) {
		let cls = this.elem.className.split(' ')
		if (!cls.includes(val)) {
			cls.push(val)
		}
		this.elem.className = cls.join(' ')
	}

	getText () {
		return this.elem.textContent
	}

	setText (text) {
		// set textContent and *clear child nodes*
		this.elem.textContent = text
		return this
	}

	addText (text) {
		this.elem.textContent += text
	}

	getValue () {
		return this.elem.value
	}

	getHTML () {
		return this.elem.innerHTML
	}

	setHTML (html) {
		this.elem.innerHTML = html
	}

	setValue (value) {
		this.elem.value = value
		return this
	}

	unshift (child) {
		child.parent = this
		this.children.unshift(child)
		this.elem.prepend(child.elem)
	}

	add (child) {
		child.parent = this
		this.children.push(child)
		this.elem.appendChild(child.elem)
		return this
	}

	remove (child) {
		this.children = this.children.filter(c => c != child)
		this.elem.removeChild(child.elem)
		return this
	}

	clear () {
		for (let child of this.children) {
			this.elem.removeChild(child.elem)
		}
		this.children = []
		return this
	}
}

export class Tag extends Component {
	constructor (name, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super(name, attrs, opts)
	}
}

export class Ul extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('ul', attrs, opts)
	}
}

export class Ol extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('ol', attrs, opts)
	}
}

export class Li extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', ['click'])
		super('li', attrs, opts)
	}
}

export class Span extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('span', attrs, opts)
	}
}

export class Div extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('div', attrs, opts)
	}
}

export class Hr extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('hr', attrs, opts)
	}
}

export class H1 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h1', attrs, opts)
		this.setText(text)
	}
}

export class H2 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h2', attrs, opts)
		this.setText(text)
	}
}

export class H3 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h3', attrs, opts)
		this.setText(text)
	}
}

export class H4 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h4', attrs, opts)
		this.setText(text)
	}
}

export class H5 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h5', attrs, opts)
		this.setText(text)
	}
}

export class H6 extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('h6', attrs, opts)
		this.setText(text)
	}
}

export class Label extends Tag {
	constructor (text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('label', attrs, opts)
		this.setText(text)
	}
}

export class Input extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', ['input', 'keydown', 'keyup'])
		super('input', attrs, opts)
	}
}

export class Textarea extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', ['input', 'keydown', 'keyup', 'scroll'])
		super('textarea', attrs, opts)
	}
}

export class Select extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', ['change'])
		super('select', attrs, opts)
	}
}

export class Section extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('section', attrs, opts)
	}
}

export class Option extends Tag {
	constructor (value, text, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('option', attrs, opts)
		this.setValue(value)
		this.setText(text)
	}
}

export class Button extends Tag {
	constructor (text, command=null, attrs={}, opts={}) {
		opts = _setopts(opts, 'events', ['click'])
		super('button', attrs, opts)
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
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('img', attrs, opts)
	}
}

export class P extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('p', attrs, opts)
	}
}

export class S extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('s', attrs, opts)
	}
}

export class Code extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('code', attrs, opts)
	}
}

export class Pre extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('pre', attrs, opts)
	}
}

export class I extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('i', attrs, opts)
	}
}

export class Strong extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('strong', attrs, opts)
	}
}

export class Canvas extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('canvas', attrs, opts)
	}

	getContext (name) {
		return this.elem.getContext(name)
	}
}

export class Table extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('table', attrs, opts)
	}
}

export class THead extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('thead', attrs, opts)
	}
}

export class TBody extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('tbody', attrs, opts)
	}
}

export class Tr extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('tr', attrs, opts)
	}
}

export class Td extends Tag {
	constructor (attrs={}, opts={}) {
		opts = _setopts(opts, 'events', [])
		super('td', attrs, opts)
	}
}

export class Colgroup extends Tag {
	constructor (attrs={}, opts={}) {
		super('colgroup', attrs, opts)
	}
}

export class Col extends Tag {
	constructor (attrs={}, opts={}) {
		super('col', attrs, opts)
	}
}

export class Root extends Component {
	constructor (name='div', attrs={}, opts={}) {
		super(name, attrs)
	}
}

export class HonestEntry extends Textarea {
	constructor (attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_honest-entry')
	}

	onKeydown (ev) {
		this.emit('honestInputKeydown', ev)
	}

	insertNewline (ev) {
		const start = this.elem.selectionStart
		const end = this.elem.selectionEnd
		this.elem.value =
			this.elem.value.substring(0, start) + '\n' +
			this.elem.value.substring(end)

		this.elem.selectionStart = this.elem.selectionEnd = start + 1
	}
}

export class HonestTableCell extends Td {
	constructor (attrs={}, opts={}) {
		attrs['tabindex'] = 0
		_setopts(opts, 'events', ['click', 'dblclick', 'keydown'])
		super(attrs, opts)
		this.addClass('nue_honest-table-cell')
		this.mode = 'normal'
		this.entry = null
		this.oldContent = ''
		this.pos = new Vector2i()
	}

	async receive (name, ev) {
		switch (name) {
		case 'honestInputKeydown':
			if (ev.ctrlKey) {
				switch (ev.code) {
				case 'Enter':
					this.entry.insertNewline(ev)
					break
				}
			} else {
				switch (ev.code) {
				case 'Escape':
					this.toNormalMode({ undo: true })
					await this.emit('honestInputKeydown', ev)
					break
				case 'Enter': {
					this.toNormalMode()

					let data = new EventData()
					data.x = this.pos.x
					data.y = this.pos.y
					data.text = this.getText()
					ev.nue = data
					await this.emit('honestTableCellSetValue', ev)
				} break
				}
			}
			break
		}
	}

	async onKeydown (ev) {
		if (ev.ctrlKey) {
			switch (ev.key) {
			case 'c':
				await this.emit('honestTableCopyCellText', this.getText())
				break
			}
		}
	}

	async onClick (ev) {
		ev.cell = this
		await this.emit('honestTableCellClick', ev)
	}

	async onDblClick (ev) {
		ev.cell = this
		await this.emit('honestTableCellDblClick', ev)
	}

	toNormalMode ({
		undo=false,
	}={}) {
		this.mode = 'normal'
		if (this.entry) {
			this.clear()
			if (undo) {
				this.setText(this.oldContent)
			} else {
				let value = this.entry.getValue()
				this.setText(value)
			}
			this.entry = null
		}
	}

	toEditMode () {
		this.mode = 'edit'
		if (this.entry) {
			this.toNormalMode()
		}
		this.oldContent = this.getText()
		this.setText('')
		this.entry = new HonestEntry()
		this.entry.setValue(this.oldContent)
		this.add(this.entry)
		this.entry.elem.focus()
	}
}

class HonestHeadCellBar extends Span {
	constructor (cell) {
		super({
			class: 'nue_honest-head-cell-bar',
		}, {
			events: ['mousedown', 'mouseup', 'mousemove'],
		})
		this.cell = cell
	}

	async onMouseDown (ev) {
		ev.bar = this
		await this.emit('honestHeadCellBarMouseDown', ev)
	}

	async onMouseUp (ev) {
		ev.bar = this
		await this.emit('honestHeadCellBarMouseUp', ev)
	}

	async onMouseMove (ev) {
		ev.bar = this
		await this.emit('honestHeadCellBarMouseMove', ev)
	}
}

export class HonestTableHeadCell extends Td {
	constructor (index, attrs={}, opts={}) {
		super(attrs, opts)
		this.index = index
		
		this.box = new Div({
			class: 'nue_honest-head-cell_box',
		})
		this.add(this.box)

		this.data = new Span({
			class: 'nue_honest-head-cell_data',
		})
		this.box.add(this.data)

		this.bar = new HonestHeadCellBar(this)
		if (index) {
			this.bar.addClass('nue_honest-head-cell-bar--grabbable')
		}
		this.box.add(this.bar)
	}

	setText (text) {
		this.data.setText(text)
	}
}

class HonestRowCellBar extends Div {
	constructor (cell) {
		super({
			class: 'nue_honest-row-cell-bar nue_honest-row-cell-bar--grabbable',
		}, {
			events: ['mousedown', 'mouseup', 'mousemove'],
		})
		this.cell = cell
	}

	async onMouseDown (ev) {
		ev.bar = this
		await this.emit('honestRowCellBarMouseDown', ev)
	}

	async onMouseUp (ev) {
		ev.bar = this
		await this.emit('honestRowCellBarMouseUp', ev)
	}

	async onMouseMove (ev) {
		ev.bar = this
		await this.emit('honestRowCellBarMouseMove', ev)
	}
}

export class HonestTableRowGrabCell extends Td {
	constructor (index, attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_honest-table-row-grab-cell')
		
		this.index = index

		this.box = new Div({
			class: 'nue_honest-table-row-grab-cell_box',
		})
		this.add(this.box)

		this.data = new Div({
			class: 'nue_honest-table-row-grab-cell_data',
		})
		this.box.add(this.data)

		this.bar = new HonestRowCellBar(this)
		this.box.add(this.bar)
	}

	setText (text) {
		this.data.setText(text)
	}
}

export class HonestTableRow extends Tr {
	constructor (attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_honest-table-row')
		this.pos = new Vector2i()
	}
}

export class HonestTable extends Table {
	constructor (attrs={}, opts={}) {
		_setopts(opts, 'events', ['mouseleave', 'mousemove', 'mouseup'])
		attrs = Object.assign(attrs, {
			class: 'nue_honest-table',
		})
		super(attrs, opts)
		this.matrix = []	
		this.colgroup = new Colgroup()
		this.add(this.colgroup)
		this.thead = new THead()
		this.add(this.thead)
		this.tbody = new TBody()
		this.add(this.tbody)
		this.editingCell = null
		this.selectCell = null
		this.grabCol = null
		this.isGrabCol = false
	}

	onMouseLeave (ev) {
		this.isGrabCol = false
		this.isGrabRow = false
	}

	onMouseUp (ev) {
		this.grabCol = null
		this.isGrabCol = false	
		this.grabRow = null
		this.isGrabRow = false
	}

	onMouseMove (ev) {
		if (this.isGrabCol) {
			let r = this.grabCol.elem.getBoundingClientRect()
			let s = this.grabCol.parseStyle()
			let w = r.width
			w += ev.movementX
			w = Math.max(0, w)
			this.grabCol.setCSS({ width: w + 'px' })
		} else if (this.isGrabRow) {
			let r = this.grabRow.elem.getBoundingClientRect()
			let s = this.grabRow.parseStyle()
			let m = /(.+)px/.exec(s['height'])
			let h = r.height
			h += ev.movementY
			h = Math.max(0, h)
			this.grabRow.setCSS({ height: h + 'px' })
		}
	}

	genHeadRow (n) {
		let row = new HonestTableRow()
		row.add(new HonestTableHeadCell(0))

		for (let i = 0; i < n; i++) {
			i %= 26
			let c = String.fromCharCode(65+i)
			let cell = new HonestTableHeadCell(i+1)
			cell.setText(c)
			row.add(cell)
		}
		return row
	}

	addRow (row) {
		let hrow = this.genHeadRow(row.len())
		this.thead.clear()
		this.thead.add(hrow)

		this.colgroup.clear()
		for (let i = 0; i < hrow.len(); i++) {
			this.colgroup.add(new Col())
		}

		let r = []
		let h = this.matrix.length

		for (let x = 0; x < row.children.length; x++) {
			let cell = row.children[x]
			cell.pos.x = x
			cell.pos.y = h
			cell.addClass(`nue_honest-table-cell_pos-x-${x}`)
			cell.addClass(`nue_honest-table-cell_pos-y-${h}`)
			r.push(cell)
		}
		this.matrix.push(r)

		let rcell = new HonestTableRowGrabCell(h)
		rcell.setText(h+1)
		row.unshift(rcell)
		row.pos.y = h
		row.addClass(`nue_honest-table-row_pos-y-${h}`)
		this.tbody.add(row)
	}

	async receive (name, ev) {
		// console.log(name, ev)
		switch (name) {
		default:
			await this.emit(name, ev)
			break
		case 'honestTableCopyCellText': {
			if (navigator && navigator.clipboard) {
				navigator.clipboard.writeText(ev)
			}
		} break
		case 'honestHeadCellBarMouseDown': {
			let cell = ev.bar.cell
			let x = cell.index
			let col = this.colgroup.children[x]
			this.grabCol = col
			this.isGrabCol = true
		} break
		case 'honestRowCellBarMouseDown': {
			let y = ev.bar.cell.index	
			let row = this.tbody.children[y]
			this.grabRow = row
			this.isGrabRow = true
		} break
		case 'honestTableCellClick':
			if (this.selectCell) {
				this.selectCell.removeClass('nue_honest-table-cell--select')
				this.selectCell.toNormalMode()
			}
			this.selectCell = ev.cell
			this.selectCell.addClass('nue_honest-table-cell--select')
			break
		case 'honestTableCellDblClick':
			if (this.editingCell) {
				this.editingCell.toNormalMode()
			}
			this.editingCell = ev.cell
			this.editingCell.toEditMode()
			break
		}
	}
}

export class Divid extends Div {
	constructor (mode, c1, c2) {
		super({}, { events: ['mousedown'] })

		if (mode === 'horizontal') {
			this.setClass('nue_paned-frame_divid nue_paned-frame_divid--horizontal')
		} else {
			this.setClass('nue_paned-frame_divid nue_paned-frame_divid--vertical')			
		}
		this.cs = [c1, c2]
	}

	onMouseDown (ev) {
		ev.cs = this.cs
		this.emit('mouseDown', ev)
	}
}

export class PanedFrame extends Div {
	constructor (mode='horizontal', attrs={}, opts={}) {
		if ('class' in attrs) {
			attrs['class'] += ` nue_paned-frame nue_paned-frame--${mode}`
		} else {
			attrs['class'] = ` nue_paned-frame nue_paned-frame--${mode}`
		}
		opts = _setopts(opts, 'events', ['mousemove', 'mouseup'])
		super(attrs, opts)
		this.mode = mode
		this.isDragging = false
		this.cs = [] // components
		this.dragX = 0
		this.dragY = 0
		this.startWidth = [0, 0]
		this.startHeight = [0, 0]
		this.startX = 0
		this.startY = 0
	}

	// 0   1   2   3   4
	// c | d | c | d | c
	// 0 -> 0
	// 1 -> 2
	// 2 -> 4
	setWidth (index, w) {
		index *= 2
		let s = this.children[index].parseStyle()
		s['width'] = w
		this.children[index].setCSS(s)
	}

	setHeight (index, h) {
		index *= 2
		let s = this.children[index].parseStyle()
		s['height'] = h
		this.children[index].setCSS(s)
	}

	add (c) {
		if (this.children.length >= 1) {
			let c1 = this.children[this.children.length-1]
			let c2 = c
			super.add(new Divid(this.mode, c1, c2))
		}
		super.add(c)
	}

	_fixY (ev, i, d) {
		let c = this.cs[i]
		let s = c.parseStyle()
		const dy = ev.clientY - this.startY
		let newHeight = this.startHeight[i] + (dy*d)

		let m = /([0-9\.]+)(px|\%)/.exec(s['height'])
		if (m) {
			let n = parseFloat(m[1])
			let suf = m[2]

			if (suf === 'px') {
				c.setCSS({ height: newHeight + 'px' })
			} else if (suf === '%') {
				const parentHeight = c.parent.elem.getBoundingClientRect().height
				n = (newHeight / parentHeight * 100)
				c.setCSS({
					height: n + suf,
				})					
			}
		}

	}

	_fixX (ev, i, d) {
		let c = this.cs[i]
		let s = c.parseStyle()
		const dx = ev.clientX - this.startX
		let newWidth = this.startWidth[i] + (dx*d)

		let m = /([0-9\.]+)(px|\%)/.exec(s['width'])
		if (m) {
			let n = parseFloat(m[1])
			let suf = m[2]

			if (suf === 'px') {
				c.setCSS({ width: newWidth + 'px' })
			} else if (suf === '%') {
				const parentHeight = c.parent.elem.getBoundingClientRect().width
				n = (newWidth / parentHeight * 100)
				c.setCSS({
					width: n + suf,
				})					
			}
		}

	}

	onMouseMove (ev) {
		if (!this.isDragging) {
			return
		}

		let s1 = this.cs[0].parseStyle()
		let s2 = this.cs[1].parseStyle()
		let w, h

		switch (this.mode) {
		case 'horizontal':
			this._fixX(ev, 0, 1)
			this._fixX(ev, 1, -1)
			break
		case 'vertical':
			this._fixY(ev, 0, 1)
			this._fixY(ev, 1, -1)
			break
		}

		this.emit('dragPanedFrame', ev)
	}

	onMouseUp (ev) {
		this.isDragging = false
	}

	receive (name, ev) {
		switch (name) {
		default: this.emit(name, ev); break
		case 'mouseDown': 
			this.isDragging = true
			this.cs = ev.cs
			this.startX = ev.clientX
			this.startY = ev.clientY
			this.startWidth[0] = this.cs[0].elem.getBoundingClientRect().width
			this.startWidth[1] = this.cs[1].elem.getBoundingClientRect().width
			this.startHeight[0] = this.cs[0].elem.getBoundingClientRect().height
			this.startHeight[1] = this.cs[1].elem.getBoundingClientRect().height
			break
		}
	}
}

class FilterEntryInput extends Input {
	constructor (attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_filter-entry-input')
	}

	onKeydown (ev) {
		if (ev.code === 'Enter') {
			this.emit('filterEntryExec', ev)
		}
	}
}

export class FilterEntry extends Div {
	constructor ({
		options=[
			['AND', 'AND'],
			['OR', 'OR'],
			['NOT', 'NOT'],
		],
		undoBtnText='Undo',
	}={}, attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_filter-entry')

		this.select = new Select()
		this.add(this.select)

		for (let row of options) {
			this.select.add(new Option(row[0], row[1]))
		}

		this.input = new FilterEntryInput()
		this.add(this.input)

		this.undoBtn = new Button(undoBtnText, async function (ev) {
			await this.emit('filterEntryUndo', ev)
		})
		this.add(this.undoBtn)
	}

	async receive (name, ev) {
		switch (name) {
		case 'filterEntryExec':
			ev.selectValue = this.select.getValue()
			ev.inputValue = this.input.getValue()
			await this.emit(name, ev)
			break
		case 'filterEntryUndo':
			await this.emit(name, ev)
			break
		}
	}
}

export class FilterListItem extends Li {
	constructor (index, text, attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_filter-list-item')
		this.text = text
		this.index = index
		this.setText(text)
	}
}

export class FilterList extends Ul {
	constructor (attrs={}, opts={}) {
		super(attrs, opts)
		this.addClass('nue_filter-list')
		this.saveItems = []
	}

	saveState () {
		this.saveItems = Object.assign([], this.children)
	}

	undo () {
		this.setChildren(this.saveItems)
	}

	filter (selectValue, filterValue) {
		switch (selectValue) {
		case 'AND': this.filterAnd(filterValue); break
		case 'OR': this.filterOr(filterValue); break
		case 'NOT': this.filterNot(filterValue); break
		}
	}

	filterAnd (val) {
		let toks = val.replace('　', ' ').split(' ')
		let match = []

		for (let item of this.saveItems) {
			let text = item.getText()
			let n = 0
			for (let tok of toks) {
				if (text.includes(tok)) {
					n++
				}
			}
			if (n === toks.length) {
				match.push(item)
			}
		}

		this.setChildren(match)
	}

	filterOr (val) {
		let toks = val.replace('　', ' ').split(' ')
		let match = []

		for (let item of this.saveItems) {
			let text = item.getText()
			let n = 0
			for (let tok of toks) {
				if (text.includes(tok)) {
					n++
					break
				}
			}
			if (n) {
				match.push(item)
			}
		}

		this.setChildren(match)
	}

	filterNot (val) {
		let toks = val.replace('　', ' ').split(' ')
		let match = []

		for (let item of this.saveItems) {
			let text = item.getText()
			let n = 0
			for (let tok of toks) {
				if (text.includes(tok)) {
					n++
					break
				}
			}
			if (!n) {
				match.push(item)
			}
		}

		this.setChildren(match)
	}
}

export class NotebookTab extends Span {
	constructor (text, component) {
		super({ 
			class: 'nue_notebook-tab',
		}, {
			events: ['click'],
		})
		this.setText(text)
		this.component = component
	}

	onClick (ev) {
		this.emit('notebookTabClicked', this)
	}
}

export class Notebook extends Div {
	constructor () {
		super({ class: 'nue_notebook' })
		this.curIndex = 0

		this.tabs = new Div({ class: 'nue_notebook_tabs' })
		this.add(this.tabs)

		this.body = new Div({ class: 'nue_notebook_body' })
		this.add(this.body)
	}

	countIndex (tab) {
		let i = 0
		for (let t of this.tabs.children) {
			if (tab === t) {
				return i
			}
			i++
		}
		return -1
	}

	receive (ev, val) {
		switch (ev) {
		case 'notebookTabClicked': {
			let index = this.countIndex(val)
			this.click(index)
		} break
		}
	}

	addTab (tab) {
		this.tabs.add(tab)
	}

	click (index) {
		let tab = this.tabs.children[index]
		let oldTab = this.tabs.children[this.curIndex]
		oldTab.removeClass('nue_notebook-tab--activate')
		this.body.clear()
		this.body.add(tab.component)
		tab.addClass('nue_notebook-tab--activate')
		this.curIndex = index
	}
}
export function test () {
	let t

	t = new Template()
	t.parse('<div class="hoge"></div>')
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].attrs['class'] === 'hoge')

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
	let Hoge = new Tag('div')
	let Moge = new Tag('p')
	let Oge = new Tag('span')
	t.parse(`<div><Hoge>123</Hoge><Moge id="223" maxlength=323>423</Moge><Oge age=20 weight="60" /></div>`, {
		components: {
			Hoge, Moge, Oge,
		},
	})
	// console.log(t)
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].children.length === 3)
	console.assert(t.root.children[0].children[0].name === 'div')
	console.assert(t.root.children[0].children[1].name === 'p')
	console.assert(t.root.children[0].children[2].name === 'span')

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
