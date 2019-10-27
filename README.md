# Oh!!迷子ッド

概要動画URL
https://youtu.be/Bpuqe9G_IL4

## 製品概要
### 迷子 Tech

### 背景（製品開発のきっかけ、課題等）

自分自身が子供の時に迷子によくなっていたから、迷子の子供に対してアプローチできる何かを作りたかった。
自分が親になった時に役立てるものを作ったら他の人にも役立つのではないかと思い、開発に至った。

着目した顧客：
ららぽーとなどの巨大商業施設、そこに訪れる親子連れ

顧客の課題：
店側：迷子のアナウンスや子供を保護するのが手間
親：子供が迷子になった時に、探すのが大変


現状：
迷子対策用のデバイスがあるが、親子の距離が離れたらデバイスが光ったり振動するなどの簡素な物しかない。
gpsで子供の位置を監視しようにも平面方向は数m、高さ方向はその数倍の誤差が生じてしまう。
高さ方向に数mの誤差があるだけで、デパートなどでは階の情報が得られない。


### 製品説明（具体的な製品の説明）
迷子を探すためのIoTデバイスと、位置を表示するアプリを組み合わせたサービス。
GPSに高精度気圧センサーを組み合わせることで、３次元座標を超高精度で取得することが可能。
GPSのみでは10数ｍの誤差があるが、気圧センサーを組み合わせることで数十cmの精度で確認することができ、正確に子供の位置がわかる。
親と離れた時は通知を送るように設定するなど、拡張性にも優れる。
容易に迷子と合流することができる。



### 特長

#### 1. 高さ情報の圧倒的精度

#### 2. 拡張性が高い、保守が容易

#### 3. 導入が簡単。wi-fi環境のみ

### 解決出来ること
店側：デバイスを配布するだけで、迷子に関する業務が減る
親：安心して買い物ができる。



### 今後の展望
高さの精度は非常に良いが、屋内で測定するとGPSの電波が弱くて平面方向にブレが生じたり、たまに通信が途絶える。
高精度のGPSモジュールに変更するか、GPS信号の増幅器を導入することで解決する予定である。


## 開発内容・開発技術
### 活用した技術
#### API・データ
* AWS
* obniz cloud

#### フレームワーク・ライブラリ・モジュール
* JavaScript
* Ajax
* HTML
* obniz cloud



#### デバイス
* obniz
* 気圧センサ DPS310
* GPSモジュール GYSFDMAXB

### 研究内容・事前開発プロダクト（任意）
* 研究内容：
1人を除いて物理工学専攻
JPHACKS2018に出場したメンバーやプログラミング経験は講義でCを少しいじったことがある程度のメンバーで構成
* 事前準備：
半田付けしたGPSモジュール


### 独自開発技術（Hack Dayで開発したもの）
#### 2日間に開発した独自の機能・技術
* obnizに複数センサーをつないで動作
* センサーから取った値をサーバーにログ
* センサー値を単位系に変換するプログラムの作成
* 単位系から階数への変換プログラムの作成
* obnizで取得したデータを自分で立てたサーバー側で処理

