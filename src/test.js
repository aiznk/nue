export function test () {
	let t

	t = new Template()
	t.parse('<div class="hoge"></div>')
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].attrs['class'] === 'hoge')

	t = new Template()
	t.parse('<div><span>123</span><p id="223" maxlength=323>423</p><img alt="hige" /></div>')
	// console.log(t)
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].children.length === 3)
	console.assert(t.root.children[0].children[0].name === 'span')
	console.assert(t.root.children[0].children[0].children.length === 1)
	console.assert(t.root.children[0].children[0].children[0].text === '123')
	console.assert(t.root.children[0].children[1].name === 'p')
	console.assert(t.root.children[0].children[1].attrs['id'] === '223')
	console.assert(t.root.children[0].children[1].attrs['maxlength'] === '323')
	console.assert(t.root.children[0].children[1].children.length === 1)
	console.assert(t.root.children[0].children[1].children[0].text === '423')
	console.assert(t.root.children[0].children[2].name === 'img')
	console.assert(t.root.children[0].children[2].attrs['alt'] === 'hige')

	t = new Template()
	let Hoge = new Tag('div')
	let Moge = new Tag('p')
	let Oge = new Tag('span')
	t.parse(`<div><Hoge>123</Hoge><Moge id="223" maxlength=323>423</Moge><Oge age=20 weight="60" /></div>`, {
		components: {
			Hoge, Moge, Oge,
		},
	})
	// console.log(t)
	console.assert(t.root.children.length === 1)
	console.assert(t.root.children[0].name === 'div')
	console.assert(t.root.children[0].children.length === 3)
	console.assert(t.root.children[0].children[0].name === 'div')
	console.assert(t.root.children[0].children[1].name === 'p')
	console.assert(t.root.children[0].children[2].name === 'span')

	t = new Template()
	t.parse(`aaa<div>bbb<p>ccc</p>ddd</div>eee`)
	console.assert(t.root.children.length === 3)
	console.assert(t.root.children[0].name === 'text')
	console.assert(t.root.children[0].text === 'aaa')
	console.assert(t.root.children[1].name === 'div')
	console.assert(t.root.children[1].children.length === 3)
	console.assert(t.root.children[1].children[0].name === 'text')
	console.assert(t.root.children[1].children[0].text === 'bbb')
	console.assert(t.root.children[1].children[1].name === 'p')
	console.assert(t.root.children[1].children[1].children.length === 1)
	console.assert(t.root.children[1].children[1].children[0].name === 'text')
	console.assert(t.root.children[1].children[1].children[0].text === 'ccc')
	console.assert(t.root.children[1].children[2].name === 'text')
	console.assert(t.root.children[1].children[2].text === 'ddd')
	console.assert(t.root.children[2].name === 'text')
	console.assert(t.root.children[2].text === 'eee')

	console.log('OK')
}
