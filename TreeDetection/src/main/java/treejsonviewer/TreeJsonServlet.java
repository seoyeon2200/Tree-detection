package treejsonviewer;

import java.io.IOException;
import java.io.InputStream;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/trees")
public class TreeJsonServlet extends HttpServlet {
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (InputStream input =
                getServletContext().getResourceAsStream(
                    "/data/GJ-S1_Tree_data.json")) {

            if (input == null) {
                response.sendError(
                    HttpServletResponse.SC_NOT_FOUND,
                    "JSON 파일을 찾을 수 없습니다."
                );
                return;
            }

            input.transferTo(response.getOutputStream());
        }
    }
}
