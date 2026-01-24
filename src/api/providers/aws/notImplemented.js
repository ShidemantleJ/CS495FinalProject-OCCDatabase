export const notImplemented = (method) => {
  throw new Error(`AWS provider not implemented: ${method}`);
};
