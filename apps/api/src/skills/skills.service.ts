import { Injectable } from "@nestjs/common";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { UpdateSkillDto } from "./dto/update-skill.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  create(createSkillDto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: createSkillDto,
    });
  }

  findAll() {
    return this.prisma.skill.findMany({
      orderBy: {
        order: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.skill.findUnique({
      where: { id },
    });
  }

  update(id: string, updateSkillDto: UpdateSkillDto) {
    return this.prisma.skill.update({
      where: { id },
      data: updateSkillDto,
    });
  }

  remove(id: string) {
    return this.prisma.skill.delete({
      where: { id },
    });
  }
}
