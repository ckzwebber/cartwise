import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';
import type { Event } from './entities/event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(): Event[] {
    return this.eventsService.findAll();
  }
}
