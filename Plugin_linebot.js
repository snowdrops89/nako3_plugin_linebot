/******************************************
 * file: Plugin_linebot.js
 * なでしこ３でLINEボットを作るプラグイン
 * とりあえず疎通確認まで。
*******************************************/

// パッケージ
const line = require('@line/bot-sdk')
const express = require('express')

// 定数・変数
let WEBSERVER_NAME = 'Nako3 LINE Bot'
let debug = true
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN
const config = {
    channelSecret: LINE_CHANNEL_SECRET,
    channelAccessToken: LINE_ACCESS_TOKEN
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
    }
  },
  // @LINE Bot サーバ(Express)
  'GETデータ': { type: 'const', value: '' }, // @GETでーた
  'POSTデータ': { type: 'const', value: '' }, // @POSTでーた
  'LINEボット起動': { // @ポートPORTNOでLineBot用Expressサーバを起動して成功したら『LINEボット起動した時』を実行する // @らいんぼっときどう
    type: 'func',
    josi: [['の', 'で']],
    fn: function (portno, sys) {
      let app = express()
      let client = new line.Client(config)
      let server = app.listen(portno, () => {
        const pno = server.address().port
        if (debug) {
          console.log('[URL] http://localhost:' + pno + 'で' + WEBSERVER_NAME + '起動しました☆')
          sys.__webapp.get('/', (req, res) => res.send(WEBSERVER_NAME + 'が起動しています☆'));//ブラウザ確認用
          sys.__webapp.post('/webhook', line.middleware(config), (req, res) => {
            res.status(200).end();//「Webhookイベントオブジェクト送信時にタイムアウトが発生しました」のエラー防止用
            if (req.body.events.length === 0) {
              console.log('検証イベント受信しました☆'); //疎通確認用
              return;
            } else {
              console.log('イベント受信しました☆{改行}',req.body.events);//Webhookの中身の確認用
            }
          })
        }
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
  'LINEボット起動時': { // @ポートPORTNOでLINE Bot用Expressサーバを起動して成功したらCALLBACKを実行する // @らいんぼっときどうしたとき
    type: 'func',
    josi: [['を'],['の', 'で']],
    fn: function (callback, portno, sys) {
      sys.__v0['WEBサーバ:ONSUCCESS'] = callback
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
        res.status(200).end();//「Webhookイベントオブジェクト送信時にタイムアウトが発生しました」のエラー防止用
        sys.__v0['LINEイベント'] = req.body.events
        if (sys.__v0['LINEイベント'].length === 0) {
          console.log('検証イベント受信しました☆'); //疎通確認用
          return;
        } else {
          console.log('イベント受信しました☆{改行}',sys.__v0['LINEイベント']);//Webhookの中身の確認用
        }
        callbackServerFunc(callback, req, res, sys)
      })
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
