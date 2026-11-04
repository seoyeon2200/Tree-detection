import * as THREE from "three";

import {scene,camera,controls,resizeViewer} from "./scene.js";
import { fetchLAS, fetchTrees } from "./api.js";
import { parseLAS } from "./lasParser.js";
import { createPointCloud } from "./pointCloud.js";
import { createTreeBoxes } from "./treeBoxes.js";

const treeList = document.getElementById("tree-list");
const detectedTreeCount = document.getElementById("detected-tree-count");
const treeCount = document.getElementById("tree-count");
const detectedListCount = document.getElementById("detected-list-count");
const treePagination = document.getElementById("tree-pagination");
const PAGE_SIZE = 5;
const treeDetail = document.getElementById("tree-detail");

let currentPage = 1;  
let trees = [];
let selectedTreeId = null;
let treeBoxController = null;


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

function selectTree(tree) {
  if (!tree) return;

  // 선택한 수목 ID 저장
  selectedTreeId = String(tree.treeId ?? "");

  // 전체 목록에서 선택한 수목 찾기
  const selectedIndex = trees.findIndex(
    item => String(item.treeId ?? "") === selectedTreeId
  );

  // 해당 수목이 있는 페이지로 자동 이동
  if (selectedIndex !== -1) {
    currentPage = Math.floor(selectedIndex / PAGE_SIZE) + 1;
  }

  // 객체 탐지 결과 목록 다시 렌더링
  renderTreeList();

  // 목록에서 선택된 행 찾기
  const selectedItem = Array.from(
    treeList?.querySelectorAll(".tree-item") ?? []
  ).find(item => item.dataset.treeId === selectedTreeId);

  // 선택된 행 강조 및 스크롤 이동
  if (selectedItem) {
    selectedItem.classList.add("selected", "is-active");

    selectedItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  // 객체 상세 정보 표시
  renderTreeDetail(tree);

  // 3D 상자 선택 (빨간색 변경)
  const result = treeBoxController?.selectTree(tree);

  return result;
}

function renderTreeList() {
  if (!treeList) return;

  treeList.replaceChildren();

  // 전체 수목 개수 표시
  if (treeCount) {
    treeCount.textContent = trees.length.toLocaleString();
  }

  if (detectedListCount) {
    detectedListCount.textContent = trees.length.toLocaleString();
  }

  // 전체 페이지 수
  const totalPages = Math.max(
    1,
    Math.ceil(trees.length / PAGE_SIZE)
  );

  currentPage = Math.min(
    Math.max(1, currentPage),
    totalPages
  );

  // 현재 페이지에 표시할 데이터
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageTrees = trees.slice(startIndex, endIndex);
  const fragment = document.createDocumentFragment();

  pageTrees.forEach((tree, index) => {

    const treeId = String(tree.treeId ?? "");
    const row = document.createElement("tr");

    row.className = "tree-item";
    row.dataset.detectType = "tree";
    row.dataset.treeId = treeId;

    if (treeId === selectedTreeId) {
      row.classList.add("selected", "is-active");
    }

    // 1. 순번
    const numberCell = document.createElement("td");
    numberCell.textContent = startIndex + index + 1;

    // 2. 유형
    const typeCell = document.createElement("td");

    const typeSpan = document.createElement("span");
    typeSpan.className = "l-detect__type";
    typeSpan.dataset.type = "tree";
    typeSpan.textContent = "수목";

    typeCell.appendChild(typeSpan);

    // 3. 위치
    const coordCell = document.createElement("td");

    const coord = document.createElement("span");
    coord.className = "l-detect__coord";

    const x = document.createElement("span");
    x.textContent = `X: ${displayValue(tree.easting)}`;

    const y = document.createElement("span");
    y.textContent = `Y: ${displayValue(tree.northing)}`;

    coord.append(x, y);
    coordCell.appendChild(coord);

    // 4. 높이(m)
    const heightCell = document.createElement("td");
    heightCell.textContent = displayValue(tree.treeHeightM);

    // 5. 수관폭(m)
    const widthCell = document.createElement("td");
    widthCell.textContent = displayValue(tree.crownWidthM);

    row.append(
      numberCell,
      typeCell,
      coordCell,
      heightCell,
      widthCell
    );

    // 수목 선택
    row.addEventListener("click", () => {
      selectTree(tree);
    });

    fragment.appendChild(row);
  });

  // 데이터가 없는 경우
  if (pageTrees.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "수목 정보가 없습니다.";

    row.appendChild(cell);
    fragment.appendChild(row);
  }

  treeList.appendChild(fragment);

  // 페이지네이션 갱신
  renderPagination();
}

function renderPagination() {
  if (!treePagination) return;

  treePagination.replaceChildren();

  const totalPages = Math.max(
    1,
    Math.ceil(trees.length / PAGE_SIZE)
  );

  const PAGE_GROUP_SIZE = 5;

  function createButton(text, page, disabled = false, active = false) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "c-paging__btn";
    button.textContent = text;
    button.disabled = disabled;

    if (active) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      if (disabled || page === currentPage) return;

      currentPage = page;
      renderTreeList();

      const tableWrap = document.querySelector(
        ".l-detect__table-wrap"
      );

      if (tableWrap) {
        tableWrap.scrollTop = 0;
      }
    });

    return button;
  }

  // 현재 페이지 그룹 계산
  const startPage =
    Math.floor((currentPage - 1) / PAGE_GROUP_SIZE)
    * PAGE_GROUP_SIZE + 1;

  const endPage = Math.min(
    startPage + PAGE_GROUP_SIZE - 1,
    totalPages
  );

  // 처음 / 이전
  treePagination.appendChild(
    createButton("«", 1, currentPage === 1)
  );

  treePagination.appendChild(
    createButton("‹", currentPage - 1, currentPage === 1)
  );

  // 페이지 번호
  for (let page = startPage; page <= endPage; page++) {
    treePagination.appendChild(
      createButton(page, page, false, page === currentPage)
    );
  }

  // 다음 / 마지막
  treePagination.appendChild(
    createButton("›", currentPage + 1, currentPage === totalPages)
  );

  treePagination.appendChild(
    createButton("»", totalPages, currentPage === totalPages)
  );
}

