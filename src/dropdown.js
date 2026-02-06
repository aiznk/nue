export class DropdownItem extends Li {
	constructor (text, href='#') {
		super({ class: 'nue_dropdown__item' })
		this.link = new A()
		this.link.setText(text)
		this.link.setAttr('href', href)
		this.link.setClass('nue_dropdown__link')
		this.add(this.link)
	}
}

class DropdownTrigger extends Button {
	constructor (text) {
		super(text, ev => {}, { class: 'nue_dropdown__trigger' })
	}
}

class DropdownMenu extends Ul {
	constructor () {
		super({ class: 'nue_dropdown__menu' })
	}
}

export class Dropdown extends Div {
	constructor (trigger='Click me!') {
		super({
			class: 'nue_dropdown',
		})
		this.trigger = new DropdownTrigger(trigger)
		this.add(this.trigger)
		this.menu = new DropdownMenu()
		this.add(this.menu)

		document.addEventListener('click', e => {
		  const dropdown = e.target.closest(".nue_dropdown");
		  const allDropdowns = document.querySelectorAll(".nue_dropdown");

		  allDropdowns.forEach(d => d.classList.remove("nue_dropdown--open"));

		  if (!dropdown) {
		  	return;
		  }

		  const trigger = e.target.closest(".nue_dropdown__trigger");
		  if (!trigger) {
		  	return;
		  }

		  dropdown.classList.toggle("nue_dropdown--open");
		})
		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') {
				document
					.querySelectorAll('.nue_dropdown')
					.forEach(d => d.classList.remove('nue_dropdown--open'))
			}
		})
	}

	addItem (item) {
		this.menu.add(item)
	}
}
