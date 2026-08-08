package controlador;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import modelo.HojaDeVida;

public class HojaDeVidaServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        HojaDeVida hoja = new HojaDeVida();
        hoja.setNombre(request.getParameter("nombre"));
        hoja.setApellido(request.getParameter("apellido"));
        hoja.setDocumento(request.getParameter("documento"));
        hoja.setTitulo(request.getParameter("titulo"));
        hoja.setInstitucion(request.getParameter("institucion"));
        hoja.setAnioFinalizacion(request.getParameter("anioFinalizacion"));
        hoja.setEmpresa1(request.getParameter("empresa1"));
        hoja.setCargo1(request.getParameter("cargo1"));
        hoja.setFechaIngreso1(request.getParameter("fechaIngreso1"));
        hoja.setFechaRetiro1(request.getParameter("fechaRetiro1"));
        hoja.setFunciones1(request.getParameter("funciones1"));
        hoja.setEmpresa2(request.getParameter("empresa2"));
        hoja.setCargo2(request.getParameter("cargo2"));
        hoja.setFechaIngreso2(request.getParameter("fechaIngreso2"));
        hoja.setFechaRetiro2(request.getParameter("fechaRetiro2"));
        hoja.setFunciones2(request.getParameter("funciones2"));
        request.setAttribute("hoja", hoja);
        RequestDispatcher rd = request.getRequestDispatcher("mostrar.jsp");
        rd.forward(request, response);
    }
}