function renderTreeDetail(tree) {

  if (!treeDetail) return;

  // 기존 상세정보 삭제
  treeDetail.replaceChildren();

  if (!tree) {
    treeDetail.textContent = "선택된 나무가 없습니다.";
    return;
  }

  // 상세정보 항목 생성 함수
  function createInfoRow(label, value) {

    const row = document.createElement("div");
    row.className = "l-detect__info-row";

    const labelDiv = document.createElement("div");
    labelDiv.className = "l-detect__info-label";
    labelDiv.textContent = label;

    const valueDiv = document.createElement("div");
    valueDiv.className = "l-detect__info-value";

    if (value instanceof Node) {
      valueDiv.appendChild(value);
    } else {
      valueDiv.textContent = displayValue(value);
    }

    row.append(labelDiv, valueDiv);

    treeDetail.appendChild(row);
  }

  // 수종
  createInfoRow(
    "수종 코드",
    tree.speciesCode
  );

  // 위치좌표
  const coord = document.createElement("span");
  coord.className = "l-detect__coord";

  const x = document.createElement("span");
  x.textContent = `X: ${displayValue(tree.easting)}`;

  const y = document.createElement("span");
  y.textContent = `Y: ${displayValue(tree.northing)}`;

  coord.append(x, y);

  createInfoRow("위치좌표", coord);

  // 높이
  createInfoRow(
    "높이 (H)",
    tree.treeHeightM != null && tree.treeHeightM !== ""
      ? `${tree.treeHeightM} m`
      : "-"
  );

  // 수관폭
  createInfoRow(
    "수관폭 (W)",
    tree.crownWidthM != null && tree.crownWidthM !== ""
      ? `${tree.crownWidthM} m`
      : "-"
  );
}

async function loadViewer() {
  const loading = document.getElementById("las-loading");
  const loadingText = document.getElementById("las-loading-text");
  
  loading?.classList.remove("hidden");
  
  if (loadingText) {
        loadingText.textContent = "파일을 불러오는 중입니다...";
  }
  
  try {
    const buffer = await fetchLAS();
    const data = parseLAS(buffer);

    if (!data.positions || data.positions.length === 0) {
      throw new Error("LAS 점군 데이터가 비어 있습니다.");
    }

    trees = await fetchTrees();
    
    // 총 탐지 수목 개체수 표시
	detectedTreeCount.textContent = trees.length.toLocaleString();
	
	// JSON 데이터로 목록 생성
	renderTreeList();
	
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
      pointCloudResult.radius * 0.2,
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
    
    loading?.classList.add("hidden");
	
  	} catch (error) {
    console.error(error);
    if (loadingText) {
      loadingText.textContent = "LAS 데이터를 불러오지 못했습니다.";
    }
  }
}

loadViewer();
