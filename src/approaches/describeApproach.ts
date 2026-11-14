const groupLabels: Record<string, string> = {
  all_12: "All 12 parameters",
  no_envelope_9: "No envelope · 9 parameters",
  core_6: "Core · 6 parameters",
  continuous_8: "Continuous · 8 parameters",
};

const methodLabels: Record<string, string> = {
  ard_bayesian_optimisation: "ARD Bayesian optimisation",
  bayesian_optimization: "Bayesian optimisation",
  bayesian_optimization_ucb: "Bayesian optimisation · UCB",
  bayesian_optimization_mes: "Bayesian optimisation · MES",
  bayesian_optimization_cl: "Bayesian optimisation · CL",
  bayesian_optimization_screened: "Bayesian optimisation · screened",
  lasso_bayesian_optimisation: "Lasso Bayesian optimisation",
  simple_bayesian_optimization: "Simple Bayesian optimisation",
  caliblab: "CalibLab",
  tpe: "TPE",
  cma_es: "CMA-ES",
  hyperband: "Hyperband",
};

export function describeApproach(run: string): { group: string; method: string; variant: string | null } {
  const [group, method, , , , , variant] = run.split("__");
  return {
    group: groupLabels[group] ?? group.replaceAll("_", " "),
    method: methodLabels[method] ?? method.replaceAll("_", " "),
    variant: variant ?? null,
  };
}
