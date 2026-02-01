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

