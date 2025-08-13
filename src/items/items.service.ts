import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Item } from './interfaces/item.interface';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  private readonly filePath = path.join(process.cwd(), 'data', 'items.json');

  // simple single-process write queue to avoid simultaneous writes
  private writeQueue: Promise<void> = Promise.resolve();

  private async ensureFile() {
    try {
      await fs.access(this.filePath);//Checks if the file exists (fs.access).
    } catch {
      // create directory & file if missing
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, '[]', 'utf8');
    }
  }

  private async readAll(): Promise<Item[]> {
    await this.ensureFile();//Ensures file exists first (ensureFile()).
    const raw = await fs.readFile(this.filePath, 'utf8');//Reads the file content as text (fs.readFile).
    try {
      const data = JSON.parse(raw || '[]');
      if (!Array.isArray(data)) return [];
      return data;
    } catch {
      // If corrupted file, return empty array (or throw)
      return [];
    }
  }

  // enqueue writes so writes are serialized in this Node process
  private writeAll(items: Item[]): Promise<void> {
    this.writeQueue = this.writeQueue//This is a queue to make sure two writes to the file don’t happen at the same time (which could corrupt the file).
      .then(() => fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf8'))
      .catch(() => {
        // swallow and continue chain to avoid breaking the queue if a write fails
      });
    return this.writeQueue;
  }

  async findAll(): Promise<Item[]> {
    return this.readAll();//Returns the entire list of items from the file.
  }

  async findOne(id: string): Promise<Item> {
    const items = await this.readAll(); //Reads all items.
    const item = items.find((i) => i.id === id); //Finds one item by matching id.
    if (!item) throw new NotFoundException(`Item with id ${id} not found`);//If not found → throws a NotFoundException (HTTP 404).
    return item; //Else → returns the found item.
  }

  async create(dto: CreateItemDto): Promise<Item> {
    const items = await this.readAll(); //Reads current items.
    const newItem: Item = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) //crypto refers to the built-in Node.js (and browser) crypto module that can generate secure random values.
        ? (crypto as any).randomUUID()
        : String(Date.now()) + Math.random().toString(36).slice(2, 8),
      name: dto.name,
      description: dto.description,
      createdAt: Date.now(),
    };
//  typeof crypto !== 'undefined' → checks if the crypto API exists in the current runtime (Node.js or browser).
// (crypto as any).randomUUID → checks if the method randomUUID exists.
// If both are true → call crypto.randomUUID() to create a secure, random UUID like:
    items.push(newItem);
    await this.writeAll(items);
    return newItem;
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const items = await this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new NotFoundException(`Item with id ${id} not found`);

    const updated = {
      ...items[idx], //...JavaScript spread operator. It’s used here to copy all properties from one object into another.
      ...dto,
      updatedAt: Date.now(),
    };
    items[idx] = updated;
    await this.writeAll(items);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const items = await this.readAll();
    const newItems = items.filter((i) => i.id !== id);
    if (newItems.length === items.length) throw new NotFoundException(`Item with id ${id} not found`);
    await this.writeAll(newItems);
  }
}
