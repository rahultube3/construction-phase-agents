import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export interface EmployeeRecord {
  id: number;
  name: string;
  age: number;
  department: string;
}

function isEmployeeRecord(value: unknown): value is EmployeeRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.age === 'number' &&
    typeof record.department === 'string'
  );
}

@Injectable()
export class EmployeesRepository {
  private readonly logger = new Logger(EmployeesRepository.name);
  private readonly dataPath: string;

  constructor(configService: ConfigService) {
    this.dataPath = resolve(
      process.cwd(),
      configService.get<string>('EMPLOYEES_DATA_PATH', 'data/employees.json'),
    );
  }

  async findAll(): Promise<EmployeeRecord[]> {
    this.logger.debug(`Loading employee data from ${this.dataPath}`);
    const startedAt = Date.now();
    try {
      const raw = await readFile(this.dataPath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(isEmployeeRecord)) {
        throw new Error('Employee data does not match the expected shape');
      }
      this.logger.log(
        `Loaded ${parsed.length} employee records in ${Date.now() - startedAt}ms`,
      );
      return parsed;
    } catch (error) {
      this.logger.error('Failed to load employee data', error);
      throw new InternalServerErrorException('Failed to load employee data');
    }
  }
}
