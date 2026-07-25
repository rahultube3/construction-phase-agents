import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  @ApiResponse({
    status: 200,
    description: 'All employees from the data source',
    type: [EmployeeResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Employee data file is missing or invalid',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to load employee data',
        error: 'Internal Server Error',
      },
    },
  })
  async findAll(): Promise<EmployeeResponseDto[]> {
    this.logger.log('GET /employees');
    try {
      const employees = await this.employeesService.findAll();
      this.logger.log(`GET /employees -> 200 (count=${employees.length})`);
      return employees;
    } catch (error) {
      this.logger.error('GET /employees failed', error as Error);
      throw error;
    }
  }
}
