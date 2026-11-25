import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { LevelsService } from "./levels.service";
import { MinRole } from "../auth/roles.decorator";
import { CreateLevelDto } from "./dto/create-level.dto";
import { UpdateLevelDto } from "./dto/update-level.dto";

@Controller("levels")
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  @MinRole("admin")
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelsService.create(createLevelDto);
  }

  @Get()
  findAll() {
    return this.levelsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.levelsService.findOne(id);
  }

  @Patch(":id")
  @MinRole("admin")
  update(@Param("id") id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelsService.update(id, updateLevelDto);
  }

  @Delete(":id")
  @MinRole("admin")
  remove(@Param("id") id: string) {
    return this.levelsService.remove(id);
  }
}
