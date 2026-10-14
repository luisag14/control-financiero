const API_BASE_URL = window.location.protocol === "file:"
    ? "http://127.0.0.1:5000"
    : "";
const API_URL = `${API_BASE_URL}/movimientos`;

let movimientos = [];
let filtroActual = {
    fechaInicio: "",
    fechaFin: ""
};
let movimientoEnEdicion = null;

const formulario = document.getElementById("formMovimiento");
const listaMovimientos = document.getElementById("listaMovimientos");
const totalIngresos = document.getElementById("totalIngresos");
const totalGastos = document.getElementById("totalGastos");
const balance = document.getElementById("balance");
const campoFecha = document.getElementById("fecha");
const campoTipo = document.getElementById("tipo");
const campoDescripcion = document.getElementById("descripcion");
const campoCategoria = document.getElementById("categoria");
const campoMonto = document.getElementById("monto");
const filtroMes = document.getElementById("filtroMes");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const btnBuscar = document.getElementById("btnBuscar");
const btnMesActual = document.getElementById("btnMesActual");
const tituloFormulario = document.getElementById("tituloFormulario");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const tituloPeriodo = document.getElementById("tituloPeriodo");
const detallePeriodo = document.getElementById("detallePeriodo");
const detalleReporte = document.getElementById("detalleReporte");
const categoriaMayorGasto = document.getElementById("categoriaMayorGasto");
const montoMayorGasto = document.getElementById("montoMayorGasto");
const reporteCategorias = document.getElementById("reporteCategorias");
const btnExportarPdf = document.getElementById("btnExportarPdf");
const btnExportarCsv = document.getElementById("btnExportarCsv");

if (campoFecha) {
    campoFecha.valueAsDate = new Date();
}

