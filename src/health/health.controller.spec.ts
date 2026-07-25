import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  describe('getHealth', () => {
    let controller: HealthController;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();
      controller = moduleRef.get(HealthController);
    });

    it('reports ok with the process uptime in whole seconds', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.uptimeSeconds).toBeLessThanOrEqual(
        Math.ceil(process.uptime()),
      );
    });
  });
});
