import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { TokensService } from "./tokens.service";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { GrantExtraTokensInput, GrantExtraTokensSchema } from "./dto/grant-tokens.dto";
import { VoidTokenInput, VoidTokenSchema } from "./dto/void-token.dto";
import { TokenBalanceQueryInput, TokenBalanceQuerySchema } from "./dto/token-balance-query.dto";

@Controller("tokens")
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get("student/:studentId/balance")
  @Roles("super_admin", "admin", "manager", "supervisor", "instructor", "viewer")
  async getBalance(
    @Param("studentId") studentId: string,
    @Query(new ZodValidationPipe(TokenBalanceQuerySchema))
    query: TokenBalanceQueryInput,
  ) {
    return this.tokensService.getTokenBalance(studentId, query.termId);
  }

  @Get("student/:studentId/summaries")
  @Roles("super_admin", "admin", "manager", "supervisor", "instructor", "viewer")
  async getSummaries(@Param("studentId") studentId: string) {
    return this.tokensService.getStudentTokenSummaries(studentId);
  }

  @Post("grant")
  @Roles("super_admin", "admin")
  async grantExtraTokens(
    @Body(new ZodValidationPipe(GrantExtraTokensSchema))
    body: GrantExtraTokensInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.tokensService.grantExtraTokens(body, staffUser);
  }

  @Delete(":tokenId")
  @Roles("super_admin", "admin")
  async voidToken(
    @Param("tokenId") tokenId: string,
    @Body(new ZodValidationPipe(VoidTokenSchema)) body: VoidTokenInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.tokensService.voidToken(tokenId, body, staffUser);
  }
}