function obtenerMesActual() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}`;
}

function obtenerRangoDelMes(mes) {
    const partes = mes.split("-");
    const anio = Number(partes[0]);
    const numeroMes = Number(partes[1]);
    const inicio = `${mes}-01`;
    const ultimoDia = new Date(anio, numeroMes, 0).getDate();
    const fin = `${mes}-${String(ultimoDia).padStart(2, "0")}`;

    return {
        fechaInicio: inicio,
        fechaFin: fin
    };
}

function formatearFechaLocal(fecha) {
    if (!fecha) {
        return "";
    }

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatearMes(mes) {
    if (!mes) {
        return "periodo seleccionado";
    }

    return new Date(`${mes}-01T00:00:00`).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long"
    });
}

function actualizarTextoPeriodo() {
    if (!tituloPeriodo || !detallePeriodo) {
        return;
    }

    if (filtroMes.value) {
        tituloPeriodo.textContent = `Resumen de ${formatearMes(filtroMes.value)}`;
    } else {
        tituloPeriodo.textContent = "Resumen por fechas";
    }

    detallePeriodo.textContent = `Desde ${formatearFechaLocal(filtroActual.fechaInicio)} hasta ${formatearFechaLocal(filtroActual.fechaFin)}.`;
}

function formatearMoneda(valor) {
    return valor.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    });
}

function formatearCategoria(categoria) {
    return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

function escaparHtml(texto) {
    const contenedor = document.createElement("div");
    contenedor.textContent = texto;
    return contenedor.innerHTML;
}

function obtenerNombreArchivoReporte(extension) {
    return `reporte-gastos-${filtroActual.fechaInicio}-${filtroActual.fechaFin}.${extension}`;
}

function crearMovimiento() {
    if (!formulario) {
        return null;
    }

    return {
        tipo: campoTipo.value,
        descripcion: campoDescripcion.value.trim(),
        categoria: campoCategoria.value.trim(),
        monto: Number(campoMonto.value),
        fecha: campoFecha.value
    };
}

function actualizarEstadoFormulario() {
    if (!formulario || !tituloFormulario || !btnGuardar || !btnCancelarEdicion) {
        return;
    }

    const editando = movimientoEnEdicion !== null;
    tituloFormulario.textContent = editando ? "Editar movimiento" : "Nuevo movimiento";
    btnGuardar.textContent = editando ? "Actualizar movimiento" : "Guardar movimiento";
    btnCancelarEdicion.classList.toggle("oculto", !editando);
}

function limpiarFormulario() {
    if (!formulario) {
        return;
    }

    formulario.reset();
    campoFecha.valueAsDate = new Date();
    movimientoEnEdicion = null;
    actualizarEstadoFormulario();
}

function cargarMovimientoEnFormulario(id) {
    const movimiento = movimientos.find(function (item) {
        return item.id === id;
    });

    if (!movimiento || !formulario) {
        return;
    }

    movimientoEnEdicion = id;
    campoTipo.value = movimiento.tipo;
    campoDescripcion.value = movimiento.descripcion;
    campoCategoria.value = movimiento.categoria;
    campoMonto.value = movimiento.monto;
    campoFecha.value = movimiento.fecha;
    actualizarEstadoFormulario();
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarMovimiento(movimiento) {
    if (!listaMovimientos) {
        return;
    }

    const articulo = document.createElement("article");
    articulo.className = `movimiento ${movimiento.tipo}`;

    const detalle = document.createElement("div");
    const descripcion = document.createElement("h3");
    const categoria = document.createElement("p");
    const monto = document.createElement("span");
    const acciones = document.createElement("div");
    const botonEditar = document.createElement("button");
    const botonEliminar = document.createElement("button");

    descripcion.textContent = movimiento.descripcion;
    categoria.textContent = `${movimiento.categoria} - ${formatearFechaLocal(movimiento.fecha)}`;
    monto.className = `monto ${movimiento.tipo}`;
    monto.textContent = `${movimiento.tipo === "ingreso" ? "+" : "-"} ${formatearMoneda(movimiento.monto)}`;

    acciones.className = "movimiento-acciones";

    botonEditar.type = "button";
    botonEditar.className = "btn-editar";
    botonEditar.dataset.id = movimiento.id;
    botonEditar.textContent = "Editar";

    botonEliminar.type = "button";
    botonEliminar.className = "btn-eliminar";
    botonEliminar.dataset.id = movimiento.id;
    botonEliminar.textContent = "Eliminar";

    acciones.append(botonEditar, botonEliminar);
    detalle.append(descripcion, categoria, monto);
    articulo.append(detalle, acciones);

    listaMovimientos.appendChild(articulo);
}

function actualizarResumen() {
    if (!totalIngresos || !totalGastos || !balance) {
        return;
    }

    let ingresos = 0;
    let gastos = 0;

    movimientos.forEach(function (movimiento) {
        const monto = Number(movimiento.monto);

        if (movimiento.tipo === "ingreso") {
            ingresos = ingresos + monto;
        } else {
            gastos = gastos + monto;
        }
    });

    totalIngresos.textContent = formatearMoneda(ingresos);
    totalGastos.textContent = formatearMoneda(gastos);
    balance.textContent = formatearMoneda(ingresos - gastos);
}

function obtenerGastosPorCategoria() {
    const totales = new Map();

    movimientos.forEach(function (movimiento) {
        if (movimiento.tipo !== "gasto") {
            return;
        }

        const categoria = movimiento.categoria || "otros";
        const totalActual = totales.get(categoria) || 0;
        totales.set(categoria, totalActual + Number(movimiento.monto));
    });

    return Array.from(totales, function ([categoria, total]) {
        return { categoria, total };
    }).sort(function (a, b) {
        return b.total - a.total;
    });
}

function actualizarReporteGastos() {
    if (!reporteCategorias || !detalleReporte || !categoriaMayorGasto || !montoMayorGasto) {
        return;
    }

    const gastosPorCategoria = obtenerGastosPorCategoria();
    const totalGastosPeriodo = gastosPorCategoria.reduce(function (total, item) {
        return total + item.total;
    }, 0);

    reporteCategorias.innerHTML = "";
    detalleReporte.textContent = `Gastos clasificados desde ${formatearFechaLocal(filtroActual.fechaInicio)} hasta ${formatearFechaLocal(filtroActual.fechaFin)}.`;

    if (gastosPorCategoria.length === 0) {
        categoriaMayorGasto.textContent = "Sin gastos";
        montoMayorGasto.textContent = formatearMoneda(0);
        reporteCategorias.innerHTML = '<p class="mensaje-vacio">No hay gastos registrados en este periodo.</p>';
        return;
    }

    const mayorGasto = gastosPorCategoria[0];
    categoriaMayorGasto.textContent = formatearCategoria(mayorGasto.categoria);
    montoMayorGasto.textContent = formatearMoneda(mayorGasto.total);

    gastosPorCategoria.forEach(function (item) {
        const porcentaje = totalGastosPeriodo > 0
            ? Math.round((item.total / totalGastosPeriodo) * 100)
            : 0;

        const fila = document.createElement("article");
        const encabezado = document.createElement("div");
        const categoria = document.createElement("strong");
        const monto = document.createElement("span");
        const barra = document.createElement("div");
        const progreso = document.createElement("span");
        const porcentajeTexto = document.createElement("small");

        fila.className = "reporte-fila";
        encabezado.className = "reporte-fila-encabezado";
        barra.className = "reporte-barra";
        progreso.style.width = `${porcentaje}%`;

        categoria.textContent = formatearCategoria(item.categoria);
        monto.textContent = formatearMoneda(item.total);
        porcentajeTexto.textContent = `${porcentaje}% del gasto`;

        encabezado.append(categoria, monto);
        barra.appendChild(progreso);
        fila.append(encabezado, barra, porcentajeTexto);
        reporteCategorias.appendChild(fila);
    });
}

function generarCsvReporte() {
    const gastosPorCategoria = obtenerGastosPorCategoria();
    const totalGastosPeriodo = gastosPorCategoria.reduce(function (total, item) {
        return total + item.total;
    }, 0);
    const filas = [["categoria", "total", "participacion"]];

    gastosPorCategoria.forEach(function (item) {
        const porcentaje = totalGastosPeriodo > 0
            ? Math.round((item.total / totalGastosPeriodo) * 100)
            : 0;

        filas.push([formatearCategoria(item.categoria), item.total, `${porcentaje}%`]);
    });

    return filas.map(function (fila) {
        return fila.map(function (valor) {
            return `"${String(valor).replaceAll('"', '""')}"`;
        }).join(",");
    }).join("\n");
}

