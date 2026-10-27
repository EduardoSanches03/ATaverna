// Sem limites, o pg espera para sempre por uma conexão ou query travada.
export const poolLimits = {
  connectionTimeoutMillis: 5_000,
  query_timeout: 10_000,
};
