import { Injectable, Logger } from '@nestjs/common';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly employeesRepository: EmployeesRepository) {}

  async findAll(): Promise<EmployeeResponseDto[]> {
    this.logger.debug('findAll: start');
    const records = await this.employeesRepository.findAll();
    const mapped = records.map(({ name, age, department }) => ({
      name,
      age,
      department,
    }));
    this.logger.log(`findAll: returning ${mapped.length} employees`);
    return mapped;
  }
}
