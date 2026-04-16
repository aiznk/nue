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
	constructor (attrs={}, opts={}) {
		if (!('class' in attrs)) {
			attrs['class'] = 'nue_notebook'
		}
		super(attrs, opts)
		this.curIndex = 0

		this.tabs = new Div({ class: 'nue_notebook__tabs' })
		this.add(this.tabs)

		this.body = new Div({ class: 'nue_notebook__body' })
		this.add(this.body)
	}

	clear () {
		this.tabs.clear()
		this.body.clear()
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
		default: 
			this.emit(ev, val)
			break
		case 'notebookTabClicked': {
			let index = this.countIndex(val)
			this.click(index)
		} break
		}
	}

	addTab (tab) {
		this.tabs.add(tab)
	}

	removeTab (tab) {
		if (typeof tab === 'number') {
			let index = tab
			tab = this.tabs.children[index]
		}

		this.tabs.remove(tab)
		tab.removeClass('nue_notebook-tab--activate')
		if (this.tabs.children.length) {
			this.click(0)
		} else {
			this.body.clear()
		}
	}

	moveTabTo (tab, index) {
		if (typeof tab === 'number') {
			if (tab < 0 || tab >= this.tabs.children.length) {
				throw new Error('index out of range')
			}
			tab = this.tabs.children[tab]
		}

		let children = this.tabs.children.filter(t => t !== tab)
		children.splice(index, 0, tab)

		this.tabs.clear()
		for (let child of children) {
			this.tabs.add(child)
		}
		this.click(tab)
	}

	click (index) {
		if (typeof index !== 'number') {
			let i = 0
			for (let t of this.tabs.children) {
				if (t === index) {
					index = i
					break
				}
				i++
			}
		}

		if (index < 0 || index >= this.tabs.children.length) {
			throw new Error('index out of range')
		}

		let tab = this.tabs.children[index]

		if (this.curIndex >= 0 && this.curIndex < this.tabs.children.length) {
			let oldTab = this.tabs.children[this.curIndex]
			oldTab.removeClass('nue_notebook-tab--activate')
		}

		this.body.clear()
		this.body.add(tab.component)
		tab.addClass('nue_notebook-tab--activate')
		this.curIndex = index
	}
}