function exportarReporteCsv() {
    const gastosPorCategoria = obtenerGastosPorCategoria();

    if (gastosPorCategoria.length === 0) {
        alert("No hay gastos para exportar en este periodo.");
        return;
    }

    const contenidoCsv = `\ufeff${generarCsvReporte()}`;
    const blob = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8" });
    const urlDescarga = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = urlDescarga;
    enlace.download = obtenerNombreArchivoReporte("csv");
    enlace.style.display = "none";

    document.body.appendChild(enlace);
    enlace.click();

    setTimeout(function () {
        document.body.removeChild(enlace);
        URL.revokeObjectURL(urlDescarga);
    }, 100);
}

function crearHtmlReportePdf() {
    const gastosPorCategoria = obtenerGastosPorCategoria();
    const totalGastosPeriodo = gastosPorCategoria.reduce(function (total, item) {
        return total + item.total;
    }, 0);
    const periodo = `${formatearFechaLocal(filtroActual.fechaInicio)} - ${formatearFechaLocal(filtroActual.fechaFin)}`;

    const filas = gastosPorCategoria.map(function (item) {
        const porcentaje = totalGastosPeriodo > 0
            ? Math.round((item.total / totalGastosPeriodo) * 100)
            : 0;

        return `
            <tr>
                <td>${escaparHtml(formatearCategoria(item.categoria))}</td>
                <td>${escaparHtml(formatearMoneda(item.total))}</td>
                <td>${porcentaje}%</td>
            </tr>
        `;
    }).join("");

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de gastos</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #1f2937;
                    margin: 32px;
                }

                h1 {
                    margin-bottom: 8px;
                }

                p {
                    color: #52657f;
                    margin-top: 0;
                }

                .resumen {
                    background: #eef2f7;
                    border-left: 5px solid #dc2626;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 24px 0;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border-bottom: 1px solid #dbe3ef;
                    padding: 12px;
                    text-align: left;
                }

                th {
                    background: #f8fafc;
                }

                td:nth-child(2),
                td:nth-child(3) {
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>Reporte de gastos</h1>
            <p>Periodo: ${periodo}</p>

            <section class="resumen">
                <strong>Mayor gasto:</strong>
                ${gastosPorCategoria.length > 0 ? escaparHtml(formatearCategoria(gastosPorCategoria[0].categoria)) : "Sin gastos"}
                <br>
                <strong>Total:</strong>
                ${gastosPorCategoria.length > 0 ? escaparHtml(formatearMoneda(gastosPorCategoria[0].total)) : formatearMoneda(0)}
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Total</th>
                        <th>Participacion</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

function exportarReportePdf() {
    if (obtenerGastosPorCategoria().length === 0) {
        alert("No hay gastos para exportar en este periodo.");
        return;
    }

    const ventana = window.open("", "_blank");

    if (!ventana) {
        alert("El navegador bloqueo la ventana de impresion. Permite ventanas emergentes para exportar el PDF.");
        return;
    }

    ventana.document.open();
    ventana.document.write(crearHtmlReportePdf());
    ventana.document.close();
    ventana.focus();

    setTimeout(function () {
        ventana.print();
    }, 250);
}

async function cargarMovimientos() {
    try {
        const parametros = new URLSearchParams();

        if (filtroActual.fechaInicio) {
            parametros.set("fecha_inicio", filtroActual.fechaInicio);
        }

        if (filtroActual.fechaFin) {
            parametros.set("fecha_fin", filtroActual.fechaFin);
        }

        const url = parametros.toString() ? `${API_URL}?${parametros.toString()}` : API_URL;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`El backend respondio con estado ${respuesta.status}`);
        }

        movimientos = await respuesta.json();

        renderizarMovimientos();
        actualizarResumen();
        actualizarTextoPeriodo();
        actualizarReporteGastos();
    } catch (error) {
        if (listaMovimientos) {
            listaMovimientos.innerHTML = '<p class="mensaje-vacio">No se pudo conectar con el backend. Abre abrir_control_financiero.bat y revisa que PostgreSQL este encendido.</p>';
        }

        if (reporteCategorias) {
            reporteCategorias.innerHTML = '<p class="mensaje-vacio">No se pudo generar el reporte porque no hay conexion con el backend.</p>';
        }

        console.error("Error al cargar movimientos:", error);
    }
}

