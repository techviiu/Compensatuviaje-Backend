# Calculator Module


## Flujo de cálculo
```
Request → Validator → Service.calculate() → Response
                          ↓
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   getAirports()   calculateHaversine()  getEmissionFactor()
         ↓                ↓                ↓
    [lat, lon]        distancia        factor DEFRA
         └────────────────┼────────────────┘
                          ↓
              kgCO2 = distancia × factor × pax
                          ↓
              precio = tonsCO2 × 15990 CLP
```

## Endpoint
```
POST /api/public/calculator/estimate

Body:
{
  "origin": "SCL",
  "destination": "MIA",
  "cabinCode": "economy",    // economy, premium_economy, business, first
  "passengers": 2,
  "roundTrip": true,
  "userId": "uuid"           // opcional: si viene, guarda en BD
}
```

## Fórmulas

**Distancia:** Haversine (error ~0.5%)

**Emisiones:** `kgCO2 = distancia × factor × pasajeros`
- Factores ya incluyen RF (no multiplicar de nuevo)

**Precio:** `CLP = tonsCO2 × 15990`

**Equivalencias (Precio Sombra, NO EPA):**
- 1 ton = 1 árbol
- 1 ton = 800 litros agua
- 1 ton = 0.08 m² vivienda
- 1 ton = 9 kg textil

## Factores DEFRA 2025 (kg CO2/km/pax)

| Haul | Economy | Premium | Business | First |
|------|---------|---------|----------|-------|
| Domestic (<500km) | 0.22928 | 0.22928 | 0.22928 | 0.22928 |
| Short (500-3700km) | 0.12576 | 0.18863 | 0.18863 | 0.18863 |
| Long (>3700km) | 0.11704 | 0.18726 | 0.33940 | 0.46814 |
