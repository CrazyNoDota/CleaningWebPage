import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DirectorChannel = 'whatsapp' | 'telegram';

export interface DirectorSettings {
  channel: DirectorChannel;
  whatsappPhone: string;
  telegramUsername: string;
}

const DIRECTOR_KEY = 'director';

const DEFAULTS: DirectorSettings = {
  channel: 'whatsapp',
  whatsappPhone: '77055975056',
  telegramUsername: '',
};

function parseDirector(value: unknown): DirectorSettings {
  const v = (value ?? {}) as Partial<DirectorSettings>;
  const channel: DirectorChannel = v.channel === 'telegram' ? 'telegram' : 'whatsapp';
  return {
    channel,
    whatsappPhone: typeof v.whatsappPhone === 'string' ? v.whatsappPhone : DEFAULTS.whatsappPhone,
    telegramUsername:
      typeof v.telegramUsername === 'string' ? v.telegramUsername : DEFAULTS.telegramUsername,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDirector(): Promise<DirectorSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: DIRECTOR_KEY } });
    if (!row) return DEFAULTS;
    return parseDirector(row.value);
  }

  async updateDirector(patch: Partial<DirectorSettings>): Promise<DirectorSettings> {
    const current = await this.getDirector();
    const next: DirectorSettings = parseDirector({ ...current, ...patch });
    if (next.channel === 'telegram' && next.telegramUsername.trim().length === 0) {
      throw new NotFoundException('telegramUsername required when channel=telegram');
    }
    const json = { ...next };
    await this.prisma.setting.upsert({
      where: { key: DIRECTOR_KEY },
      create: { key: DIRECTOR_KEY, value: json },
      update: { value: json },
    });
    return next;
  }
}
