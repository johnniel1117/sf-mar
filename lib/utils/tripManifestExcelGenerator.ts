import { TripManifest } from '@/lib/services/tripManifestService';
import * as XLSX from 'xlsx-js-style';

export class TripManifestExcelGenerator {
  static generateExcel(manifestData: TripManifest): void {
    const items = manifestData.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.total_quantity || 0), 0);

    const formatDateShort = (dateStr?: string) => {
      if (!dateStr) return '—';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    };

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([]);

    let row = 0;

    const setCell = (
      r: number,
      c: number,
      value: any,
      style: Partial<XLSX.CellObject['s']> = {},
      type: XLSX.CellObject['t'] = 's'
    ) => {
      const cell: XLSX.CellObject = { v: value, t: type, s: style };
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = cell;
    };

    // ─── Header Section ───────────────────────────────────────
    setCell(row, 0, 'SF EXPRESS WAREHOUSE', { font: { bold: true, sz: 14 } });
    setCell(row, 1, 'UPPER TINGUB, MANDAUE, CEBU');
    row += 2;

    // Manifest number (yellow box)
    setCell(row, 4, manifestData.manifest_number || '—', {
      font: { bold: true, sz: 16, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: 'FFFFC400' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } },
    });
    row += 3;

    // Title
    setCell(row, 0, 'TRIP MANIFEST', {
      font: { bold: true, sz: 20 },
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 4 } });
    row += 3;

    // ─── Trip Information ─────────────────────────────────────
    const infoData = [
      ['Client', 'HAIER PHILIPPINES INC.', 'Dispatch Date', formatDateShort(manifestData.manifest_date)],
      ['Trucker', manifestData.trucker || 'N/A', 'Driver', manifestData.driver_name || '—'],
      ['Plate No.', manifestData.plate_no || '—', 'Truck Type', manifestData.truck_type || 'N/A'],
      ['Time Start', manifestData.time_start || '—', 'Time End', manifestData.time_end || '—'],
    ];

    infoData.forEach(([label1, val1, label2, val2]) => {
      setCell(row, 0, label1, { font: { bold: true } });
      setCell(row, 1, val1);
      setCell(row, 2, label2, { font: { bold: true } });
      setCell(row, 3, val2);
      row++;
    });

    if (manifestData.remarks) {
      setCell(row, 0, 'Remarks', { font: { bold: true } });
      setCell(row, 1, manifestData.remarks);
      ws['!merges']?.push({ s: { r: row, c: 1 }, e: { r: row, c: 3 } });
      row += 2;
    } else {
      row += 1;
    }

    // ─── Table Header Row ─────────────────────────────────────
    const tableStartRow = row;
    const headers = ['NO.', 'SHIP TO NAME', 'DN/TRA NO.', 'QTY', 'REMARKS'];
    const headerStyle = {
      font: { bold: true, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: 'E8E8E8' } },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    };

    headers.forEach((header, col) => {
      setCell(row, col, header, headerStyle);
    });
    row++;

    // ─── Table Data Rows ──────────────────────────────────────
    const tableDataStart = row;
    if (items.length === 0) {
      setCell(row, 0, '—', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center' } });
      setCell(row, 1, 'No documents added', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } });
      setCell(row, 2, '—', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center' } });
      setCell(row, 3, 0, { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center' } });
      setCell(row, 4, '—', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center' } });
      row++;
    } else {
      items.forEach((item, idx) => {
        const cellStyle = {
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
        setCell(row, 0, idx + 1, cellStyle);
        setCell(row, 1, item.ship_to_name || '—', { ...cellStyle, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } });
        setCell(row, 2, item.document_number || '—', { ...cellStyle, font: { bold: true } });
        setCell(row, 3, item.total_quantity || 0, cellStyle);
        setCell(row, 4, '', cellStyle);
        row++;
      });
    }

    // ─── Total Row ────────────────────────────────────────────
    const totalRow = row;
    setCell(row, 0, 'TOTAL', {
      font: { bold: true },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    });
    setCell(row, 1, '', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } });
    setCell(row, 2, '', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } });
    setCell(row, 3, totalQty, {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    });
    setCell(row, 4, '', { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } });
    row += 2;

    // ─── Summary Line ─────────────────────────────────────────
    setCell(row, 2, `TOTAL DOCUMENTS: ${items.length}  |  TOTAL QUANTITY: ${totalQty}`, {
      font: { bold: true },
      alignment: { horizontal: 'right', vertical: 'center' },
    });
    row += 3; // spacing before signatures

    // ─── Signature Section (exactly like PDF) ─────────────────
    const sigStart = row;

    // Row 1 – Labels (Checked + Approved)
    setCell(sigStart, 0, 'Checked by (Signature Over Printed Name):', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'left' } });
    ws['!merges']?.push({ s: { r: sigStart, c: 0 }, e: { r: sigStart, c: 1 } });
    setCell(sigStart, 2, 'Approved by (Signature Over Printed Name):', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'left' } });
    ws['!merges']?.push({ s: { r: sigStart, c: 2 }, e: { r: sigStart, c: 3 } });

    // Row 2 – Signature lines
    const line1 = sigStart + 1;
    setCell(line1, 0, '', { border: { top: { style: 'medium' } } });
    ws['!merges']?.push({ s: { r: line1, c: 0 }, e: { r: line1, c: 1 } });
    setCell(line1, 2, '', { border: { top: { style: 'medium' } } });
    ws['!merges']?.push({ s: { r: line1, c: 2 }, e: { r: line1, c: 3 } });

    // Row 3 – Names
    const name1 = sigStart + 2;
    setCell(name1, 0, 'JAYMIE TAGALOG JR. / IRIC RANILI', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: name1, c: 0 }, e: { r: name1, c: 1 } });
    setCell(name1, 2, 'KENNETH IRVIN BELICARIO / ANTHONYLOU CHAN', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: name1, c: 2 }, e: { r: name1, c: 3 } });

    // Row 4 – Positions
    const pos1 = sigStart + 3;
    setCell(pos1, 0, 'Warehouse Checker', { font: { sz: 9, italic: true }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: pos1, c: 0 }, e: { r: pos1, c: 1 } });
    setCell(pos1, 2, 'Warehouse Supervisor', { font: { sz: 9, italic: true }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: pos1, c: 2 }, e: { r: pos1, c: 3 } });

    // Row 6 – Labels (Received + Witnessed)
    const sigStart2 = sigStart + 5;
    setCell(sigStart2, 0, 'Received by (Signature Over Printed Name):', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'left' } });
    ws['!merges']?.push({ s: { r: sigStart2, c: 0 }, e: { r: sigStart2, c: 1 } });
    setCell(sigStart2, 2, 'Witnessed by (Signature Over Printed Name):', { font: { bold: true, sz: 10 }, alignment: { horizontal: 'left' } });
    ws['!merges']?.push({ s: { r: sigStart2, c: 2 }, e: { r: sigStart2, c: 3 } });

    // Row 7 – Signature lines
    const line2 = sigStart2 + 1;
    setCell(line2, 0, '', { border: { top: { style: 'medium' } } });
    ws['!merges']?.push({ s: { r: line2, c: 0 }, e: { r: line2, c: 1 } });
    setCell(line2, 2, '', { border: { top: { style: 'medium' } } });
    ws['!merges']?.push({ s: { r: line2, c: 2 }, e: { r: line2, c: 3 } });

    // Row 8 – Names (empty)
    const name2 = sigStart2 + 2;
    setCell(name2, 0, '', { alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: name2, c: 0 }, e: { r: name2, c: 1 } });
    setCell(name2, 2, '', { alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: name2, c: 2 }, e: { r: name2, c: 3 } });

    // Row 9 – Positions
    const pos2 = sigStart2 + 3;
    setCell(pos2, 0, 'Customer / Trucker Representative', { font: { sz: 9, italic: true }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: pos2, c: 0 }, e: { r: pos2, c: 1 } });
    setCell(pos2, 2, 'Security Guard', { font: { sz: 9, italic: true }, alignment: { horizontal: 'center' } });
    ws['!merges']?.push({ s: { r: pos2, c: 2 }, e: { r: pos2, c: 3 } });

    const finalRow = pos2 + 2;

    // ─── Apply thin borders to the entire table area (NO. → TOTAL) ───
    const tableEndRow = totalRow;
    for (let r = tableStartRow; r <= tableEndRow; r++) {
      for (let c = 0; c <= 4; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // ─── Finalize sheet ───────────────────────────────────────
    ws['!ref'] = `A1:E${finalRow}`;
    ws['!cols'] = [
      { wch: 6 },   // NO.
      { wch: 45 },  // SHIP TO NAME
      { wch: 20 },  // DN/TRA NO.
      { wch: 12 },  // QTY
      { wch: 25 },  // REMARKS
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Trip Manifest');

    const filename = `Trip-Manifest-${manifestData.manifest_number || 'export'}-${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}