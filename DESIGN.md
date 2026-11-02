# DESIGN.md — Sistema de identidad visual SITELSEG

> **Fuente de verdad:** *BRANDBOOK SITELSEG*, manual de identidad de marca (26 páginas, abril de 2025).  
> **Alcance:** especificación de diseño para interfaces digitales, sitios web, materiales corporativos y activos de marca.  
> **Criterio:** las reglas marcadas **[Manual]** provienen del brandbook; las marcadas **[Propuesta digital]** son recomendaciones de implementación y no normas oficiales.

## 1. Esencia de marca

**Marca:** Sitelseg  
**Descriptor / eslogan:** «Telecomunicaciones y seguridad».  
**Atributos expresados por el manual:** seguridad, confianza, conectividad, tecnología, modernidad, control, protección, fortaleza y profesionalismo.

El imagotipo reúne un isotipo y un logotipo. El isotipo sintetiza **nube + candado + conectividad**. La expresión gráfica debe ser moderna, amigable y formal. **[Manual, pp. 3, 6–7]**

## 2. Identidad cromática

### 2.1 Colores primarios [Manual, p. 17]

| Token | Nombre funcional | HEX | RGB | Pantone | Uso sugerido |
|---|---|---|---|---|---|
| `brand.primary` | Azul Sitelseg | `#367EF6` | 54, 126, 246 | 2727 C | Identidad, acentos, CTA |
| `brand.ink` | Negro Sitelseg | `#1B1C1E` | 27, 28, 30 | Neutral Black U | Texto, logotipo en fondo claro |

**CMYK declarado:** azul `77, 51, 0, 0`; negro `78, 68, 59, 80`.

### 2.2 Colores complementarios [Manual, p. 18]

| Token | Pantone | HEX indicado | RGB indicado | Observaciones |
|---|---|---|---|---|
| `brand.cyan` | 638 U | `#22C0F8` | 34, 192, 248 | Acento cian |
| `brand.blue.deep` | 3005 U | `#0A78BA` | 10, 120, 186 | Azul complementario |
| `brand.complementary.656u` | 656 U | `#0A78BA` | 10, 120, 186 | **Dato duplicado en el manual:** verificar antes de corregir |

**Nota de integridad:** el brandbook asigna el mismo HEX y RGB a Pantone 3005 U y 656 U. Esta especificación conserva el dato original y no infiere un tercer color.

### 2.3 Colores de interfaz [Propuesta digital]

- `surface.default: #FFFFFF` — fondos principales.
- `surface.inverse: #1B1C1E` — superficies oscuras.
- `text.primary: #1B1C1E` — contenido sobre fondo claro.
- `text.inverse: #FFFFFF` — contenido sobre fondo oscuro.
- `action.primary: #367EF6` — botones, enlaces destacados.
- `accent.cyan: #22C0F8` — acentos limitados.
- `accent.deep: #0A78BA` — variación para elementos complementarios.

No se definen en el manual escalas tonales, colores de estado (éxito/error/advertencia), ni pares de contraste WCAG; deberán diseñarse y verificarse por separado.

## 3. Tipografía

| Rol | Familia / peso | Procedencia |
|---|---|---|
| Logotipo «Sitelseg» | **Conthrax Sb Regular** | Manual, p. 15 |
| Eslogan | **Poppins SemiBold** | Manual, p. 15 |
| Títulos secundarios / textos de marca | **Poppins Bold / Medium / Regular** | Manual, p. 16 |

**[Propuesta digital]** Usar `Poppins` como familia general para UI y contenido. Reservar `Conthrax Sb Regular` para el arte original del logotipo, no para recrearlo en CSS. Si no se dispone de la licencia o los archivos de fuente, utilizar una alternativa sans-serif para textos de interfaz, sin alterar el logotipo oficial.

