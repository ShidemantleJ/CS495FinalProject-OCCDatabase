// Helper that throws for unimplemented AWS provider methods.

export const notImplemented = (method) => {
  throw new Error(`AWS provider not implemented: ${method}`);
};

