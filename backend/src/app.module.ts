import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ImportsModule } from './modules/imports/imports.module';
import { AiModule } from './modules/ai/ai.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { GoalsModule } from './modules/goals/goals.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { LedgerModule } from './common/ledger/ledger.module';
import { EmailModule } from './common/email/email.module';
import { EntitlementsModule } from './common/entitlements/entitlements.module';
import { HealthController } from './health/health.controller';
import { validateEnv } from './config/env.validation';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    LedgerModule,
    EmailModule,
    EntitlementsModule,
    UsersModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
    ReportingModule,
    ImportsModule,
    AiModule,
    ConnectionsModule,
    PortfolioModule,
    GoalsModule,
    SubscriptionsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
