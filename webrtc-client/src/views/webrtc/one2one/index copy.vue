<template>
  <div style="width: 98%; height: 98vh; margin-top: 30px">
    <el-row :gutter="20">
      <el-col :span="6">
        <div style="width: 100%; height: 800px">
          <div v-for="(item, index) in roomUserList" :key="index">
            <el-tag size="small" type="success">{{ '用户' }}</el-tag>
            <el-tag size="small" type="danger">增加比特率</el-tag>
            <el-button size="small" type="primary">通话</el-button>
            <el-button size="small" type="danger">切换</el-button>
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

const linkSocket: any = ref(null)
const localRtcPc: any = ref(null)
const channel: any = ref(null)
const roomUserList = ref([])
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

  linkSocket.value = io($serverSocketUrl as string, {
    transports: ['websocket'],
    query: {
      userId: userId,
      roomId: roomId,
      nickname: nickname
    }
  })

  linkSocket.value.on('connect', () => {
    console.log('socket.io connect success')
  })

  linkSocket.value.on('roomUserList', (e: any) => {
    console.log('roomUserList', e)
    roomUserList.value = e
  })

  linkSocket.value.on('msg', async (e: any) => {
    console.log('msg', e)
    if (e['type'] == 'join' || e['tupe'] == 'leave') {
      setTimeout(() => {
        const params = { roomId: getParams('roomId') }
        linkSocket.value.emit('roomUserList', params)
      }, 1000)
    }

    if (e['type'] === 'call') {
      await onCall(e)
    }
  })
}

// 发送信息
function sendMessageUserRtcChannel() {
  if (!channel.value) {
    ElMessage({
      showClose: true,
      message: '请先建立连接',
      type: 'error'
    })
  }
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
async function onCall(e: any) {
  console.log('远端呼叫：', e)
  await initCalleeInfo(e.data['targetUid'], e.data['userId'])
}
async function initCalleeInfo(localUid: string, formUid: string) {
  // 初始化pc
  localRtcPc.value = new PeerConnection()
  // 初始化本地媒体信息
  const localStream = await getLocalUserMedia({ audio: true, video: true })
  for (let track of localStream!.getTracks()) {
    localRtcPc.value.addTrack(track)
  }
  // dom 渲染
  // await setDomVideoStream('localdemo01', localStream)

  // 监听
  onPcEvent(localRtcPc.value, localUid, formUid)
}

function onPcEvent(pc: any, localUid: any, remoteUid: any) {
  channel.value = pc.createDataChannel('chat')
  pc.ontrack = function (event: any) {
    console.log(event)
    // setRemoteDomVideoStream('remoteVideo01', event.track)
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
  }
}

// 工具 -----------------------------------
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
