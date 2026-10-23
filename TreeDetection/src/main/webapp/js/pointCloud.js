import * as THREE from "three";
import { scene } from "./scene.js";

export function createPointCloud(data) {
  const positions = data.positions;

  if (!positions || positions.length < 3) {
    throw new Error("LAS 점군 좌표가 없습니다.");
  }

  if (positions.length % 3 !== 0) {
    throw new Error("LAS 좌표 배열 형식이 올바르지 않습니다.");
  }

  // 원본 좌표의 경계 상자를 계산
  const sourceGeometry = new THREE.BufferGeometry();

  sourceGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  sourceGeometry.computeBoundingBox();

  const sourceBox = sourceGeometry.boundingBox;

  if (!sourceBox || sourceBox.isEmpty()) {
    sourceGeometry.dispose();
    throw new Error("LAS 점군의 좌표 범위를 계산할 수 없습니다.");
  }

  // LAS 원본 좌표의 중심을 공통 원점으로 사용
  const origin = sourceBox.getCenter(new THREE.Vector3());

  // 원본 좌표를 수정하지 않고 별도 배열 생성
  const localPositions = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    localPositions[i] = positions[i] - origin.x;
    localPositions[i + 1] = positions[i + 1] - origin.y;
    localPositions[i + 2] = positions[i + 2] - origin.z;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(localPositions, 3)
  );

  if (data.colors) {
    if (data.colors.length !== positions.length) {
      sourceGeometry.dispose();
      geometry.dispose();
      throw new Error("LAS 좌표와 색상 배열의 길이가 다릅니다.");
    }

    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(data.colors, 3)
    );
  }

  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: Boolean(data.colors),
    color: data.colors ? 0xffffff : 0x62d5fa,
    sizeAttenuation: false
  });

  const pointCloud = new THREE.Points(geometry, material);

  scene.add(pointCloud);

  const sphere = geometry.boundingSphere;

  sourceGeometry.dispose();

  return {
    pointCloud,
    origin,
    center: sphere.center.clone(),
    radius: sphere.radius,
    pointCount: positions.length / 3
  };
}
