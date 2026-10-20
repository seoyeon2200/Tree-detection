package lasviewer;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/las")
public class LasFileServlet extends HttpServlet {
    private static final int MAX_POINTS = 1_000_000;
    private static final int MIN_HEADER_SIZE = 227;

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String path = "/data/GJ-S1_Tree.las";

        try (InputStream raw =
                     getServletContext().getResourceAsStream(path)) {

            if (raw == null) {
                response.sendError(
                    HttpServletResponse.SC_NOT_FOUND,
                    "LAS 파일을 찾을 수 없습니다."
                );
                return;
            }

            try (DataInputStream input = new DataInputStream(
                    new BufferedInputStream(raw, 1024 * 1024))) {

                // 1. LAS 기본 헤더 읽기
                byte[] first = new byte[MIN_HEADER_SIZE];
                input.readFully(first);

                if (first[0] != 'L' || first[1] != 'A'
                        || first[2] != 'S' || first[3] != 'F') {
                    throw new IOException("올바른 LAS 파일이 아닙니다.");
                }

                ByteBuffer initial = ByteBuffer.wrap(first)
                        .order(ByteOrder.LITTLE_ENDIAN);

                int headerSize =
                        Short.toUnsignedInt(initial.getShort(94));

                if (headerSize < MIN_HEADER_SIZE) {
                    throw new IOException("LAS 헤더 크기가 올바르지 않습니다.");
                }

                byte[] header = new byte[headerSize];
                System.arraycopy(first, 0, header, 0, first.length);

                if (headerSize > first.length) {
                    input.readFully(
                        header, first.length, headerSize - first.length
                    );
                }

                ByteBuffer h = ByteBuffer.wrap(header)
                        .order(ByteOrder.LITTLE_ENDIAN);

                long pointOffset =
                        Integer.toUnsignedLong(h.getInt(96));

                int formatByte = Byte.toUnsignedInt(header[104]);

                // LAS 압축 여부 확인
                if ((formatByte & 0x80) != 0) {
                    throw new IOException(
                        "압축된 LAS 파일은 지원하지 않습니다."
                    );
                }

                int format = formatByte & 0x3F;
                int recordLength =
                        Short.toUnsignedInt(h.getShort(105));

                long totalPoints =
                        Integer.toUnsignedLong(h.getInt(107));

                // LAS 1.4 확장 점 개수 필드
                if (totalPoints == 0 && headerSize >= 255) {
                    totalPoints = h.getLong(247);

                    if (totalPoints < 0) {
                        throw new IOException(
                            "지원할 수 없는 LAS 점 개수입니다."
                        );
                    }
                }

                if (totalPoints == 0) {
                    throw new IOException("LAS 파일에 점이 없습니다.");
                }

                if (recordLength < 12) {
                    throw new IOException("Point Record 길이가 올바르지 않습니다.");
                }

                if (pointOffset < headerSize) {
                    throw new IOException("LAS Point Data 위치가 올바르지 않습니다.");
                }

                // 2. XYZ 좌표 스케일 및 오프셋
                double scaleX = h.getDouble(131);
                double scaleY = h.getDouble(139);
                double scaleZ = h.getDouble(147);

                double originX = h.getDouble(155);
                double originY = h.getDouble(163);
                double originZ = h.getDouble(171);

                // 3. RGB 필드 위치
                int rgbOffset;

                switch (format) {
                    case 2:
                        rgbOffset = 20;
                        break;
                    case 3:
                        rgbOffset = 28;
                        break;
                    case 7:
                    case 8:
                        rgbOffset = 30;
                        break;
                    case 0:
                    case 1:
                    case 6:
                        rgbOffset = -1;
                        break;
                    default:
                        throw new IOException(
                            "지원하지 않는 Point Format: " + format
                        );
                }

                boolean hasRGB = rgbOffset >= 0;

                if (hasRGB && recordLength < rgbOffset + 6) {
                    throw new IOException("RGB 데이터 위치가 올바르지 않습니다.");
                }

                // 4. 점군 데이터 시작 위치까지 이동
                skipFully(input, pointOffset - headerSize);

                int pointCount = (int) Math.min(
                    totalPoints, (long) MAX_POINTS
                );

                double step = (double) totalPoints / pointCount;

                byte[] record = new byte[recordLength];

                response.setContentType(
                    "application/octet-stream"
                );
                response.setHeader(
                    "Cache-Control", "no-store"
                );

                // 응답 헤더: 점 개수 4바이트 + RGB 여부 1바이트
                DataOutputStream output = new DataOutputStream(
                    response.getOutputStream()
                );

                output.writeInt(pointCount);
                output.writeByte(hasRGB ? 1 : 0);

                // 5. 일정 간격으로 점 선택 및 전송
                long previousIndex = -1;

                for (int i = 0; i < pointCount; i++) {

                    long sourceIndex =
                            (long) Math.floor(i * step);

                    long recordsToSkip =
                            sourceIndex - previousIndex - 1;

                    skipFully(
                        input, recordsToSkip * recordLength
                    );

                    input.readFully(record);
                    previousIndex = sourceIndex;

                    int ix = readIntLE(record, 0);
                    int iy = readIntLE(record, 4);
                    int iz = readIntLE(record, 8);

                    float x = (float) (ix * scaleX + originX);
                    float y = (float) (iy * scaleY + originY);
                    float z = (float) (iz * scaleZ + originZ);

                    // XYZ: 각각 4바이트
                    output.writeFloat(x);
                    output.writeFloat(y);
                    output.writeFloat(z);

                    if (hasRGB) {
                        // RGB: 각각 2바이트
                        output.writeShort(
                            readUnsignedShortLE(record, rgbOffset)
                        );
                        output.writeShort(
                            readUnsignedShortLE(record, rgbOffset + 2)
                        );
                        output.writeShort(
                            readUnsignedShortLE(record, rgbOffset + 4)
                        );
                    }
                }

                output.flush();

                System.out.println(
                    "LAS 전체 점 개수: " + totalPoints
                );
                System.out.println(
                    "전송 점 개수: " + pointCount
                );
            }
        } catch (IOException e) {
            if (!response.isCommitted()) {
                response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "LAS 파일 처리 실패: " + e.getMessage()
                );
            } else {
                throw e;
            }
        }
    }

    private static int readIntLE(byte[] data, int offset) {
        return (data[offset] & 0xFF)
             | ((data[offset + 1] & 0xFF) << 8)
             | ((data[offset + 2] & 0xFF) << 16)
             | ((data[offset + 3] & 0xFF) << 24);
    }

    private static int readUnsignedShortLE(
            byte[] data, int offset) {

        return (data[offset] & 0xFF)
             | ((data[offset + 1] & 0xFF) << 8);
    }

    private static void skipFully(
            InputStream input, long bytes) throws IOException {

        while (bytes > 0) {
            long skipped = input.skip(bytes);

            if (skipped > 0) {
                bytes -= skipped;
            } else {
                if (input.read() == -1) {
                    throw new IOException(
                        "LAS 파일이 예상보다 짧습니다."
                    );
                }
                bytes--;
            }
        }
    }
}
