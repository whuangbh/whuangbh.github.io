<script setup>
import { Peer } from 'https://esm.sh/peerjs@1.5.4?bundle-deps'

import { computed, onMounted, ref } from 'vue'

const deviceId = ref('') // Initialize as empty
const peerDeviceId = ref('')
const errMsg = ref('')
const isDisplayErrorMsg = computed(() => errMsg.value)

let conn = null
const peer = new Peer({ debug: 3 })
peer.on('open', function (id) {
  console.log('My peer ID is: ' + id)
  deviceId.value = id
})
peer.on('connection', (incomingConnection) => {
  conn = incomingConnection

  conn.on('data', function (data) {
    console.log('Received', data)
  })

  conn.on('open', function () {
    // Receive messages
    conn.on('data', function (data) {
      console.log('Received', data)
    })

    // Send messages
    conn.send({ str: 'Hello!' })
  })
})

function initializePeer() {}

function connectToPeer() {
  conn = peer.connect(peerDeviceId.value)

  conn.on('open', function () {
    // Receive messages
    conn.on('data', function (data) {
      console.log('Received', data)
    })

    // Send messages
    conn.send({ str: 'Hello!' })
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
                type="text"
                class="form-control"
                placeholder="Peer ID"
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
