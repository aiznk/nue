# Nue

A light weight JavaScript framework for Single Page Application.

```js
import * as nue from "../src/main.js"

class Root extends nue.Root {
	constructor () {
		super()
		this.msg = new nue.P()
		this.msg.setText('Hello, World!')
		this.add(this.msg)
	}
}

document.addEventListener('DOMContentLoaded', () => {
	let root = new Root()
	root.mount('#app')
})
```

# License

MIT
