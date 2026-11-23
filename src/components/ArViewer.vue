<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ArHudOverlay from './ArHudOverlay.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close-ar'])

// DOM refs
const canvasContainer = ref(null)
const videoElement = ref(null)

// HUD reactive state
const isLoading = ref(true)
const loadingProgress = ref(0)
const errorMessage = ref('')
const cameraAlertMessage = ref('')
let cameraAlertTimer = null

const isAnimationPlaying = ref(true)
const showArrows = ref(true)
const activeHotspotId = ref(props.product.hotspots?.[0]?.id || null)
const isCameraActive = ref(false)
const isWebXrSupported = ref(false)
const isWebXrActive = ref(false)

// Three.js instances
let scene = null
let camera = null
let renderer = null
let controls = null
let clock = null
let animationFrameId = null

// 3D Objects & Animation
let currentGltfScene = null
let modelContainer = null
let mixer = null
let inspectionAction = null
let arrowsGroup = null
const arrowMeshes = []
let raycaster = null
let mouse = null
let mediaStream = null
let xrSession = null

function setCameraAlert(msg) {
  cameraAlertMessage.value = msg
  if (cameraAlertTimer) clearTimeout(cameraAlertTimer)
  if (msg) {
    cameraAlertTimer = setTimeout(() => {
      cameraAlertMessage.value = ''
    }, 7000)
  }
}

function dismissCameraAlert() {
  cameraAlertMessage.value = ''
  if (cameraAlertTimer) clearTimeout(cameraAlertTimer)
}

// Initialize Scene
function initScene() {
  const container = canvasContainer.value
  if (!container) return

  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  // 1. Scene com fundo transparente
  scene = new THREE.Scene()
  scene.background = null

  // 2. Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50)
  camera.position.set(0, 0.2, 0.85)

  // 3. Renderer com suporte à transparência total (alpha: true)
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.xr.enabled = true
  renderer.domElement.className = 'webgl-canvas'
  container.appendChild(renderer.domElement)

  // 4. OrbitControls para rotação, zoom e arrasto contínuos por cima da câmera
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 0.3
  controls.maxDistance = 2.5
  controls.maxPolarAngle = Math.PI / 2 + 0.15
  controls.target.set(0, 0, 0)

  // 5. Iluminação
  setupLighting()

  // 6. Relógio e Ferramentas de Interação
  clock = new THREE.Clock()
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 7. Grupos de Objetos 3D
  modelContainer = new THREE.Group()
  scene.add(modelContainer)

  arrowsGroup = new THREE.Group()
  scene.add(arrowsGroup)

  // Sombra de contato no chão para aterrar o objeto na cena
  createContactShadow()

  // Verificar suporte a WebXR Nativo
  checkWebXrSupport()

  // Iniciar Câmera Real automaticamente (com fallback suave para webcam ou modo 3D)
  startCamera()

  // Carregar Modelo GLB
  loadProductModel()

  // Listeners de Redimensionamento e Toque
  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown)

  // Iniciar Render Loop
  renderer.setAnimationLoop(renderLoop)
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 1.25)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(2, 4, 3)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x82E6F5, 1.0)
  fillLight.position.set(-2.5, 1.5, 2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0x8FB8FF, 1.4)
  rimLight.position.set(0, 3, -3)
  scene.add(rimLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0E1A5C, 0.8)
  hemiLight.position.set(0, 5, 0)
  scene.add(hemiLight)
}

function createContactShadow() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120)
  gradient.addColorStop(0, 'rgba(14, 26, 92, 0.45)')
  gradient.addColorStop(0.4, 'rgba(14, 26, 92, 0.18)')
  gradient.addColorStop(1, 'rgba(14, 26, 92, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  const shadowGeo = new THREE.PlaneGeometry(0.65, 0.65)
  const shadowMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.55
  })

  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
  shadowMesh.rotation.x = -Math.PI / 2
  shadowMesh.position.y = -0.22
  scene.add(shadowMesh)
}

