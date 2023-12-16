# bds-discord-connect

## 使い方

1. 追加したいワールドをMinecraftで読み込む
1. .mcpackを起動してワールドに追加するか、`bds_discord_connection`をワールドデータの`behavior_packs`フォルダにコピーする
1. Minecraftからワールドの設定を開いてベータAPIをONにする
1. [BDS](https://www.minecraft.net/ja-jp/download/server/bedrock)をダウンロードし展開する
1. `bedrock_server.exe`起動し、フォルダが作成されたら終了する(以後この`bedrock-server-x.xx.xx.xx/`を`bds/`と表記)
1. `bedrock-server-x.xx.xx.xx/`を`bds/`にコピーする
1. `bds/server.properties`の最後に`emit-server-telemetry=true`を追加する
1. `bds/world/Bedrock level`をワールドデータに置き換える
1. `Main/.env`を埋める
1. `Main/run.bat`を起動する

## メモ

- BDSに新しいビヘイビアパックをロードさせるには一度Minecraftのアプリでロードさせる必要がある
- BDSではベータAPIの設定を変更できないからどちらにせよMinecraftのアプリでワールドを作るのがよさそう?
- @minecraft/server-netを使用するには`bds/config/`を設定する必要がある
- 全部[ここ](https://learn.microsoft.com/en-us/minecraft/creator/documents/scriptingservers?view=minecraft-bedrock-experimental)に書いてた
