# Sistema de Gestión de Vehículos y Combustible

Aplicación de escritorio para llevar el registro semanal de viajes de vehículos y calcular automáticamente el costo de combustible consumido.

## Requisitos

- **Node.js** 20.x o superior
- **pnpm** 11.x (gestor de paquetes utilizado)
- **macOS**, **Windows** o **Linux**

## Instalación

```bash
# Instalar dependencias
pnpm install

# En macOS con chip Apple Silicon puede ser necesario recompilar better-sqlite3
pnpm run rebuild:mac:arm
```

## Ejecución en desarrollo

```bash
pnpm run dev
```

## Compilación

```bash
# Compilar para el sistema operativo actual
pnpm run build

# Compilar para macOS (Intel)
pnpm run build:mac

# Compilar para macOS (Apple Silicon)
pnpm run build:mac:arm

# Compilar para Windows
pnpm run build:win

# Compilar para Linux
pnpm run build:linux

# Compilar para todas las plataformas
pnpm run build:all
```

Los ejecutables se generan en la carpeta `dist/`.

## Pruebas

```bash
# Ejecutar todas las pruebas
pnpm run test

# Ejecutar con cobertura
pnpm run test:coverage

# Ejecutar en modo observador
pnpm run test:watch
```

## Linting

```bash
# Verificar código
pnpm run lint

# Corregir errores automáticamente
pnpm run lint:fix
```

## Funcionalidades

### Gestión de choferes

- Registrar choferes con nombre y teléfono.
- Editar y eliminar (suave) choferes.
- Los choferes activos se muestran en los formularios de salida.

### Gestión de vehículos

- Registrar vehículos con nombre, placa, rendimiento de combustible (km/L) y precio del combustible ($/L).
- Editar y eliminar (suave) vehículos.
- El rendimiento y precio del combustible se utilizan en el cálculo de costos.

### Registro de salidas (viajes)

- Registrar viajes asignados a un chofer y vehículo.
- Campos: fecha, kilómetros recorridos, precio del combustible, opción de ida y regreso.
- **Cálculo automático del costo**: `costo_total = (kilometros / rendimiento) * precio_combustible`
- La opción "ida y regreso" es informativa; no afecta el cálculo.
- Editar y eliminar salidas individuales.

### Semanas de trabajo

- Las salidas se agrupan por semana (inicio: lunes).
- Crear, ver y eliminar (suave) semanas de trabajo.
- Totales calculados automáticamente por semana: kilómetros totales, costo total.

### Exportación e importación

- **Formato .ggw** (JSON): exportar e importar semanas completas de trabajo.
- **Formato Excel** (.xlsx): exportar tabla resumen con columnas configurables.
- Coincidencia de nombres normalizada a mayúsculas para importar/exportar.

### Notificaciones

- Feedback visual con notificaciones toast (éxito, error, información) tras cada operación CRUD.

## Estructura del proyecto

```
gestion-gasolina/
├── src/
│   ├── main/           # Proceso principal de Electron
│   │   ├── database/  # SQLite (better-sqlite3) + seed data
│   │   ├── services/  # Lógica de negocio (exportar, importar)
│   │   └── main.js    # Punto de entrada principal
│   ├── preload/       # Script de preload para IPC
│   └── renderer/      # Interfaz React
│       ├── components/ # Componentes UI
│       ├── pages/     # Páginas principales
│       ├── hooks/     # Custom hooks de React
│       └── styles/    # Estilos CSS
├── tests/
│   └── unit/          # Pruebas unitarias independientes (88 tests)
├── resources/         # Recursos de build (iconos)
└── dist/              # Ejecutables compilados
```

## Base de datos

SQLite (vía `better-sqlite3`), base de datos local almacenada en la carpeta de datos del usuario.

### Datos iniciales (seed)

- **Choferes**: MIGUEL, RUBEN, JUAN
- **Vehículos**: 4 vehículos de ejemplo

## Licencia

MIT
