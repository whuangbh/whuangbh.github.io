<script setup>
import { ref, onMounted } from 'vue'

const bluetoothSupported = ref(false)
const errorMessage = ref('')

const targetDevice = ref()

onMounted(() => {
  if ('bluetooth' in navigator) {
    bluetoothSupported.value = true
  } else {
    bluetoothSupported.value = false
    errorMessage.value = 'Web Bluetooth API is not supported in this browser.'
  }
})

async function handleButtonClick() {
  console.log('clicked!')

  if (!bluetoothSupported.value) {
    return
  }

  try {
    console.log('Requesting Bluetooth Device...')
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true, // Be cautious with this in production
      // optionalServices: ['your-service-uuid'] // Specify services you need
    })
    console.log('Device found:', device)
    alert(`Found device: ${device.name || 'Unnamed Device'}`)
    // You can now proceed to connect to the device's GATT server
    // and interact with its services and characteristics.
  } catch (error) {
    console.error('Error requesting Bluetooth device:', error)
    errorMessage.value = `Error: ${error.message}`
  }
}

async function test() {
  navigator.bluetooth
    .getDevices()
    .then((devices) => {
      console.log('Previously permitted devices:', devices)
      devices.forEach((device) => {
        console.dir(device)
      })
    })
    .catch((error) => {
      console.error('Error getting previously permitted devices:', error)
    })
}
</script>

<template>
  <div class="mt-2 container">
    <div class="row justify-content-center">
      <div class="fs-3 col-6">
        <template v-if="!bluetoothSupported">
          <span class="me-2 fw-medium">1. Bluetooth is not support by your device or browser</span>
          <img class="align-bottom" src="../images/cross.svg" />
        </template>
        <template v-else>
          <span class="me-2 fw-medium">1. Bluetooth is supported</span>
          <img class="align-bottom" src="../images/check.svg" />
        </template>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="fs-3 col-6">
        <span class="me-2 fw-medium">2. Pair a device to share</span>
        <img v-if="!targetDevice" class="align-bottom" src="../images/cross.svg" />
        <img v-else class="align-bottom" src="../images/check.svg" />
      </div>
    </div>

    <div class="row justify-content-center mt-2">
      <div class="col-6">
        <button
          @click="handleButtonClick"
          :disabled="!bluetoothSupported"
          type="button"
          class="btn btn-primary ms-4 me-3"
        >
          Pair
        </button>
        <span class="fs-5 text-secondary fst-italic">No device is selected! </span>
      </div>
    </div>
  </div>

  <button @click="test">Check</button>
</template>

<style scoped></style>
