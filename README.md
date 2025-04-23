# create-svelte

npm install -g firebase-tools



### General 


1. **Estructura del proyecto:** 

    ```
    poweradmin/
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── src/
    │   ├── app.css
    │   ├── lib/
    │   │   ├── asistencias/
    │   │   │   └── AsistenciasGridCraft.svelte
    │   │   ├── components/
    │   │   │   ├── BrandSide.svelte
    │   │   │   ├── MenuLateral.svelte
    │   │   │   └── ui/
    │   │   │       ├── ButtonLogOut.svelte
    │   │   │       ├── Modal.svelte
    │   │   │       ├── Sidebar.svelte
    │   │   │       └── Time.svelte
    │   │   ├── equipos/
    │   │   │   └── EquiposGridCraft.svelte
    │   │   ├── stores/
    │   │   │   └── index.ts
    │   │   ├── types/
    │   │   │   └── index.ts
    │   ├── routes/
    │   │   ├── +layout.svelte
    │   │   ├── +page.svelte
    │   │   ├── panel/
    │   │   │   ├── +layout.svelte
    │   │   │   ├── usuarios/
    │   │   │   │   ├── new/
    │   │   │   │   │   └── +page.svelte
    │   │   │   │   └── nuevoemp/
    │   │   │   │       └── +page.svelte
    │   │   │   ├── asistencias/
    │   │   │   │   └── +page.svelte
    │   │   │   ├── equipos/
    │   │   │   │   └── +page.svelte
    ├── firebase.json
    ├── .firebaserc
    ```

2.  **Using Lists (Nested):**  This can be more readable for some.

    ```
    poweradmin/
    *   README.md
    *   package.json
    *   tsconfig.json
    *   vite.config.ts
    *   src/
        *   app.css
        *   lib/
            *   asistencias/
                *   AsistenciasGridCraft.svelte
            *   components/
                *   BrandSide.svelte
                *   MenuLateral.svelte
                *   ui/
                    *   ButtonLogOut.svelte
                    *   Modal.svelte
                    *   Sidebar.svelte
                    *   Time.svelte
            *   equipos/
                *   EquiposGridCraft.svelte
            *   stores/
                *   index.ts
            *   types/
                *   index.ts
        *   routes/
            *   +layout.svelte
            *   +page.svelte
            *   panel/
                *   +layout.svelte
                *   usuarios/
                    *   new/
                        *   +page.svelte
                    *   nuevoemp/
                        *   +page.svelte
                *   asistencias/
                    *   +page.svelte
                *   equipos/
                    *   +page.svelte
    *   firebase.json
    *   .firebaserc
    ```



```json
{
  "created_at": "2025-04-15T12:38:27-06:00",
  "curp": "REVJ750603HDFYGN00",
  "dias_laborables": [
    "Lunes"
  ],
  "domicilio": {
    "calle": "las Vegas",
    "colonia": "Ahuehuete",
    "cp": "52943",
    "numero_ext": "500",
    "numero_int": ""
  },
  "edad": 50,
  "email": "jean@dos.com",
  "estado_civil": "soltero",
  "fecha_ingreso": "",
  "genero": "masculino",
  "isBlocked": false,
  "lugar_ciudad": "Guadalajara",
  "lugar_estado": "Jalisco",
  "nombre_completo": "Jean Reynoso ",
  "puesto": "1",
  "rfc": "REVJ750603JX3",
  "role": "admin",
  "uid": "KrGNoHEc8LhENio3dSanw7isa2a2",
  "username": "Jean Luis Reynoso Vega"
}
```json