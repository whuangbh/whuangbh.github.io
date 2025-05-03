<script setup>
import { ref, onMounted } from 'vue'

const bluetoothSupported = ref(false)
const errorMessage = ref('')

onMounted(() => {
  if ('bluetooth' in navigator) {
    bluetoothSupported.value = true
  } else {
    bluetoothSupported.value = false
    errorMessage.value = 'Web Bluetooth API is not supported in this browser.'
  }
})

const handleButtonClick = async () => {
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
</script>

<template>
  <div>
    <h1>Check Web Bluetooth API</h1>
    <p v-if="!bluetoothSupported" style="color: red">
      {{ errorMessage }}
    </p>
    <button v-if="bluetoothSupported" @click="handleButtonClick">Request Bluetooth Device</button>
    <p v-if="bluetoothSupported">
      Click the button to see if your browser can request a Bluetooth device.
    </p>
  </div>
</template>

<style scoped>
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