async function checkWebXrSupport() {
  if (navigator.xr && navigator.xr.isSessionSupported) {
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar')
      isWebXrSupported.value = supported
    } catch {
      isWebXrSupported.value = false
    }
  } else {
    isWebXrSupported.value = false
  }
}

// Lógica Real da Câmera: Celular (traseira) e Notebook (webcam)
async function startCamera() {
  setCameraAlert('')

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraAlert('Seu navegador não tem suporte a acesso à câmera (requer HTTPS ou localhost).')
    isCameraActive.value = false
    return false
  }

  let stream = null

  // 1. Tentar primeiro com { facingMode: { ideal: 'environment' } }
  // No celular usa a câmera traseira; no notebook faz fallback automático para a webcam
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    })
  } catch (firstErr) {
    console.warn('Tentativa com facingMode ideal: environment falhou, tentando fallback simples video: true...', firstErr)
    try {
      // 2. Fallback para webcam padrão
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
    } catch (secondErr) {
      console.warn('Acesso à câmera não concedido ou bloqueado:', secondErr)
      if (secondErr.name === 'NotAllowedError' || secondErr.name === 'PermissionDeniedError') {
        setCameraAlert('Permissão de câmera não concedida. Habilite o acesso nas configurações do navegador para usar a Realidade Aumentada.')
      } else if (secondErr.name === 'NotFoundError' || secondErr.name === 'DevicesNotFoundError') {
        setCameraAlert('Nenhuma câmera detectada neste aparelho. Continuando no modo 3D interativo.')
      } else {
        setCameraAlert('Não foi possível iniciar a câmera. Continuando no modo 3D interativo.')
      }
      isCameraActive.value = false
      return false
    }
  }

  if (stream) {
    mediaStream = stream
    const video = videoElement.value
    if (video) {
      video.muted = true
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.srcObject = stream

      try {
        await video.play()
      } catch (playErr) {
        console.warn('Vídeo aguardando evento de reprodução:', playErr)
      }

      isCameraActive.value = true

      // Transparência ativa no Three.js
      if (renderer) {
        renderer.setClearColor(0x000000, 0)
      }
      if (scene) {
        scene.background = null
      }
      return true
    }
  }
  return false
}

// Encerramento Limpo da Câmera (apaga a luz da webcam imediatamente)
function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      track.stop()
    })
    mediaStream = null
  }
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.srcObject = null
  }
  isCameraActive.value = false

  if (renderer) {
    renderer.setClearColor(0x000000, 0)
  }
  if (scene) {
    scene.background = null
  }
}

// Toggle Câmera (Ligar / Desligar)
async function toggleCamera() {
  if (isCameraActive.value) {
    stopCamera()
  } else {
    await startCamera()
  }
}

// WebXR Nativo
async function launchWebXr() {
  if (!navigator.xr || !isWebXrSupported.value) return

  try {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: canvasContainer.value }
    })

    xrSession = session
    isWebXrActive.value = true
    stopCamera() // WebXR gerencia o hardware da câmera diretamente

    renderer.xr.setReferenceSpaceType('local')
    await renderer.xr.setSession(session)

    if (modelContainer) {
      modelContainer.position.set(0, -0.15, -0.6)
      modelContainer.scale.set(0.7, 0.7, 0.7)
    }

    session.addEventListener('end', () => {
      xrSession = null
      isWebXrActive.value = false
      resetModelPlacement()
      startCamera()
    })
  } catch (err) {
    console.error('Falha ao iniciar WebXR:', err)
  }
}

