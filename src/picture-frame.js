export class PictureFrameImage extends Img {
	constructor () {
		super({
			class: 'nue_picture-frame__image',
		}, {
			events: ['click'],
		})
	}

	onClick (ev) {
		ev.src = this.getAttr('src') || null
		ev.image = this
		this.emit('pictureFrameImageClicked', ev)
	}
}

export class PictureFrame extends Div {
	constructor (attrs={}, opts={}) {
		if (attrs.class) {
			attrs.class += ' nue_picture-frame'
		} else {
			attrs.class = 'nue_picture-frame'
		}
		super(attrs, opts)

		this.image = new PictureFrameImage()
		this.add(this.image)

		this.title = new P({
			class: 'nue_picture-frame__title',
		})
		this.add(this.title)
	}

	setImage (src) {
		this.image.setAttr('src', src)
	}

	setTitle (title) {
		this.title.setText(title)
	}
}
