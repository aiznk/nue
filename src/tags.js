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

