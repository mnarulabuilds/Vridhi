import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { CategoriesModule } from './modules/categories/categories.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        UsersModule,
        AuthModule,
        AccountsModule,
        TransactionsModule,
        CategoriesModule,
        BudgetsModule,
        ReportingModule
    ]
})
export class AppModule { }
