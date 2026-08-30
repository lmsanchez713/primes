from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

pdf_path = "Relatorio_Mensal_Completo_3Paginas.pdf"

# ---------------- palette (do mockup) ----------------
BG      = colors.HexColor("#101010")   # fundo da página
HEADER  = colors.HexColor("#3E3E3E")   # faixa do cabeçalho
BAR     = colors.HexColor("#C9C9C9")   # barras de título (cinza claro)
BLACK   = colors.HexColor("#111111")   # texto sobre barras claras
WHITE   = colors.HexColor("#F2F2F2")   # texto corpo
GRID    = colors.HexColor("#D9D9D9")   # rótulos do gráfico
GRIDLN  = colors.HexColor("#3A3A3A")   # linhas de grade
CHART   = colors.HexColor("#8C8C8C")   # barras do gráfico
LOGOBOX = colors.HexColor("#9C9C9C")

W, H = A4                       # 595.27 x 841.89 pt
ML = 40.0
CW = W - 2 * ML                 # 515.27
GAP = 20.0
W_L = 245.0
W_R = CW - W_L - GAP            # 250.27
X_L = ML
X_R = ML + W_L + GAP

BAR_H = 26.0
B_GAP = 12.0
T_GAP = 14.0
CHART_H = 175.0


def P_(text, size=9.5, bold=False, color=WHITE, align=0):
    st = ParagraphStyle("body",
                        fontName="Helvetica-Bold" if bold else "Helvetica",
                        fontSize=size, leading=size * 1.45,
                        textColor=color, alignment=align)
    return Paragraph(text, st)


class Doc:
    def __init__(self, filename):
        self.c = canvas.Canvas(filename, pagesize=A4)
        self._new_page()

    def _new_page(self):
        self.c.setFillColor(BG)
        self.c.rect(0, 0, W, H, fill=1, stroke=0)
        self.y = H - 24

    def ensure(self, need):
        if self.y - need < 48:
            self.c.showPage()
            self._new_page()


# ---------------- helpers de desenho ----------------

def col_height(w, items):
    h = 0.0
    for it in items:
        if it[0] == "bar":
            h += BAR_H + B_GAP
        elif it[0] == "chart":
            h += CHART_H + T_GAP
        else:
            _, p = it
            _, ph = p.wrap(w, 4000)
            h += ph + T_GAP
    return h


def draw_col(c, x, w, top, items):
    y = top
    for it in items:
        if it[0] == "bar":
            y -= BAR_H
            c.setFillColor(BAR)
            c.rect(x, y, w, BAR_H, fill=1, stroke=0)
            c.setFillColor(BLACK)
            c.setFont("Helvetica-Bold", 12)
            c.drawCentredString(x + w / 2, y + BAR_H / 2 - 4, it[1])
            y -= B_GAP
        elif it[0] == "chart":
            y -= CHART_H
            draw_chart(c, x, w, y, CHART_H)
            y -= T_GAP
        else:
            _, p = it
            _, ph = p.wrap(w, 4000)
            p.drawOn(c, x, y - ph)
            y -= ph + T_GAP


def row(doc, cols, gap_after=28.0):
    """cols = [(x, w, items)...] — colunas alinhadas no mesmo topo."""
    hs = [col_height(w, items) for _, w, items in cols]
    doc.ensure(max(hs) + gap_after)
    top = doc.y
    for (x, w, items), _ in zip(cols, hs):
        draw_col(doc.c, x, w, top, items)
    doc.y = top - (max(hs) + gap_after)