// Carregamento do Modelo GLB
function loadProductModel() {
  isLoading.value = true
  loadingProgress.value = 15
  errorMessage.value = ''

  const loader = new GLTFLoader()

  loader.load(
    props.product.modelUrl,
    (gltf) => {
      currentGltfScene = gltf.scene

      const box = new THREE.Box3().setFromObject(currentGltfScene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      currentGltfScene.position.x = -center.x
      currentGltfScene.position.y = -center.y
      currentGltfScene.position.z = -center.z

      const targetHeight = 0.42
      const scaleFactor = targetHeight / Math.max(size.y, 0.1)
      modelContainer.scale.set(scaleFactor, scaleFactor, scaleFactor)

      currentGltfScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness, 0.45)
            child.material.metalness = Math.max(child.material.metalness, 0.1)
            child.material.needsUpdate = true
          }
        }
      })

      modelContainer.add(currentGltfScene)

      setupAnimationMixer(gltf)
      create3dArrows()

      loadingProgress.value = 100
      setTimeout(() => {
        isLoading.value = false
      }, 300)
    },
    (xhr) => {
      if (xhr.total > 0) {
        const percent = Math.min(Math.round((xhr.loaded / xhr.total) * 100), 99)
        loadingProgress.value = percent
      } else {
        loadingProgress.value = Math.min(loadingProgress.value + 15, 90)
      }
    },
    (err) => {
      console.error('Erro ao carregar modelo GLB:', err)
      errorMessage.value = 'Não foi possível carregar o modelo 3D.'
      isLoading.value = false
    }
  )
}

function setupAnimationMixer(gltf) {
  mixer = new THREE.AnimationMixer(modelContainer)

  if (gltf.animations && gltf.animations.length > 0) {
    const clip = gltf.animations[0]
    inspectionAction = mixer.clipAction(clip)
  } else {
    const times = [0, 2, 4, 6, 8]
    const positionValues = [
      0, 0, 0,
      0, 0.02, 0,
      0, 0, 0,
      0, -0.015, 0,
      0, 0, 0
    ]
    const posTrack = new THREE.VectorKeyframeTrack('.position', times, positionValues)

    const rotTimes = [0, 2.5, 5, 7.5, 10]
    const q0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5)
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
    const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 1.5)
    const q4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2)

    const rotValues = [
      q0.x, q0.y, q0.z, q0.w,
      q1.x, q1.y, q1.z, q1.w,
      q2.x, q2.y, q2.z, q2.w,
      q3.x, q3.y, q3.z, q3.w,
      q4.x, q4.y, q4.z, q4.w
    ]
    const rotTrack = new THREE.QuaternionKeyframeTrack('.quaternion', rotTimes, rotValues)

    const showcaseClip = new THREE.AnimationClip('InspectionShowcase', 10, [posTrack, rotTrack])
    inspectionAction = mixer.clipAction(showcaseClip)
  }

  inspectionAction.setLoop(THREE.LoopRepeat)
  inspectionAction.play()
  isAnimationPlaying.value = true
}

function toggleAnimation() {
  if (!inspectionAction) return

  if (isAnimationPlaying.value) {
    inspectionAction.paused = true
    isAnimationPlaying.value = false
  } else {
    inspectionAction.paused = false
    isAnimationPlaying.value = true
  }
}

function create3dArrows() {
  while (arrowsGroup.children.length > 0) {
    arrowsGroup.remove(arrowsGroup.children[0])
  }
  arrowMeshes.length = 0

  if (!props.product.hotspots) return

  props.product.hotspots.forEach((hotspot) => {
    const singleArrowGroup = new THREE.Group()

    const coneGeo = new THREE.ConeGeometry(0.014, 0.038, 20)
    coneGeo.rotateX(Math.PI / 2)

    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x005EFF,
      emissive: 0x82E6F5,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8
    })
    const coneMesh = new THREE.Mesh(coneGeo, arrowMat)
    coneMesh.position.set(0, 0, -0.019)

    const shaftGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.035, 16)
    shaftGeo.rotateX(Math.PI / 2)
    const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat)
    shaftMesh.position.set(0, 0, 0.015)

    const ringGeo = new THREE.RingGeometry(0.012, 0.018, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x82E6F5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.set(0, 0, -0.04)

    const sprite = createNumberBadgeSprite(hotspot.index)
    sprite.position.set(0, 0.032, 0.02)
    sprite.scale.set(0.05, 0.05, 1)

    singleArrowGroup.add(coneMesh)
    singleArrowGroup.add(shaftMesh)
    singleArrowGroup.add(ringMesh)
    singleArrowGroup.add(sprite)

    const [px, py, pz] = hotspot.position
    const [tx, ty, tz] = hotspot.target || [0, py, 0]

    singleArrowGroup.position.set(px, py, pz)
    singleArrowGroup.lookAt(new THREE.Vector3(tx, ty, tz))

    singleArrowGroup.userData = {
      hotspotId: hotspot.id,
      basePos: new THREE.Vector3(px, py, pz),
      index: hotspot.index,
      coneMesh,
      shaftMesh,
      ringMesh
    }

    coneMesh.userData = singleArrowGroup.userData
    shaftMesh.userData = singleArrowGroup.userData
    ringMesh.userData = singleArrowGroup.userData
    sprite.userData = singleArrowGroup.userData

    arrowMeshes.push(singleArrowGroup)
    arrowsGroup.add(singleArrowGroup)
  })

  highlightActiveArrow(activeHotspotId.value)
}

