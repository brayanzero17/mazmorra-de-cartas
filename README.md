# ⚔️ Mazmorra de Cartas

Prototipo de un juego de **cartas + dados** con ambientación de mazmorra fantasy.
Proyecto de semillero de videojuegos.

El **dado (d6)** decide qué cartas puedes jugar cada turno — esa es la mecánica central.

---

## 🎮 Cómo jugar

1. Escribe tu nombre de aventurero.
2. Elige una de las **4 clases** (cada una juega distinto según el dado):
   | Clase | Estilo | El dado... |
   |-------|--------|------------|
   | 🧝 **Elfo Arquero** | Preciso y ágil | Recompensa dados altos |
   | ⚔️ **Guerrero** | Fuerza bruta | Constante con cualquier dado |
   | 🧙 **Mago** | Poder arcano | Explosivo pero variable |
   | 🗡️ **Pícaro** | Sigilo y astucia | Recompensa dados **bajos** |
3. En cada turno: **lanza el dado** 🎲 y juega una carta que cumpla su requisito.
4. Derrota a los enemigos de las **5 salas** (Goblin → Esqueleto → Orco → Nigromante → 🐉 Dragón).

---

## ▶️ Cómo ejecutar el juego (modo offline, sin servidor)

Funciona 100% en el navegador, sin instalar nada. Solo necesitas servirlo como sitio estático:

```bash
cd mazmorra-game
python3 -m http.server 8080
```

Luego abre en tu navegador: **http://localhost:8080**

> 💡 También puedes abrir `index.html` directamente, pero se recomienda el servidor local para evitar restricciones de los navegadores.

---

## 📁 Estructura del proyecto

```
mazmorra-game/
├── index.html            # Pantallas del juego
├── css/
│   └── style.css         # Estética de mazmorra (dorado sobre negro)
├── js/
│   ├── config.js         # Configuración (URL del servidor)
│   ├── data.js           # ⭐ Clases, cartas y enemigos (edita aquí para balancear)
│   ├── game.js           # Motor del juego (dado, combate, salas)
│   ├── ui.js             # Interfaz / render
│   ├── network.js        # Conexión opcional con el servidor Flask
│   └── firebase.js       # Integración opcional con Firebase
├── server/
│   └── colab_server.py   # Servidor Flask para Google Colab
└── README.md
```

---

## 🖥️ Servidor en Google Colab (opcional)

El profesor pidió usar Colab para el backend. El servidor guarda partidas y un **ranking global**.

1. Abre [Google Colab](https://colab.research.google.com) y crea un notebook.
2. Instala dependencias:
   ```
   !pip install flask flask-cors pyngrok
   ```
3. Regístrate gratis en [ngrok.com](https://ngrok.com), copia tu token y ejecútalo:
   ```
   !ngrok config add-authtoken TU_TOKEN
   ```
4. Copia todo el contenido de `server/colab_server.py` en una celda y ejecútala.
5. Colab te dará una **URL pública** (`https://xxxx.ngrok-free.app`).
6. Pega esa URL en `js/config.js` → `API_URL`.

**Endpoints del servidor:**
- `GET /ping` — comprobar conexión
- `GET /roll` — tirada de dado autoritativa (anti-trampas)
- `POST /save` — guardar partida
- `GET /ranking` — top 10 global

---

## 🔥 Firebase (opcional)

Para login y ranking persistente. Está desactivado por defecto (el juego usa `localStorage`).
Para activarlo, sigue las instrucciones dentro de `js/firebase.js` y descomenta los `<script>` de Firebase en `index.html`.

---

## 📱 Cómo generar un APK (para después)

El juego es web, así que se empaqueta fácil con **Capacitor**:

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "MazmorraCartas" "com.semillero.mazmorra"
# Copia los archivos del juego a la carpeta www/
npx cap add android
npx cap sync
npx cap open android   # abre Android Studio para generar el APK
```

> Alternativa rápida: instalarlo como **PWA** desde el navegador del celular (menú → "Agregar a pantalla de inicio").

---

## 🛠️ Cómo modificar / balancear el juego

Casi todo el balance vive en **`js/data.js`**:
- **Cartas**: cambia `effect`, `diceReq` (requisito del dado) y `calc` (fórmula de daño/curación).
- **Enemigos**: edita el array `ENEMIES` (HP y rango de ataque de cada sala).
- **Clases**: ajusta `maxHp` y las 5 cartas de cada clase.

Requisitos de dado disponibles:
`any` (cualquiera), `gte` (≥), `lte` (≤), `eq` (=), `even` (par), `odd` (impar).

---

## 🗺️ Próximos pasos (roadmap del GDD)

- [x] Prototipo jugable PvE (esta versión)
- [ ] Más cartas y salas
- [ ] Modo PvP en línea (4 jugadores) usando el servidor
- [ ] Arte y sonido propios
- [ ] Empaquetar APK final

---

_Hecho para el semillero de videojuegos 🎓_
