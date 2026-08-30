import reportlab
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas

pdf_path = "Relatorio_Mensal_Completo_3Paginas.pdf"

NAVY = colors.HexColor("#0C2340")
DARK_GRAY = colors.HexColor("#1A1A1A")
LIGHT_BG = colors.HexColor("#F8FAFC")

def build_pdf(filename):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4 # 595.27 x 841.89 pt
    
    form = c.acroForm

    # ==========================================
    # PAGE 1: RELATÓRIO MENSAL - PRINCIPAL
    # ==========================================
    # Header Banner
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
    box_w = (width - 80 - 20) / 3
    y_row1 = height - 130
    box_h = 55
    
    cols = [
        ("PERÍODO", "13 a 31 de agosto", "p1_periodo"),
        ("PROJETO", "MUB3 / Exposição\nFGC 30 Anos", "p1_projeto"),
        ("EQUIPE", "Gabriela, Maia, Patrícia\ne Verônica", "p1_equipe")
    ]
    
    for i, (title, default_val, name) in enumerate(cols):
        x = 40 + i * (box_w + 10)
        c.setFillColor(NAVY)
        c.rect(x, y_row1 + box_h - 20, box_w, 20, fill=1, stroke=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + box_w/2, y_row1 + box_h - 15, title)
        
        c.setFillColor(colors.white)
        c.setStrokeColor(NAVY)
        c.rect(x, y_row1, box_w, box_h - 20, fill=1, stroke=1)
        
        form.textfield(
            name=name,
            tooltip=title,
            x=x + 2,
            y=y_row1 + 2,
            width=box_w - 4,
            height=box_h - 24,
            value=default_val,
            fillColor=LIGHT_BG,
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
        name="p1_introducao_fluxo",
        tooltip="Introdução e Fluxo de Visitantes",
        x=45,
        y=y_sec2 + 5,
        width=width - 90,
        height=sec2_h - 35,
        value=intro_text,
        fillColor=LIGHT_BG,
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
        name="p1_desempenho_equipe",
        tooltip="Desempenho e Organização da Equipe",
        x=45,
        y=y_sec3 + 5,
        width=width - 90,
        height=sec3_h - 35,
        value=desempenho_text,
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    c.showPage() # End of Page 1

    # ==========================================
    # PAGE 2: CONTINUAÇÃO (OBSERVAÇÕES & ACOMODAÇÃO)
    # ==========================================
    # Header Banner
    c.setFillColor(NAVY)
    c.rect(120, height - 60, width - 160, 35, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(130, height - 48, "RELATÓRIO MENSAL - CONTINUAÇÃO (PÁGINA 2)")
    
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, height - 52, "fgc")
    c.setFont("Helvetica", 9)
    c.drawString(75, height - 44, "30")
    c.drawString(75, height - 54, "anos")

    # Two columns layout for top section of Page 2
    col_w = (width - 80 - 15) / 2 # ~250 pt
    y_p2_top = height - 370
    p2_top_h = 295
    
    # Left Column: OBSERVAÇÕES E PONTOS DE ATENÇÃO
    x_left = 40
    c.setFillColor(NAVY)
    c.rect(x_left, y_p2_top + p2_top_h - 35, col_w, 35, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x_left + col_w/2, y_p2_top + p2_top_h - 16, "OBSERVAÇÕES E PONTOS")
    c.drawCentredString(x_left + col_w/2, y_p2_top + p2_top_h - 28, "DE ATENÇÃO")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(x_left, y_p2_top, col_w, p2_top_h - 35, fill=1, stroke=1)
    
    obs_text = (
        "As lixeiras de descarte de chicletes, na porta principal, estão em local visível, evitando sujeiras nos espaços expostos. "
        "Aconselha-se manter a fiscalização preventiva para garantir a limpeza contínua.\r\r"
        "Seguem em andamento as estratégias de fluxo para prevenção de aglomerações e gestão de permanência dos visitantes."
    )
    
    form.textfield(
        name="p2_observacoes",
        tooltip="Observações e Pontos de Atenção",
        x=x_left + 5,
        y=y_p2_top + 5,
        width=col_w - 10,
        height=p2_top_h - 45,
        value=obs_text,
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    # Right Column: ACOMODAÇÃO DE PERTENCES
    x_right = 40 + col_w + 15
    c.setFillColor(NAVY)
    c.rect(x_right, y_p2_top + p2_top_h - 35, col_w, 35, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x_right + col_w/2, y_p2_top + p2_top_h - 16, "ACOMODAÇÃO DE")
    c.drawCentredString(x_right + col_w/2, y_p2_top + p2_top_h - 28, "PERTENCES")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(x_right, y_p2_top, col_w, p2_top_h - 35, fill=1, stroke=1)
    
    pertences_text = (
        "Para a acomodação e guarda temporária de pertences de visitantes no espaço de exposição, dispõe-se de armários e guarda-volumes localizados no edifício B3."
    )
    
    form.textfield(
        name="p2_pertences",
        tooltip="Acomodação de Pertences",
        x=x_right + 5,
        y=y_p2_top + 5,
        width=col_w - 10,
        height=p2_top_h - 45,
        value=pertences_text,
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    # Bottom Section Page 2: VISITANTES NA EXPOSIÇÃO (Photo box 1)
    y_p2_bot = height - 760
    p2_bot_h = 360
    
    c.setFillColor(NAVY)
    c.rect(40, y_p2_bot + p2_bot_h - 25, width - 80, 25, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y_p2_bot + p2_bot_h - 18, "VISITANTES NA EXPOSIÇÃO")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(40, y_p2_bot, width - 80, p2_bot_h - 25, fill=1, stroke=1)
    
    form.textfield(
        name="p2_legenda_foto1",
        tooltip="Legenda / Descrição da Imagem (Página 2)",
        x=45,
        y=y_p2_bot + 5,
        width=width - 90,
        height=p2_bot_h - 35,
        value="[Área reservada para Imagem / Registro Fotográfico - Clique ou insira a foto do grupo de visitantes no estande do FGC 30 Anos]",
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    c.showPage() # End of Page 2

    # ==========================================
    # PAGE 3: REGISTROS FOTOGRÁFICOS DOS VISITANTES
    # ==========================================
    # Header Banner
    c.setFillColor(NAVY)
    c.rect(120, height - 60, width - 160, 35, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(130, height - 48, "RELATÓRIO MENSAL - REGISTROS FOTOGRÁFICOS (PÁGINA 3)")
    
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, height - 52, "fgc")
    c.setFont("Helvetica", 9)
    c.drawString(75, height - 44, "30")
    c.drawString(75, height - 54, "anos")

    # Photo Slot A (Top)
    y_p3_top = height - 410
    p3_slot_h = 330
    
    c.setFillColor(NAVY)
    c.rect(40, y_p3_top + p3_slot_h - 25, width - 80, 25, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y_p3_top + p3_slot_h - 18, "REGISTRO FOTOGRÁFICO - FOTO 1")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(40, y_p3_top, width - 80, p3_slot_h - 25, fill=1, stroke=1)
    
    form.textfield(
        name="p3_foto1_descricao",
        tooltip="Foto 1 - Legenda e Imagem",
        x=45,
        y=y_p3_top + 5,
        width=width - 90,
        height=p3_slot_h - 35,
        value="[Insira aqui a foto do grupo de visitantes / atendimento e adicione a legenda correspondente]",
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    # Photo Slot B (Bottom)
    y_p3_bot = height - 760
    
    c.setFillColor(NAVY)
    c.rect(40, y_p3_bot + p3_slot_h - 25, width - 80, 25, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y_p3_bot + p3_slot_h - 18, "REGISTRO FOTOGRÁFICO - FOTO 2")
    
    c.setFillColor(colors.white)
    c.setStrokeColor(NAVY)
    c.rect(40, y_p3_bot, width - 80, p3_slot_h - 25, fill=1, stroke=1)
    
    form.textfield(
        name="p3_foto2_descricao",
        tooltip="Foto 2 - Legenda e Imagem",
        x=45,
        y=y_p3_bot + 5,
        width=width - 90,
        height=p3_slot_h - 35,
        value="[Insira aqui a foto complementar de interação com o público / espaço da exposição]",
        fillColor=LIGHT_BG,
        textColor=DARK_GRAY,
        fontSize=10
    )

    c.save()

build_pdf(pdf_path)
print("3-Page PDF generated successfully!")