import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@CurrentUser() user: CurrentUserData) {
        return this.notificationsService.findAllForUser(user._id);
    }

    @Get('unread-count')
    getUnreadCount(@CurrentUser() user: CurrentUserData) {
        return this.notificationsService.getUnreadCount(user._id);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.notificationsService.markAsRead(id, user._id);
    }

    @Patch('read-all')
    markAllAsRead(@CurrentUser() user: CurrentUserData) {
        return this.notificationsService.markAllAsRead(user._id);
    }
}
