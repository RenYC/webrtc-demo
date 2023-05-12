<template>
  <div style="width: 98%; height: 98vh; margin-top: 30px">
    <el-row :gutter="20">
      <el-col :span="6">
        <div style="width: 100%; height: 800px">
          <div v-for="(item, index) in roomUserList" :key="index">
            <el-tag v-if="userInfo.userId === item.userId" size="small" type="success">
              {{ '我' }}
            </el-tag>
            <el-tag size="small" type="success" @click="getStats">
              {{ '用户' + item.nickname }}
            </el-tag>
            <el-tag
              v-if="userInfo.userId === item.userId"
              size="small"
              type="danger"
              @click="changeBitRate()"
            >
              增加比特率
            </el-tag>
            <el-button
              v-if="userInfo.userId !== item.userId"
              size="small"
              type="primary"
              @click="call(item)"
            >
              通话
            </el-button>
            <el-button
              v-if="userInfo.userId === item.userId"
              size="small"
              type="danger"
              @click="openVideoOrNot"
            >
              切换
            </el-button>
          </div>
        </div>
      </el-col>
      <el-col :span="18">
        <div
          style="
            width: 800px;
            height: 200px;
            display: flex;
            flex-direction: row;
            align-items: center;
          "
        >
          <el-form :model="formInline" label-width="250px" class="demo-form-inline">
            <el-form-item label="发送消息">
              <el-input v-model="formInline.rtcmessage" placeholder="消息"></el-input>
            </el-form-item>
            <el-form-item label="远端消息">
              <div>{{ formInline.rtcmessageRes }}</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="sendMessageUserRtcChannel">点击发送</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- <div class="video-box">
          <video
            id="localdemo01"
            autoplay
            controls
            muted
            @click="streamInfo('localdemo01')"
          ></video>
          <video
            id="remoteVideo01"
            autoplay
            controls
            muted
            @click="streamInfo('remoteVideo01')"
          ></video>
        </div> -->
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, inject } from 'vue'
import { io } from 'socket.io-client'
import ElMessage from 'element-plus/lib/components/message/index.js'

const PeerConnection = window.RTCPeerConnection
const $serverSocketUrl = inject('$serverSocketUrl')

let linkSocket: any = null
let localRtcPc: any = null
const channel: any = ref(null)
const roomUserList: any = ref([])
const formInline = ref({
  rtcmessage: '',
  rtcmessageRes: ''
})
const userInfo = reactive({
  userId: '',
  roomId: '',
  nickname: ''
})

if (getParams('userId')) {
  init(getParams('userId'), getParams('roomId'), getParams('userId'))
}
function init(userId: string | null, roomId: string | null, nickname: string | null) {
  userInfo.userId = userId || ''
  userInfo.roomId = roomId || ''
  userInfo.nickname = nickname || ''

  linkSocket = io($serverSocketUrl as string, {
    transports: ['websocket'],
    query: {
      userId: userId,
      roomId: roomId,
      nickname: nickname
    }
  })

  linkSocket.on('connect', () => {
    console.log('socket.io connect success')
  })

  linkSocket.on('roomUserList', (e: any) => {
    console.log('roomUserList', e)
    roomUserList.value = e
  })

  linkSocket.on('msg', async (e: any) => {
    console.log('msg', e)

    if (e['type'] == 'join' || e['tupe'] == 'leave') {
      setTimeout(() => {
        const params = { roomId: getParams('roomId') }
        linkSocket.emit('roomUserList', params)
      }, 1000)
    }

    if (e['type'] === 'call') {
      await onCall(e)
    }

    if (e['type'] === 'offer') {
      await onRemoteOffer(e['data']['userId'], e['data']['offer'])
    }

    if (e['type'] === 'answer') {
      await onRemoteAnswer(e['data']['userId'], e['data']['answer'])
    }

    if (e['type'] === 'candidate') {
      localRtcPc.addIceCandidate(e.data.candidate)
    }
  })
  linkSocket.on('error', (e: any) => {
    console.log('error', e)
  })
}

function streamInfo(val: string) {
  console.log(val)
}

/**
 * 获取设备 stream
 * @param constraints
 */
async function getLocalUserMedia(constraints: MediaStreamConstraints | undefined) {
  return await navigator.mediaDevices.getUserMedia(constraints).catch(handleError)
}

// ----------------------- 事件-------------------------------

// 发送信息
function sendMessageUserRtcChannel() {
  if (!channel.value) {
    ElMessage({
      showClose: true,
      message: '请先建立连接',
      type: 'error'
    })
  }
  channel.value.send(formInline.value.rtcmessage)
  formInline.value.rtcmessage = ''
}

