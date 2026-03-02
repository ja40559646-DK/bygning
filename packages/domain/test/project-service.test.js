import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectService } from '../src/project-service.js';
import { createInMemoryProjectRepository } from '../src/project-repository.js';
import { createInMemoryOtpRepository } from '../src/otp-repository.js';
import { createInMemoryMailer } from '../src/mailer.js';
import { createInMemorySiteObjectRepository } from '../src/site-object-repository.js';

function setup(now = () => Date.now()) {
  const mailer = createInMemoryMailer();

  const service = createProjectService({
    projectRepository: createInMemoryProjectRepository(),
    otpRepository: createInMemoryOtpRepository(now),
    mailer,
    siteObjectRepository: createInMemorySiteObjectRepository(),
    now
  });

  return { service, mailer };
}

const payload = {
  customerName: 'Byg Kunde',
  customerAddress: {
    street: 'Skovvej',
    number: '10',
    postalCode: '9000',
    city: 'Aalborg',
    phone: '+45 11223344',
    email: 'kunde@example.dk'
  },
  projectName: 'Ny tilbygning',
  projectAddressSameAsCustomer: true
};

test('createIntake returns 201 for valid payload', () => {
  const { service } = setup();
  const result = service.createIntake(payload);

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.project.customerName, 'Byg Kunde');
});

test('requestOtp sends mail for known email', () => {
  const { service, mailer } = setup();
  service.createIntake(payload);

  const result = service.requestOtp('kunde@example.dk');

  assert.equal(result.ok, true);
  assert.equal(mailer.getSent().length, 1);
  assert.equal(mailer.getSent()[0].subject, 'Godkendelse af fase 01');
});

test('verifyOtp returns session token for valid code', () => {
  const fixedTime = 1700000000000;
  const { service, mailer } = setup(() => fixedTime);
  service.createIntake(payload);
  service.requestOtp('kunde@example.dk');

  const mail = mailer.getSent()[0];
  const code = mail.text.match(/[A-Z0-9]{6}/)[0];
  const result = service.verifyOtp('kunde@example.dk', code);

  assert.equal(result.ok, true);
  assert.match(result.session.token, /^SESS-/);
});


test('createSiteObject stores valid object', () => {
  const { service } = setup();
  const response = service.createSiteObject({
    type: 'hus',
    name: 'Hus A',
    points: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 }
    ]
  });

  assert.equal(response.status, 201);
  assert.equal(response.siteObject.areaM2, 20);
});
