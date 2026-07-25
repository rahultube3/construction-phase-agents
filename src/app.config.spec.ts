import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configureApp } from './app.config';

@Module({})
class EmptyModule {}

describe('configureApp', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmptyModule],
    }).compile();
    app = moduleRef.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a global ValidationPipe and returns the same app', () => {
    const useGlobalPipesSpy = jest.spyOn(app, 'useGlobalPipes');

    const result = configureApp(app);

    expect(result).toBe(app);
    expect(useGlobalPipesSpy).toHaveBeenCalledTimes(1);
    const [pipe] = useGlobalPipesSpy.mock.calls[0];
    expect(pipe).toBeInstanceOf(ValidationPipe);
  });
});
