// PokéAPI Client + Intelligent LocalStorage/Memory Cache Engine

export interface PokemonTypeInfo {
  id: string;
  name: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  borderColor: string;
  bgRgba: string;
  textColor: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  dexNumber: string;
  types: string[];
  primaryType: string;
  spriteUrl: string;
  artworkUrl: string;
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
    total: number;
  };
  customLabel?: string; // Pack hunt rule or custom label
}

export const OFFICIAL_POKEMON_TYPES: PokemonTypeInfo[] = [
  {
    id: "normal",
    name: "normal",
    displayName: "Normal",
    primaryColor: "#A8A878",
    secondaryColor: "#C6C6A7",
    gradient: "from-stone-500 to-zinc-600",
    borderColor: "#A8A878",
    bgRgba: "rgba(168, 168, 120, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "fire",
    name: "fire",
    displayName: "Fire",
    primaryColor: "#F08030",
    secondaryColor: "#F5AC78",
    gradient: "from-orange-500 via-amber-500 to-red-600",
    borderColor: "#F08030",
    bgRgba: "rgba(240, 128, 48, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "water",
    name: "water",
    displayName: "Water",
    primaryColor: "#6890F0",
    secondaryColor: "#9DB7F5",
    gradient: "from-blue-600 via-cyan-500 to-sky-400",
    borderColor: "#6890F0",
    bgRgba: "rgba(104, 144, 240, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "grass",
    name: "grass",
    displayName: "Grass",
    primaryColor: "#78C850",
    secondaryColor: "#A7DB8D",
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    borderColor: "#78C850",
    bgRgba: "rgba(120, 200, 80, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "electric",
    name: "electric",
    displayName: "Electric",
    primaryColor: "#F8D030",
    secondaryColor: "#FAE078",
    gradient: "from-yellow-400 via-amber-400 to-orange-400",
    borderColor: "#F8D030",
    bgRgba: "rgba(248, 208, 48, 0.2)",
    textColor: "#1a1a1a",
  },
  {
    id: "ice",
    name: "ice",
    displayName: "Ice",
    primaryColor: "#98D8D8",
    secondaryColor: "#BCE6E6",
    gradient: "from-cyan-300 via-sky-400 to-blue-500",
    borderColor: "#98D8D8",
    bgRgba: "rgba(152, 216, 216, 0.2)",
    textColor: "#1a1a1a",
  },
  {
    id: "fighting",
    name: "fighting",
    displayName: "Fighting",
    primaryColor: "#C03028",
    secondaryColor: "#D67873",
    gradient: "from-red-700 via-rose-700 to-amber-800",
    borderColor: "#C03028",
    bgRgba: "rgba(192, 48, 40, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "poison",
    name: "poison",
    displayName: "Poison",
    primaryColor: "#A040A0",
    secondaryColor: "#C183C1",
    gradient: "from-purple-600 via-fuchsia-700 to-pink-800",
    borderColor: "#A040A0",
    bgRgba: "rgba(160, 64, 160, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "ground",
    name: "ground",
    displayName: "Ground",
    primaryColor: "#E0C068",
    secondaryColor: "#EBD69D",
    gradient: "from-yellow-600 via-amber-700 to-stone-700",
    borderColor: "#E0C068",
    bgRgba: "rgba(224, 192, 104, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "flying",
    name: "flying",
    displayName: "Flying",
    primaryColor: "#A890F0",
    secondaryColor: "#C6B7F5",
    gradient: "from-indigo-400 via-sky-400 to-blue-500",
    borderColor: "#A890F0",
    bgRgba: "rgba(168, 144, 240, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "psychic",
    name: "psychic",
    displayName: "Psychic",
    primaryColor: "#F85888",
    secondaryColor: "#FA92B2",
    gradient: "from-pink-500 via-rose-500 to-fuchsia-600",
    borderColor: "#F85888",
    bgRgba: "rgba(248, 88, 136, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "bug",
    name: "bug",
    displayName: "Bug",
    primaryColor: "#A8B820",
    secondaryColor: "#C6D16E",
    gradient: "from-lime-500 via-green-600 to-emerald-700",
    borderColor: "#A8B820",
    bgRgba: "rgba(168, 184, 32, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "rock",
    name: "rock",
    displayName: "Rock",
    primaryColor: "#B8A038",
    secondaryColor: "#D1C17D",
    gradient: "from-amber-700 via-stone-700 to-yellow-800",
    borderColor: "#B8A038",
    bgRgba: "rgba(184, 160, 56, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "ghost",
    name: "ghost",
    displayName: "Ghost",
    primaryColor: "#705898",
    secondaryColor: "#A292BC",
    gradient: "from-purple-800 via-violet-900 to-indigo-950",
    borderColor: "#705898",
    bgRgba: "rgba(112, 88, 152, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "dragon",
    name: "dragon",
    displayName: "Dragon",
    primaryColor: "#7038F8",
    secondaryColor: "#A27DFA",
    gradient: "from-indigo-600 via-purple-700 to-rose-700",
    borderColor: "#7038F8",
    bgRgba: "rgba(112, 56, 248, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "dark",
    name: "dark",
    displayName: "Dark",
    primaryColor: "#705848",
    secondaryColor: "#A29288",
    gradient: "from-neutral-800 via-stone-900 to-zinc-950",
    borderColor: "#705848",
    bgRgba: "rgba(112, 88, 72, 0.2)",
    textColor: "#ffffff",
  },
  {
    id: "steel",
    name: "steel",
    displayName: "Steel",
    primaryColor: "#B8B8D0",
    secondaryColor: "#D1D1E0",
    gradient: "from-slate-400 via-zinc-400 to-cool-gray-500",
    borderColor: "#B8B8D0",
    bgRgba: "rgba(184, 184, 208, 0.2)",
    textColor: "#1a1a1a",
  },
  {
    id: "fairy",
    name: "fairy",
    displayName: "Fairy",
    primaryColor: "#EE99AC",
    secondaryColor: "#F4BDC9",
    gradient: "from-pink-400 via-rose-300 to-fuchsia-400",
    borderColor: "#EE99AC",
    bgRgba: "rgba(238, 153, 172, 0.2)",
    textColor: "#1a1a1a",
  },
];

