import reportlab
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas

pdf_path = "Relatorio_Mensal_Preenchivel.pdf"

NAVY = colors.HexColor("#0C2340")
DARK_GRAY = colors.HexColor("#1A1A1A")

def build_pdf(filename):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4 # 595.27 x 841.89 pt
    
    # Top bar
    c.setFillColor(NAVY)
    c.rect(120, height - 60, width - 160, 35, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(130, height - 48, "RELATÓRIO MENSAL - EQUIPE ORIENTAÇÃO DE PÚBLICO")
    
    # Logo text placeholder (fgc 30 anos)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, height - 52, "fgc")
    c.setFont("Helvetica", 9)
    c.drawString(75, height - 44, "30")
    c.drawString(75, height - 54, "anos")
    
    # Row 1: PERÍODO | PROJETO | EQUIPE
    box_w = (width - 80 - 20) / 3 # ~165 pt each
    y_row1 = height - 130
    box_h = 55
    
    cols = [
        ("PERÍODO", "13 a 31 de agosto", "periodo"),
        ("PROJETO", "MUB3 / Exposição\nFGC 30 Anos", "projeto"),
        ("EQUIPE", "Gabriela, Maia, Patrícia\ne Verônica", "equipe")
    ]
    
    form = c.acroForm
    
    for i, (title, default_val, name) in enumerate(cols):
        x = 40 + i * (box_w + 10)
        # Header box
        c.setFillColor(NAVY)
        c.rect(x, y_row1 + box_h - 20, box_w, 20, fill=1, stroke=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + box_w/2, y_row1 + box_h - 15, title)
        
        # Content box
        c.setFillColor(colors.white)
        c.setStrokeColor(NAVY)
        c.rect(x, y_row1, box_w, box_h - 20, fill=1, stroke=1)
        
        # Add form textfield
        form.textfield(
            name=name,
            tooltip=title,
            x=x + 2,
            y=y_row1 + 2,
            width=box_w - 4,
            height=box_h - 24,
            value=default_val,
            fillColor=colors.HexColor("#F8FAFC"),
            textColor=DARK_GRAY,
            fontSize=10
        )

    # Section 2: INTRODUÇÃO E FLUXO DE VISITANTES
    y_sec2 = height - 420
    sec2_h = 270
    
    c.setFillColor(NAVY)
    c.rect(40, y_sec2 + sec2_h - 25, width - 80, 25, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y_sec2 + sec2_h - 18, "INTRODUÇÃO E FLUXO DE VISITANTES")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(40, y_sec2, width - 80, sec2_h - 25, fill=1, stroke=1)
    
    intro_text = (
        "No período de 13 a 31 de agosto, a exposição registrou um fluxo constante e positivo de visitantes. "
        "Destaca-se a forte presença de grupos escolares das redes pública e privada de ensino, além de turmas do ensino técnico e de graduação, majoritariamente da área de Administração.\r\r"
        "O perfil dos visitantes é diversificado, com origem de diversas localidades, incluindo: São Paulo (capital), Guarulhos, Sorocaba, São Sebastião e Belo Horizonte MG.\r\r"
        "A equipe atuou diligentemente para garantir a melhor experiência possível, e o fluxo foi gerenciado de forma a evitar gargalos. "
        "Registrou-se zero intercorrências durante o período."
    )
    
    form.textfield(
        name="introducao_fluxo",
        tooltip="Introdução e Fluxo de Visitantes",
        x=45,
        y=y_sec2 + 5,
        width=width - 90,
        height=sec2_h - 35,
        value=intro_text,
        fillColor=colors.HexColor("#F8FAFC"),
        textColor=DARK_GRAY,
        fontSize=10
    )

    # Section 3: DESEMPENHO E ORGANIZAÇÃO DA EQUIPE
    y_sec3 = height - 740
    sec3_h = 290
    
    c.setFillColor(NAVY)
    c.rect(40, y_sec3 + sec3_h - 25, width - 80, 25, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y_sec3 + sec3_h - 18, "DESEMPENHO E ORGANIZAÇÃO DA EQUIPE")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(40, y_sec3, width - 80, sec3_h - 25, fill=1, stroke=1)
    
    desempenho_text = (
        "A equipe demonstrou comprometimento e dedicação ao longo do período, atuando na proteção do acervo e das obras expostas, "
        "além de prestar um bom e eficiente atendimento ao público.\r\r"
        "A organização da escala e horários de trabalho foi alinhada levando em consideração as preferências e necessidades individuais das orientadoras, mantendo a harmonia do trabalho em equipe.\r\r"
        "Maia e Patrícia, em termos operacionais, alternam semanalmente entre os turnos da manhã e da tarde. Essa dinâmica tem funcionado com total fluidez, garantindo o pleno funcionamento sem prejuízos."
    )
    
    form.textfield(
        name="desempenho_equipe",
        tooltip="Desempenho e Organização da Equipe",
        x=45,
        y=y_sec3 + 5,
        width=width - 90,
        height=sec3_h - 35,
        value=desempenho_text,
        fillColor=colors.HexColor("#F8FAFC"),
        textColor=DARK_GRAY,
        fontSize=10
    )

    c.save()

build_pdf(pdf_path)
print("Fillable PDF created successfully!")