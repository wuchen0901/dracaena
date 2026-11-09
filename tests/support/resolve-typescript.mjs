import { extname } from 'node:path';

// Cocos resolves extensionless TypeScript imports; mirror that for Node tests.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cc') return { url: new URL('./cc-stub.mjs', import.meta.url).href, shortCircuit: true };
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' ||
        !specifier.startsWith('.') || extname(specifier)) throw error;
    return nextResolve(`${specifier}.ts`, context);
  }
}
