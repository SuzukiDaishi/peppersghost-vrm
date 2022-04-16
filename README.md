# peppersghost-vrm

Viewed VRM model using Pepper's Ghost

![IMG_2278-_1_](https://user-images.githubusercontent.com/34536327/163660880-2afcd8b6-54e9-4f34-ad9e-30c9fe3fb004.gif)


## debug
```bash
npm run build
python -m http.server 8000
```

## web
[こちら](https://suzukidaishi.github.io/peppersghost-vrm/)

## アニメーションの変え方
1. [Mixio](https://www.mixamo.com/#/?page=1&type=Motion%2CMotionPack)にアクセスする
2. 好きなアニメーションを選択
3. 右上の「DOWNLOAD」ボタンを押す
4. 「Format」を「FBX for Unity(.fbx)」にする
5. 「Skin」を「Without Skin」にする
6. 「DOWNLOAD」する
7. ダウンロードしたファイルを`assets`直下におく
8. [コード内](./src/index.ts)の定数`ANIMATION`の値をダウンロードしたファイルのパスに書き換える
9. 再ビルドする

## キャラクターの変え方
1. [VRoid Hub](https://hub.vroid.com/)などでVRMファイルをダウンロード
2. ダウンロードしたファイルを`assets`直下におく
3. [コード内](./src/index.ts)の定数`CHARACTER`の値をダウンロードしたファイルのパスに書き換える
4. 再ビルドする

## 使用したモデル
- [AvatarSample_A](https://hub.vroid.com/characters/2843975675147313744/models/5644550979324015604)