export const TYPE_MAP = new Map<string, PokemonTypeInfo>(
  OFFICIAL_POKEMON_TYPES.map((t) => [t.id, t])
);

// In-Memory Caches
const memoryPokemonCache = new Map<number, PokemonSummary>();
const memoryTypePokemonIdsCache = new Map<string, number[]>();

// Format Dex Number to #0001 format
export function formatDexNumber(id: number): string {
  if (id === 0) return "#0000";
  return `#${id.toString().padStart(4, "0")}`;
}

// Capitalize helper
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Custom Type Logo Resolvers
export function getCustomTypeLogo(type: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`poke_custom_type_logo_${type.toLowerCase()}`);
}

export function setCustomTypeLogo(type: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`poke_custom_type_logo_${type.toLowerCase()}`, dataUrl);
}

export function resetCustomTypeLogo(type: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`poke_custom_type_logo_${type.toLowerCase()}`);
}

/**
 * Resolves Type Icon URL:
 * 1. User uploaded custom logo in localStorage
 * 2. Fallback to duiker101's high quality official SVG icons
 */
export function getTypeIconUrl(type: string): string {
  const custom = getCustomTypeLogo(type);
  if (custom) return custom;
  const cleanType = type.toLowerCase();
  return `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${cleanType}.svg`;
}

// MissingNo #0 Easter Egg Data
const MISSINGNO_DATA: PokemonSummary = {
  id: 0,
  name: "MissingNo.",
  dexNumber: "#0000",
  types: ["bird", "normal"],
  primaryType: "normal",
  spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png",
  artworkUrl:
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png", // Fun Ditto/Glitch placeholder or glitch silhouette
  stats: {
    hp: 33,
    attack: 136,
    defense: 0,
    specialAttack: 6,
    specialDefense: 6,
    speed: 29,
    total: 210,
  },
  customLabel: "GLITCH WILD CARD!",
};