def header(doc):
    c = doc.c
    band = 112
    doc.ensure(band + 16)
    top = doc.y
    c.setFillColor(HEADER)
    c.rect(0, top - band, W, band, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(48, top - 48, "RELATÓRIO MENSAL")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(48, top - 78, "EQUIPE ORIENTAÇÃO DE PÚBLICO")
    # logo AEP
    bw, bh = 112, 72
    bx, by = W - 48 - bw, top - 18 - bh
    c.setFillColor(LOGOBOX)
    c.rect(bx, by, bw, bh, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(bx + bw / 2 - 14, by + 20, "AEP")
    c.saveState()                                   # pétala branca
    c.setFillColor(colors.white)
    c.translate(bx + bw - 26, by + bh - 16)
    c.rotate(-32)
    c.scale(1, 0.45)
    c.circle(0, 0, 17, fill=1, stroke=0)
    c.restoreState()
    doc.y = top - band - 16


def draw_chart(c, x, w, bottom, h):
    top = bottom + h
    # legenda
    lx = x + w / 2 - 42
    c.setFillColor(GRID)
    c.circle(lx, top - 8, 2.2, fill=1, stroke=0)
    c.setFont("Helvetica", 7.5)
    c.drawString(lx + 6, top - 10.5, "Visitantes / Exposição")
    # área de plotagem
    ax = x + 36
    aw = w - 40
    ay = bottom + 12
    ah = h - 34
    vmax = 1400.0
    c.setFont("Helvetica", 6.5)
    for v in range(0, 1401, 200):
        gx = ax + aw * v / vmax
        c.setStrokeColor(GRIDLN)
        c.setLineWidth(0.5)
        c.line(gx, ay, gx, ay + ah)
        lab = f"{v // 1000}.{v % 1000:03d}" if v >= 1000 else str(v)
        c.setFillColor(GRID)
        c.drawCentredString(gx, ay - 9, lab)
    # barras horizontais
    data = [("ABRIL", 850), ("MAIO", 1237)]
    bh = ah * 0.36
    gap = ah * 0.13
    ytop = ay + ah
    c.setFont("Helvetica", 7)
    for name, val in data:
        ytop -= gap + bh
        bar_w = max(aw * val / vmax, 8)
        c.setFillColor(CHART)
        c.roundRect(ax, ytop, bar_w, bh, 5, fill=1, stroke=0)
        c.setFillColor(GRID)
        c.drawRightString(ax - 5, ytop + bh / 2 - 2.5, name)


# ---------------- documento ----------------

def build(filename):
    doc = Doc(filename)

    header(doc)

    # linha 1: PERÍODO/PROJETO/EQUIPE  |  INTRODUÇÃO/ATENDIMENTO
    left = [
        ("bar", "PERÍODO"),
        ("p", P_("01 à 31 de Maio / 2026", align=1)),
        ("bar", "PROJETO"),
        ("p", P_('MUB3 / Exposição Temporária "Acervo em Movimento: '
                 'Entre permanências e reinvenções".', align=1)),
        ("bar", "EQUIPE"),
        ("p", P_("Supervisão: Ruana Negri<br/>Orientadoras: Daniela e Larissa<br/>"
                 "Folguista: Luiza di Rose", align=1)),
    ]
    right = [
        ("bar", "INTRODUÇÃO"),
        ("p", P_("Durante o mês de maio a exposição teve um bom fluxo de visitantes. "
                 "Na última semana o número de público diminuiu, possivelmente por conta "
                 "do clima estar bem frio. Não houveram intercorrências com nenhum "
                 "visitante e/ou pessoas de outras equipes que habitam o prédio das moedas.")),
        ("bar", "ATENDIMENTO"),
        ("p", P_("1.237 VISITANTES", bold=True, align=1)),
        ("p", P_("Residentes de São Paulo, estrangeiros, Turistas brasileiros. "
                 "Grupos e público espontâneo.")),
    ]
    row(doc, [(X_L, W_L, left), (X_R, W_R, right)])

    # linha 2: gráfico | OBSERVAÇÃO
    obs1 = [
        ("bar", "OBSERVAÇÃO"),
        ("p", P_("- Por conta da reforma no calçado (feita pela prefeitura), a porta "
                 "principal foi novamente fechada. Impactando a visitação do público.")),
        ("p", P_("- Em dado momento, a exposição nova da Farol Santander contribuiu com "
                 "o surgimento de público aos finais de semana.")),
        ("p", P_("- Alguns visitantes procuraram conversar sobre as obras "
                 "(interação - mediação) enquanto outros seguiram com a preferência "
                 "de visitar a exposição individualmente.")),
    ]
    row(doc, [(X_L, W_L, [("chart", None)]), (X_R, W_R, obs1)])

    # linha 3: ESTRUTURA | OBSERVAÇÃO
    estr = [
        ("bar", "ESTRUTURA"),
        ("p", P_("- Quanto a falta de armários no prédio das moedas, testamos e "
                 "encontramos uma forma de acomodar nossas coisas, sem que atrapalhasse "
                 "visualmente a estética do ambiente. De forma moderada, acomodamos "
                 "nosso material entre o chão e a base do assento da cadeira, essa que "
                 "usamos no espaço expositivo.")),
        ("p", P_("- No final do dia, o contador está sendo guardado no encalxe do verso "
                 "da cadeira de descanso. Ficando em fácil alcance para a orientadora "
                 "que abrirá a exposição na manhã seguinte.")),
    ]
    obs2 = [
        ("bar", "OBSERVAÇÃO"),
        ("p", P_("- Ainda temos disponível o armário que se encontra no outro prédio, "
                 "para guardarmos nossas coisas quando trouxemos grandes volumes.")),
        ("p", P_("- Nota-se que o espaço da exposição tem ficado com acúmulo de pó, "
                 "principalmente em cima das molduras / painéis. A higiene do chão "
                 "passou a ser feita com mais constância a partir da metade do mês. "
                 "Foi sinalizado para Polly sobre a necessidade de manutenção, limpeza "
                 "dos materiais expostos. Ela informou que mandaria um técnico do "
                 "centro de referência para resolver a questão.")),
    ]
    row(doc, [(X_L, W_L, estr), (X_R, W_R, obs2)])

    # linha 4: EQUIPE / ORGANIZAÇÃO
    row(doc, [(X_L, CW, [
        ("bar", "EQUIPE / ORGANIZAÇÃO"),
        ("p", P_("Escala de turnos, divisão de responsabilidades e rotina de "
                 "atendimento da equipe.")),
    ])])

    doc.c.save()
    print("PDF gerado com sucesso!")


build(pdf_path)
