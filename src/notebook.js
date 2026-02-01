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
