import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from apps.api.db.models import InvoiceModel, ProfileModel

def generate_invoice_pdf(invoice: InvoiceModel, profile: ProfileModel) -> bytes:
    """
    Generates a high-quality branded PDF for an invoice using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0f172a'),
        leading=28
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        leading=14
    )
    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1e293b'),
        leading=16
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=13
    )
    bold_style = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#0f172a'),
        leading=13
    )

    elements = []

    # Header: Brand & Invoice #
    header_data = [
        [
            Paragraph(f"<b>{profile.business_name}</b><br/>{profile.email}", body_style),
            Paragraph(f"<b>INVOICE</b><br/>#{invoice.invoice_number}<br/>Status: <b>{invoice.status}</b>", ParagraphStyle('RightHdr', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=15))

    # Bill To & Dates
    cust_name = invoice.customer.name if invoice.customer else "Valued Client"
    cust_email = invoice.customer.email if invoice.customer else "client@example.com"
    due_str = invoice.due_date.strftime("%b %d, %Y") if invoice.due_date else "Due on receipt"
    date_str = invoice.created_at.strftime("%b %d, %Y")

    meta_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/>{cust_name}<br/>{cust_email}", body_style),
            Paragraph(f"<b>Invoice Date:</b> {date_str}<br/><b>Due Date:</b> {due_str}<br/><b>Currency:</b> {invoice.currency}", ParagraphStyle('RightMeta', parent=body_style, alignment=2))
        ]
    ]
    meta_table = Table(meta_data, colWidths=[4.0 * inch, 3.5 * inch])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    elements.append(meta_table)

    # Line Items Table
    table_data = [
        [
            Paragraph("<b>Item Description</b>", bold_style),
            Paragraph("<b>Qty</b>", ParagraphStyle('QtyHdr', parent=bold_style, alignment=1)),
            Paragraph("<b>Unit Price</b>", ParagraphStyle('UnitHdr', parent=bold_style, alignment=2)),
            Paragraph("<b>Total Amount</b>", ParagraphStyle('TotHdr', parent=bold_style, alignment=2)),
        ]
    ]

    for item in invoice.items:
        table_data.append([
            Paragraph(item.description, body_style),
            Paragraph(f"{item.quantity:g}", ParagraphStyle('QtyCol', parent=body_style, alignment=1)),
            Paragraph(f"${item.unit_price:,.2f}", ParagraphStyle('PriceCol', parent=body_style, alignment=2)),
            Paragraph(f"${item.total_amount:,.2f}", ParagraphStyle('TotCol', parent=body_style, alignment=2)),
        ])

    items_table = Table(table_data, colWidths=[4.2 * inch, 0.8 * inch, 1.2 * inch, 1.3 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Totals Table
    total_data = [
        ["", Paragraph("<b>Total Due:</b>", ParagraphStyle('TotLbl', parent=bold_style, alignment=2, fontSize=11)),
         Paragraph(f"<b>${invoice.amount:,.2f} {invoice.currency}</b>", ParagraphStyle('TotVal', parent=bold_style, alignment=2, fontSize=12, textColor=colors.HexColor('#0284c7')))]
    ]
    totals_table = Table(total_data, colWidths=[4.5 * inch, 1.5 * inch, 1.5 * inch])
    totals_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)

    # Memo & PayPal Details
    elements.append(Spacer(1, 20))
    if invoice.memo:
        elements.append(Paragraph("<b>Notes / Memo:</b>", bold_style))
        elements.append(Paragraph(invoice.memo, subtitle_style))
        elements.append(Spacer(1, 10))

    if invoice.paypal_invoice_id:
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=10))
        elements.append(Paragraph(f"<b>PayPal Invoicing Reference:</b> {invoice.paypal_invoice_id}", subtitle_style))
        if invoice.payment_url:
            elements.append(Paragraph(f"<b>Pay Online:</b> {invoice.payment_url}", subtitle_style))

    # Footer note
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Thank you for your business. Powered by PayPilot AI & PayPal Developer Platform.", ParagraphStyle('Foot', parent=subtitle_style, alignment=1, fontSize=8)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
