export function detectTypeScript(pkgData) {
  if (!pkgData) return { supported: false, label: 'No TypeScript', native: false };
  if (pkgData.name && pkgData.name.startsWith('@types/')) {
    return { supported: true, label: 'DefinitelyTyped', native: false };
  }
  if (pkgData.types || pkgData.typings) {
    return { supported: true, label: 'TypeScript Native', native: true };
  }
  if (pkgData.exports) {
    const expStr = JSON.stringify(pkgData.exports);
    if (
      expStr.includes('.d.ts') ||
      expStr.includes('.d.cts') ||
      expStr.includes('.d.mts') ||
      expStr.includes('"types"')
    ) {
      return { supported: true, label: 'TypeScript Native', native: true };
    }
  }
  const knownTyped = [
    'react',
    'react-dom',
    'lodash',
    'express',
    'node-fetch',
    'ws',
    'jest',
    'mocha',
    'qs',
    'uuid',
    'superagent',
    'luxon'
  ];
  if (knownTyped.includes(pkgData.name)) {
    return { supported: true, label: 'DefinitelyTyped (@types)', native: false };
  }
  return { supported: false, label: 'No TypeScript', native: false };
}

export function detectEsm(pkgData) {
  if (!pkgData) return { isEsm: false, isCjs: true, label: 'CommonJS' };
  const isTypeModule = pkgData.type === 'module';
  const hasModuleField = Boolean(pkgData.module || pkgData['jsnext:main']);
  let hasEsmExport = false;
  let hasCjsExport = false;

  if (pkgData.exports) {
    const expStr = JSON.stringify(pkgData.exports);
    if (expStr.includes('"import"') || expStr.includes('.mjs')) hasEsmExport = true;
    if (expStr.includes('"require"') || expStr.includes('.cjs')) hasCjsExport = true;
  }

  if (isTypeModule && !hasCjsExport && !pkgData.main) {
    return { isEsm: true, isCjs: false, label: 'Pure ESM' };
  }
  if ((isTypeModule || hasModuleField || hasEsmExport) && (hasCjsExport || pkgData.main)) {
    return { isEsm: true, isCjs: true, label: 'Dual (ESM + CJS)' };
  }
  if (hasModuleField || hasEsmExport || isTypeModule) {
    return { isEsm: true, isCjs: false, label: 'ESM' };
  }
  return { isEsm: false, isCjs: true, label: 'CommonJS' };
}
