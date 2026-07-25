import { Test } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { EmployeesRepository, EmployeeRecord } from './employees.repository';

describe('EmployeesService', () => {
  describe('findAll', () => {
    let service: EmployeesService;
    let findAllMock: jest.Mock<Promise<EmployeeRecord[]>, []>;

    beforeEach(async () => {
      findAllMock = jest.fn<Promise<EmployeeRecord[]>, []>();
      const moduleRef = await Test.createTestingModule({
        providers: [
          EmployeesService,
          {
            provide: EmployeesRepository,
            useValue: { findAll: findAllMock },
          },
        ],
      }).compile();

      service = moduleRef.get(EmployeesService);
    });

    it('maps records to { name, age, department } and drops id', async () => {
      findAllMock.mockResolvedValue([
        { id: 1, name: 'Alice', age: 34, department: 'Engineering' },
        { id: 2, name: 'Bob', age: 41, department: 'Finance' },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        { name: 'Alice', age: 34, department: 'Engineering' },
        { name: 'Bob', age: 41, department: 'Finance' },
      ]);
      expect(result[0]).not.toHaveProperty('id');
      expect(result[1]).not.toHaveProperty('id');
    });

    it('returns an empty array when the repository has no records', async () => {
      findAllMock.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });

    it('propagates repository errors unchanged', async () => {
      const failure = new Error('boom');
      findAllMock.mockRejectedValue(failure);

      await expect(service.findAll()).rejects.toBe(failure);
    });
  });
});
