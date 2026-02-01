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

