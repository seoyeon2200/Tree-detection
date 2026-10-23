import * as THREE from "three";

import {scene,camera,controls,resizeViewer} from "./scene.js";
import { fetchLAS, fetchTrees } from "./api.js";
import { parseLAS } from "./lasParser.js";
import { createPointCloud } from "./pointCloud.js";
import { createTreeBoxes } from "./treeBoxes.js";

const status = document.getElementById("status");
const treeList = document.getElementById("tree-list");
const treeCount = document.getElementById("tree-count");
const treeDetail = document.getElementById("tree-detail");

let trees = [];
let selectedTreeId = null;
let treeBoxController = null;

// JSON 필드명과 화면에 표시할 한글 이름
const FIELD_LABELS = {
  treeId: "수목 아이디",
  label: "라벨",
  speciesCode: "수종 코드",
  emdCd: "법정동 코드",
  sido: "시도",
  sigungu: "시군구",
  eupmyeondong: "읍면동",
  sectionId: "실증구간 아이디",
  side: "식재 방향(1:좌측, 2:우측)",
  easting: "동측 좌표(X)",
  northing: "북측 좌표(Y)",
  elevationM: "표고(m)",
  crsEpsg: "좌표계 EPSG 코드",
  treeHeightM: "수고(m)",
  dbhCm: "흉고직경(cm)",
  crownWidthM: "평균 수관폭(m)",
  crownWidthSnM: "남북 수관폭(m)",
  crownWidthEwM: "동서 수관폭(m)",
  crownAreaM2: "수관 면적(m²)"
};

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return String(value);
}

function renderTreeList() {
  treeList.replaceChildren();

  // 전체 나무 개수 표시
  treeCount.textContent = `${trees.length.toLocaleString()}개`;

  if (trees.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "나무 정보가 없습니다.";
    treeList.appendChild(message);
    return;
  }

  const fragment = document.createDocumentFragment();

  // 검색 필터 없이 전체 나무 목록 표시
  trees.forEach((tree) => {
    const treeId = String(tree.treeId ?? "");
    const button = document.createElement("button");

    button.type = "button";
    button.className = "tree-item";

    if (treeId === selectedTreeId) {
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    const label = document.createElement("span");
    label.className = "tree-item-label";
    label.textContent = displayValue(tree.label);

    const meta = document.createElement("span");
    meta.className = "tree-item-meta";
    meta.textContent =
      `ID: ${displayValue(tree.treeId)} · ` +
      `수종: ${displayValue(tree.speciesCode)}`;

    button.append(label, meta);

    button.addEventListener("click", () => {
      selectTree(tree);
    });
    fragment.appendChild(button);
  });

  treeList.appendChild(fragment);

  console.log("BOTTOM 목록 생성 완료");
  console.log(
    "실제 목록 항목 개수:",
    treeList.querySelectorAll(".tree-item").length
  );
}

function renderTreeDetail(tree) {
  treeDetail.replaceChildren();

  if (!tree) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "선택된 나무가 없습니다.";
    treeDetail.appendChild(message);
    return;
  }

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  Object.entries(FIELD_LABELS).forEach(([field, label]) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    const value = document.createElement("td");

    heading.scope = "row";
    heading.textContent = label;
    value.textContent = displayValue(tree[field]);

    row.append(heading, value);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  treeDetail.appendChild(table);
}

function selectTree(tree) {
  if (!tree) return;

  // 선택한 나무 ID 저장
  selectedTreeId = String(tree.treeId ?? "");

  // 왼쪽 목록에서 선택한 카드 강조
  renderTreeList();
  
  // 선택된 나무가 목록의 가운데로 오도록 스크롤
  const selectedItem = treeList.querySelector(".tree-item.selected");

  if (selectedItem) {
    treeList.scrollTo({
	  top:
	    treeList.scrollTop +
	    selectedItem.getBoundingClientRect().top -
	    treeList.getBoundingClientRect().top -
	    treeList.clientTop -
	    treeList.clientHeight / 2 +
	    selectedItem.offsetHeight / 2,
	  behavior: "instant"
	});
  }
  // 오른쪽에 선택한 나무의 상세 정보 표시
  renderTreeDetail(tree);
  
  // 선택한 3D 상자를 빨간색으로 변경
  const result = treeBoxController?.selectTree(tree);
  
  status.textContent =
    `선택한 나무: ${displayValue(tree.label)} ` +
    `(${selectedTreeId})`;
    
  return result;
}

async function loadViewer() {
  try {
    status.textContent = "LAS 점군을 불러오는 중...";

    const buffer = await fetchLAS();
    const data = parseLAS(buffer);
    
    console.log("LAS 파일 로딩 성공:", buffer.byteLength, "bytes");
	console.log("LAS 점 개수:", data.positions.length / 3);

    if (!data.positions || data.positions.length === 0) {
      throw new Error("LAS 점군 데이터가 비어 있습니다.");
    }

    status.textContent = "나무 JSON을 불러오는 중...";

    trees = await fetchTrees();
    
    // 데이터를 받으면 바로 목록 표시
	selectedTreeId = null;
	renderTreeList();
	
	// 최초에는 상세 정보 비우기
	treeDetail.replaceChildren();
	    
    console.log("나무 JSON 로딩 성공");
	console.log("전체 나무 개수:", trees.length);
	console.log("첫 번째 나무 데이터:", trees[0]);

    // 점군 중심을 기준 원점으로 변환
    const pointCloudResult = createPointCloud(data);

    // 같은 원점을 사용해 나무 상자를 배치
	treeBoxController = createTreeBoxes(
	  trees,
	  pointCloudResult.origin
	);
	
	// 3D 상자를 클릭하면 main.js의 selectTree() 호출
	const canvas = document.querySelector("#viewer canvas");
	
	if (!canvas) {
	  throw new Error("3D 화면의 canvas를 찾을 수 없습니다.");
	}
	treeBoxController.bindPointerEvents(
	  canvas,
	  camera,
	  (tree) => selectTree(tree)
	);
	
    // 초기 카메라를 점군 중심으로 설정
    const center = pointCloudResult.center;
    const distance = Math.max(
      pointCloudResult.radius * 2.5,
      1
    );

    controls.target.copy(center);

    camera.position.set(
      center.x + distance,
      center.y - distance,
      center.z + distance
    );

    camera.lookAt(center);
    controls.update();
    resizeViewer();
	
	status.textContent =
      `표시 완료 | 점군 ${pointCloudResult.pointCount.toLocaleString()}개 | ` +
      `나무 상자 ${treeBoxController.created}/${treeBoxController.total}개 | ` +
      `제외 ${treeBoxController.skipped}개`;
  	} catch (error) {
    console.error(error);
    status.textContent = `오류: ${error.message}`;
  }
}

loadViewer();
