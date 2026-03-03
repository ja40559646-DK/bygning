const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{5,20}$/;

function assertNonEmpty(value, fieldName, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${fieldName} er påkrævet.`);
  }
}

function validateAddress(address, prefix, errors) {
  if (!address || typeof address !== 'object') {
    errors.push(`${prefix} adresse mangler.`);
    return;
  }

  assertNonEmpty(address.street, `${prefix} vejnavn`, errors);
  assertNonEmpty(address.number, `${prefix} husnummer`, errors);
  assertNonEmpty(address.postalCode, `${prefix} postnummer`, errors);
  assertNonEmpty(address.city, `${prefix} by`, errors);
}

export function normalizeIntakeInput(input) {
  const customerAddress = input.customerAddress || {};
  const projectAddress = input.projectAddress || {};
  const sameAddress = Boolean(input.projectAddressSameAsCustomer);

  return {
    customerName: (input.customerName || '').trim(),
    customerAddress: {
      street: (customerAddress.street || '').trim(),
      number: (customerAddress.number || '').trim(),
      postalCode: (customerAddress.postalCode || '').trim(),
      city: (customerAddress.city || '').trim(),
      phone: (customerAddress.phone || '').trim(),
      email: (customerAddress.email || '').trim().toLowerCase()
    },
    projectName: (input.projectName || '').trim(),
    projectAddressSameAsCustomer: sameAddress,
    projectAddress: sameAddress
      ? {
          street: (customerAddress.street || '').trim(),
          number: (customerAddress.number || '').trim(),
          postalCode: (customerAddress.postalCode || '').trim(),
          city: (customerAddress.city || '').trim()
        }
      : {
          street: (projectAddress.street || '').trim(),
          number: (projectAddress.number || '').trim(),
          postalCode: (projectAddress.postalCode || '').trim(),
          city: (projectAddress.city || '').trim()
        }
  };
}

export function validateIntakeInput(rawInput) {
  const input = normalizeIntakeInput(rawInput);
  const errors = [];

  assertNonEmpty(input.customerName, 'Kundenavn', errors);
  assertNonEmpty(input.projectName, 'Projektnavn', errors);

  validateAddress(input.customerAddress, 'Kunde', errors);

  if (!EMAIL_REGEX.test(input.customerAddress.email)) {
    errors.push('Kunde e-mail er ugyldig.');
  }

  if (!PHONE_REGEX.test(input.customerAddress.phone)) {
    errors.push('Kunde telefonnummer er ugyldigt.');
  }

  validateAddress(input.projectAddress, 'Projekt', errors);

  return {
    valid: errors.length === 0,
    errors,
    value: input
  };
}

export function generateOtpCode(length = 6) {
  if (!Number.isInteger(length) || length < 4 || length > 10) {
    throw new Error('OTP længde skal være et heltal mellem 4 og 10.');
  }

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    code += alphabet[randomIndex];
  }

  return code;
}
