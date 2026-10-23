import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";

const viewer = document.getElementById("viewer");

// Scene
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10151f);

// Camera
export const camera = new THREE.PerspectiveCamera(
  60, viewer.clientWidth / viewer.clientHeight, 0.1, 1000000
);

camera.position.set(0, -100, 100);

// Renderer
export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

viewer.appendChild(renderer.domElement);

// Browser 크기
export function resizeViewer() {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;

  if (width <= 0 || height <= 0) {
    return;
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, false);
  controls.handleResize();
}

// Controls
export const controls = new TrackballControls(
  camera, renderer.domElement
);

controls.rotateSpeed = 4.0;
controls.zoomSpeed = 0.7;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = false;

// viewer 영역 크기가 변경될 때 화면 크기도 갱신
const resizeObserver = new ResizeObserver(() => {
  resizeViewer();
});

resizeObserver.observe(viewer);

// 최초 화면 크기 적용
resizeViewer();

// Animation
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();