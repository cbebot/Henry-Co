// V3-41 — predictive quality & workload: pure engine surface (ARCHITECTURE §5.4).
//
// Everything exported here is deterministic, DB-less and AI-free. The optional
// staff-narrative slice lives in the hub adapter, downstream of these outputs —
// it can describe a forecast, never produce or alter one.
export * from "./workload";
export * from "./quality";
export * from "./dispute";
export * from "./budget";
export * from "./projection";
