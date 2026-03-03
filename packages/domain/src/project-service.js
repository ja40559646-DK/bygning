import { generateOtpCode, validateIntakeInput } from './intake.js';
import { createWorkArea } from './site-planning.js';

function createProjectId(now = () => Date.now()) {
  return `PRJ-${now().toString(36).toUpperCase()}`;
}

function createSessionToken(now = () => Date.now()) {
  return `SESS-${now().toString(36).toUpperCase()}`;
}

export function createProjectService({ projectRepository, otpRepository, mailer, siteObjectRepository, now = () => Date.now() }) {
  if (!projectRepository || !otpRepository || !mailer || !siteObjectRepository) {
    throw new Error('ProjectService kræver projectRepository, otpRepository, mailer og siteObjectRepository.');
  }

  return {
    createIntake(payload) {
      const validation = validateIntakeInput(payload);
      if (!validation.valid) {
        return {
          ok: false,
          status: 400,
          errors: validation.errors
        };
      }

      const project = {
        id: createProjectId(now),
        ...validation.value,
        createdAt: new Date(now()).toISOString()
      };

      projectRepository.save(project);

      return {
        ok: true,
        status: 201,
        project
      };
    },

    requestOtp(email) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return { ok: false, status: 400, error: 'E-mail er påkrævet.' };
      }

      const project = projectRepository.findByEmail(normalizedEmail);
      if (!project) {
        return { ok: false, status: 404, error: 'Projekt blev ikke fundet for denne e-mail.' };
      }

      const code = generateOtpCode(6);
      const expiresAt = now() + 10 * 60 * 1000;

      otpRepository.saveOtp(normalizedEmail, code, expiresAt);
      mailer.send({
        to: normalizedEmail,
        subject: 'Godkendelse af fase 01',
        text: `Din verificeringskode er: ${code}. Koden udløber om 10 minutter.`
      });

      return { ok: true, status: 200 };
    },


    createSiteObject(payload) {
      const allowedTypes = new Set(['hus', 'anneks', 'tilbygning', 'skur', 'carport', 'terrasse']);
      const type = String(payload?.type || '').trim().toLowerCase();
      const name = String(payload?.name || '').trim();

      if (!allowedTypes.has(type)) {
        return { ok: false, status: 400, error: 'Objekttype er ugyldig.' };
      }

      if (!name) {
        return { ok: false, status: 400, error: 'Objektnavn er påkrævet.' };
      }

      try {
        const area = createWorkArea(name, payload?.points || []);
        const siteObject = {
          id: `OBJ-${now().toString(36).toUpperCase()}`,
          type,
          ...area,
          createdAt: new Date(now()).toISOString()
        };

        siteObjectRepository.save(siteObject);
        return { ok: true, status: 201, siteObject };
      } catch (error) {
        return { ok: false, status: 400, error: error.message };
      }
    },

    listSiteObjects() {
      return { ok: true, status: 200, siteObjects: siteObjectRepository.list() };
    },

    listProjects() {
      const projects = projectRepository.list().map((project) => ({
        id: project.id,
        customerName: project.customerName,
        projectName: project.projectName,
        email: project.customerAddress.email,
        createdAt: project.createdAt
      }));

      return { ok: true, status: 200, projects };
    },


    previewWorkArea(name, points) {
      try {
        const workArea = createWorkArea(name, points);
        return { ok: true, status: 200, workArea };
      } catch (error) {
        return { ok: false, status: 400, error: error.message };
      }
    },

    verifyOtp(email, code) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const normalizedCode = (code || '').trim().toUpperCase();

      if (!normalizedEmail || !normalizedCode) {
        return { ok: false, status: 400, error: 'E-mail og kode er påkrævet.' };
      }

      const result = otpRepository.consumeOtp(normalizedEmail, normalizedCode);
      if (!result.ok) {
        return { ok: false, status: 401, error: 'Ugyldig eller udløbet kode.' };
      }

      return {
        ok: true,
        status: 200,
        session: {
          token: createSessionToken(now),
          issuedAt: new Date(now()).toISOString()
        }
      };
    }
  };
}
