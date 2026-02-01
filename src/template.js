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

