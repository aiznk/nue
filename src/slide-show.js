export class SlideThumb extends Span {
	constructor (url) {
		super({
			class: 'nue_slide-show__thumb',
		}, {
			events: ['click']
		})
		this.setCSS({
			'background-image': `url(${url})`,
		})
		this.url = url
	}

	async onClick (ev) {
		await this.emit('inactiveAllThumbs')
		this.addClass('nue_slide-show__thumb--active')
		await this.emit('slideShowClickThumb', this.url)
	}
}

export class SlideShow extends Div {
	constructor () {
		super({ class: 'nue_slide-show' })
		this.display = new Div({ class: 'nue_slide-show__display' })
		this.add(this.display)
		this.thumbs = new Div({ class: 'nue_slide-show__thumbs' })
		this.add(this.thumbs)
		this.index = 0
	}

	async receive (key, val) {
		switch (key) {
		case 'slideShowClickThumb':
			this.showImage(val)
			break
		case 'inactiveAllThumbs':
			this.inactiveAllThumbs()
			break
		}
	}

	inactiveAllThumbs () {
		for (let thumb of this.thumbs.children) {
			thumb.removeClass('nue_slide-show__thumb--active')
		}
	}

	setWidth (width) {
		this.setCSS({
			'width': width + 'px',
		})
	}

	showImage (obj) {
		if (typeof obj !== 'string') {
			obj = obj.src
		}
		this.display.setCSS({
			'background-image': `url(${obj})`,
		})
	}

	click (index) {
		if (index < 0 || index >= this.thumbs.children.length) {
			throw new Error('thumbs index out of range')
		}
		let url = this.thumbs.children[index].url
		this.showImage(url)
	}

	addImage (obj) {
		if (typeof obj === 'string') {
			this.thumbs.add(new SlideThumb(obj))
		} else {
			this.thumbs.add(new SlideThumb(obj.src))
		}
		this.showImage(this.thumbs.children[0].url)
	}
}
