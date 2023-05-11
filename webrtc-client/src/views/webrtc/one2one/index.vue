<template>
  <div style="width: 98%; height: 98vh; margin-top: 30px">
    <el-row :gutter="20">
      <el-col :span="6">
        <div style="width: 100%; height: 800px">
          <div>
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

const PeerConnection = window.RTCPeerConnection
const $serverSocketUrl = inject('$serverSocketUrl')

const linkSocket: any = ref(null)
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
  })
}

function sendMessageUserRtcChannel() {}

function streamInfo(val: string) {
  console.log(val)
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
