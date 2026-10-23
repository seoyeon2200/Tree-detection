async function fetchResponse(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${url} 요청 실패 (HTTP ${response.status})`
    );
  }

  return response;
}

export async function fetchLAS() {
  const response = await fetchResponse("./api/las");
  return response.arrayBuffer();
}

export async function fetchTrees() {
  const response = await fetchResponse("./api/trees");
  const json = await response.json();

  if (!json || !Array.isArray(json.data)) {
    throw new Error(
      "나무 JSON에 data 배열이 없습니다."
    );
  }

  return json.data;
}