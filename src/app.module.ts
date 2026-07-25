import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, EmployeesModule],
})
export class AppModule {}
