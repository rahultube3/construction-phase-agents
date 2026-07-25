import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is up' })
  getHealth(): HealthStatus {
    const status: HealthStatus = {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
    this.logger.debug(`GET /health -> 200 (uptime=${status.uptimeSeconds}s)`);
    return status;
  }
}
