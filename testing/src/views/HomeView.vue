<script setup>
import { Peer } from 'https://esm.sh/peerjs@1.5.4?bundle-deps'

import { computed, onMounted, ref } from 'vue'

const deviceId = ref(generateSixDigitRandomNumber())
const peerDeviceId = ref('')
const errMsg = ref('')
const isDisplayErrorMsg = computed(() => errMsg.value)

let peer = null
let conn = null

function generateSixDigitRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000)
}

function initializePeer() {
  // if (peer != null) return

  peer = new Peer()
  //   {
  //   debug: 3,
  //   config: {
  //     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  //   },
  // }

  peer.on('open', function (id) {
    console.log('My peer ID is: ' + id)
    deviceId.value = id
  })

  peer.on('connection', (peerConnection) => {
    conn = peerConnection

    conn.on('open', function () {
      // Receive messages
      conn.on('data', function (data) {
        console.log('Received', data)
      })

      // Send messages
      conn.send('Hello!')
    })
  })
}

function connectToPeer() {
  // if (peer == null) {
  //   showErrorMsg('Fail to initialize peer!')
  //   return
  // }

  // if (!peerDeviceId.value || peerDeviceId.value.toString().length !== 6) {
  //   showErrorMsg('Please input a valid device id!')
  //   return
  // }

  conn = peer.connect(peerDeviceId.value.toString())

  conn.on('open', function () {
    // Receive messages
    conn.on('data', function (data) {
      console.log('Received', data)
    })

    // Send messages
    conn.send('Hello!')
  })
}

function showErrorMsg(msg) {
  errMsg.value = msg
}

function dismissErrMsg() {
  errMsg.value = ''
}

onMounted(() => {
  initializePeer()
})
</script>

<template>
  <div class="mt-2 container">
    <div class="row justify-content-center">
      <div class="fs-3 col-6">
        Device Id: <span class="text-primary fw-bold">{{ deviceId }} </span>
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="fs-3 col-6">
        <div class="row align-items-center">
          <div class="col-auto">Connect to other device:</div>
          <div class="col-auto">
            <form class="input-group">
              <input
                v-model="peerDeviceId"
                required
                type="number"
                class="form-control"
                placeholder="Device Id"
                maxlength="6"
                minlength="6"
              />
              <button @click="connectToPeer" class="btn btn-primary" type="button">Connect</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="row justify-content-center my-2">
      <div class="col-6">
        <div v-show="isDisplayErrorMsg" class="alert alert-danger alert-dismissible" role="alert">
          <span>{{ errMsg }}</span>
          <button @click="dismissErrMsg" type="button" class="btn-close"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
