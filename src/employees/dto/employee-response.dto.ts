import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Full name of the employee', example: 'Ada Testperson' })
  name!: string;

  @ApiProperty({ description: 'Age in years', example: 34 })
  age!: number;

  @ApiProperty({ description: 'Department the employee belongs to', example: 'Engineering' })
  department!: string;
}
