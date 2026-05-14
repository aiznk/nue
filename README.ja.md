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

## コンポーネントのマウント

コンポーネントはDOMの要素にマウント可能です。マウントした要素にコンポーネントが展開されます。

```js
class Root extends nue.Root {
	constructor () {
		super()
	}
}

let root = new Root()
root.mount('#my-app')
```

## Rootコンポーネント

Rootコンポーネントは他のコンポーネントと大差がなく、違うのは名前だけです。Rootコンポーネントは他のコンポーネントと同様に`Component`クラスを継承しています。
Rootコンポーネントはデフォルトでは`div`要素になりますが、これを変更したい場合は`super`でタグ名や属性値を変更します。

```js
class Root extends nue.Root {
	constructor () {
		super('span', {
			class: 'my-root',
		})
	}
}
```

## コンポーネントのDOM要素の参照

コンポーネントの`elem`属性を参照すると、コンポーネントが持つDOM要素を参照できます。

```js
class MyDiv extends nue.Div {
	constructor () {
		super()

		let div = this.elem
		div.textContent = 'text text'
	}
}
```

## コンポーネントの属性の変更

`Div`や`Span`などのコンポーネントの属性値を変更したい場合は、コンストラクタを調整します。

```js
class MyDiv extends nue.Div {
	constructor () {
		super({
			class: 'my-class',
			id: 'my-id',
		})
	}
}
```

あるいは`setAttr`メソッドで変更することも出来ます。

```js
class MyDiv extends nue.Div {
	constructor () {
		super()

		this.setAttr('class', 'my-class')
		this.setAttr('id', 'my-id')
	}
}
```

## コンポーネントのテキストや値のGET/SET

テキストのGET/SETは`getText`や`setText`メソッドを使います。これは`this.elem.textContent`を参照するのと等価です。
値のGET/SETは`getValue`や`setValue`メソッドを使います。これも`this.elem.value`を参照するのと等価です。

```js
class MyP extends nue.P {
}

class MyInput extends nue.Input {
}

let p = new MyP()
p.setText('Hello, World!')
alert(p.getText())

alert(p.elem.textContent)

let input = new MyInput()
input.setValue('default value')
alert(input.getValue())

alert(input.elem.value)

```

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

## テンプレートによるツリーの構築

基本的にはコンポーネント・ツリーの構築は`add`メソッドで子コンポーネントを追加することで構築します。
しかし、HTMLのようにツリー構造を構築できた方が便利な時もあります。
そういう時は`template`メソッドを使います。

```js
class Root extends nue.Root {
	constructor () {
		super()

		this.myInput = new nue.Input()

		this.template(`
			<div class="my-class">
				<MyInput />
			</div>
		`, {
			components: {
				MyInput: this.myInput,
			}
		})
	}
}
```

`template`メソッドにはHTMLのようにコンポーネントやHTML要素の記述をすることができます。引数の`components`にコンポーネントを指定することで、テンプレート中のコンポーネント名が置換されます。

## ライセンス

MIT
