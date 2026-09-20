import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { ReportingModule } from '../reporting/reporting.module';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [AccountsModule, TransactionsModule, BudgetsModule, ReportingModule, PortfolioModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
