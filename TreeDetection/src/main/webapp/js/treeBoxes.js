import * as THREE from "three";
import { scene } from "./scene.js";

const NORMAL_COLOR = 0x4F7942;
const SELECTED_COLOR = 0xFF3030;

export function createTreeBoxes(trees, origin) {
  const treeBoxMap = new Map();
  const treeDataMap = new Map();

  let selectedTreeId = null;
  let hoveredTreeId = null;

  let created = 0;
  let skipped = 0;

  trees.forEach((tree) => {
    const x = Number(tree.easting);
    const y = Number(tree.northing);
    const z = Number(tree.elevationM);

    const height = Number(tree.treeHeightM);
    const width = Number(tree.crownWidthEwM ?? tree.crownWidthM);
    const depth = Number(tree.crownWidthSnM ?? tree.crownWidthM);

    const treeId = String(tree.treeId ?? "");

    if (
      !treeId ||
      ![x, y, z, height, width, depth].every(Number.isFinite) ||
      height <= 0 ||
      width <= 0 ||
      depth <= 0
    ) {
      console.warn("유효하지 않은 나무 데이터:", tree.treeId);
      skipped++;
      return;
    }

    if (treeBoxMap.has(treeId)) {
      console.warn("중복 treeId:", treeId);
      skipped++;
      return;
    }

    const geometry = new THREE.BoxGeometry(width, depth, height);
    const edges = new THREE.EdgesGeometry(geometry);

    const treeBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: NORMAL_COLOR
      })
    );

    treeBox.position.set(
      x - origin.x,
      y - origin.y,
      z - origin.z + height / 2
    );

    treeBox.name = treeId;

    treeBox.userData = {
      treeId,
      label: tree.label,
      speciesCode: tree.speciesCode,
      easting: x,
      northing: y,
      elevationM: z
    };

    scene.add(treeBox);

    treeBoxMap.set(treeId, treeBox);
    treeDataMap.set(treeId, tree);

    geometry.dispose();
    created++;
  });

  // 선택 또는 마우스가 올라간 상자는 빨간색
  function updateColor(treeId) {
    if (treeId === null) return;

    const box = treeBoxMap.get(treeId);
    if (!box) return;

    const highlighted =
      treeId === selectedTreeId ||
      treeId === hoveredTreeId;

    box.material.color.setHex(
      highlighted ? SELECTED_COLOR : NORMAL_COLOR
    );
  }

  function setHoveredTree(treeId) {
    const previousId = hoveredTreeId;
    hoveredTreeId = treeId;

    updateColor(previousId);
    updateColor(hoveredTreeId);
  }

  function selectTree(tree) {
    const previousId = selectedTreeId;
    selectedTreeId = String(tree.treeId ?? "");

    updateColor(previousId);
    updateColor(selectedTreeId);

    return {
      tree,
      treeBox: treeBoxMap.get(selectedTreeId) ?? null,
      treeId: selectedTreeId,
      easting: Number(tree.easting),
      northing: Number(tree.northing),
      elevationM: Number(tree.elevationM)
    };
  }

  // 카메라에서 마우스 방향으로 광선을 쏘아 상자 감지
  function bindPointerEvents(canvas, camera, onTreeClick) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // 선에서 이 거리 이내이면 감지. 좌표 단위가 m이면 0.4m
    raycaster.params.Line.threshold = 0.4;

    const boxes = [...treeBoxMap.values()];
    const previousCursor = canvas.style.cursor;

    let pointerDown = null;

    function findTreeId(event) {
      const rect = canvas.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) return null;

      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      scene.updateMatrixWorld(true);
      camera.updateWorldMatrix(true, false);

      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(boxes, false);

      return hits.length > 0
        ? hits[0].object.userData.treeId
        : null;
    }

    function onPointerMove(event) {
      // 드래그 중에는 카메라 조작에 집중
      if (event.buttons !== 0) {
        setHoveredTree(null);
        canvas.style.cursor = previousCursor;
        return;
      }

      const treeId = findTreeId(event);

      setHoveredTree(treeId);
      canvas.style.cursor = treeId ? "pointer" : previousCursor;
    }

    function onPointerLeave() {
      setHoveredTree(null);
      canvas.style.cursor = previousCursor;
    }

    function onPointerDown(event) {
      if (event.button !== 0 || !event.isPrimary) return;

      pointerDown = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
    }

    function onPointerUp(event) {
      const start = pointerDown;
      pointerDown = null;

      if (
        !start ||
        start.pointerId !== event.pointerId ||
        event.button !== 0
      ) {
        return;
      }

      // 드래그로 화면을 회전한 경우 클릭 처리하지 않음
      const distance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y
      );

      if (distance > 5) return;

      const treeId = findTreeId(event);
      if (treeId === null) return;

      const tree = treeDataMap.get(treeId);

      if (tree) {
        onTreeClick(tree);
      }
    }

    function onPointerCancel() {
      pointerDown = null;
      onPointerLeave();
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);

    // 필요할 때 이벤트 해제
    return function unbind() {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);

      pointerDown = null;
      onPointerLeave();
    };
  }

  return {
    created,
    skipped,
    total: trees.length,
    selectTree,
    bindPointerEvents,
    getBox: (treeId) => treeBoxMap.get(String(treeId)) ?? null
  };
}