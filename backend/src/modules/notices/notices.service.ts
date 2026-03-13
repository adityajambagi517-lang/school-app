import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchoolNotice, SchoolNoticeDocument } from '../../schemas/school-notice.schema';
import { UserRole } from '../../schemas/user.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientRole } from '../../schemas/notification.schema';

@Injectable()
export class NoticesService {
    constructor(
        @InjectModel(SchoolNotice.name) private noticeModel: Model<SchoolNoticeDocument>,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(data: any) {
        const notice = await new this.noticeModel(data).save();

        // Send notifications to all users with target roles
        try {
            const targetUsers = await this.usersService.findByRoles(data.targetRoles);
            
            // Chunk notifications to avoid overwhelming the database
            const batchSize = 100;
            for (let i = 0; i < targetUsers.length; i += batchSize) {
                const batch = targetUsers.slice(i, i + batchSize);
                await Promise.all(batch.map(user => 
                    this.notificationsService.create({
                        recipientId: user._id.toString(),
                        recipientRole: user.role as unknown as NotificationRecipientRole,
                        type: 'school_notice',
                        title: `New Notice: ${notice.title}`,
                        message: notice.content.substring(0, 100) + (notice.content.length > 100 ? '...' : ''),
                        relatedEntity: { type: 'SchoolNotice', id: notice._id.toString() }
                    })
                ));
            }
        } catch (err) {
            console.error('Failed to send notice notifications:', err);
        }

        return notice;
    }

    async findAll() {
        return this.noticeModel.find().sort({ createdAt: -1 }).exec();
    }

    async findForRole(role: UserRole) {
        return this.noticeModel.find({ 
            targetRoles: role,
            isActive: true 
        }).sort({ createdAt: -1 }).exec();
    }

    async update(id: string, data: any) {
        return this.noticeModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async remove(id: string) {
        return this.noticeModel.findByIdAndDelete(id).exec();
    }
}
