<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'

const videoUrl = ref<string | null>(null)
const isDragOver = ref(false)
const fileInput = useTemplateRef('file-input')
const videoPlayer = useTemplateRef('video-player')

const videoInfo = ref({
  name: '',
  duration: 0, // seconds
  resolution: 'N/A',
  format: 'N/A',
})

const captureRange = ref(2.0)
const captureStep = ref(0.2)
const currentTime = ref(0)
const isCapturing = ref(false)
const showBackToTop = ref(false)

interface CapturedFrame {
  timestamp: number
  dataUrl: string
  filename: string
}

const capturedFrames = ref<CapturedFrame[]>([])

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00.000'
  const seconds = Math.floor(time)
  const milliseconds = (time - seconds).toFixed(3).substring(2)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds}.${milliseconds}`
}

watch(videoPlayer, (player) => {
  if (player) {
    const updateTime = () => {
      currentTime.value = player.currentTime
    }
    // Listen for time updates and when the video is paused
    player.addEventListener('timeupdate', updateTime)
    player.addEventListener('pause', updateTime)

    // Initial data load to update metadata
    player.addEventListener('loadedmetadata', () => {
      videoInfo.value.duration = player.duration
      videoInfo.value.resolution = `${player.videoWidth} x ${player.videoHeight}`
    })
  }
})

const processVideoFile = (file: File) => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
  videoUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  capturedFrames.value = []

  if (!file.type.startsWith('video/')) {
    alert('Please drop a valid video file.')
    return
  }

  videoInfo.value.name = file.name
  videoInfo.value.format = file.type

  videoUrl.value = URL.createObjectURL(file)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processVideoFile(file)
  }
}

const dropFile = (event: DragEvent) => {
  isDragOver.value = false

  const file = event.dataTransfer?.files[0]
  if (file) {
    processVideoFile(file)
  }
}

const dragOver = () => {
  isDragOver.value = true
}

const dragLeave = () => {
  isDragOver.value = false
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 290
}

const scrollToTop = () => {
  window.scrollTo({
    top: 290,
    behavior: 'smooth',
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const captureFrames = async () => {
  if (!videoPlayer.value || videoPlayer.value.paused === false) {
    alert('Please pause the video at the desired capture moment first.')
    return
  }

  isCapturing.value = true
  capturedFrames.value = []

  const video = videoPlayer.value
  const currentTime = video.currentTime
  const range = captureRange.value
  const step = captureStep.value

  const startTime = currentTime
  const endTime = currentTime + range
  const baseName = videoInfo.value.name.replace(/\.[^/.]+$/, '')

  const timesToCapture = []

  for (let t = startTime; t <= endTime; t += step) {
    if (t >= 0 && t <= video.duration) {
      timesToCapture.push(Number(t.toFixed(6)))
    }
  }

  let promiseChain = Promise.resolve()

  // console.dir(timesToCapture)
  // console.dir(uniqueSortedTimes)

  timesToCapture.forEach((timestamp, i) => {
    // For each timestamp, append a new asynchronous task to the chain
    promiseChain = promiseChain
      .then(() => {
        // captureFrameAtTime returns a Promise, so .then() waits for it
        return captureFrameAtTime(video, timestamp, baseName, i)
      })
      .then((frameData) => {
        if (frameData) {
          // Once captureFrameAtTime resolves, push the data
          capturedFrames.value.push(frameData)
        }
      })
  })

  promiseChain.finally(() => {
    // Reset video time to the original center point
    video.currentTime = currentTime
    isCapturing.value = false
  })

  // Return the final promise chain (optional, but good practice)
  return promiseChain
}

const captureFrameAtTime = (
  video: HTMLVideoElement,
  timestamp: number,
  baseName: string,
  index: number,
) => {
  return new Promise<CapturedFrame | null>((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    const onSeeked = () => {
      // 1. Remove the listener immediately to prevent event collision in the loop
      video.removeEventListener('seeked', onSeeked)

      // 2. Draw the *new* frame now that it is ready
      try {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        const timeStr = (timestamp * 1000).toFixed(0).padStart(7, '0')
        const filename = `${baseName}_frame_${index.toString().padStart(3, '0')}_t${timeStr}ms.jpeg`

        // 3. Resolve the promise, returning the captured data
        resolve({
          timestamp: timestamp,
          dataUrl: dataUrl,
          filename: filename,
        })
      } catch (error) {
        console.error(`Canvas drawing failed at ${timestamp}s:`, error)
        resolve(null)
      }
    }

    // 4. Attach the listener BEFORE setting the time
    video.addEventListener('seeked', onSeeked)

    // 5. Request the new time
    video.currentTime = timestamp
  })
}
</script>

<template>
  <div class="container-fluid my-3 px-5">
    <h2 class="mb-4 text-center">Video Frame Capture Tool</h2>

    <div class="row gx-5 gy-3">
      <div class="col-12">
        <div class="alert alert-info p-4 shadow-sm">
          <h4 class="alert-heading">Welcome to the Video Frame Capture Tool</h4>

          <p>
            This tool is designed to help you extract frames from your video files using custom time
            ranges and step sizes.
          </p>

          <ul>
            <li>
              All video processing is done
              <strong>locally</strong> in your browser. Your file is never uploaded or transmitted.
            </li>
            <li>
              The tool captures frames by using the browser's video seeking mechanism (`seeked`
              event). Although it may not produce the most precise results, it should be good enough
              for any basic needs.
            </li>
          </ul>
        </div>
      </div>
      <div class="col-lg-6">
        <h4 class="mb-3 text-primary d-flex align-items-center">
          Video Input & Playback
          <i class="bi bi-camera-video-fill ms-2"></i>
        </h4>

        <div
          @dragover.prevent="dragOver"
          @dragleave.prevent="dragLeave"
          @drop.prevent="dropFile"
          @click="triggerFileInput"
          class="card text-center mb-3"
          id="input_area"
          :class="{ drag_shadow: isDragOver }"
        >
          <div v-if="!videoUrl" class="d-flex flex-column align-items-center m-5">
            <template v-if="isDragOver">
              <i class="bi bi-check fs-1 mb-3"></i>
              <p class="lead">
                <span>Drop It!</span>
              </p>
            </template>
            <template v-else>
              <i class="bi bi-cloud-arrow-up fs-1 mb-3"></i>
              <p class="lead">
                <span>Click / Drag & Drop Video</span>
              </p>
            </template>
          </div>
          <div v-else class="m-4">
            <template v-if="isDragOver">
              <i class="bi bi-check"></i>
              <div>Drop It!</div>
            </template>
            <template v-else>
              <div>Click / Drag & Drop Video</div>
              <div>Tips: You can drag onto the video below!</div>
            </template>
          </div>
        </div>

        <input
          type="file"
          ref="file-input"
          @change="handleFileSelect"
          accept="video/*"
          style="display: none"
        />

        <div
          v-if="videoUrl"
          class="video-player-container"
          @dragover.prevent="dragOver"
          @dragleave.prevent="dragLeave"
          @drop.prevent="dropFile"
        >
          <video
            ref="video-player"
            :src="videoUrl"
            controls
            class="video-player w-100 rounded shadow-sm"
          ></video>
        </div>
      </div>

      <div class="col-lg-6">
        <h4 class="mb-3 text-success d-flex align-items-center">
          Frame Capture Controls
          <i class="bi bi-camera-fill ms-2"></i>
        </h4>

        <div v-if="videoUrl" class="card mb-4 p-3 shadow-sm">
          <h5 class="card-title text-success">Video Status</h5>
          <ul class="list-unstyled mb-0 small">
            <li><strong>File Name:</strong> {{ videoInfo.name }}</li>
            <li><strong>Resolution:</strong> {{ videoInfo.resolution }}</li>
            <li><strong>Format/MIME:</strong> {{ videoInfo.format }}</li>
            <li><strong>Duration:</strong> {{ formatTime(videoInfo.duration) }}</li>
            <li>
              <strong>Current Time:</strong>
              <span class="ms-1 text-danger fw-bold fs-5">{{ formatTime(currentTime) }}</span>
            </li>
          </ul>
        </div>

        <div v-else class="card mb-3">
          <div class="text-center text-muted lead m-5">
            <i class="bi bi-upload me-2"></i> Load a video on the left to begin.
          </div>
        </div>

        <div v-if="videoUrl" class="card mb-4 p-4 shadow">
          <h5 class="card-title text-success mb-3">Capture Settings</h5>

          <div class="row g-3">
            <div class="col-md-6">
              <label for="captureRange" class="form-label">Capture Range</label>
              <h4 class="text-primary fw-bold mb-1">{{ captureRange }}s</h4>
              <input
                type="range"
                id="captureRange"
                class="form-range"
                v-model.number="captureRange"
                min="1.0"
                max="10.0"
                step="0.25"
              />
              <div class="form-text">Captures the following {{ captureRange }}s</div>
            </div>

            <div class="col-md-6">
              <label for="captureStep" class="form-label">Step Size</label>
              <h4 class="text-primary fw-bold mb-1">{{ captureStep.toFixed(2) }}s</h4>
              <input
                type="range"
                id="captureStep"
                class="form-range"
                v-model.number="captureStep"
                min="0.1"
                max="0.5"
                step="0.05"
              />
              <div class="form-text">Captures every {{ captureStep.toFixed(2) }}s.</div>
            </div>
          </div>

          <button
            @click="captureFrames"
            class="btn btn-success btn-lg mt-3"
            :disabled="!videoUrl || videoPlayer?.paused === false || isCapturing"
          >
            <span
              v-if="isCapturing"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-camera-fill me-1"></i>
            {{ isCapturing ? 'Capturing Frames...' : 'Capture' }}
          </button>
        </div>
      </div>
      <div class="col-12 mb-5">
        <h4 class="mb-3 text-info d-flex align-items-center">
          Frame Capture Results
          <i class="bi bi-pass-fill ms-2"></i>
        </h4>

        <div v-if="capturedFrames.length > 0" class="card p-3 shadow mb-5">
          <div class="container-fluid">
            <h5 class="card-title text-info">Captured Frames ({{ capturedFrames.length }})</h5>
            <div class="row gy-3 mb-2">
              <div
                class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                v-for="(frame, index) in capturedFrames"
                :key="index"
              >
                <div class="card text-center">
                  <img :src="frame.dataUrl" class="card-img-top" />
                  <div class="card-body">
                    <h5 class="card-title d-flex justify-content-between">
                      <div>#{{ index + 1 }}</div>
                      <div>{{ formatTime(frame.timestamp) }}</div>
                    </h5>
                    <a
                      :href="frame.dataUrl"
                      :download="frame.filename"
                      class="btn btn-sm btn-primary px-4"
                    >
                      <i class="bi bi-download"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <transition name="fade">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="btn btn-warning back-to-top-btn shadow"
      >
        <i class="bi bi-arrow-up-short fs-4"></i>
      </button>
    </transition>
  </div>
</template>

<style scoped>
#input_area {
  cursor: pointer;
  transition: background-color 0.3s;
}

#input_area:hover,
.drag_shadow {
  background-color: rgb(16, 132, 221);
}

.video-player {
  max-height: 75vh;
}

.back-to-top-btn {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  padding: 0;
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
