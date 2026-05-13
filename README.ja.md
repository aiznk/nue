# Nue

Nueは軽量なフロントエンド用JavaScriptフレームワークです。

```js
import * as nue from "../nue.js"

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

## 設計

コンポーネント指向で、コンポーネントで木構造を構築し、末端のコンポーネントで生じたイベントは親コンポーネントに伝達できるようにしてあります。そのため、子コンポーネントで生じるイベント（クリックや入力）をすべて親コンポーネントに集約させることが可能です。

## 子コンポーネントの追加

子コンポーネントは親コンポーネントのメソッド`add`で追加します。

```js
class Root extends nue.Root {
	constructor () {
		super()

		this.child = new nue.P()
		this.add(this.child) // child is child component of root
	}
}
````

## イベントの伝搬と捕捉

イベントを補足したいコンポーネントに設定を加え、イベントをハンドルし、親に`emit`します。

```js
class MyInput extends nue.Input {
	constructor () {
		super({}, {
			events: ['click', 'keydown'],
		})
	}

	onClick (ev) {
		this.emit('clicked!', ev) // emit to parent component
	}

	onKeydown (ev) {
		this.emit('keydown!', ev) // emit to parent component
	}
}
```

`emit`したイベントはリンクが繋がっている親ノードに再帰的に伝搬されます。つまり、特にコードを追加しなくてもイベントはすべて親に集約されます。
伝搬されてくるイベントを補足したい場合は`receive`メソッドをオーバーライドします。

```js
class Parent extends nue.Div {
	constructor () {
		super()
		
		this.input = new MyInput()
		this.add(this.input)
	}

	receive (key, val) {
		switch (key) {
		case 'clicked!': console.log(val); break
		case 'keydown!': console.log(val); break
		}
	}
}
```

## ライセンス

MIT
