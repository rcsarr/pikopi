import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BatchData {
    id: string;
    batchNumber: number;
    status: string;
    totalWeight: number;
    totalBeans: number;
    healthyBeans: number;
    defectiveBeans: number;
    accuracy: number;
    createdAt: string;
}

interface OrderData {
    id: string;
    packageName: string;
    weight: number;
    createdAt: string;
}

interface DashboardStats {
    total: number;
    healthy: number;
    defect: number;
    accuracy: number;
}

export const generateBatchHistoryPDF = (
    context: {
        type: 'order' | 'month' | 'year';
        title: string;
        subtitle: string;
        data?: any;
    },
    batches: BatchData[],
    dashboardStats: DashboardStats,
    userName: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(75, 46, 5); // #4B2E05
    doc.text(context.type === 'order' ? 'Laporan Riwayat Batch' : `Laporan ${context.title}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;

    yPos += 15;

    // Information Section
    doc.setFontSize(14);
    doc.setTextColor(75, 46, 5);
    doc.text('Informasi Laporan', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let infoData: string[][] = [
        ['Pengguna', userName],
        ['Periode', context.subtitle],
        ['Tanggal Cetak', new Date().toLocaleDateString('id-ID')]
    ];

    if (context.type === 'order' && context.data) {
        infoData = [
            ['Pengguna', userName],
            ['ID Pesanan', context.data.id],
            ['Paket', context.data.packageName],
            ['Berat Total', `${context.data.weight} Kg`],
            ['Tanggal Pesanan', new Date(context.data.createdAt).toLocaleDateString('id-ID')]
        ];
    }

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: infoData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 'auto' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Dashboard Statistics Section
    doc.setFontSize(14);
    doc.setTextColor(75, 46, 5);
    doc.text('Ringkasan Statistik', 14, yPos);
    yPos += 8;

    const statsData = [
        ['Total Biji Kopi', dashboardStats.total.toLocaleString('id-ID')],
        ['Biji Sehat', `${dashboardStats.healthy.toLocaleString('id-ID')} (${((dashboardStats.healthy / dashboardStats.total) * 100).toFixed(1)}%)`],
        ['Biji Cacat', `${dashboardStats.defect.toLocaleString('id-ID')} (${((dashboardStats.defect / dashboardStats.total) * 100).toFixed(1)}%)`],
        ['Akurasi Keseluruhan', `${dashboardStats.accuracy}%`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: statsData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60, fillColor: [245, 230, 202] },
            1: { cellWidth: 'auto' }
        },
        headStyles: { fillColor: [76, 124, 46] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Batches Table Section
    doc.setFontSize(14);
    doc.setTextColor(75, 46, 5);
    doc.text('Detail Batch', 14, yPos);
    yPos += 8;

    const batchTableData = batches.map(batch => [
        `#${batch.batchNumber}`,
        `${batch.totalWeight} Kg`,
        batch.totalBeans.toLocaleString('id-ID'),
        batch.healthyBeans.toLocaleString('id-ID'),
        batch.defectiveBeans.toLocaleString('id-ID'),
        `${batch.accuracy}%`,
        new Date(batch.createdAt).toLocaleDateString('id-ID')
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Batch', 'Berat', 'Total Biji', 'Sehat', 'Cacat', 'Akurasi', 'Tanggal']],
        body: batchTableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: [76, 124, 46],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 25 },
            2: { cellWidth: 28 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 32 }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Individual Batch Details (if space allows, otherwise new page)
    batches.forEach((batch, index) => {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(75, 46, 5);
        doc.text(`Batch #${batch.batchNumber} - Detail`, 14, yPos);
        yPos += 7;

        const batchDetails = [
            ['Status', batch.status],
            ['Berat', `${batch.totalWeight} Kg`],
            ['Total Biji', batch.totalBeans.toLocaleString('id-ID')],
            ['Biji Sehat', `${batch.healthyBeans.toLocaleString('id-ID')} (${((batch.healthyBeans / batch.totalBeans) * 100).toFixed(1)}%)`],
            ['Biji Cacat', `${batch.defectiveBeans.toLocaleString('id-ID')} (${((batch.defectiveBeans / batch.totalBeans) * 100).toFixed(1)}%)`],
            ['Akurasi', `${batch.accuracy}%`],
            ['Tanggal Proses', new Date(batch.createdAt).toLocaleString('id-ID')]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [],
            body: batchDetails,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, fillColor: [245, 230, 202] },
                1: { cellWidth: 'auto' }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
    });

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Halaman ${i} dari ${pageCount} - PiKopi Batch Report`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    // Save the PDF
    const prefix = context.type === 'order' ? `Batch_Report_${context.data?.id}` : `Laporan_${context.type}_${context.title.replace(/\s+/g, '_')}`;
    const fileName = `${prefix}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
