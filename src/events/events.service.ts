import { Injectable } from '@nestjs/common';
import { Event, EVENT_TYPE } from './entities/event.entity';
import { events } from './data/events.data';

@Injectable()
export class EventsService {
  create(userId: number, productId: number, type: EVENT_TYPE): Event {
    if (!userId || !productId || !type) {
      throw new Error('Algum parametro faltando na criacao do evento');
    }

    const newEvent: Event = { userId, productId, type, createdAt: new Date() };

    events.push(newEvent);

    return newEvent;
  }

  findAll(): Event[] {
    return events;
  }
}
