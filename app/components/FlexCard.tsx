'use client';
import { useDiscordPresence } from './hooks/useDiscordPresence';
import RoleBadge from './ui/RoleBadge';
import { formatDistanceToNow } from 'date-fns'; // optional, for last updated

export default function FlexCard() {
  const {
    data,
    error,
    isLoading,
    intervalMs,
    autoRefresh,
    setAutoRefresh,
    changeInterval,
    refresh,
  } = useDiscordPresence();

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="bg-zinc-900 text-white p-6 rounded-2xl w-96 shadow-xl animate-pulse">
        <div className="w-24 h-24 rounded-full bg-zinc-700 mx-auto" />
        <div className="h-6 bg-zinc-700 rounded mt-4 w-3/4 mx-auto" />
        <div className="h-4 bg-zinc-700 rounded mt-2 w-1/2 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-white p-6 rounded-2xl w-96 shadow-xl">
        <p className="text-red-200">Error: {error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-700 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.user) return <div className="text-white">No data</div>;

  const avatarUrl = data.user.avatar
    ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.user.discriminator) % 5}.png`;

  const statusColors = {
    online: 'border-green-500',
    idle: 'border-yellow-500',
    dnd: 'border-red-500',
    offline: 'border-gray-500',
  };

  const status = data.presence?.status || 'offline';

  // Parse activities
  const activities = data.presence?.activities || [];
  const customStatus = activities.find(a => a.type === 4)?.state;
  const spotify = activities.find(a => a.type === 2 && a.name === 'Spotify');
  const game = activities.find(a => a.type === 0);
  const streaming = activities.find(a => a.type === 1);
  const watching = activities.find(a => a.type === 3);
  const competing = activities.find(a => a.type === 5);

  return (
    <div className="relative bg-zinc-900/80 backdrop-blur-md text-white p-6 rounded-2xl w-96 shadow-2xl border border-zinc-700 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-gradient" />

      {/* Avatar with glowing border */}
      <div className="relative">
        <img
          src={avatarUrl}
          alt={data.user.username}
          className={`w-24 h-24 rounded-full border-4 mx-auto transition-colors duration-300 ${statusColors[status]}`}
        />
        {data.voice?.channelId && (
          <div className="absolute bottom-0 right-1/2 translate-x-12 bg-green-500 rounded-full p-1 border-2 border-zinc-900">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 6a1 1 0 112 0v4a1 1 0 11-2 0V6zm1 8a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="text-center mt-4">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          {data.user.username}
          {data.user.discriminator && data.user.discriminator !== '0' && (
            <span className="text-sm text-gray-400">#{data.user.discriminator}</span>
          )}
        </h2>
        {customStatus && (
          <p className="text-sm text-gray-300 mt-1 italic">“{customStatus}”</p>
        )}
      </div>

      {/* Guild info */}
      {data.guild && (
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-400">
          {data.guild.icon && (
            <img
              src={`https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=32`}
              alt={data.guild.name}
              className="w-5 h-5 rounded-full"
            />
          )}
          <span>{data.guild.name}</span>
        </div>
      )}

      {/* Activities */}
      <div className="mt-4 space-y-2">
        {game && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">🎮</span>
            <span>Playing <strong>{game.name}</strong></span>
          </div>
        )}
        {streaming && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-400">📺</span>
            <span>Streaming <strong>{streaming.name}</strong></span>
          </div>
        )}
        {watching && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-400">📺</span>
            <span>Watching <strong>{watching.name}</strong></span>
          </div>
        )}
        {competing && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400">🏆</span>
            <span>Competing in <strong>{competing.name}</strong></span>
          </div>
        )}
        {spotify && (
          <div className="bg-green-900/30 p-2 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">🎵</span>
              <span className="font-medium truncate">{spotify.details}</span>
            </div>
            <div className="text-xs text-gray-300 truncate">{spotify.state}</div>
            {spotify.timestamps?.start && spotify.timestamps?.end && (
              <SpotifyProgress
                start={spotify.timestamps.start}
                end={spotify.timestamps.end}
              />
            )}
          </div>
        )}
      </div>

      {/* Voice state */}
      {data.voice?.channelId && (
        <div className="mt-4 p-2 bg-zinc-800 rounded-lg flex items-center gap-2">
          <span className="text-green-400">🔊</span>
          <span className="text-sm">In voice channel</span>
          {data.voice.mute && <span className="text-red-400 text-xs">(muted)</span>}
          {data.voice.deaf && <span className="text-red-400 text-xs">(deafened)</span>}
        </div>
      )}

      {/* Role badges */}
      {data.roles.length > 0 && (
        <div className="mt-4 flex flex-wrap">
          {data.roles.map(role => (
            <RoleBadge key={role.id} name={role.name} color={role.color} />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700"
          >
            ⟳ Refresh
          </button>
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-1"
            />
            Auto
          </label>
          <select
            value={intervalMs}
            onChange={(e) => changeInterval(Number(e.target.value))}
            className="bg-zinc-800 rounded px-1 py-1"
          >
            <option value="3000">3s</option>
            <option value="5000">5s</option>
            <option value="10000">10s</option>
            <option value="30000">30s</option>
          </select>
        </div>
        {lastUpdated && (
          <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
        )}
      </div>
    </div>
  );
}

// Simple Spotify progress bar component
function SpotifyProgress({ start, end }: { start: number; end: number }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const total = end - start;
      const elapsed = now - start;
      setProgress(Math.min(100, (elapsed / total) * 100));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [start, end]);
  return (
    <div className="w-full h-1 bg-gray-700 rounded-full mt-1">
      <div
        className="h-1 bg-green-500 rounded-full transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
