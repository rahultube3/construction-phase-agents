import { Test } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.config';

interface EmployeeResponse {
  name: string;
  age: number;
  department: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

async function bootApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}

describe('Employees (e2e)', () => {
  let tempDir: string;
  let app: INestApplication | undefined;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'employees-e2e-'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  afterEach(async () => {
    delete process.env.EMPLOYEES_DATA_PATH;
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  function writeFixture(fileName: string, contents: string): string {
    const filePath = join(tempDir, fileName);
    writeFileSync(filePath, contents, 'utf-8');
    return filePath;
  }

  async function bootWithDataPath(dataPath: string): Promise<INestApplication> {
    process.env.EMPLOYEES_DATA_PATH = dataPath;
    app = await bootApp();
    return app;
  }

  function expectStandardErrorBody(body: ErrorResponse): void {
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Failed to load employee data');
    expect(JSON.stringify(body)).not.toContain(tempDir);
    expect(JSON.stringify(body)).not.toContain('/');
  }

  it('GET /employees returns the fixture records with exactly name, age, department', async () => {
    const fixture = [
      { id: 10, name: 'Grace Fixture', age: 37, department: 'Engineering' },
      { id: 11, name: 'Heidi Sample', age: 45, department: 'Legal' },
    ];
    const server = await bootWithDataPath(
      writeFixture('happy.json', JSON.stringify(fixture)),
    );

    const res = await request(server.getHttpServer())
      .get('/employees')
      .expect(200)
      .expect('Content-Type', /json/);

    const body = res.body as EmployeeResponse[];
    expect(body).toEqual([
      { name: 'Grace Fixture', age: 37, department: 'Engineering' },
      { name: 'Heidi Sample', age: 45, department: 'Legal' },
    ]);
    for (const employee of body) {
      expect(Object.keys(employee).sort()).toEqual([
        'age',
        'department',
        'name',
      ]);
      expect(employee).not.toHaveProperty('id');
    }
  });

  it('GET /employees with the default data file returns 5 well-shaped records', async () => {
    app = await bootApp();

    const res = await request(app.getHttpServer())
      .get('/employees')
      .expect(200)
      .expect('Content-Type', /json/);

    const body = res.body as EmployeeResponse[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(5);
    for (const employee of body) {
      expect(Object.keys(employee).sort()).toEqual([
        'age',
        'department',
        'name',
      ]);
      expect(typeof employee.name).toBe('string');
      expect(typeof employee.age).toBe('number');
      expect(typeof employee.department).toBe('string');
    }
  });

  it('GET /employees returns 500 with a generic message when the data file is missing', async () => {
    const server = await bootWithDataPath(join(tempDir, 'does-not-exist.json'));

    const res = await request(server.getHttpServer())
      .get('/employees')
      .expect(500);

    expectStandardErrorBody(res.body as ErrorResponse);
  });

  it('GET /employees returns 500 with a generic message when the data file is invalid JSON', async () => {
    const server = await bootWithDataPath(
      writeFixture('invalid.json', '{not valid json'),
    );

    const res = await request(server.getHttpServer())
      .get('/employees')
      .expect(500);

    expectStandardErrorBody(res.body as ErrorResponse);
  });

  it('GET /employees returns 500 with a generic message when the data has the wrong shape', async () => {
    const server = await bootWithDataPath(
      writeFixture('wrong-shape.json', JSON.stringify([{ id: 1 }])),
    );

    const res = await request(server.getHttpServer())
      .get('/employees')
      .expect(500);

    expectStandardErrorBody(res.body as ErrorResponse);
  });
});
