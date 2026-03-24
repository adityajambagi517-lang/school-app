import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportTicket, SupportTicketDocument, TicketStatus } from '../../schemas/support-ticket.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async create(data: any): Promise<SupportTicket> {
    const ticket = new this.ticketModel(data);
    return ticket.save();
  }

  async findAll(): Promise<SupportTicket[]> {
    return this.ticketModel.find().sort({ createdAt: -1 }).exec();
  }

  async resolve(id: string, adminNotes?: string): Promise<SupportTicket> {
    return this.ticketModel.findByIdAndUpdate(
      id,
      { status: TicketStatus.RESOLVED, adminNotes },
      { new: true },
    ).exec();
  }

  async remove(id: string): Promise<void> {
    await this.ticketModel.findByIdAndDelete(id).exec();
  }
}