async function eliminarMovimiento(id) {
    const confirmar = confirm("Deseas eliminar este movimiento?");

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.error || "No se pudo eliminar el movimiento.");
            return;
        }

        movimientos = movimientos.filter(function (movimiento) {
            return movimiento.id !== id;
        });

        if (movimientoEnEdicion === id) {
            limpiarFormulario();
        }

        renderizarMovimientos();
        actualizarResumen();
        actualizarTextoPeriodo();
        actualizarReporteGastos();
    } catch (error) {
        alert("No se pudo eliminar el movimiento.");
        console.error("Error al eliminar:", error);
    }
}

function renderizarMovimientos() {
    if (!listaMovimientos) {
        return;
    }

    listaMovimientos.innerHTML = "";

    if (movimientos.length === 0) {
        listaMovimientos.innerHTML = '<p class="mensaje-vacio">Todavia no hay movimientos registrados.</p>';
        return;
    }

    movimientos.forEach(function (movimiento) {
        mostrarMovimiento(movimiento);
    });
}

if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const movimiento = crearMovimiento();
        const editando = movimientoEnEdicion !== null;
        const url = editando ? `${API_URL}/${movimientoEnEdicion}` : API_URL;
        const metodo = editando ? "PUT" : "POST";

        try {
            const respuesta = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(movimiento)
            });

            const movimientoGuardado = await respuesta.json();

            if (!respuesta.ok) {
                alert(movimientoGuardado.error || "No se pudo guardar el movimiento.");
                return;
            }

            if (!editando) {
                movimientos.push(movimientoGuardado);
            }

            limpiarFormulario();
            await cargarMovimientos();
        } catch (error) {
            alert("No se pudo conectar con el backend. Abre abrir_control_financiero.bat y revisa que PostgreSQL este encendido.");
            console.error("Error al guardar:", error);
        }
    });
}

if (listaMovimientos) {
    listaMovimientos.addEventListener("click", function (evento) {
        const botonEditar = evento.target.closest(".btn-editar");
        const botonEliminar = evento.target.closest(".btn-eliminar");

        if (botonEditar) {
            cargarMovimientoEnFormulario(Number(botonEditar.dataset.id));
            return;
        }

        if (botonEliminar) {
            eliminarMovimiento(Number(botonEliminar.dataset.id));
        }
    });
}

if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener("click", limpiarFormulario);
}

if (btnBuscar) {
    btnBuscar.addEventListener("click", function () {
        filtroMes.value = "";

        if (!fechaInicio.value || !fechaFin.value) {
            alert("Selecciona la fecha de inicio y la fecha final.");
            return;
        }

        if (fechaInicio.value > fechaFin.value) {
            alert("La fecha de inicio no puede ser mayor que la fecha final.");
            return;
        }

        filtroActual = {
            fechaInicio: fechaInicio.value,
            fechaFin: fechaFin.value
        };

        cargarMovimientos();
    });
}

if (filtroMes) {
    filtroMes.addEventListener("change", function () {
        if (!filtroMes.value) {
            return;
        }

        const rango = obtenerRangoDelMes(filtroMes.value);
        fechaInicio.value = rango.fechaInicio;
        fechaFin.value = rango.fechaFin;
        filtroActual = rango;

        cargarMovimientos();
    });
}

if (btnMesActual) {
    btnMesActual.addEventListener("click", function () {
        aplicarMesActual();
        cargarMovimientos();
    });
}

if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", function (evento) {
        evento.preventDefault();
        exportarReporteCsv();
    });
}

if (btnExportarPdf) {
    btnExportarPdf.addEventListener("click", function (evento) {
        evento.preventDefault();
        exportarReportePdf();
    });
}

function aplicarMesActual() {
    if (!filtroMes || !fechaInicio || !fechaFin) {
        return;
    }

    filtroMes.value = obtenerMesActual();
    const rango = obtenerRangoDelMes(filtroMes.value);
    fechaInicio.value = rango.fechaInicio;
    fechaFin.value = rango.fechaFin;
    filtroActual = rango;
}

aplicarMesActual();
actualizarEstadoFormulario();
cargarMovimientos();
