import { PartialType } from '@nestjs/mapped-types';
import { CreateMarkcardDto } from './create-markcard.dto';

export class UpdateMarkcardDto extends PartialType(CreateMarkcardDto) {}
