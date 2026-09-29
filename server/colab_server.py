"""
=====================================================================
 MAZMORRA DE CARTAS — Servidor para Google Colab
=====================================================================

Este servidor Flask corre dentro de Google Colab y expone una API
pública gracias a pyngrok. Guarda las partidas, rankings y valida
tiradas de dado en el servidor (anti-trampas básico).

╔═══════════════════════════════════════════════════════════════╗
║ CÓMO USARLO EN GOOGLE COLAB (paso a paso):                     ║
╠═══════════════════════════════════════════════════════════════╣
║ 1. Abre https://colab.research.google.com                      ║
║ 2. Crea un notebook nuevo.                                     ║
║ 3. En la PRIMERA celda pega e instala dependencias:            ║
║       !pip install flask flask-cors pyngrok                    ║
║ 4. Regístrate GRATIS en https://ngrok.com y copia tu token.    ║
║ 5. En una celda: !ngrok config add-authtoken TU_TOKEN         ║
║ 6. Pega TODO este archivo en una celda y ejecútala.           ║
║ 7. Copia la URL pública que aparece (algo como                 ║
║    https://xxxx.ngrok-free.app) y ponla en js/config.js        ║
║    del juego (API_URL).                                        ║
╚═══════════════════════════════════════════════════════════════╝
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pyngrok import ngrok
import random
import time
import threading

app = Flask(__name__)
CORS(app)  # Permite que el juego (otro dominio) llame a esta API

# ─────────────────────────── "Base de datos" en memoria ───────────────
# Para el prototipo guardamos en memoria. En producción → Firebase.
PARTIDAS = []      # historial de partidas
RANKING  = []      # mejores puntuaciones


# ═══════════════════════════════ ENDPOINTS ═══════════════════════════

@app.route("/")
def home():
    return jsonify({
        "juego": "Mazmorra de Cartas",
        "estado": "servidor activo ⚔️",
        "endpoints": ["/ping", "/roll", "/save", "/ranking"]
    })


@app.route("/ping")
def ping():
    """Comprobar que el servidor responde desde el juego."""
    return jsonify({"ok": True, "msg": "pong 🎲", "time": time.time()})


@app.route("/roll", methods=["GET"])
def roll():
    """
    Tirada de dado autoritativa en el servidor.
    El cliente PUEDE usar esto en lugar de tirar localmente, así el
    resultado no se puede manipular desde el navegador.
    """
    sides = int(request.args.get("sides", 6))
    sides = max(2, min(sides, 100))
    value = random.randint(1, sides)
    return jsonify({"value": value, "sides": sides})


@app.route("/save", methods=["POST"])
def save():
    """Guarda el resultado de una partida y actualiza el ranking."""
    data = request.get_json(force=True, silent=True) or {}
    record = {
        "name":    str(data.get("name", "Anónimo"))[:20],
        "class":   data.get("class", "?"),
        "room":    int(data.get("room", 0)),
        "level":   int(data.get("level", 0)),
        "outcome": data.get("outcome", "?"),
        "date":    data.get("date", ""),
    }
    PARTIDAS.append(record)

    # Puntuación = salas superadas * 100 + nivel * 10
    score = record["room"] * 100 + record["level"] * 10
    record["score"] = score
    RANKING.append({"name": record["name"], "class": record["class"], "score": score})
    RANKING.sort(key=lambda r: r["score"], reverse=True)
    del RANKING[10:]  # top 10

    return jsonify({"ok": True, "guardado": record, "posicion_ranking": _rank_position(record["name"], score)})


@app.route("/ranking", methods=["GET"])
def ranking():
    """Devuelve el top 10 de mejores partidas."""
    return jsonify({"ranking": RANKING, "total_partidas": len(PARTIDAS)})


def _rank_position(name, score):
    for i, r in enumerate(RANKING):
        if r["name"] == name and r["score"] == score:
            return i + 1
    return None


# ═══════════════════════════════ ARRANQUE ════════════════════════════

def _run_flask():
    app.run(port=5000, use_reloader=False)


def start():
    """Arranca Flask en un hilo y abre el túnel público con ngrok."""
    public_url = ngrok.connect(5000)
    print("=" * 60)
    print("  ⚔️  SERVIDOR DE MAZMORRA DE CARTAS ACTIVO")
    print("=" * 60)
    print(f"  URL PÚBLICA:  {public_url}")
    print("  → Copia esa URL en js/config.js  (API_URL)")
    print("=" * 60)

    threading.Thread(target=_run_flask, daemon=True).start()
    return public_url


# En Colab, ejecuta simplemente:  start()
if __name__ == "__main__":
    start()
    # Mantener vivo el proceso al correr como script normal
    while True:
        time.sleep(1)
