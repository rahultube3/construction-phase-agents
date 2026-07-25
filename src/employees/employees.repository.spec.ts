import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { EmployeesRepository } from './employees.repository';

describe('EmployeesRepository', () => {
  describe('findAll', () => {
    let tempDir: string;

    beforeAll(() => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'employees-repo-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    async function createRepository(dataPath: string): Promise<EmployeesRepository> {
      const moduleRef = await Test.createTestingModule({
        providers: [
          EmployeesRepository,
          {
            provide: ConfigService,
            useValue: { get: (): string => dataPath },
          },
        ],
      }).compile();
      return moduleRef.get(EmployeesRepository);
    }

    async function writeFixture(contents: string): Promise<string> {
      const filePath = join(tempDir, 'employees.json');
      await writeFile(filePath, contents, 'utf-8');
      return filePath;
    }

    it('returns the parsed records from a valid data file', async () => {
      const records = [
        { id: 1, name: 'Alice', age: 34, department: 'Engineering' },
        { id: 2, name: 'Bob', age: 41, department: 'Finance' },
      ];
      const filePath = await writeFixture(JSON.stringify(records));
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).resolves.toEqual(records);
    });

    it('returns an empty array when the file contains an empty array', async () => {
      const filePath = await writeFixture('[]');
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).resolves.toEqual([]);
    });

    it('throws InternalServerErrorException when the file is missing', async () => {
      const repository = await createRepository(join(tempDir, 'missing.json'));

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when the file is not valid JSON', async () => {
      const filePath = await writeFixture('{not json');
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when the JSON is not an array', async () => {
      const filePath = await writeFixture(
        JSON.stringify({ id: 1, name: 'Alice', age: 34, department: 'Eng' }),
      );
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when an element is not an object', async () => {
      const filePath = await writeFixture(JSON.stringify(['Alice', null]));
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when a record is missing a field', async () => {
      const filePath = await writeFixture(
        JSON.stringify([{ id: 1, name: 'Alice', age: 34 }]),
      );
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when a field has the wrong type', async () => {
      const filePath = await writeFixture(
        JSON.stringify([
          { id: 1, name: 'Alice', age: '34', department: 'Engineering' },
        ]),
      );
      const repository = await createRepository(filePath);

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
