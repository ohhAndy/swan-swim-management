import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TokensService } from "./tokens.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { GrantExtraTokensInput, GrantExtraTokensSchema } from "./dto/grant-tokens.dto";
import { VoidTokenInput, VoidTokenSchema } from "./dto/void-token.dto";
import { TokenBalanceQueryInput, TokenBalanceQuerySchema } from "./dto/token-balance-query.dto";

@Controller("tokens")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get("student/:studentId/balance")
  @Roles("super_admin", "admin", "manager", "supervisor", "instructor", "viewer")
  async getBalance(
    @Param("studentId") studentId: string,
    @Query() query: TokenBalanceQueryInput,
  ) {
    const validated = TokenBalanceQuerySchema.parse(query);
    return this.tokensService.getTokenBalance(studentId, validated.termId);
  }

  @Get("student/:studentId/summaries")
  @Roles("super_admin", "admin", "manager", "supervisor", "instructor", "viewer")
  async getSummaries(@Param("studentId") studentId: string) {
    return this.tokensService.getStudentTokenSummaries(studentId);
  }

  @Post("grant")
  @Roles("super_admin", "admin")
  async grantExtraTokens(
    @Body() body: GrantExtraTokensInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    const validated = GrantExtraTokensSchema.parse(body);
    return this.tokensService.grantExtraTokens(validated, staffUser);
  }

  @Delete(":tokenId")
  @Roles("super_admin", "admin")
  async voidToken(
    @Param("tokenId") tokenId: string,
    @Body() body: VoidTokenInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    const validated = VoidTokenSchema.parse(body);
    return this.tokensService.voidToken(tokenId, validated, staffUser);
  }
}
