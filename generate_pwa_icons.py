#!/usr/bin/env python3
"""
Gera os ícones PWA do FlowEdu com fundo sólido branco (para any)
e fundo verde escuro com safe zone (para maskable).
"""
from PIL import Image
import os

PUBLIC_DIR = "client/public"
LOGO_SRC = os.path.join(PUBLIC_DIR, "logo-512.png")

# Cor de fundo para ícone normal (branco)
BG_WHITE = (255, 255, 255, 255)
# Cor de fundo para maskable (verde escuro do FlowEdu, igual ao tema)
BG_GREEN = (22, 101, 52, 255)   # #166534 - green-800

def make_icon_any(logo: Image.Image, size: int, bg_color: tuple) -> Image.Image:
    """Cria ícone com logo centralizado em fundo sólido."""
    canvas = Image.new("RGBA", (size, size), bg_color)
    # Padding de 15% de cada lado
    pad = int(size * 0.15)
    logo_size = size - 2 * pad
    logo_resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
    canvas.paste(logo_resized, (pad, pad), logo_resized)
    return canvas

def make_icon_maskable(logo: Image.Image, size: int, bg_color: tuple) -> Image.Image:
    """
    Cria ícone maskable: logo dentro da safe zone (80% central).
    O Android pode recortar até 10% de cada borda.
    """
    canvas = Image.new("RGBA", (size, size), bg_color)
    # Safe zone: logo ocupa 60% do tamanho total (centralizado)
    logo_size = int(size * 0.60)
    pad = (size - logo_size) // 2
    logo_resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
    canvas.paste(logo_resized, (pad, pad), logo_resized)
    return canvas

def save_png(img: Image.Image, path: str):
    # Converter para RGB se necessário (para ícones sem transparência)
    out = img.convert("RGBA")
    out.save(path, "PNG", optimize=True)
    print(f"  Salvo: {path} ({img.size[0]}x{img.size[1]})")

# Carregar logo original (RGBA com fundo transparente)
logo = Image.open(LOGO_SRC).convert("RGBA")
print(f"Logo carregado: {logo.size} mode={logo.mode}")

# --- icon-192.png (any) ---
icon192 = make_icon_any(logo, 192, BG_WHITE)
save_png(icon192, os.path.join(PUBLIC_DIR, "icon-192.png"))

# --- icon-512.png (any) ---
icon512 = make_icon_any(logo, 512, BG_WHITE)
save_png(icon512, os.path.join(PUBLIC_DIR, "icon-512.png"))

# --- icon-192-maskable.png (maskable) ---
icon192m = make_icon_maskable(logo, 192, BG_GREEN)
save_png(icon192m, os.path.join(PUBLIC_DIR, "icon-192-maskable.png"))

# --- icon-512-maskable.png (maskable) ---
icon512m = make_icon_maskable(logo, 512, BG_GREEN)
save_png(icon512m, os.path.join(PUBLIC_DIR, "icon-512-maskable.png"))

# --- apple-touch-icon.png (180x180, fundo branco) ---
apple = make_icon_any(logo, 180, BG_WHITE)
save_png(apple, os.path.join(PUBLIC_DIR, "apple-touch-icon.png"))

print("\nTodos os ícones PWA gerados com sucesso!")
