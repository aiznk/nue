export class Popup extends Div {
	constructor (attrs={}, opts={}) {
		if (attrs.class) {
			attrs.class += ' nue_popup'
		} else {
			attrs.class = 'nue_popup'
		}
		if (opts.events) {
			opts.events.push('click')
		} else {
			opts.events = ['click']
		}
		super(attrs, opts)
	}

	onClick (ev) {
		this.hide()
	}
}
