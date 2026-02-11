import { IsString, IsEmail, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { UserRole } from '../../../schemas/user.schema';

export class CreateUserDto {
    @IsString()
    userId: string;

    @IsString()
    password: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsEmail()
    email: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsMongoId()
    referenceId?: string;
}
