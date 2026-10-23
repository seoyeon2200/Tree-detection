export function parseLAS(buffer) {
  const view = new DataView(buffer);

  if (view.byteLength < 5) {
    throw new Error("LAS 응답 데이터가 너무 짧습니다.");
  }

  // Java에서 기록한 헤더
  const pointCount = view.getUint32(0, false);
  const hasRGB = view.getUint8(4) === 1;

  const bytesPerPoint = hasRGB ? 18 : 12;
  const expectedLength = 5 + pointCount * bytesPerPoint;

  if (view.byteLength < expectedLength) {
    throw new Error("LAS 점군 데이터가 불완전합니다.");
  }

  const positions = new Float32Array(pointCount * 3);

  const colors = hasRGB
    ? new Float32Array(pointCount * 3)
    : null;

  let offset = 5;
  let maxRGB = 0;

  for (let i = 0; i < pointCount; i++) {
    const j = i * 3;

    positions[j] = view.getFloat32(offset, false);
    offset += 4;

    positions[j + 1] = view.getFloat32(offset, false);
    offset += 4;

    positions[j + 2] = view.getFloat32(offset, false);
    offset += 4;

    if (colors) {
      for (let channel = 0; channel < 3; channel++) {
        const value = view.getUint16(offset, false);

        colors[j + channel] = value;
        maxRGB = Math.max(maxRGB, value);

        offset += 2;
      }
    }
  }

  // RGB 범위를 0~1로 정규화
  if (colors) {
    const divisor = maxRGB <= 255 ? 255 : 65535;

    for (let i = 0; i < colors.length; i++) {
      colors[i] /= divisor;
      colors[i] = Math.min(
        1,
        Math.pow(colors[i], 1.5)
      );
    }
  }

  return { positions, colors };
}