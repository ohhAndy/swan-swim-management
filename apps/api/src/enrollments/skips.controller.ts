import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SkipsService } from "./skips.service";
import { AddSkipInput, addSkipSchema } from "./dto/skips.dto";

@Controller("enrollments/:enrollmentId/skips") 
export class SkipsController {
    constructor(private readonly skipsService: SkipsService) {}

    @Post()
    async add(
        @Param("enrollmentId") enrollmentId: string,
        @Body(new ZodValidationPipe(addSkipSchema)) body: AddSkipInput,
    ) {
        return this.skipsService.addSkip(enrollmentId, body);
    }

    @Delete(":classSessionId")
    async delete(
        @Param("enrollmentId") enrollmentId: string,
        @Param("classSessionId") classSessionId: string,
    ) {
        return this.skipsService.deleteSkip(enrollmentId, classSessionId);
    }
}