/**
 * Fetch a Pokémon by National Dex ID (0 to 1025)
 * Supports memory + localStorage caching
 */
export async function getPokemonById(id: number): Promise<PokemonSummary> {
  if (id === 0) {
    return MISSINGNO_DATA;
  }

  // 1. Check memory cache
  if (memoryPokemonCache.has(id)) {
    return memoryPokemonCache.get(id)!;
  }

  // 2. Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`poke_cache_pkmn_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as PokemonSummary;
        memoryPokemonCache.set(id, parsed);
        return parsed;
      }
    } catch {
      // LocalStorage access or quota fail safe
    }
  }

  // 3. Fetch from PokéAPI
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Pokémon with ID ${id} (Status: ${res.status})`);
  }

  const data = await res.json();
  const types: string[] = data.types.map(
    (t: { type: { name: string } }) => t.type.name
  );
  const primaryType = types[0] || "normal";

  // Stat parsing
  let hp = 45;
  let attack = 49;
  let defense = 49;
  let specialAttack = 65;
  let specialDefense = 65;
  let speed = 45;

  if (Array.isArray(data.stats)) {
    for (const s of data.stats) {
      const sName = s.stat.name;
      const base = s.base_stat || 0;
      if (sName === "hp") hp = base;
      else if (sName === "attack") attack = base;
      else if (sName === "defense") defense = base;
      else if (sName === "special-attack") specialAttack = base;
      else if (sName === "special-defense") specialDefense = base;
      else if (sName === "speed") speed = base;
    }
  }

  const total = hp + attack + defense + specialAttack + specialDefense + speed;

  const artworkUrl =
    data.sprites?.other?.["official-artwork"]?.front_default ||
    data.sprites?.other?.home?.front_default ||
    data.sprites?.front_default ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const spriteUrl =
    data.sprites?.front_default || artworkUrl;

  const summary: PokemonSummary = {
    id: data.id,
    name: capitalize(data.name.replace(/-/g, " ")),
    dexNumber: formatDexNumber(data.id),
    types,
    primaryType,
    spriteUrl,
    artworkUrl,
    stats: {
      hp,
      attack,
      defense,
      specialAttack,
      specialDefense,
      speed,
      total,
    },
  };

  // Cache in memory
  memoryPokemonCache.set(id, summary);

  // Cache in localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`poke_cache_pkmn_${id}`, JSON.stringify(summary));
    } catch {
      // ignore quota exceeded
    }
  }

  return summary;
}

/**
 * Fetch all Pokémon IDs belonging to a specific Type (1 to 1025)
 * Caches in memory & localStorage
 */
export async function getPokemonListByType(type: string): Promise<number[]> {
  const cleanType = type.toLowerCase();

  // 1. Check memory cache
  if (memoryTypePokemonIdsCache.has(cleanType)) {
    return memoryTypePokemonIdsCache.get(cleanType)!;
  }

  // 2. Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`poke_cache_type_${cleanType}`);
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryTypePokemonIdsCache.set(cleanType, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Fetch from PokéAPI
  const res = await fetch(`https://pokeapi.co/api/v2/type/${cleanType}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Pokémon list for type ${type}`);
  }

  const data = await res.json();
  const validIds: number[] = [];

  for (const entry of data.pokemon) {
    const url = entry.pokemon.url;
    // Extract ID from URL like: https://pokeapi.co/api/v2/pokemon/25/
    const match = url.match(/\/pokemon\/(\d+)\//);
    if (match) {
      const id = parseInt(match[1], 10);
      if (id >= 1 && id <= 1025) {
        validIds.push(id);
      }
    }
  }

  // Cache
  memoryTypePokemonIdsCache.set(cleanType, validIds);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`poke_cache_type_${cleanType}`, JSON.stringify(validIds));
    } catch {}
  }

  return validIds;
}

/**
 * Pick N random unique integers in [min, max]
 */
export function getRandomInts(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Pick N random unique items from an array
 */
export function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

