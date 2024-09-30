import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiProperty({ example: 'password123', description: 'The password of the user', minLength: 6 })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly password: string;

    @ApiProperty({ example: '123-456-7890', description: 'The phone number of the user', required: false })
    @IsString()
    @IsOptional()
    readonly phone?: string;
}