function createNumberBadgeSprite(num) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.beginPath()
  ctx.arc(64, 64, 56, 0, Math.PI * 2)
  ctx.fillStyle = '#005EFF'
  ctx.fill()

  ctx.lineWidth = 8
  ctx.strokeStyle = '#82E6F5'
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 64px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(num), 64, 68)

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true
  })
  return new THREE.Sprite(spriteMat)
}

function highlightActiveArrow(hotspotId) {
  arrowMeshes.forEach((arrow) => {
    const isCurrent = arrow.userData.hotspotId === hotspotId
    const { coneMesh, shaftMesh, ringMesh } = arrow.userData

    if (coneMesh?.material) {
      coneMesh.material.emissive.setHex(isCurrent ? 0x82E6F5 : 0x0052CC)
      coneMesh.material.emissiveIntensity = isCurrent ? 1.0 : 0.4
    }
    if (ringMesh?.material) {
      ringMesh.material.opacity = isCurrent ? 1.0 : 0.5
      ringMesh.scale.setScalar(isCurrent ? 1.3 : 1.0)
    }
  })
}

function onCanvasPointerDown(event) {
  if (!arrowsGroup || !arrowsGroup.visible || !camera) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(arrowsGroup.children, true)

  if (intersects.length > 0) {
    const hitObj = intersects[0].object
    if (hitObj.userData && hitObj.userData.hotspotId) {
      selectHotspot(hitObj.userData.hotspotId)
    }
  }
}

function selectHotspot(hotspotId) {
  activeHotspotId.value = hotspotId
  highlightActiveArrow(hotspotId)

  const hotspot = props.product.hotspots.find(h => h.id === hotspotId)
  if (hotspot && controls) {
    const [px, py, pz] = hotspot.position
    controls.target.lerp(new THREE.Vector3(px * 0.4, py, pz * 0.4), 0.5)
  }
}

function toggleArrows() {
  showArrows.value = !showArrows.value
  if (arrowsGroup) {
    arrowsGroup.visible = showArrows.value
  }
}

function resetModelPlacement() {
  if (modelContainer) {
    modelContainer.position.set(0, 0, 0)
    modelContainer.rotation.set(0, 0, 0)
    modelContainer.scale.setScalar(0.42 / Math.max(1, 0.1))
  }
  if (controls) {
    controls.target.set(0, 0, 0)
    camera.position.set(0, 0.2, 0.85)
    controls.update()
  }
}

function renderLoop() {
  const delta = clock.getDelta()
  const time = clock.getElapsedTime()

  if (mixer) {
    mixer.update(delta)
  }

  if (arrowsGroup && arrowsGroup.visible) {
    arrowMeshes.forEach((arrow, i) => {
      const basePos = arrow.userData.basePos
      if (basePos) {
        arrow.position.y = basePos.y + Math.sin(time * 3 + i * 1.5) * 0.008
      }
    })
  }

  if (!isWebXrActive.value && controls) {
    controls.update()
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Descarte completo e encerramento limpo da cena e do hardware de câmera
function disposeScene() {
  if (xrSession) {
    xrSession.end().catch(() => {})
    xrSession = null
  }

  // Parar faixas de vídeo da câmera e apagar webcam imediatamente
  stopCamera()

  if (cameraAlertTimer) {
    clearTimeout(cameraAlertTimer)
    cameraAlertTimer = null
  }

  if (renderer) {
    renderer.setAnimationLoop(null)
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  window.removeEventListener('resize', onWindowResize)
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('pointerdown', onCanvasPointerDown)
  }

  if (mixer) {
    mixer.stopAllAction()
    mixer = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(disposeMaterial)
        } else {
          disposeMaterial(obj.material)
        }
      }
    })
    while (scene.children.length > 0) {
      scene.remove(scene.children[0])
    }
    scene = null
  }

  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    renderer = null
  }
}