function getStats() {}

function changeBitRate() {}

// 通话
async function call(item: any) {
  initCallerInfo(getParams('userId'), item.userId)
  let params = {
    userId: getParams('userId'),
    targetUid: item.userId
  }
  linkSocket.emit('call', params)
}

async function onCall(e: any) {
  console.log('远端呼叫：', e)
  await initCalleeInfo(e.data['targetUid'], e.data['userId'])
}

async function initCalleeInfo(localUid: string, formUid: string) {
  // 初始化pc
  localRtcPc = new PeerConnection()
  // 初始化本地媒体信息
  const localStream = await getLocalUserMedia({ audio: true, video: true })
  for (let track of localStream!.getTracks()) {
    localRtcPc.addTrack(track)
  }
  // dom 渲染
  await setDomVideoStream('localdemo01', localStream)

  // 监听
  onPcEvent(localRtcPc, localUid, formUid)
}

async function initCallerInfo(callerId: any, calleeId: any) {
  // 初始化pc
  localRtcPc = new PeerConnection()

  // 获取本地媒体并添加到pc中
  const localStream: any = await getLocalUserMedia({ audio: true, video: true })
  for (const track of localStream.getTracks()) {
    localRtcPc.addTrack(track)
  }

  // 本地 dom 渲染
  await setDomVideoStream('localdemo01', localStream)

  // 回调监听
  onPcEvent(localRtcPc, callerId, calleeId)

  // 创建 offer
  const offer = await localRtcPc.createOffer({ iceRestart: true })

  // 设置 offer 本地描述
  await localRtcPc.setLocalDescription(offer)

  // 发送 offer 给被呼叫端
  const params = { targetUid: calleeId, userId: callerId, offer: offer }
  linkSocket.emit('offer', params)
}

async function setDomVideoStream(domId: any, newStream: any) {}

/**
 * 打开或关闭摄像头
 */
function openVideoOrNot() {
  const senders = localRtcPc.getSenders()
  const send = senders.find((s: any) => s.track.kind === 'video')
  send.track.enabled = !send.track.enabled // 控制视频显示与否
}
// ------------------- end 事件 --------------------------------------------------

// ----------------- 抽离的函数逻辑 -----------------------

function onPcEvent(pc: any, localUid: any, remoteUid: any) {
  channel.value = pc.createDataChannel('chat')
  pc.ontrack = function (event: any) {
    console.log(event)
    setRemoteDomVideoStream('remoteVideo01', event.track)
  }
  pc.onnegotiationneeded = function (e: any) {
    console.log('重新链接', e)
  }
  pc.ondatachannel = function (ev: any) {
    console.log('Data channel is created!')
    ev.channel.onopen = function () {
      console.log('Data channel ---------- open -----------')
    }
    ev.channel.onmessage = function (data: any) {
      console.log('Data channel ---------- message -----------', data)
      formInline.value.rtcmessageRes = data.data
    }
    ev.channel.onclose = function () {
      console.log('Data channel ------------close----------------')
    }
  }
  pc.onicecandidate = (event: any) => {
    if (event.candidate) {
      linkSocket.emit('candidate', {
        targetUid: remoteUid,
        userId: localUid,
        candidate: event.candidate
      })
    } else {
      /* 在此次协商中，没有更多的候选了 */
      console.log('在此次协商中，没有更多的候选了')
    }
  }
}

async function onRemoteOffer(fromUid: any, offer: any) {
  localRtcPc.setRemoteDescription(offer)
  let answer = await localRtcPc.createAnswer()
  await localRtcPc.setLocalDescription(answer)
  let params = { targetUid: fromUid, userId: getParams('userId'), answer: answer }
  linkSocket.emit('answer', params)
}

async function onRemoteAnswer(fromUid: any, answer: any) {
  await localRtcPc.setRemoteDescription(answer)
}
// ------------------------------     end   ------------------------

// 工具 -----------------------------------
function setRemoteDomVideoStream(domId: any, track: any) {
  // let video = document.getElementById(domId)
  // let stream = video.srcObject
  // if (stream) {
  //   stream.addTrack(track)
  // } else {
  //   let newStream = new MediaStream()
  //   newStream.addTrack(track)
  //   video.srcObject = newStream
  //   video.muted = true
  // }
}
function getParams(queryName: string) {
  let url = window.location.href
  let query = decodeURI(url.split('?')[1])
  let vars = query.split('&')
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
    if (pair[0] === queryName) {
      return pair[1]
    }
  }
  return null
}

function handleError(error: any) {
  // alert("摄像头无法正常使用，请检查是否占用或缺失")
  console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name)
}
</script>

<style scoped>
.video-box {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}
</style>
