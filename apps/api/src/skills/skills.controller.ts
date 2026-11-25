import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { SkillsService } from "./skills.service";
import { MinRole } from "../auth/roles.decorator";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { UpdateSkillDto } from "./dto/update-skill.dto";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @MinRole("admin")
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(":id")
  @MinRole("admin")
  update(@Param("id") id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(":id")
  @MinRole("admin")
  remove(@Param("id") id: string) {
    return this.skillsService.remove(id);
  }
}
