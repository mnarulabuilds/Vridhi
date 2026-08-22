import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    private async createAuthResponse(user: {
        id: string;
        name: string;
        email: string;
    }) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }

    async register(dto: RegisterDto) {

        const existingUser =
            await this.usersService.findByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException(
                'Email already registered'
            );
        }

        const passwordHash = await bcrypt.hash(
            dto.password,
            BCRYPT_SALT_ROUNDS,
        );

        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            passwordHash,
        });

        return this.createAuthResponse(user);
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return this.createAuthResponse(user);
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
        };
    }

}
