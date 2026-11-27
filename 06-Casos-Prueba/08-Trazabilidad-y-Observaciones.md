# Trazabilidad y observaciones

[← Índice](README.md)

## Trazabilidad

| Requisito | Casos |
|---|---|
| HU-CLI-01 | CP-09, CP-10 |
| HU-CLI-02 | CP-12, CP-13 |
| HU-CLI-03 | CP-12 |
| HU-CLI-04 | CP-11, CP-15, CP-35 |
| HU-CLI-05 | CP-14 |
| HU-CLI-06 | CP-16, CP-20 |
| HU-CLI-07 | CP-01, CP-02, CP-03, CP-36 |
| HU-PER-01 | CP-24, CP-25 |
| HU-PER-02 | CP-26 |
| HU-PER-03 | CP-27, CP-28 |
| HU-PER-04 | CP-17 |
| HU-PER-05 | CP-18 |
| HU-PER-06 | CP-19 |
| HU-PER-07 | CP-21, CP-22, CP-23 |
| HU-USU-01 | CP-32, CP-33 |
| HU-USU-02 | CP-04 a CP-08, CP-34 |
| HU-ADM-01 | CP-29, CP-30 |
| HU-ADM-02 | CP-29 |
| HU-ADM-03 | CP-31 |
| RN-NEG-01 | CP-11, CP-13, CP-35 |
| RN-NEG-02 | CP-09, CP-15, CP-27 |
| RN-NEG-03 | CP-12 |
| RN-NEG-04 | CP-26 |
| RN-NEG-05 | CP-14, CF-PED-11 |
| RN-NEG-06 | CP-18, CP-19, CP-23, CP-31 |
| RN-NEG-07 | CP-17, CP-21, CP-22, CP-23 |
| RNF-01 Persistencia | CP-37 |
| RNF-02 Seguridad | CP-08, CF-AUT-01 a 05, CF-REG-07 |
| RNF-03 Integridad | CF-BD-01 a 03 |
| RNF-04 Concurrencia | CF-PER-10 |
| RNF-06 Verificabilidad | Anexo B |

## Observaciones y límites

- **Validación del correo en dos pasos:** el aviso de correo no institucional lo da el servidor, así que aparece cuando los demás campos ya son válidos. Por eso se prueba por separado (CP-36); CP-02 se ajustó para cubrir solo cédula, celular y contraseña.
- **Presentación:** en el panel del trabajador, los contadores de los filtros se muestran muy separados de sus paréntesis (visible en CP-17). No afecta la función.
- **No cubierto:** otros navegadores, pantallas de teléfono, pruebas de carga y la actualización automática cada 15 segundos de las listas.
- **Base de datos:** las pruebas se hicieron en PostgreSQL local, no en el proyecto de Supabase.
