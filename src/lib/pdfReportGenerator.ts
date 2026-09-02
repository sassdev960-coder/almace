import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InsumoItem, LoteItem, DepartamentoItem, FormulaItem } from '../types';

export interface ReportOptions {
  title?: string;
  includeInventario?: boolean;
  includeLotes?: boolean;
  filtroEstadoLote?: 'todos' | 'almacen1' | 'almacen2';
  filtroDepartamentoId?: string;
  notes?: string;
}

export function generateOperationalPDFReport({
  inventario,
  lotes,
  departamentos,
  formulas,
  options = {},
}: {
  inventario: InsumoItem[];
  lotes: LoteItem[];
  departamentos: DepartamentoItem[];
  formulas?: FormulaItem[];
  options?: ReportOptions;
}): { success: boolean; filename: string } {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const includeInventario = options.includeInventario !== false;
    const includeLotes = options.includeLotes !== false;

    // Filter lotes according to options
    const filteredLotes = lotes.filter((lote) => {
      if (options.filtroEstadoLote && options.filtroEstadoLote !== 'todos') {
        if (lote.estado !== options.filtroEstadoLote) return false;
      }
      if (options.filtroDepartamentoId && options.filtroDepartamentoId !== 'all') {
        if (
          lote.departamento_id !== options.filtroDepartamentoId &&
          !departamentos.find((d) => (d.id === options.filtroDepartamentoId || d.slug === options.filtroDepartamentoId) && (lote.departamento_id === d.id || lote.departamento_id === d.slug))
        ) {
          return false;
        }
      }
      return true;
    });

    // Department helper map
    const getDeptName = (idOrSlug: string) => {
      const dep = departamentos.find((d) => d.id === idOrSlug || d.slug === idOrSlug);
      return dep ? dep.nombre : idOrSlug || 'General';
    };

    // Calculate Global Metrics
    const valorTotalInventario = inventario.reduce(
      (acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.costo_unitario) || 0),
      0
    );
    const insumosBajoMinimo = inventario.filter((i) => (Number(i.cantidad) || 0) <= 5);
    const lotesEnProceso = filteredLotes.filter((l) => l.estado === 'almacen1');
    const lotesEmpacados = filteredLotes.filter((l) => l.estado === 'almacen2');
    const totalBandejas = filteredLotes.reduce((acc, l) => acc + (Number(l.total_bandejas) || 0), 0);
    const totalBolas = filteredLotes.reduce((acc, l) => acc + (Number(l.total_bolas) || 0), 0);

    // ==========================================
    // 1. HEADER SECTION (Brand & Metadata)
    // ==========================================
    // Top banner color strip
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFillColor(79, 70, 229); // Indigo 600 accent bar
    doc.rect(0, 24, 210, 1.5, 'F');

    // Brand Logo / Monogram Box
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(14, 5, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AP', 21, 14, { align: 'center' });

    // Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ALMACÉN PRO', 32, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text('REPORTE OFICIAL DE INVENTARIO Y CONTROL DE LOTES', 32, 17);

    // Metadata Right-Aligned
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Fecha: ${formattedDate} ${formattedTime}`, 196, 11, { align: 'right' });
    doc.text('Documento para Auditoría Física', 196, 17, { align: 'right' });

    let currentY = 32;

    // ==========================================
    // 2. EXECUTIVE SUMMARY STATS CARDS
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Resumen Ejecutivo de Operaciones', 14, currentY);

    currentY += 4;

    // Draw KPI Summary boxes
    const cardWidth = 43;
    const cardHeight = 16;
    const startX = 14;
    const gap = 3.5;

    // Card 1: Valor Inventario
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(startX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('VALOR TOTAL INVENTARIO', startX + 3, currentY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.text(`${valorTotalInventario.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.`, startX + 3, currentY + 11);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`${inventario.length} insumos registrados`, startX + 3, currentY + 14.5);

    // Card 2: Insumos Críticos
    const card2X = startX + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INSUMOS BAJO MÍNIMO', card2X + 3, currentY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(insumosBajoMinimo.length > 0 ? 217 : 71, insumosBajoMinimo.length > 0 ? 119 : 85, insumosBajoMinimo.length > 0 ? 6 : 105);
    doc.text(`${insumosBajoMinimo.length} ${insumosBajoMinimo.length > 0 ? 'Críticos (≤ 5)' : 'Óptimo'}`, card2X + 3, currentY + 11);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Requieren reabastecimiento', card2X + 3, currentY + 14.5);

    // Card 3: Lotes en Proceso (Almacén 1)
    const card3X = card2X + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('LOTES EN PROCESO (ALM. 1)', card3X + 3, currentY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text(`${lotesEnProceso.length} Activos`, card3X + 3, currentY + 11);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Pendientes de empaque final', card3X + 3, currentY + 14.5);

    // Card 4: Lotes Empacados (Almacén 2)
    const card4X = card3X + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('LOTES EMPACADOS (ALM. 2)', card4X + 3, currentY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(`${lotesEmpacados.length} Lotes Listos`, card4X + 3, currentY + 11);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`${totalBandejas} bandejas / ${totalBolas} bolas`, card4X + 3, currentY + 14.5);

    currentY += cardHeight + 8;

    // ==========================================
    // 3. INVENTORY TABLE FOR PHYSICAL AUDIT
    // ==========================================
    if (includeInventario) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Inventario de Materias Primas (Control y Conteo Físico)', 14, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Utilice las casillas de verificación y conteo físico para la auditoría y cotejo en planta.', 14, currentY + 4);

      currentY += 6;

      const inventarioRows = inventario.map((item, index) => {
        const cantidad = Number(item.cantidad) || 0;
        const costoUnit = Number(item.costo_unitario) || 0;
        const total = cantidad * costoUnit;
        const estadoStock = cantidad <= 0 ? 'AGOTADO' : cantidad <= 5 ? 'BAJO STOCK' : 'NORMAL';

        return [
          (index + 1).toString(),
          item.nombre,
          item.unidad,
          cantidad.toFixed(2),
          costoUnit.toFixed(2) + ' Bs.',
          total.toFixed(2) + ' Bs.',
          estadoStock,
          '[        ]', // Physical Count blank space for pen writing
          '[        ]', // Difference blank space
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            '#',
            'Materia Prima / Insumo',
            'Unidad',
            'Stock Sist.',
            'Costo Unit.',
            'Valor Total',
            'Estado',
            'Conteo Físico',
            'Diferencia',
          ],
        ],
        body: inventarioRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          valign: 'middle',
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 22, halign: 'center', textColor: [100, 116, 139] },
          8: { cellWidth: 20, halign: 'center', textColor: [100, 116, 139] },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const val = data.cell.raw;
            if (val === 'AGOTADO') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'BAJO STOCK') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [5, 150, 105];
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Update currentY after table
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ==========================================
    // 4. LOTES DE PRODUCCIÓN & ALMACÉN TABLE
    // ==========================================
    if (includeLotes) {
      // Check if we need a new page for Lotes section
      if (currentY > 210) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Estado Operativo de Lotes de Producción', 14, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Trazabilidad de ${filteredLotes.length} lote(s) registrados en Almacén 1 (En proceso) y Almacén 2 (Empacados).`,
        14,
        currentY + 4
      );

      currentY += 6;

      const lotesRows = filteredLotes.map((lote) => {
        const fecha = lote.created_at
          ? new Date(lote.created_at).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })
          : 'N/D';
        const depto = getDeptName(lote.departamento_id);
        const estadoStr = lote.estado === 'almacen2' ? 'ALM. 2 (EMPACADO)' : 'ALM. 1 (EN PROCESO)';
        const costo = Number(lote.costo_lote) || 0;

        return [
          lote.id.length > 8 ? lote.id.slice(0, 8) + '...' : lote.id,
          fecha,
          lote.producto || 'Fórmula Base',
          depto,
          (lote.lotes_producidos || 1).toString(),
          (lote.total_bandejas || 0).toString(),
          (lote.total_bolas || 0).toString(),
          costo.toFixed(1) + ' Bs.',
          estadoStr,
          '[  OK  ]', // Verification box
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Código Lote',
            'Fecha',
            'Producto / Sabor',
            'Departamento',
            'Lotes',
            'Bandejas',
            'Bolas',
            'Costo MP',
            'Ubicación / Estado',
            'Cotejo',
          ],
        ],
        body: lotesRows.length > 0 ? lotesRows : [['-', '-', 'No hay lotes registrados con este filtro', '-', '-', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          valign: 'middle',
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 36, fontStyle: 'bold' },
          3: { cellWidth: 26 },
          4: { cellWidth: 11, halign: 'center' },
          5: { cellWidth: 13, halign: 'center' },
          6: { cellWidth: 13, halign: 'center' },
          7: { cellWidth: 16, halign: 'right' },
          8: { cellWidth: 23, halign: 'center' },
          9: { cellWidth: 10, halign: 'center', textColor: [100, 116, 139] },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 8) {
            const val = String(data.cell.raw);
            if (val.includes('EMPACADO')) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('EN PROCESO')) {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // ==========================================
    // 5. PHYSICAL AUDIT SIGN-OFF BOXES
    // ==========================================
    if (currentY > 235) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Validación y Firmas de Control Físico:', 14, currentY);

    currentY += 5;

    const signWidth = 56;
    const signHeight = 22;

    // Sign Box 1: Responsable de Producción
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, currentY, signWidth, signHeight, 1, 1, 'FD');
    doc.setDrawColor(148, 163, 184);
    doc.line(18, currentY + 14, 14 + signWidth - 4, currentY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Responsable de Producción', 14 + signWidth / 2, currentY + 18, { align: 'center' });

    // Sign Box 2: Encargado de Almacén
    const sign2X = 14 + signWidth + 6;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(sign2X, currentY, signWidth, signHeight, 1, 1, 'FD');
    doc.setDrawColor(148, 163, 184);
    doc.line(sign2X + 4, currentY + 14, sign2X + signWidth - 4, currentY + 14);
    doc.text('Encargado de Almacén', sign2X + signWidth / 2, currentY + 18, { align: 'center' });

    // Sign Box 3: Auditor / Gerencia
    const sign3X = sign2X + signWidth + 6;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(sign3X, currentY, signWidth, signHeight, 1, 1, 'FD');
    doc.setDrawColor(148, 163, 184);
    doc.line(sign3X + 4, currentY + 14, sign3X + signWidth - 4, currentY + 14);
    doc.text('Auditor / Control de Calidad', sign3X + signWidth / 2, currentY + 18, { align: 'center' });

    // ==========================================
    // 6. FOOTER & PAGE NUMBERING
    // ==========================================
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      // Top thin divider for footer
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 287, 196, 287);

      doc.text('Almacén Pro - Sistema de Gestión Operativa y Control de Lotes', 14, 291);
      doc.text(`Página ${i} de ${pageCount}`, 196, 291, { align: 'right' });
    }

    const filenameDate = now.toISOString().slice(0, 10);
    const filename = `Reporte_Control_Fisico_AlmacenPro_${filenameDate}.pdf`;

    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}
