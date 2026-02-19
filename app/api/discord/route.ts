import { NextResponse } from 'next/server';

// Types (you can export these to a shared file)
interface DiscordRole {
  id: string;
  name: string;
  color: number;
}

interface DiscordMember {
  user: { id: string; username: string; avatar: string; discriminator?: string };
  roles: string[];
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'offline';
    activities: any[];
  };
}

interface VoiceState {
  channel_id: string | null;
  mute: boolean;
  deaf: boolean;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export async function GET() {
  const userId = process.env.DISCORD_USER_ID!;
  const guildId = process.env.DISCORD_GUILD_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  const headers = { Authorization: `Bot ${botToken}` };
  const baseUrl = 'https://discord.com/api/v10';

  // Helper to fetch with error fallback
  async function fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (!res.ok) {
        console.error(`Discord API error (${url}): ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Fetch failed (${url}):`, err);
      return null;
    }
  }

  // Parallel requests
  const [member, voiceState, guildRoles, guild] = await Promise.all([
    fetchJson<DiscordMember>(`${baseUrl}/guilds/${guildId}/members/${userId}?with_presence=true`),
    fetchJson<VoiceState>(`${baseUrl}/guilds/${guildId}/voice-states/${userId}`),
    fetchJson<DiscordRole[]>(`${baseUrl}/guilds/${guildId}/roles`),
    fetchJson<Guild>(`${baseUrl}/guilds/${guildId}`),
  ]);

  // Enrich member's roles with colours from guildRoles
  const roleMap = new Map(guildRoles?.map(r => [r.id, r]) ?? []);
  const enrichedRoles = member?.roles?.map(roleId => {
    const role = roleMap.get(roleId);
    return role ? { id: roleId, name: role.name, color: role.color } : null;
  }).filter(Boolean) ?? [];

  // Extract custom status from activities (type = 4)
  const customStatus = member?.presence?.activities?.find(a => a.type === 4)?.state || null;

  return NextResponse.json({
    user: member?.user ? {
      id: member.user.id,
      username: member.user.username,
      avatar: member.user.avatar,
      discriminator: member.user.discriminator,
    } : null,
    presence: member?.presence ? {
      status: member.presence.status,
      activities: member.presence.activities,
      customStatus,
    } : null,
    roles: enrichedRoles,
    voice: voiceState ? {
      channelId: voiceState.channel_id,
      mute: voiceState.mute,
      deaf: voiceState.deaf,
    } : null,
    guild: guild ? {
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
    } : null,
  });
}
