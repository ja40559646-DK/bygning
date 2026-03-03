export function createInMemoryOtpRepository(now = () => Date.now()) {
  const otpByEmail = new Map();

  return {
    saveOtp(email, code, expiresAtMs) {
      otpByEmail.set(email, { code, expiresAtMs, createdAtMs: now() });
    },

    consumeOtp(email, code) {
      const record = otpByEmail.get(email);

      if (!record) {
        return { ok: false, reason: 'missing' };
      }

      if (record.expiresAtMs < now()) {
        otpByEmail.delete(email);
        return { ok: false, reason: 'expired' };
      }

      if (record.code !== code) {
        return { ok: false, reason: 'mismatch' };
      }

      otpByEmail.delete(email);
      return { ok: true };
    }
  };
}
