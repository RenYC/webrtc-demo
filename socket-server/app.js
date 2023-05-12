const { hSet, hGetAll, hDel } = require('./redis')
const { getMsg, getParams } = require('./common')

const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();

// http server
app.use(express.static('./dist'));
app.use(function (req, res, next) {
  res.sendfile('/dist/index.html');
})
const server = http.createServer(app);

// socket server
const io = require('socket.io')(server, { allowEIO3: true });

server.listen(18080, () => {
  console.log('server listening on port 18080');
});

io.on('connection', async (socket) => {
  await onListener(socket)
})

const userMap = new Map() // user -> socket
const roomkey = 'meeting-room::'

/**
 * DB data
 * @param {object} userId
 * @param {Object} roomId
 * @param {Object} nickname
 * @param {Object} pub
 */
async function getUserDefailByUid(userId, roomId, nickname, pub) {
  let res = JSON.stringify({ userId, roomId, nickname, pub })
  return res
}

/**
 * 监听
 * @param {Object} s
 */
async function onListener(s) {
  let url = s.client.request.url
  let userId = getParams(url, 'userId')
  let roomId = getParams(url, 'roomId')
  let nickname = getParams(url, 'nickname')
  let pub = getParams(url, 'pub')
  console.log('userId', userId, 'roomId', roomId, 'nickname', nickname, 'pub', pub);
  // user map
  userMap.set(userId, s)
  // room cache
  if (roomId) {
    await hSet(roomkey + roomId, userId, await getUserDefailByUid(userId, roomId, nickname, pub))
    console.log("roomId", roomId);
    oneToRoomMany(roomId, getMsg('join', userId + 'join then room', 200, { userId, nickname }))
  }

  s.on('msg', async (data) => {
    console.log('msg', data);
    await oneToRoomMany(roomId, data)
  })

  s.on('disconnect', () => {
    console.log(`client uid:${userId} roomId:${roomId} 【${nickname}】 offline`);
  })

  s.on('roomUserList', async (data) => {
    s.emit('roomUserList', await getRoomOnlyUserList(data['roomId']))
  })

  s.on('call', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('call', '远程呼叫', 200, data))
  })

  s.on('candidate', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('candidate', 'ice candidate', 200, data))
  })

  s.on('offer', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('offer', 'rtc offer', 200, data))
  })

  s.on('answer', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('answer', 'rtc answer', 200, data))
  })

  s.on('applyMic', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('applyMic', "apply mic", 200, data))
  })

  s.on('acceptApplyMic', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('acceptApplyMic', "acceptApplyMic mic", 200, data))
  })

  s.on('refuseApplyMic', (data) => {
    let targetUid = data['targetUid']
    oneToOne(targetUid, getMsg('refuseApplyMic', "refuseApplyMic mic", 200, data))
  })
}

/**
 * 
 * @param {*} uid 
 * @param {*} msg 
 */
function oneToOne(uid, msg) {
  let s = userMap.get(uid)
  if (s) {
    s.emit('msg', msg)
  } else {
    console.log(uid + '用户不在线');
  }
}

/**
 * 
 * @param {*} roomId 
 * @returns 
 */
async function getRoomUser(roomId) {
  return await hGetAll(roomkey + roomId)
}

async function getRoomOnlyUserList(roomId) {
  let resList = []
  let uMap = await hGetAll(roomkey + roomId)
  for (const key in uMap) {
    let detail = JSON.parse(uMap[key])
    resList.push(detail)
  }
  return resList
}

/**
 * 
 * @param {*} roomId 
 * @param {*} msg 
 */
async function oneToRoomMany(roomId, msg) {
  let uMap = await getRoomUser(roomId)
  for (const uid in uMap) {
    oneToOne(uid, msg)
  }
}