import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtpCode, validateIntakeInput } from '../src/intake.js';

const validPayload = {
  customerName: 'Nordisk Byg ApS',
  customerAddress: {
    street: 'Kystvej',
    number: '12A',
    postalCode: '8000',
    city: 'Aarhus C',
    phone: '+45 22113344',
    email: 'kontakt@nordiskbyg.dk'
  },
  projectName: 'Carport projekt',
  projectAddressSameAsCustomer: true
};

test('validateIntakeInput accepts valid payload', () => {
  const result = validateIntakeInput(validPayload);

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.value.projectAddress.city, 'Aarhus C');
});

test('validateIntakeInput rejects invalid email and phone', () => {
  const result = validateIntakeInput({
    ...validPayload,
    customerAddress: {
      ...validPayload.customerAddress,
      email: 'forkert-mail',
      phone: '12'
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Kunde e-mail er ugyldig.'));
  assert.ok(result.errors.includes('Kunde telefonnummer er ugyldigt.'));
});

test('validateIntakeInput requires explicit project address when checkbox is false', () => {
  const result = validateIntakeInput({
    ...validPayload,
    projectAddressSameAsCustomer: false,
    projectAddress: {
      street: '',
      number: '',
      postalCode: '',
      city: ''
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.startsWith('Projekt')));
});

test('generateOtpCode uses expected charset and length', () => {
  const code = generateOtpCode(8);
  assert.equal(code.length, 8);
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
});

test('generateOtpCode rejects unsupported length', () => {
  assert.throws(() => generateOtpCode(2), /mellem 4 og 10/);
});
