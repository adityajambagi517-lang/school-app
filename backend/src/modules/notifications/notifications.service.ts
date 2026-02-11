import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationRecipientRole } from '../../schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    ) { }

    async create(data: {
        recipientId: Types.ObjectId | string;
        recipientRole: NotificationRecipientRole;
        type: string;
        title: string;
        message: string;
        relatedEntity?: { type: string; id: Types.ObjectId | string };
    }) {
        const notification = new this.notificationModel({
            ...data,
            recipientId: new Types.ObjectId(data.recipientId),
            relatedEntity: data.relatedEntity ? {
                type: data.relatedEntity.type,
                id: new Types.ObjectId(data.relatedEntity.id),
            } : undefined,
        });
        return notification.save();
    }

    async findAllForUser(userId: string) {
        return this.notificationModel
            .find({ recipientId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
    }

    async getUnreadCount(userId: string) {
        return this.notificationModel.countDocuments({
            recipientId: new Types.ObjectId(userId),
            isRead: false,
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.notificationModel.findOneAndUpdate(
            { _id: new Types.ObjectId(notificationId), recipientId: new Types.ObjectId(userId) },
            { isRead: true },
            { new: true },
        );
    }

    async markAllAsRead(userId: string) {
        return this.notificationModel.updateMany(
            { recipientId: new Types.ObjectId(userId), isRead: false },
            { isRead: true },
        );
    }

    async deleteByRelatedEntity(relatedEntityType: string, relatedEntityId: string) {
        return this.notificationModel.deleteMany({
            'relatedEntity.type': relatedEntityType,
            'relatedEntity.id': new Types.ObjectId(relatedEntityId),
        });
    }
}