```css
:root {
  --font-ui: 'Poppins', system-ui, -apple-system, sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

El manual **no establece** escala tipográfica, interlineados, tamaños de encabezados ni reglas de responsive typography.

## 4. Logotipo e isotipo

### 4.1 Variantes [Manual, pp. 6–10, 19]

- **Imagotipo vertical:** isotipo sobre logotipo y descriptor.
- **Imagotipo horizontal:** isotipo a la izquierda y logotipo/descriptor a la derecha; especialmente apto para encabezados, firmas, sitios web y papelería.
- **Isotipo independiente:** símbolo de nube/candado/conectividad.
- **Sobre blanco:** isotipo azul y logotipo negro.
- **Sobre negro:** isotipo azul y logotipo blanco.

**Importante:** usar los archivos oficiales del imagotipo, no redibujarlo a partir de esta descripción. Conservar proporciones, alineación y trazos.

### 4.2 Zona de seguridad [Manual, p. 10]

Dejar alrededor del imagotipo un espacio libre equivalente a la **altura de la segunda letra «S» de «Sitelseg»**, según la definición literal del manual. La ilustración es la referencia de aplicación. No sustituir por un margen arbitrario cuando se disponga del arte vectorial.

### 4.3 Reducción mínima [Manual, p. 13]

Medidas tal como aparecen en el diagrama del manual:

| Variante | Impresión | Digital |
|---|---|---|
| Isotipo | 1.9 × 1.4 cm | 50 × 45 px |
| Logotipo tipográfico | 5 × 1 cm | 140 × 30 px |
| Imagotipo vertical | 5 × 3.7 cm | 140 × 100 px |

**Advertencia:** las medidas son las cotas mostradas en la lámina y pueden ser aproximadas; el manual no declara una metodología de exportación ni densidades de pantalla. Para el imagotipo horizontal completo, confirmar el mínimo en el arte final.

### 4.4 Usos prohibidos [Manual, pp. 11–12]

1. Intercambiar posiciones de sus elementos.
2. Deformar o alterar proporciones.
3. Aplicar degradados al logotipo.
4. Cambiar sus colores de identidad.
5. Agregar contornos.
6. Agregar sombras.
7. Rotar el conjunto o sus elementos.
8. Agrandar selectivamente componentes.

## 5. Lenguaje visual y composición

### 5.1 Rasgos observados [Manual, pp. 2, 8–10, 21–25]

- Predominan **azul intenso, blanco y negro**.
- Se usan composiciones de alto contraste con grandes planos de color.
- Los títulos de las láminas emplean azul sobre superficies claras y blanco sobre azul u oscuro.
- Existe un patrón repetitivo formado por el isotipo, visible en la página 2.
- La geometría del símbolo es redondeada y de trazo continuo; **esto no constituye una regla formal de radios para UI**.
- Las aplicaciones muestran papelería, uniformes, tarjetas, firma de correo y perfil de Instagram.

### 5.2 Traducción a producto digital [Propuesta digital]

- Diseñar con fondos limpios, jerarquía tipográfica clara y acentos azules puntuales.
- Priorizar el imagotipo horizontal oficial en la navegación de escritorio y variantes autorizadas según el espacio disponible.
- Usar el isotipo oficial para avatar, favicon o recurso decorativo, previa validación de legibilidad en tamaños pequeños.
- Emplear el patrón del isotipo como textura secundaria de baja densidad; no debe competir con contenido o controles.
- Mantener contraste suficiente en textos y botones. El azul corporativo no garantiza por sí solo cumplimiento WCAG con cualquier tamaño de texto.
- No trasladar las prohibiciones de efectos **del logotipo** a toda la interfaz: por ejemplo, sombras de tarjetas UI no están reguladas por el manual.

## 6. Tokens para implementación web

```css
:root {
  /* Identidad oficial */
  --sitelseg-blue: #367ef6;
  --sitelseg-black: #1b1c1e;
  --sitelseg-cyan: #22c0f8;
  --sitelseg-blue-deep: #0a78ba;

  /* Tokens funcionales propuestos */
  --color-bg: #ffffff;
  --color-bg-inverse: var(--sitelseg-black);
  --color-text: var(--sitelseg-black);
  --color-text-inverse: #ffffff;
  --color-accent: var(--sitelseg-blue);
  --font-body: 'Poppins', system-ui, sans-serif;
}
```

```json
{
  "brand": {
    "name": "Sitelseg",
    "tagline": "Telecomunicaciones y seguridad",
    "colors": {
      "primary": "#367EF6",
      "black": "#1B1C1E",
      "cyan": "#22C0F8",
      "blueDeep": "#0A78BA"
    },
    "typography": {
      "logo": "Conthrax Sb Regular",
      "tagline": "Poppins SemiBold",
      "ui": "Poppins"
    }
  }
}
```

## 7. Componentes y aplicaciones

| Contexto | Regla documentada | Implementación sugerida |
|---|---|---|
| Sitio web / header | Se contempla logotipo horizontal (p. 9) | Usar SVG oficial, con zona de protección |
| Firma de email | Existe aplicación visual (p. 24) | Preservar jerarquía logo, nombre, cargo y contacto |
| Tarjeta de presentación | Existe aplicación visual (p. 23) | Mantener azul, negro, blanco y versiones autorizadas |
| Membrete | Existe aplicación visual (p. 21) | Emplear arte aprobado; no reconstruir desde mockup |
| Uniformes | Existe aplicación visual (p. 22) | Respetar posición y proporción del logo según arte |
| Instagram | Existe aplicación visual (p. 25) | Usar isotipo oficial para perfil y paleta institucional |

## 8. Accesibilidad y diseño responsivo [Propuesta digital]

- Verificar contraste WCAG AA para texto normal (≥ 4.5:1) y texto grande (≥ 3:1), y contraste de elementos no textuales relevantes (≥ 3:1).
- No usar el color como única señal de estado o error.
- Proporcionar texto alternativo significativo cuando el logotipo actúe como enlace; marcar isotipos puramente decorativos como tales.
- Garantizar navegación por teclado, foco visible y controles táctiles adecuados.
- No escalar el logotipo por debajo de los mínimos del manual sin autorización de marca.
- Definir breakpoints, grillas, espaciado, radios, elevación y estados de interacción a nivel de producto: **no aparecen especificados en el brandbook**.

## 9. Inventario de activos requerido

Para implementar esta guía sin pérdida de fidelidad, solicitar:

- Imagotipo vertical vectorial (SVG/AI/EPS), versión clara y oscura.
- Imagotipo horizontal vectorial, versión clara y oscura.
- Isotipo independiente y favicon autorizado.
- Patrón repetitivo original del isotipo.
- Archivos/licencias de Conthrax Sb y Poppins o confirmación de distribución permitida.
- Versiones de impresión (CMYK/Pantone) y digitales (RGB/HEX) aprobadas.

**El PDF presenta muestras y mockups, pero no garantiza que estos activos estén disponibles como archivos independientes listos para producción.**

## 10. Pendientes de validación

1. Confirmar el color de **Pantone 656 U**, que aparece con los mismos valores que 3005 U (p. 18).
2. Confirmar medidas mínimas y zona de seguridad para cada variante exportada del logotipo.
3. Definir tamaños, pesos y escalas tipográficas para producto digital.
4. Definir colores de estado y combinaciones accesibles sin alterar los colores corporativos.
5. Obtener activos vectoriales y licencias de fuentes antes de producción.
6. Aprobar la adaptación de la identidad a componentes UI y sistemas responsivos.

---

**Trazabilidad:** Brandbook SITELSEG, pp. 3 (propósito), 6–13 (imagotipo y normas), 15–19 (tipografía y color), 21–25 (aplicaciones). Los tokens funcionales, reglas de accesibilidad y recomendaciones UI se distinguen como propuestas, no como especificaciones oficiales del manual.
