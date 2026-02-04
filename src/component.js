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
		return this
	}

	insertTextToCaretPos(text) {
		const start = this.elem.selectionStart;
		const end = this.elem.selectionEnd;
		const value = this.elem.value;
		this.elem.value = value.slice(0, start) + text + value.slice(end);
		this.elem.selectionStart = this.elem.selectionEnd = start + text.length;
		this.elem.focus();
		return this
	}

	scrollToBottom ({ caret=null }={}) {
		this.elem.scrollTop = this.elem.scrollHeight

		switch (caret) {
		case 'focusBottom':
			this.elem.focus()
			this.elem.setSelectionRange(this.elem.value.length, this.elem.value.length)
			break
		}
		
		return this
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
		return this
	}

	setClass (val) {
		this.elem.setAttribute('class', val)
		return this
	}

	removeClass (val) {
		let cls = this.elem.className.split(' ')
		cls = cls.filter(el => el !== val)
		this.elem.className = cls.join(' ')
		return this
	}

	addClass (val) {
		let cls = this.elem.className.split(' ')
		if (!cls.includes(val)) {
			cls.push(val)
		}
		this.elem.className = cls.join(' ')
		return this
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
		return this
	}

	getValue () {
		return this.elem.value
	}

	getHTML () {
		return this.elem.innerHTML
	}

	setHTML (html) {
		this.elem.innerHTML = html
		return this
	}

	setValue (value) {
		this.elem.value = value
		return this
	}

	unshift (child) {
		child.parent = this
		this.children.unshift(child)
		this.elem.prepend(child.elem)
		return this
	}

	has (child) {
		for (let n of this.elem.childNodes) {
			if (n === child.elem) {
				return true
			}
		}
		return false
	}

	add (child) {
		if (this.has(child)) {
			return
		}
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

