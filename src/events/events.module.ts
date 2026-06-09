import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './products.controller';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
