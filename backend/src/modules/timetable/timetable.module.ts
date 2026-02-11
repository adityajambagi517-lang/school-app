import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { Timetable, TimetableSchema } from '../../schemas/timetable.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Timetable.name, schema: TimetableSchema },
    ]),
  ],
  controllers: [TimetableController],
  providers: [TimetableService],
})
export class TimetableModule { }
