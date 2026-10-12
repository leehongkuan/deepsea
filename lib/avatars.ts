export const avatarOptions = [
  { id: "dolphin", label: "Dolphin", url: "/avatars/dolphin.png" },
  { id: "whale", label: "Whale", url: "/avatars/whale.png" },
  { id: "turtle", label: "Sea Turtle", url: "/avatars/turtle.png" },
  { id: "octopus", label: "Octopus", url: "/avatars/octopus.png" },
  { id: "jellyfish", label: "Jellyfish", url: "/avatars/jellyfish.png" },
  { id: "seahorse", label: "Seahorse", url: "/avatars/seahorse.png" },
  { id: "clownfish", label: "Clownfish", url: "/avatars/clownfish.png" },
  { id: "manta-ray", label: "Manta Ray", url: "/avatars/manta-ray.png" },
  { id: "seal", label: "Seal", url: "/avatars/seal.png" },
  { id: "crab", label: "Crab", url: "/avatars/crab.png" },
  { id: "penguin", label: "Penguin", url: "/avatars/penguin.png" },
  { id: "starfish", label: "Starfish", url: "/avatars/starfish.png" },
] as const;

export function isAvatarUrl(value: unknown): value is (typeof avatarOptions)[number]["url"] {
  return typeof value === "string" && avatarOptions.some((avatar) => avatar.url === value);
}
