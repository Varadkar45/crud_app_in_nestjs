import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './interfaces/item.interface';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(): Promise<Item[]> {
    return this.itemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Item> {
    return this.itemsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateItemDto): Promise<Item> {
    return this.itemsService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateItemDto): Promise<Item> {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemsService.remove(id);
  }
}

// @HttpCode(HttpStatus.NO_CONTENT) in your controller tells NestJS:

// “When this route succeeds, send back HTTP status code 204 (No Content) instead of the default.”

// 📌 Why is this needed in your @Delete method?
// By default:

// @Delete() in NestJS returns 200 OK if it completes successfully.

// But HTTP best practice for a successful delete with no response body is 204 No Content.

// Example from your code:

// @Delete(':id')
// @HttpCode(HttpStatus.NO_CONTENT) // 204
// async remove(@Param('id') id: string): Promise<void> {
//   return this.itemsService.remove(id);
// }
// 🔹 What 204 means in HTTP
// 204 → “The request was successful, but there’s nothing to send in the response body.”

// The client knows the deletion worked, but the server doesn’t send any JSON or HTML.

// The response will be empty:

// css
// Copy
// Edit
// HTTP/1.1 204 No Content
// Content-Length: 0
// 🔹 Without @HttpCode(HttpStatus.NO_CONTENT)
// NestJS would return 200 OK and likely null or {} as the body, which is still valid but not as clean.

// 💡 When to use it
// DELETE operations (most common).

// Sometimes PUT or POST when the server doesn't need to send any body back (e.g., async processing).


