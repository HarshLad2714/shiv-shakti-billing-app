"""QR image used by scripts/make-table-qr.swift. Run both from the repo root."""

import urllib.request
from pathlib import Path

import qrcode

URL = "https://shiv-shakti-billing-app.netlify.app/order"
FONT_DIR = Path("/tmp/shiv-shakti-fonts")
QR_PATH = Path("/tmp/shiv-order-qr.png")


def main():
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    gujarati = FONT_DIR / "NotoSansGujarati-Bold.ttf"
    if not gujarati.exists():
        urllib.request.urlretrieve(
            "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Bold.ttf",
            gujarati,
        )
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=18, border=1)
    qr.add_data(URL)
    qr.make(fit=True)
    qr.make_image(fill_color="#14110F", back_color="#FFFDF8").save(QR_PATH)
    print(QR_PATH)


if __name__ == "__main__":
    main()
