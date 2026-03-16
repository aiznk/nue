export class ReorderableList extends Ul {
	constructor ({
		upText='Up', 
		downText='Down',
	}={}) {
		super()
		this.upText = upText
		this.downText = downText
	}

	addItem (item) {
		let li = new Li()
		li.add(item)

		let up = new Button(this.upText, ev => {
			this.moveUpItem(li)
		})
		let down = new Button(this.downText, ev => {
			this.moveDownItem(li)
		})
		li.add(up)
		li.add(down)

		this.add(li)
	}

	moveUpItem (item) {
		let upper = null 

		for (let i = 0; i < this.children.length; i++) {
			let child = this.children[i]
			if (item === child) {
				if (upper === null) {
					// item is most upper
				} else {
					let parent = upper.elem.parentNode
					item.elem.parentNode.removeChild(item.elem)
					parent.insertBefore(item.elem, upper.elem)
					let tmp = this.children[i-1]
					this.children[i-1] = this.children[i]
					this.children[i] = tmp
					break
				}
			}
			upper = child
		}
		this.emit('reorderableListMoveUpItem')
	}

	moveDownItem (item) {
		let downer = null

		for (let i = this.children.length-1; i >= 0; i--) {
			let child = this.children[i]
			if (item === child) {
				if (downer === null) {
					// item is most downer
				} else {
					let parent = downer.elem.parentNode
					item.elem.parentNode.removeChild(item.elem)
					parent.insertBefore(item.elem, downer.elem.nextSibling)
					let tmp = this.children[i+1]
					this.children[i+1] = this.children[i]
					this.children[i] = tmp
					break
				}
			}
			downer = child
		}

		this.emit('reorderableListMoveDownItem')
	}
}