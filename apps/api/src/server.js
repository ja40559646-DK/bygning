import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApiHandlers } from './handlers.js';
import { createProjectService } from '../../../packages/domain/src/project-service.js';
import { createInMemoryProjectRepository } from '../../../packages/domain/src/project-repository.js';
import { createInMemoryOtpRepository } from '../../../packages/domain/src/otp-repository.js';
import { createConsoleMailer } from '../../../packages/domain/src/mailer.js';
import { createInMemorySiteObjectRepository } from '../../../packages/domain/src/site-object-repository.js';

const webRoot = resolve(process.cwd(), 'apps/web');
const staticFiles = {
  '/': { path: resolve(webRoot, 'index.html'), type: 'text/html; charset=utf-8' },
  '/app.js': { path: resolve(webRoot, 'app.js'), type: 'text/javascript; charset=utf-8' },
  '/styles.css': { path: resolve(webRoot, 'styles.css'), type: 'text/css; charset=utf-8' }
};

function json(data) {
  return JSON.stringify(data);
}

function createServer() {
  const projectService = createProjectService({
    projectRepository: createInMemoryProjectRepository(),
    otpRepository: createInMemoryOtpRepository(),
    mailer: createConsoleMailer(),
    siteObjectRepository: createInMemorySiteObjectRepository()
  });

  const handlers = createApiHandlers({ projectService });

  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && staticFiles[req.url]) {
      const file = staticFiles[req.url];
      const content = readFileSync(file.path, 'utf8');
      res.writeHead(200, { 'Content-Type': file.type });
      res.end(content);
      return;
    }

    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const response = handlers.handle({
        method: req.method,
        path: req.url,
        body: Buffer.concat(chunks).toString('utf8')
      });

      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(json(response.body));
    });
  });
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => {
    console.log(`API/UI lytter på http://localhost:${port}`);
  });
}

export { createServer };
