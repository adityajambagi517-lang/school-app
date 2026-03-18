import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponse {
  access_token: string;
  user: {
    userId: string;
    name: string;
    role: string;
    email: string;
  };
}
