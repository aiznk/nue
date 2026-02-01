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

