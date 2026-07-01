import { Injectable } from "@nestjs/common";
import { CreateLevelDto } from "./dto/create-level.dto";
import { UpdateLevelDto } from "./dto/update-level.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LevelsService {
  constructor(private prisma: PrismaService) {}

  create(createLevelDto: CreateLevelDto) {
    return this.prisma.level.create({
      data: createLevelDto,
    });
  }

  findAll() {
    return this.prisma.level.findMany({
      orderBy: {
        order: "asc",
      },
      include: {
        skills: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.level.findUnique({
      where: { id },
      include: {
        skills: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  update(id: string, updateLevelDto: UpdateLevelDto) {
    return this.prisma.level.update({
      where: { id },
      data: updateLevelDto,
    });
  }

  remove(id: string) {
    return this.prisma.level.delete({
      where: { id },
    });
  }
}
