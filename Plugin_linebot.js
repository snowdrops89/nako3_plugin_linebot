/******************************************
 * file: Plugin_linebot.js
 * なでしこ３でLINEボットを作るプラグイン
*******************************************/
const version = 'v0.6.0'

// パッケージ
const line = require('@line/bot-sdk')
const express = require('express')

// 秘密鍵（環境変数から取得）
let config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_ACCESS_TOKEN
}

const PluginLinebot = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__v0['WEBサーバ:ONSUCCESS'] = null
      sys.__v0['WEBサーバ:ONERROR'] = null
      sys.__v0['WEBサーバ:要求'] = null
      sys.__v0['WEBサーバ:応答'] = null
      sys.__v0['WEBサーバクエリ'] = {}
      sys.__server = null
      sys.__webapp = null
      sys.__client = null
    }
  },
  // @LINEボット用サーバ(Express)
  'GETデータ': { type: 'const', value: '' }, // @GETでーた
  'POSTデータ': { type: 'const', value: '' }, // @POSTでーた
  'PORT番号': { type: 'const', value: process.env.PORT }, // @PORTばんごう
  'LINEボット名': { type: 'const', value: 'なこぼっと' + version }, // @らいんぼっとめい
  'LINEボット秘密鍵変更': { // @LINEボットのアクセストークンを変更する(LINEボット起動前に行う) // @らいんぼっとしーくれっときーへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (cnf, sys) {
      config = cnf
    },
    return_none: true
  },
  'LINEボット起動': { // @ポート番号でLINEボット用にExpressサーバを起動して成功したら『LINEボット起動した時』を実行する // @らいんぼっときどう
    type: 'func',
    josi: ['で'],
    fn: function (portno, sys) {
      let app = express()
      let client = new line.Client(config)
      let server = app.listen(portno, () => {
        const pno = server.address().port
        console.log('[URL] http://localhost:' + pno + 'で ' + sys.__v0['LINEボット名'] + ' 起動しました☆')
        sys.__webapp.get('/', (req, res) => res.send(sys.__v0['LINEボット名'] + ' が起動しています☆')); //ブラウザ確認用
        const callback = sys.__v0['WEBサーバ:ONSUCCESS']
        if (callback) {callback(pno, sys)}
      })
      server.on('error', (e) => {
        const callback = sys.__v0['WEBサーバ:ONERROR']
        if (callback) {callback(e, sys)}
      })
      // memo
      sys.__webapp = app
      sys.__server = server
      sys.__client = client
      return server
    }
  },
  'LINEボット起動時': { // @LINEボット用にExpressサーバを起動して成功したらCALLBACKを実行する // @らいんぼっときどうしたとき
    type: 'func',
    josi: ['を'],
    fn: function (callback, sys) {
      sys.__v0['WEBサーバ:ONSUCCESS'] = callback
      portno = sys.__v0['PORT番号']
      return sys.__exec('LINEボット起動', [portno, sys])
    }
  },

  // @イベント
  'LINEイベント': { type: 'const', value: '' }, // @らいんいべんと
  'LINEイベント受信時': { // @webhookにイベントがPOSTされた時 // @らいんいべんとじゅしんしたとき
    type: 'func',
    josi: ['を'],
    fn: function (callback, sys) {
      sys.__webapp.post('/webhook', line.middleware(config), (req, res) => {
        res.status(200).end(); //エラー対策
        sys.__v0['LINEイベント'] = req.body.events
        if (sys.__v0['LINEイベント'].length === 0) {
          console.log('検証イベント受信しました☆'); //疎通確認用
          return;
        } else {
          console.log('イベント受信しました☆\n',sys.__v0['LINEイベント']); //Webhookの中身の確認用
        }
        callbackServerFunc(callback, req, res, sys)
      })
    }
  },
  'プロフィール取得時': { // @ユーザーのプロフィール情報を取得 // @ぷろふぃーるしゅとくしたとき
    type: 'func',
    josi: [['を'],['の']],
    fn: function (fn, userId, sys) {
      sys.__client.getProfile(userId).then((prf) => {
        sys.__v0['対象'] = prf
        console.log('ユーザープロフィール取得しました☆\n',prf); //確認用
        return fn(prf, sys)
      })
    }
  },
  // @メッセージオブジェクト
  'LINEテキストメッセージ': { // @textのテキストメッセージobjを作成する // @らいんてきすとめっせーじ
    type: 'func',
    josi: ['の'],
    fn: function (text, sys) {
      return {type: 'text', text: text}
    }
  },
  'LINEスタンプメッセージ': { // @パッケージIDからスタンプIDのスタンプメッセージobjを作成する // @らいんすたんぷめっせーじ
    type: 'func',
    josi: [['から'],['の']],
    fn: function (packageId, stickerId, sys) {
      return {type: 'sticker', packageId: packageId, stickerId: stickerId}
    }
  },
  'LINE画像メッセージ': { // @プレビュー画像とオリジナル画像の画像メッセージobjを作成する // @らいんがぞうめっせーじ
    type: 'func',
    josi: [['と'],['の']],
    fn: function (preview, original, sys) {
      return {type: 'image', originalContentUrl: original, previewImageUrl: preview}
    }
  },
  'LINE動画メッセージ': { // @プレビュー画像と動画ファイルの動画メッセージobjを作成する // @らいんどうがめっせーじ
    type: 'func',
    josi: [['と'],['の']],
    fn: function (preview, video, sys) {
      return {type: 'video', originalContentUrl: video, previewImageUrl: preview}
    }
  },
  'LINE音声メッセージ': { // @長さ（ミリ秒）で音声ファイルの音声メッセージobjを作成する // @らいんおんせいめっせーじ
    type: 'func',
    josi: [['で'],['の']],
    fn: function (duration, audio, sys) {
      return {type: 'audio', originalContentUrl: audio, duration: duration}
    }
  },
  'LINE位置情報メッセージ': { // @タイトルと住所で[緯度,経度]の位置情報メッセージobjを作成する // @らいんいちじょうほうめっせーじ
    type: 'func',
    josi: [['と'],['で'],['の']],
    fn: function (title, address, latlon, sys) {
      return {type: 'location', title: title, address: address, latitude: latlon[0], longitude: latlon[1]}
    }
  },
  'LINE二択メッセージ': { // @AとBでtextの確認メッセージobjを作成する // @らいんにたくめっせーじ
    type: 'func',
    josi: [['と'],['で'],['の']],
    fn: function (A, B, text, sys) {
      return {
        type: 'template',
        altText: "this is a confirm template",
        template: {
          type: 'confirm',
          text: text,
          actions: [
            {
              type: 'message',
              label: A,
              text: A
            },
            {
              type: 'message',
              label: B,
              text: B
            }
          ]
        }
      }
    }
  },

  // @メッセージ送信
  'LINE返信': { // @返信先(replyToken)へ応答メッセージを送信待機する（実際の送信は「LINEメッセージ送信」でまとめて行われる） // @らいんへんしん
    type: 'func',
    josi: [['に', 'へ'],['を']],
    fn: function (replyToken, mes, sys) {
      return sys.__client.replyMessage(replyToken, mes);
    }
  },
  'LINEプッシュ': { // @送信先ID(userId)へ任意のタイミングでプッシュメッセージを送信する // @らいんぷっしゅ
    type: 'func',
    josi: [['に', 'へ'],['を']],
    fn: function (id, mes, sys) {
      sys.__client.pushMessage(id, mes);
    }
  },
  'LINE複数プッシュ': { // @複数の送信先ID(userId)の配列へ任意のタイミングでプッシュメッセージを送信する。マルチキャストメッセージ // @らいんふくすうぷっしゅ
    type: 'func',
    josi: [['に', 'へ'],['を']],
    fn: function (id, mes, sys) {
      sys.__client.multicast(id, mes);
    }
  },
  'LINE一斉プッシュ': { // 友達になっている全てのユーザーへ任意のタイミングでプッシュメッセージを送信する。ブロードキャストメッセージ // @らいんいっせいぷっしゅ
    type: 'func',
    josi: ['を'],
    fn: function (mes, sys) {
      sys.__client.broadcast(mes);
    }
  },
  'LINEマルチキャスト送信': { // @複数の送信先ID(userId)の配列へ任意のタイミングでプッシュメッセージを送信する。マルチキャストメッセージ // @らいんまるちきゃすとそうしん
    type: 'func',
    josi: [['に', 'へ'],['を']],
    fn: function (id, mes, sys) {
      sys.__client.multicast(id, mes);
    }
  },
  'LINEブロードキャスト送信': { // 友達になっている全てのユーザーへ任意のタイミングでプッシュメッセージを送信する。ブロードキャストメッセージ // @らいんぶろーどきゃすとそうしん
    type: 'func',
    josi: ['を'],
    fn: function (mes, sys) {
      sys.__client.broadcast(mes);
    }
  },
  'LINEナローキャスト送信': { // 属性情報やオーディエンスを利用して複数のユーザーへ任意のタイミングでプッシュメッセージをメッセージを送信する。ナローキャストメッセージ // @らいんなろーきゃすとそうしん
    type: 'func',
    josi: [['を'],['と'],['で'],['の']],
    fn: function (mes, recipient, filter, limit, sys) {
      sys.__client.narrowcast(mes, recipient, filter, limit);
    }
  },
  'LINEメッセージ送信': { // @LINEメッセージをぷろみすで送信 // @らいんめっせーじそうしん
    type: 'func',
    josi: [['を', 'の']],
    fn: function (promises, sys) {
      Promise.all(promises).then((response) => {
          console.log(`${response.length} 件のイベントを処理しました☆`);
      });
    }
  }
}


// GET/POST/PUT/DELETEのコールバック
function callbackServerFunc (callback, req, res, sys) {
  // if (debug) { console.log(req) }
  sys.__v0['WEBサーバ:要求'] = req
  sys.__v0['WEBサーバ:応答'] = res
  sys.__v0['GETデータ'] = req.query
  sys.__v0['POSTデータ'] = req.body
  callback(req, res)
}
module.exports = PluginLinebot