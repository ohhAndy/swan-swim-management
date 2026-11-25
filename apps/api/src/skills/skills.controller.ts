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
import { Roles } from "../auth/roles.decorator";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { UpdateSkillDto } from "./dto/update-skill.dto";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @Roles("super_admin", "admin")
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
  @Roles("super_admin", "admin")
  update(@Param("id") id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(":id")
  @Roles("super_admin", "admin")
  remove(@Param("id") id: string) {
    return this.skillsService.remove(id);
  }
}