function disposeMaterial(mat) {
  if (!mat) return
  if (mat.map) mat.map.dispose()
  if (mat.lightMap) mat.lightMap.dispose()
  if (mat.bumpMap) mat.bumpMap.dispose()
  if (mat.normalMap) mat.normalMap.dispose()
  if (mat.specularMap) mat.specularMap.dispose()
  if (mat.roughnessMap) mat.roughnessMap.dispose()
  if (mat.metalnessMap) mat.metalnessMap.dispose()
  if (mat.alphaMap) mat.alphaMap.dispose()
  if (mat.emissiveMap) mat.emissiveMap.dispose()
  mat.dispose()
}

onMounted(() => {
  initScene()
})

onBeforeUnmount(() => {
  disposeScene()
})

watch(() => props.product, () => {
  disposeScene()
  initScene()
})
</script>

<template>
  <div class="ar-viewer-root">
    <!-- Stream de Câmera Real (Webcam / Câmera Traseira) posicionado atrás do canvas -->
    <video
      ref="videoElement"
      class="camera-stream-video"
      :class="{ visible: isCameraActive && !isWebXrActive }"
      playsinline
      autoplay
      muted
    ></video>

    <!-- Fundo Estúdio Corporativo Escuro (ativo quando câmera está desligada) -->
    <div
      class="studio-background"
      :class="{ hidden: (isCameraActive || isWebXrActive) }"
    >
      <div class="studio-ambient-orb orb-1"></div>
      <div class="studio-ambient-orb orb-2"></div>
      <div class="studio-grid-floor"></div>
    </div>

    <!-- Container do Canvas WebGL Three.js Transparente -->
    <div ref="canvasContainer" class="canvas-mount-point"></div>

    <!-- HUD Sobreposto -->
    <ArHudOverlay
      :product="product"
      :is-animation-playing="isAnimationPlaying"
      :show-arrows="showArrows"
      :active-hotspot-id="activeHotspotId"
      :is-camera-active="isCameraActive"
      :camera-alert-message="cameraAlertMessage"
      :is-web-xr-supported="isWebXrSupported"
      :is-web-xr-active="isWebXrActive"
      :is-loading="isLoading"
      :loading-progress="loadingProgress"
      :error-message="errorMessage"
      @close-ar="$emit('close-ar')"
      @toggle-animation="toggleAnimation"
      @toggle-arrows="toggleArrows"
      @select-hotspot="selectHotspot"
      @toggle-camera="toggleCamera"
      @reset-view="resetModelPlacement"
      @launch-webxr="launchWebXr"
      @dismiss-camera-alert="dismissCameraAlert"
    />
  </div>
</template>

<style scoped>
.ar-viewer-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 1000;
  background-color: var(--bg-navy-primary);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

/* Câmera real ao vivo no fundo */
.camera-stream-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.camera-stream-video.visible {
  opacity: 1;
  z-index: 2;
}

/* Fundo Estúdio Corporativo (#0E1A5C) quando a câmera estiver desligada */
.studio-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: radial-gradient(circle at 50% 35%, #1C3494 0%, #0E1A5C 70%, #080E33 100%);
  opacity: 1;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.studio-background.hidden {
  opacity: 0;
  visibility: hidden;
}

.studio-grid-floor {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35%;
  background: radial-gradient(ellipse at 50% 100%, rgba(0, 94, 255, 0.12) 0%, transparent 70%);
}

/* WebGL Canvas Transparente */
.canvas-mount-point {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  z-index: 10;
  touch-action: none;
}

:deep(.webgl-canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
