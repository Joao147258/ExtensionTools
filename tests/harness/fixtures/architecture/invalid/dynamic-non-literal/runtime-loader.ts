// Import dinâmico com argumento variável em tempo de execução
export async function loadFeatureDynamically(featureName: string) {
  const dynamicTarget = `./features/${featureName}`;
  const loadedModule = await import(dynamicTarget);
  return loadedModule;
}
