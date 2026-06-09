import { Injectable } from '@nestjs/common';
import { EventsService } from 'src/events/events.service';
import type { Event } from 'src/events/entities/event.entity';

@Injectable()
export class PurchasesService {
  constructor(private readonly eventsService: EventsService) {}

  purchase(userId: number, productId: number): Event {
    return this.eventsService.create(userId, productId, 'PURCHASE');
  }
}
