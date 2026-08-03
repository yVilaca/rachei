import { execSync } from 'node:child_process'

// Garante o schema do banco de E2E antes dos testes. O banco (rachei_e2e) já
// deve existir; as migrações são idempotentes. O seed acontece por teste, via
// o endpoint de reset (ver e2e/support/e2e.ts).
export default function globalSetup() {
  execSync('python manage.py migrate --noinput --settings=config.settings_e2e', {
    cwd: '../rachei-backend',
    stdio: 'inherit',
  })
}
